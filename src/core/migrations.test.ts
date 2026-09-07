import { describe, expect, it } from 'vitest';

import { applyMigrations } from '@/core/migrations';

describe('migraciones de documentos guardados', () => {
  const aDos = {
    from: 1,
    to: 2,
    migrate: (raw: Record<string, unknown>) => ({ ...raw, nuevoCampo: true }),
  };

  it('encadena las migraciones hasta la versión objetivo', () => {
    const migrado = applyMigrations({ schemaVersion: 1, sessions: [] }, 2, [aDos]) as Record<
      string,
      unknown
    >;
    expect(migrado['schemaVersion']).toBe(2);
    expect(migrado['nuevoCampo']).toBe(true);
  });

  it('no toca un documento que ya está en la versión buena', () => {
    const documento = { schemaVersion: 2, sessions: [] };
    expect(applyMigrations(documento, 2, [aDos])).toEqual(documento);
  });

  it('si falta el camino de migración, lo deja para que lo rechace la validación', () => {
    const documento = { schemaVersion: 5, sessions: [] };
    expect(applyMigrations(documento, 9, [aDos])).toEqual(documento);
  });

  it('un documento de una versión futura se devuelve tal cual, sin traducir a medias', () => {
    // Que lo rechace Zod. Migrarlo «como se pueda» sería inventarse datos.
    const futuro = { schemaVersion: 99, sessions: [] };
    expect(applyMigrations(futuro, 2, [aDos])).toEqual(futuro);
  });

  it('lo que no es un objeto pasa de largo sin romper nada', () => {
    expect(applyMigrations(null, 2)).toBeNull();
    expect(applyMigrations('no soy un documento', 2)).toBe('no soy un documento');
  });
});
