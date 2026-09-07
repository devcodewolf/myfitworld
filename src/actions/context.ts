/**
 * Lo que toda acción necesita antes de tocar la base: quién llama, y decírselo
 * a Postgres.
 *
 * **Aquí vive la seguridad de los datos.** Hay dos cerrojos, y son a propósito
 * dos y no uno:
 *
 * 1. Cada consulta filtra por `user_id`. Explícito, visible en el código, y
 *    además es lo que hace que la consulta use los índices.
 * 2. Postgres filtra por su cuenta, con las políticas de `drizzle/0001_rls.sql`.
 *    Esa es la que sigue funcionando el día que a alguien se le olvide la
 *    primera.
 *
 * El puente entre ambos es `withUser`: abre una transacción y **declara en
 * nombre de quién se va a actuar** antes de la primera consulta. Ninguna acción
 * habla con la base fuera de ahí.
 */
import { createHash } from 'node:crypto';

import { ActionError, type ActionAPIContext } from 'astro:actions';
import { asc, eq, sql } from 'drizzle-orm';

import type { Profile } from '@/core/model';
import { db, type Database } from '@/db';
import { rowToProfile } from '@/db/mappers';
import { profiles } from '@/db/schema';

/**
 * El asa de la transacción. Se pasa a mano a todo lo que consulte, en vez de
 * usar `db` directamente, porque `db` no lleva dentro la declaración de quién
 * eres: una consulta suelta contra `db` no vería absolutamente nada.
 */
export type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];

/** El nombre del perfil que se crea solo. */
const DEFAULT_PROFILE_NAME = 'Yo';

/** Quién llama, o `null` si nadie ha entrado. */
export function currentUserId(context: ActionAPIContext): string | null {
  return context.locals.user?.id ?? null;
}

/** Quién llama, o se acabó la acción. */
export function requireUserId(context: ActionAPIContext): string {
  const id = currentUserId(context);
  if (id === null) {
    throw new ActionError({ code: 'UNAUTHORIZED', message: 'Hay que entrar para hacer esto.' });
  }
  return id;
}

/**
 * Abre una transacción diciéndole a Postgres en nombre de quién se actúa.
 *
 * El tercer argumento de `set_config` en `true` es la pieza importante: hace
 * que la declaración **muera con la transacción**. Sin él quedaría pegada a la
 * conexión, y como las conexiones se reparten entre peticiones, la siguiente en
 * usar esa conexión heredaría tu identidad. Eso no sería un error de
 * rendimiento: sería enseñarle tu entreno a otro.
 *
 * Todo lo que toque la base va dentro. Fuera de aquí, las políticas no ven
 * ninguna identidad declarada y no devuelven nada.
 */
export async function withUser<T>(
  context: ActionAPIContext,
  work: (tx: Tx, userId: string) => Promise<T>,
): Promise<T> {
  const userId = requireUserId(context);
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`);
    return work(tx, userId);
  });
}

/**
 * Un UUID estable a partir del id de usuario.
 *
 * `ProfileSchema.id` exige un UUID de verdad, así que no vale con inventarse
 * una cadena legible: se toman 16 bytes del resumen SHA-256 del usuario y se
 * les ponen los bits de versión y variante. Sale siempre el mismo y sale
 * válido. Es en esencia un UUID v5 sin arrastrar una dependencia por diez
 * líneas.
 */
function stableUuidFrom(seed: string): string {
  const bytes = createHash('sha256').update(seed).digest().subarray(0, 16);
  // Versión 8 (UUID «a medida», el hueco que el estándar deja libre) y variante RFC.
  bytes[6] = (bytes[6]! & 0x0f) | 0x80;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * El perfil en uso, creándolo la primera vez.
 *
 * El id del perfil por defecto **se deriva del usuario** en vez de ser
 * aleatorio, y eso es a propósito: si dos peticiones de la misma pantalla
 * llegan a la vez y las dos ven que no hay perfil, con un id aleatorio se
 * crearían dos y los datos quedarían partidos entre ambos. Derivándolo, la
 * segunda choca contra la clave primaria y no hace nada.
 *
 * Los perfiles que se creen a mano más adelante sí llevarán id aleatorio: la
 * tabla admite varios, esto solo fija cuál es el primero.
 */
export async function ensureProfile(tx: Tx, userId: string): Promise<Profile> {
  const existing = await tx
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .orderBy(asc(profiles.createdAt))
    .limit(1);

  const found = existing[0];
  if (found) return rowToProfile(found);

  const created = {
    id: stableUuidFrom(userId),
    userId,
    name: DEFAULT_PROFILE_NAME,
    createdAt: new Date(),
  };
  await tx.insert(profiles).values(created).onConflictDoNothing();

  // Si la carrera la ganó la otra petición, la fila buena es la suya.
  const settled = await tx
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .orderBy(asc(profiles.createdAt))
    .limit(1);

  return rowToProfile(settled[0] ?? created);
}
