import { describe, expect, it } from 'vitest';

import type { Profile, SessionLog, Settings } from '@/core/model';
import { STORAGE_SCHEMA_VERSION } from '@/core/model';
import {
  profileToRow,
  rowToProfile,
  rowToSession,
  rowToSettings,
  sessionToRow,
  settingsToRow,
} from '@/db/mappers';

const USER = 'usr_abc123';

const sesion: SessionLog = {
  id: '00000000-0000-4000-8000-000000000010',
  profileId: '00000000-0000-4000-8000-000000000001',
  mesocycleId: 'meso-01',
  weekOrder: 2,
  dayOrder: 3,
  status: 'completed',
  startedAt: '2026-08-20T10:00:00.000Z',
  finishedAt: '2026-08-20T11:00:00.000Z',
  restMultiplier: 1,
  exercises: [
    {
      blockKey: 'flexiones',
      exerciseId: 'flexiones',
      sets: [
        {
          id: '00000000-0000-4000-8000-000000000020',
          setIndex: 1,
          reps: 12,
          weightKg: 9,
          skipped: false,
          completedAt: '2026-08-20T10:05:00.000Z',
        },
      ],
    },
  ],
  createdAt: '2026-08-20T10:00:00.000Z',
  updatedAt: '2026-08-20T11:00:00.000Z',
};

const ajustes: Settings = {
  profileId: '00000000-0000-4000-8000-000000000001',
  availableLoads: [
    { id: '00000000-0000-4000-8000-000000000030', kind: 'dumbbell', weightKg: 9, count: 2 },
  ],
  bodyweightKg: 78,
  soundEnabled: true,
  vibrationEnabled: true,
  theme: 'dark',
  restSeconds: 60,
  restMultiplier: 1,
  autoStartRest: true,
  keepScreenAwake: true,
  updatedAt: '2026-08-20T11:00:00.000Z',
};

const perfil: Profile = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Yo',
  createdAt: '2026-08-01T09:00:00.000Z',
};

describe('mapeo de sesiones', () => {
  it('sube a columnas solo lo que se filtra, y el resto va al JSON', () => {
    const row = sessionToRow(sesion, USER);

    expect(row).toMatchObject({
      userId: USER,
      mesocycleId: 'meso-01',
      weekOrder: 2,
      dayOrder: 3,
      status: 'completed',
      schemaVersion: STORAGE_SCHEMA_VERSION,
    });
    // Las series no tienen columna: viven dentro del payload.
    expect(row.payload).toBe(sesion);
    expect(Object.keys(row)).not.toContain('exercises');
  });

  it('convierte las marcas de tiempo a Date para Postgres', () => {
    const row = sessionToRow(sesion, USER);

    expect(row.startedAt).toBeInstanceOf(Date);
    expect(row.startedAt.toISOString()).toBe(sesion.startedAt);
    expect(row.finishedAt?.toISOString()).toBe(sesion.finishedAt);
  });

  it('deja finishedAt nulo cuando la sesión sigue en curso', () => {
    const { finishedAt: _omitido, ...resto } = sesion;
    const enCurso: SessionLog = { ...resto, status: 'in_progress' };

    expect(sessionToRow(enCurso, USER).finishedAt).toBeNull();
  });

  it('vuelve del JSON a la sesión sin perder nada', () => {
    const row = sessionToRow(sesion, USER);

    expect(rowToSession({ payload: row.payload, schemaVersion: row.schemaVersion })).toEqual(
      sesion,
    );
  });

  it('rechaza una fila con el payload corrupto en vez de devolver basura', () => {
    expect(() => rowToSession({ payload: { id: 'no-es-un-uuid' }, schemaVersion: 1 })).toThrow();
  });
});

describe('mapeo de ajustes y perfiles', () => {
  it('guarda los ajustes enteros en data y los recupera', () => {
    const row = settingsToRow(ajustes, USER);

    expect(row.userId).toBe(USER);
    expect(row.profileId).toBe(ajustes.profileId);
    expect(rowToSettings({ data: row.data, schemaVersion: row.schemaVersion })).toEqual(ajustes);
  });

  it('rechaza unos ajustes corruptos', () => {
    expect(() => rowToSettings({ data: { restSeconds: 9999 }, schemaVersion: 1 })).toThrow();
  });

  it('el perfil va y vuelve entero', () => {
    const row = profileToRow(perfil, USER);

    expect(row.userId).toBe(USER);
    expect(rowToProfile(row)).toEqual(perfil);
  });
});
