/**
 * Las tablas del dominio, traducidas de los esquemas Zod de `core/model.ts`.
 *
 * La regla que gobierna este archivo: **las columnas sueltas son solo las que
 * se filtran**; el registro completo va en `jsonb` y se valida con el mismo
 * esquema Zod que usa el cliente. Así hay una sola fuente de verdad para la
 * forma de los datos, y `core/` no se entera de que existe una base.
 *
 * Qué se filtra hoy lo dice `SessionQuery` en `repository/contract.ts`:
 * mesociclo, semana, día, estado y usuario. Nada más. Todo lo demás —las
 * series, los pesos, las repeticiones— vive dentro del JSON.
 *
 * `userId` es `text` porque Better Auth genera ids de texto, no UUID, y apunta
 * a su tabla `user` con borrado en cascada: si un día se borra una cuenta, sus
 * perfiles, ajustes y sesiones se van con ella y no queda basura huérfana.
 */
import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { user } from '@/db/auth-schema';

/**
 * La regla de seguridad de la base, escrita una sola vez.
 *
 * Postgres compara la columna `user_id` de cada fila con quién ha dicho la
 * aplicación que es, y esa declaración se hace al abrir la transacción con
 * `set_config('app.user_id', ...)` —ver `src/actions/context.ts`—.
 *
 * **Falla cerrado.** Si nadie lo ha declarado, `current_setting` devuelve NULL,
 * la comparación no es cierta y no se ve ni una fila. Olvidarse deja la
 * pantalla vacía, que es un fallo evidente; lo contrario sería enseñar los
 * datos de todos, que es un fallo invisible.
 *
 * `using` filtra lo que se lee; `withCheck` impide escribir una fila a nombre
 * de otro. Hacen falta las dos: sin la segunda, se podría insertar basura en la
 * cuenta ajena aunque no se pudiera leer.
 */
const propiaDelUsuario = sql`user_id = current_setting('app.user_id', true)`;

const soloTusFilas = (nombre: string) =>
  pgPolicy(nombre, { for: 'all', using: propiaDelUsuario, withCheck: propiaDelUsuario });

/**
 * Un perfil de entrenamiento. Hoy hay uno por usuario, pero la tabla ya admite
 * varios: el hueco que `PRODUCT.md` reservaba para un segundo perfil.
 */
export const profiles = pgTable(
  'profiles',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('profiles_user_idx').on(table.userId), soloTusFilas('profiles_propias')],
).enableRLS();

/**
 * Los ajustes: material declarado, descansos, sonido, peso corporal.
 *
 * Uno por perfil, y por eso `profileId` es la clave primaria. El documento
 * entero va en `data`, validado con `SettingsSchema` al leerlo.
 */
export const settings = pgTable(
  'settings',
  {
    profileId: text('profile_id')
      .primaryKey()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    data: jsonb('data').notNull(),
    schemaVersion: integer('schema_version').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('settings_user_idx').on(table.userId), soloTusFilas('settings_propios')],
).enableRLS();

/**
 * Una sesión de entrenamiento, terminada o en curso.
 *
 * `payload` es el `SessionLog` completo. `schemaVersion` viaja con cada fila
 * para que la cadena de `MIGRATIONS` de `core/migrations.ts` siga sirviendo:
 * una fila guardada con un esquema viejo se migra al leerla.
 *
 * Se llama `workout_sessions` y no `sessions` porque Better Auth ya tiene una
 * tabla `session` —las sesiones de quien ha entrado— y dos nombres que se
 * diferencian en una "s" son una trampa esperando a que alguien la pise.
 *
 * El índice único sobre usuario y sesión activa es la regla de negocio que hoy
 * garantiza la clave `mfw:active-session`: **no puede haber dos sesiones en
 * curso a la vez**. Vale más tenerlo en la base que confiar en el cliente.
 */
export const workoutSessions = pgTable(
  'workout_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    mesocycleId: text('mesocycle_id').notNull(),
    weekOrder: integer('week_order').notNull(),
    dayOrder: integer('day_order').notNull(),
    status: text('status').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    payload: jsonb('payload').notNull(),
    schemaVersion: integer('schema_version').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    // El historial se lee siempre del más reciente hacia atrás.
    index('workout_sessions_user_started_idx').on(table.userId, table.startedAt),
    index('workout_sessions_user_week_day_idx').on(table.userId, table.weekOrder, table.dayOrder),
    // Una sola sesión en curso por usuario, garantizado por la base.
    uniqueIndex('workout_sessions_one_active_idx')
      .on(table.userId)
      .where(sql`status = 'in_progress'`),
    soloTusFilas('workout_sessions_propias'),
  ],
).enableRLS();
