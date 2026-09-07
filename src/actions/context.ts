/**
 * Lo que toda acción necesita antes de tocar la base: quién llama y con qué
 * perfil.
 *
 * **Aquí vive la regla de seguridad de todo el paso 6.** No hay RLS en
 * Postgres: el filtro por `user_id` lo pone el servidor, acción por acción. Una
 * acción que no filtre no es un descuido, es un agujero. Por eso el `userId`
 * no se pide por parámetro en ningún sitio —se saca de la sesión— y por eso
 * ninguna acción acepta que el cliente le diga de quién son los datos.
 */
import { createHash } from 'node:crypto';

import { ActionError, type ActionAPIContext } from 'astro:actions';
import { asc, eq } from 'drizzle-orm';

import type { Profile } from '@/core/model';
import { db } from '@/db';
import { rowToProfile } from '@/db/mappers';
import { profiles } from '@/db/schema';

/** El nombre del perfil que se crea solo. Igual que en el repositorio local. */
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
export async function ensureProfile(userId: string): Promise<Profile> {
  const existing = await db
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
  await db.insert(profiles).values(created).onConflictDoNothing();

  // Si la carrera la ganó la otra petición, la fila buena es la suya.
  const settled = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .orderBy(asc(profiles.createdAt))
    .limit(1);

  return rowToProfile(settled[0] ?? created);
}
