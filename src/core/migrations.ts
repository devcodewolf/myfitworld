/**
 * Cómo sube de versión un documento guardado.
 *
 * Vive en `core/` porque es lógica pura —no sabe si el documento viene de una
 * fila de Postgres, de un archivo o de la memoria— y porque camina hacia
 * `STORAGE_SCHEMA_VERSION`, que se declara aquí al lado en `model.ts`.
 *
 * Antes estaba en `storage/document.ts`, junto a la lectura de `localStorage`.
 * Cuando la persistencia se fue al servidor, esa carpeta desapareció, pero
 * **esto no**: una fila escrita con un esquema antiguo se sigue leyendo, y sube
 * por esta cadena antes de que Zod la valide. Es lo que permite cambiar la
 * forma de lo guardado sin dejar atrás lo ya guardado.
 */

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

function versionOf(raw: unknown): number {
  if (typeof raw !== 'object' || raw === null) return 0;
  const version = (raw as Record<string, unknown>)['schemaVersion'];
  return typeof version === 'number' ? version : 0;
}

/**
 * Aplica en orden las migraciones que hagan falta hasta la versión objetivo.
 *
 * Si no hay camino se para y devuelve lo que tenga: **no inventa**. Quien llame
 * lo pasará por Zod, que es quien debe rechazarlo. Un documento de una versión
 * futura, o de una que nadie sabe migrar, tiene que fallar la validación en vez
 * de colarse a medio traducir.
 */
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
