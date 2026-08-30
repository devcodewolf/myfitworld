/**
 * Las tablas del dominio, traducidas de los esquemas Zod de `core/model.ts`.
 *
 * La regla que gobierna este archivo: **las columnas sueltas son solo las que
 * se filtran**; el registro completo va en `jsonb` y se valida con el mismo
 * esquema Zod que usa el cliente. Así hay una sola fuente de verdad para la
 * forma de los datos, y `core/` no se entera de que existe una base.
 *
 * Qué se filtra hoy lo dice `SessionQuery` en `storage/repository.ts`:
 * mesociclo, semana, día, estado y usuario. Nada más. Todo lo demás —las
 * series, los pesos, las repeticiones— vive dentro del JSON.
 *
 * `userId` es `text` porque Better Auth genera ids de texto, no UUID. La clave
 * foránea contra su tabla `user` llega en el paso siguiente, cuando esa tabla
 * exista; hoy la columna ya está para que ese paso sea solo añadir la
 * restricción.
 */
import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * Un perfil de entrenamiento. Hoy hay uno por usuario, pero la tabla ya admite
 * varios: el hueco que `PRODUCT.md` reservaba para un segundo perfil.
 */
export const profiles = pgTable(
  'profiles',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('profiles_user_idx').on(table.userId)],
);

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
    userId: text('user_id').notNull(),
    data: jsonb('data').notNull(),
    schemaVersion: integer('schema_version').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('settings_user_idx').on(table.userId)],
);

/**
 * Una sesión de entrenamiento, terminada o en curso.
 *
 * `payload` es el `SessionLog` completo. `schemaVersion` viaja con cada fila
 * para que la cadena de `MIGRATIONS` de `storage/document.ts` siga sirviendo:
 * un documento guardado con un esquema viejo se migra al leerlo, igual que
 * hacía en `localStorage`.
 *
 * El índice único sobre usuario y sesión activa es la regla de negocio que hoy
 * garantiza la clave `mfw:active-session`: **no puede haber dos sesiones en
 * curso a la vez**. Vale más tenerlo en la base que confiar en el cliente.
 */
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
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
    index('sessions_user_started_idx').on(table.userId, table.startedAt),
    index('sessions_user_week_day_idx').on(table.userId, table.weekOrder, table.dayOrder),
    // Una sola sesión en curso por usuario, garantizado por la base.
    uniqueIndex('sessions_one_active_idx')
      .on(table.userId)
      .where(sql`status = 'in_progress'`),
  ],
);
