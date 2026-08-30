import { describe, expect, it } from 'vitest';

import type { Exercise, LoadItem, SessionLog, SetLog, Slug } from '@/core/model';
import type { ExerciseCatalog } from '@/core/training';
import type { TrackedBlock } from '@/core/history';
import { briefSizeBytes, buildTrainingBrief } from '@/core/advice';

const ejercicio = (id: Slug, extra: Partial<Exercise> = {}): Exercise => ({
  id,
  name: id,
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment: ['dumbbell'],
  difficulty: 'beginner',
  loadType: 'external',
  unilateral: false,
  isometric: false,
  cues: ['una clave', 'otra clave'],
  commonMistakes: ['un error'],
  substitutions: [],
  ...extra,
});

const catalog: ExerciseCatalog = new Map([
  ['press', ejercicio('press', { primaryMuscles: ['front_delts'], secondaryMuscles: ['triceps'] })],
]);

const names = { press: 'Press militar' };

const serie = (extra: Partial<SetLog> = {}): SetLog => ({
  id: crypto.randomUUID(),
  setIndex: 1,
  reps: 12,
  weightKg: 9,
  skipped: false,
  completedAt: '2026-08-22T10:00:00.000Z',
  ...extra,
});

const sesion = (weekOrder: number, startedAt: string, sets: SetLog[]): SessionLog => ({
  id: crypto.randomUUID(),
  profileId: '00000000-0000-4000-8000-000000000001',
  mesocycleId: 'meso-01',
  weekOrder,
  dayOrder: 1,
  status: 'completed',
  startedAt,
  finishedAt: startedAt,
  restMultiplier: 1,
  exercises: [{ blockKey: 'press', exerciseId: 'press', sets }],
  createdAt: startedAt,
  updatedAt: startedAt,
});

const bloques: TrackedBlock[] = [
  { blockKey: 'press', exerciseId: 'press', repRange: { min: 8, max: 12 } },
];

const material: LoadItem[] = [{ id: crypto.randomUUID(), kind: 'dumbbell', weightKg: 9, count: 2 }];

const entrada = (sessions: SessionLog[], equipment: LoadItem[] = material) => ({
  sessions,
  catalog,
  names,
  blocks: bloques,
  equipment,
  phases: { 1: 'accumulation' as const, 2: 'progression' as const },
  plannedSessions: 12,
  bodyweightKg: 78,
});

describe('buildTrainingBrief', () => {
  it('resume el progreso y el reparto por músculo sin mandar una sola serie cruda', () => {
    const brief = buildTrainingBrief(
      entrada([
        sesion(1, '2026-08-01T10:00:00.000Z', [serie(), serie()]),
        sesion(2, '2026-08-08T10:00:00.000Z', [serie()]),
      ]),
    );

    expect(brief.progress).toEqual({ done: 2, planned: 12, week: 2 });
    expect(brief.weeks.map((week) => week.sets)).toEqual([2, 1]);
    // El secundario cuenta media serie, igual que en el historial.
    expect(brief.byMuscle).toEqual([
      { muscle: 'front_delts', sets: 3 },
      { muscle: 'triceps', sets: 1.5 },
    ]);
    expect(JSON.stringify(brief)).not.toContain('completedAt');
  });

  it('no incluye el identificador del perfil ni marcas de tiempo', () => {
    const brief = buildTrainingBrief(entrada([sesion(1, '2026-08-01T10:00:00.000Z', [serie()])]));
    const json = JSON.stringify(brief);

    expect(json).not.toContain('00000000-0000-4000-8000-000000000001');
    expect(json).not.toContain('2026-08-01');
  });

  it('lleva las cargas que se pueden montar de verdad, no el inventario', () => {
    const brief = buildTrainingBrief(entrada([]));

    // Un par de 9 kg: se puede trabajar a 9 por mano.
    expect(brief.equipmentKg).toContain(9);
    expect(brief.bodyweightKg).toBe(78);
  });

  it('separa lo que puede subir de peso de lo que ya topa su material', () => {
    // Dos sesiones seguidas superando el tope del rango: dispara el aviso.
    const alTope = [serie({ reps: 13 }), serie({ reps: 13, setIndex: 2 })];
    const brief = buildTrainingBrief(
      entrada([
        sesion(1, '2026-08-01T10:00:00.000Z', alTope),
        sesion(2, '2026-08-08T10:00:00.000Z', alTope),
      ]),
    );

    const mencionado = [...brief.readyToRaise.map((x) => x.exercise), ...brief.atCeiling];
    expect(mencionado).toContain('Press militar');
    // Con un solo par de mancuernas no hay salto: cae en el techo, no en subir.
    expect(brief.readyToRaise).toEqual([]);
    expect(brief.atCeiling).toEqual(['Press militar']);
  });

  it('sobrevive a un historial vacío sin inventar nada', () => {
    const brief = buildTrainingBrief(entrada([]));

    expect(brief.progress).toEqual({ done: 0, planned: 12, week: 0 });
    expect(brief.weeks).toEqual([]);
    expect(brief.byMuscle).toEqual([]);
  });

  it('el resumen entero cabe en unos pocos kilobytes', () => {
    const muchas = Array.from({ length: 12 }, (_, i) =>
      sesion((i % 4) + 1, `2026-08-0${(i % 9) + 1}T10:00:00.000Z`, [serie(), serie(), serie()]),
    );

    expect(briefSizeBytes(buildTrainingBrief(entrada(muchas)))).toBeLessThan(2000);
  });
});
