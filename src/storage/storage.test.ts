import { describe, expect, it } from 'vitest';

import type { SessionLog } from '@/core/model';
import { STORAGE_SCHEMA_VERSION, StoredStateV1Schema } from '@/core/model';
import { applyMigrations, listQuarantined, readDocument } from '@/storage/document';
import { STORAGE_KEYS, createMemoryStore } from '@/storage/kv';
import { createLocalRepository } from '@/storage/repository';
import { buildBackup, importBackup } from '@/storage/backup';

/** Reloj y generador de ids deterministas: los tests no dependen del azar. */
function createDeps(seed: Record<string, string> = {}) {
  const store = createMemoryStore(seed);
  let tick = 0;
  let counter = 0;
  const now = (): string => {
    tick += 1;
    return `2026-08-2${Math.min(9, tick)}T10:00:0${Math.min(9, tick)}.000Z`;
  };
  const uuid = (): string => {
    counter += 1;
    return `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`;
  };
  return { store, deps: { store, now, uuid } };
}

const sesion = (extra: Partial<SessionLog> = {}): SessionLog => ({
  id: '11111111-1111-4111-8111-111111111111',
  profileId: '00000000-0000-4000-8000-000000000001',
  mesocycleId: 'meso-01',
  weekOrder: 1,
  dayOrder: 1,
  status: 'in_progress',
  startedAt: '2026-08-22T10:00:00.000Z',
  restMultiplier: 1,
  exercises: [],
  createdAt: '2026-08-22T10:00:00.000Z',
  updatedAt: '2026-08-22T10:00:00.000Z',
  ...extra,
});

describe('perfiles y ajustes', () => {
  it('crea un perfil y sus ajustes la primera vez, y los reutiliza después', async () => {
    const { deps } = createDeps();
    const repo = createLocalRepository(deps);

    const perfil = await repo.profiles.getActive();
    expect(perfil.name).toBe('Yo');

    const otraVez = await repo.profiles.getActive();
    expect(otraVez.id).toBe(perfil.id);
    expect(await repo.profiles.list()).toHaveLength(1);
  });

  it('los ajustes por defecto salen del esquema, no de valores sueltos', async () => {
    const repo = createLocalRepository(createDeps().deps);
    const ajustes = await repo.settings.get();
    expect(ajustes.theme).toBe('dark');
    expect(ajustes.restMultiplier).toBe(1);
    expect(ajustes.availableLoads).toEqual([]);
  });

  it('guarda cambios parciales sin perder el resto', async () => {
    const repo = createLocalRepository(createDeps().deps);
    await repo.settings.save({ restMultiplier: 0.8 });
    const ajustes = await repo.settings.save({ soundEnabled: false });
    expect(ajustes.restMultiplier).toBe(0.8);
    expect(ajustes.soundEnabled).toBe(false);
  });

  it('rechaza un ajuste fuera de rango en vez de guardarlo', async () => {
    const repo = createLocalRepository(createDeps().deps);
    await expect(repo.settings.save({ restMultiplier: 9 })).rejects.toThrow();
  });
});

describe('sesión en curso', () => {
  it('sobrevive a recargar: se guarda aparte y se recupera entera', async () => {
    const { store, deps } = createDeps();
    const repo = createLocalRepository(deps);
    await repo.sessions.saveActiveSession(sesion());

    // Una recarga es exactamente esto: un repositorio nuevo sobre el mismo disco.
    const recargado = createLocalRepository({ ...deps, store });
    const activa = await recargado.sessions.getActiveSession();
    expect(activa?.id).toBe(sesion().id);
    expect(activa?.status).toBe('in_progress');
  });

  it('al completarla pasa al historial y deja de estar en curso', async () => {
    const { deps } = createDeps();
    const repo = createLocalRepository(deps);
    await repo.sessions.saveActiveSession(sesion());

    const completada = await repo.sessions.completeActiveSession('2026-08-22T11:00:00.000Z');
    expect(completada?.status).toBe('completed');
    expect(await repo.sessions.getActiveSession()).toBeNull();
    expect(await repo.sessions.listSessions()).toHaveLength(1);
  });

  it('completar sin sesión en curso no inventa nada', async () => {
    const repo = createLocalRepository(createDeps().deps);
    expect(await repo.sessions.completeActiveSession('2026-08-22T11:00:00.000Z')).toBeNull();
  });

  it('descartar la borra sin tocar el historial', async () => {
    const repo = createLocalRepository(createDeps().deps);
    await repo.sessions.saveActiveSession(sesion());
    await repo.sessions.discardActiveSession();
    expect(await repo.sessions.getActiveSession()).toBeNull();
    expect(await repo.sessions.listSessions()).toHaveLength(0);
  });

  it('guardar dos veces la misma sesión no la duplica en el historial', async () => {
    const repo = createLocalRepository(createDeps().deps);
    await repo.sessions.saveActiveSession(sesion());
    await repo.sessions.completeActiveSession('2026-08-22T11:00:00.000Z');
    await repo.sessions.saveActiveSession(sesion());
    await repo.sessions.completeActiveSession('2026-08-22T12:00:00.000Z');
    expect(await repo.sessions.listSessions()).toHaveLength(1);
  });
});

describe('consultas del historial', () => {
  it('filtra y ordena de la más reciente a la más antigua', async () => {
    const { deps } = createDeps();
    const repo = createLocalRepository(deps);

    for (const [id, week, startedAt] of [
      ['aaaaaaaa-1111-4111-8111-111111111111', 1, '2026-08-01T10:00:00.000Z'],
      ['bbbbbbbb-1111-4111-8111-111111111111', 2, '2026-08-08T10:00:00.000Z'],
    ] as const) {
      await repo.sessions.saveActiveSession(sesion({ id, weekOrder: week, startedAt }));
      await repo.sessions.completeActiveSession('2026-08-08T11:00:00.000Z');
    }

    const todas = await repo.sessions.listSessions();
    expect(todas.map((s) => s.weekOrder)).toEqual([2, 1]);
    expect(await repo.sessions.listSessions({ weekOrder: 1 })).toHaveLength(1);
    expect(await repo.sessions.listSessions({ limit: 1 })).toHaveLength(1);
  });

  it('borrar una sesión la quita del historial', async () => {
    const repo = createLocalRepository(createDeps().deps);
    await repo.sessions.saveActiveSession(sesion());
    await repo.sessions.completeActiveSession('2026-08-22T11:00:00.000Z');
    await repo.sessions.deleteSession(sesion().id);
    expect(await repo.sessions.listSessions()).toHaveLength(0);
  });
});

describe('datos corruptos', () => {
  it('aparta un JSON roto en cuarentena en vez de borrarlo', async () => {
    const { store, deps } = createDeps({ [STORAGE_KEYS.state]: '{esto no es json' });
    const repo = createLocalRepository(deps);

    expect(await repo.sessions.listSessions()).toEqual([]);
    expect(repo.lastReadStatus()).toBe('quarantined');

    const apartados = listQuarantined(store);
    expect(apartados).toHaveLength(1);
    // El original sigue ahí, entero, para poder rescatarlo a mano.
    expect(store.get(apartados[0]!)).toBe('{esto no es json');
  });

  it('aparta también un JSON válido que no cumple el esquema', async () => {
    const { store, deps } = createDeps({
      [STORAGE_KEYS.state]: JSON.stringify({ schemaVersion: 1, sessions: 'no es una lista' }),
    });
    const repo = createLocalRepository(deps);
    await repo.sessions.listSessions();
    expect(repo.lastReadStatus()).toBe('quarantined');
    expect(listQuarantined(store)).toHaveLength(1);
  });

  it('sin datos previos arranca vacío, que no es lo mismo que corrupto', async () => {
    const repo = createLocalRepository(createDeps().deps);
    await repo.sessions.listSessions();
    expect(repo.lastReadStatus()).toBe('empty');
  });
});

describe('migraciones', () => {
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

  it('un documento de una versión futura se aparta, no rompe la app', async () => {
    const { store, deps } = createDeps({
      [STORAGE_KEYS.state]: JSON.stringify({ schemaVersion: 99, sessions: [] }),
    });
    const repo = createLocalRepository(deps);
    expect(await repo.sessions.listSessions()).toEqual([]);
    expect(repo.lastReadStatus()).toBe('quarantined');
    expect(listQuarantined(store)).toHaveLength(1);
  });

  it('lee y valida un documento correcto sin apartarlo', () => {
    const store = createMemoryStore({
      [STORAGE_KEYS.state]: JSON.stringify({
        schemaVersion: STORAGE_SCHEMA_VERSION,
        profiles: [],
        sessions: [],
        settings: [],
      }),
    });
    const resultado = readDocument({
      store,
      key: STORAGE_KEYS.state,
      schema: StoredStateV1Schema,
      fallback: { schemaVersion: 1 as const, profiles: [], sessions: [], settings: [] },
      targetVersion: STORAGE_SCHEMA_VERSION,
      stamp: () => 'x',
    });
    expect(resultado.status).toBe('ok');
    expect(listQuarantined(store)).toHaveLength(0);
  });
});

describe('copia de seguridad', () => {
  it('exporta un documento que se puede volver a importar', async () => {
    const repo = createLocalRepository(createDeps().deps);
    await repo.sessions.saveActiveSession(sesion());
    await repo.sessions.completeActiveSession('2026-08-22T11:00:00.000Z');

    const copia = buildBackup(await repo.snapshot(), '2026-08-22T12:00:00.000Z');
    expect(copia.app).toBe('my-fitness-world');
    expect(copia.sessions).toHaveLength(1);

    const vacio = createLocalRepository(createDeps().deps);
    const resultado = importBackup(copia, 'replace', await vacio.snapshot());
    expect(resultado.report.ok).toBe(true);
    expect(resultado.state.sessions).toHaveLength(1);
  });

  it('rechaza un archivo que no es una copia nuestra, sin tocar los datos', async () => {
    const repo = createLocalRepository(createDeps().deps);
    const actual = await repo.snapshot();
    const resultado = importBackup({ hola: 'mundo' }, 'replace', actual);
    expect(resultado.report.ok).toBe(false);
    expect(resultado.report.error).toContain('no es una copia válida');
    expect(resultado.state).toBe(actual);
  });

  it('al fusionar, gana el registro más reciente y nunca lo pisa el antiguo', () => {
    const vieja = sesion({ status: 'completed', updatedAt: '2026-08-01T10:00:00.000Z' });
    const nueva = sesion({ status: 'completed', updatedAt: '2026-08-20T10:00:00.000Z' });

    const actual = { schemaVersion: 1 as const, profiles: [], sessions: [nueva], settings: [] };
    const copia = buildBackup(
      { schemaVersion: 1, profiles: [], sessions: [vieja], settings: [] },
      '2026-08-22T12:00:00.000Z',
    );

    const resultado = importBackup(copia, 'merge', actual);
    expect(resultado.report.sessionsKept).toBe(1);
    expect(resultado.report.sessionsUpdated).toBe(0);
    expect(resultado.state.sessions[0]?.updatedAt).toBe('2026-08-20T10:00:00.000Z');
  });

  it('al fusionar añade las sesiones que no tenías', () => {
    const mia = sesion({ id: 'aaaaaaaa-1111-4111-8111-111111111111', status: 'completed' });
    const suya = sesion({ id: 'bbbbbbbb-1111-4111-8111-111111111111', status: 'completed' });

    const resultado = importBackup(
      buildBackup(
        { schemaVersion: 1, profiles: [], sessions: [suya], settings: [] },
        '2026-08-22T12:00:00.000Z',
      ),
      'merge',
      { schemaVersion: 1, profiles: [], sessions: [mia], settings: [] },
    );

    expect(resultado.report.sessionsAdded).toBe(1);
    expect(resultado.state.sessions).toHaveLength(2);
  });

  it('restaurar deja el estado importado y descarta cualquier sesión a medias', async () => {
    const { deps } = createDeps();
    const repo = createLocalRepository(deps);
    await repo.sessions.saveActiveSession(sesion());

    await repo.restore({ schemaVersion: 1, profiles: [], sessions: [], settings: [] });
    expect(await repo.sessions.getActiveSession()).toBeNull();
    expect(await repo.sessions.listSessions()).toHaveLength(0);
  });
});
