/**
 * Leer y escribir documentos versionados, con migraciones y cuarentena.
 *
 * Todo lo que sale del almacenamiento es **dato no confiable**: lo escribió una
 * versión anterior de la app, o lo editó alguien a mano, o se truncó a medias.
 * Por eso nada entra en la app sin pasar por Zod, y nada que falle la
 * validación se borra: se aparta con su marca de tiempo para poder recuperarlo.
 * El export JSON es la única copia de seguridad que existe, y una app que borra
 * en silencio lo que no entiende es una app que se come esa copia.
 */
import type { z } from 'zod';

import { STORAGE_KEYS, type KeyValueStore } from '@/storage/kv';

export interface Migration {
  readonly from: number;
  readonly to: number;
  migrate(raw: Record<string, unknown>): Record<string, unknown>;
}

/**
 * Migraciones en cadena, de la más antigua a la más nueva.
 *
 * Todavía no hay ninguna porque la v1 es la primera. Cuando el esquema cambie,
 * aquí se añade `{ from: 1, to: 2, migrate }` y los datos viejos suben solos.
 */
export const MIGRATIONS: readonly Migration[] = [];

export type ReadStatus = 'ok' | 'empty' | 'quarantined';

export interface ReadResult<T> {
  readonly value: T;
  readonly status: ReadStatus;
  /** Clave donde quedó el original ilegible, si hubo que apartarlo. */
  readonly quarantineKey?: string;
}

function versionOf(raw: unknown): number {
  if (typeof raw !== 'object' || raw === null) return 0;
  const version = (raw as Record<string, unknown>)['schemaVersion'];
  return typeof version === 'number' ? version : 0;
}

/** Aplica en orden las migraciones que hagan falta hasta la versión objetivo. */
export function applyMigrations(
  raw: unknown,
  targetVersion: number,
  migrations: readonly Migration[] = MIGRATIONS,
): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  let current = raw as Record<string, unknown>;
  let version = versionOf(current);

  while (version < targetVersion) {
    const step = migrations.find((migration) => migration.from === version);
    if (!step) break; // No hay camino: que lo rechace la validación.
    current = { ...step.migrate(current), schemaVersion: step.to };
    version = step.to;
  }

  return current;
}

export interface ReadOptions<T> {
  readonly store: KeyValueStore;
  readonly key: string;
  readonly schema: z.ZodType<T>;
  readonly fallback: T;
  readonly targetVersion: number;
  readonly migrations?: readonly Migration[];
  /** Marca de tiempo para nombrar la cuarentena; inyectada para poder testear. */
  readonly stamp: () => string;
}

export function readDocument<T>({
  store,
  key,
  schema,
  fallback,
  targetVersion,
  migrations = MIGRATIONS,
  stamp,
}: ReadOptions<T>): ReadResult<T> {
  const raw = store.get(key);
  if (raw === null) return { value: fallback, status: 'empty' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return quarantine(store, key, raw, fallback, stamp);
  }

  const migrated = applyMigrations(parsed, targetVersion, migrations);
  const result = schema.safeParse(migrated);
  if (!result.success) {
    return quarantine(store, key, raw, fallback, stamp);
  }

  return { value: result.data, status: 'ok' };
}

function quarantine<T>(
  store: KeyValueStore,
  key: string,
  raw: string,
  fallback: T,
  stamp: () => string,
): ReadResult<T> {
  const quarantineKey = `${STORAGE_KEYS.quarantinePrefix}${stamp()}`;
  store.set(quarantineKey, raw);
  store.remove(key);
  return { value: fallback, status: 'quarantined', quarantineKey };
}

export function writeDocument<T>(store: KeyValueStore, key: string, value: T): void {
  store.set(key, JSON.stringify(value));
}

/** Claves de datos apartados, de la más reciente a la más antigua. */
export function listQuarantined(store: KeyValueStore): string[] {
  return store
    .keys()
    .filter((key) => key.startsWith(STORAGE_KEYS.quarantinePrefix))
    .sort()
    .reverse();
}
