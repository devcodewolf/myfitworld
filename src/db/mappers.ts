/**
 * Traducción entre las filas de Postgres y los tipos del dominio.
 *
 * Esta es la pieza que mantiene a `core/` sin enterarse de que existe una base
 * de datos. Va en las dos direcciones y **valida siempre al leer**: una fila
 * que viene de la base es dato tan poco confiable como uno de `localStorage`.
 * Es exactamente la lección que ya estaba escrita en `storage/document.ts`, y
 * el motivo de que exista la cuarentena.
 *
 * Lo asimétrico es deliberado: al escribir confiamos en el tipo, porque el
 * objeto viene de dentro de la app; al leer no, porque viene de fuera.
 */
import {
  ProfileSchema,
  SessionLogSchema,
  SettingsSchema,
  STORAGE_SCHEMA_VERSION,
  type Profile,
  type SessionLog,
  type Settings,
} from '@/core/model';
import { applyMigrations } from '@/storage/document';

/** Las columnas que escribimos, sin las que genera la base. */
export interface SessionRow {
  id: string;
  userId: string;
  profileId: string;
  mesocycleId: string;
  weekOrder: number;
  dayOrder: number;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  payload: unknown;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingsRow {
  profileId: string;
  userId: string;
  data: unknown;
  schemaVersion: number;
  updatedAt: Date;
}

export interface ProfileRow {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
}

const iso = (value: string): Date => new Date(value);

/**
 * Sesión → fila. Los campos que se filtran suben a columnas; el resto se queda
 * en el JSON, que es el registro íntegro.
 */
export function sessionToRow(session: SessionLog, userId: string): SessionRow {
  return {
    id: session.id,
    userId,
    profileId: session.profileId,
    mesocycleId: session.mesocycleId,
    weekOrder: session.weekOrder,
    dayOrder: session.dayOrder,
    status: session.status,
    startedAt: iso(session.startedAt),
    finishedAt: session.finishedAt ? iso(session.finishedAt) : null,
    payload: session,
    schemaVersion: STORAGE_SCHEMA_VERSION,
    createdAt: iso(session.createdAt),
    updatedAt: iso(session.updatedAt),
  };
}

/**
 * Fila → sesión. Pasa por la cadena de migraciones antes de validar, para que
 * una fila escrita por una versión anterior del esquema siga leyéndose.
 *
 * Lanza si no valida. Quien llama decide qué hacer: en el servidor, registrar
 * y saltarse esa fila es mejor que devolver medio historial roto.
 */
export function rowToSession(row: Pick<SessionRow, 'payload' | 'schemaVersion'>): SessionLog {
  const migrated = applyMigrations(row.payload, STORAGE_SCHEMA_VERSION);
  return SessionLogSchema.parse(migrated);
}

export function settingsToRow(settings: Settings, userId: string): SettingsRow {
  return {
    profileId: settings.profileId,
    userId,
    data: settings,
    schemaVersion: STORAGE_SCHEMA_VERSION,
    updatedAt: iso(settings.updatedAt),
  };
}

export function rowToSettings(row: Pick<SettingsRow, 'data' | 'schemaVersion'>): Settings {
  const migrated = applyMigrations(row.data, STORAGE_SCHEMA_VERSION);
  return SettingsSchema.parse(migrated);
}

export function profileToRow(profile: Profile, userId: string): ProfileRow {
  return {
    id: profile.id,
    userId,
    name: profile.name,
    createdAt: iso(profile.createdAt),
  };
}

export function rowToProfile(row: ProfileRow): Profile {
  return ProfileSchema.parse({
    id: row.id,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
  });
}
