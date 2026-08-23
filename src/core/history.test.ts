import { describe, expect, it } from 'vitest';

import type { Exercise, LoadItem, Mesocycle, SessionLog, SetLog, Slug } from '@/core/model';
import type { ExerciseCatalog } from '@/core/training';
import { loadAlerts, muscleBars, sessionRows, trackedBlocksOf, volumeByWeek } from '@/core/history';

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

const catalogo: ExerciseCatalog = new Map([
  ['press', ejercicio('press', { primaryMuscles: ['front_delts'], secondaryMuscles: ['triceps'] })],
  ['flexiones', ejercicio('flexiones', { primaryMuscles: ['chest'] })],
]);

const serie = (extra: Partial<SetLog> = {}): SetLog => ({
  id: crypto.randomUUID(),
  setIndex: 1,
  skipped: false,
  completedAt: '2026-08-22T10:00:00.000Z',
  ...extra,
});

const sesion = (
  weekOrder: number,
  startedAt: string,
  exercises: SessionLog['exercises'],
  extra: Partial<SessionLog> = {},
): SessionLog => ({
  id: crypto.randomUUID(),
  profileId: '00000000-0000-4000-8000-000000000001',
  mesocycleId: 'meso-01',
  weekOrder,
  dayOrder: 1,
  status: 'completed',
  startedAt,
  finishedAt: '2026-08-22T11:00:00.000Z',
  restMultiplier: 1,
  exercises,
  createdAt: startedAt,
  updatedAt: startedAt,
  ...extra,
});

const bloquePress = {
  exerciseId: 'press' as Slug,
  sets: 3,
  repRange: { min: 10, max: 12 },
  restSeconds: 90,
  perSideLogging: false,
};

const mesociclo: Mesocycle = {
  id: 'meso-01',
  name: 'Meso',
  isActive: true,
  weeks: [
    {
      order: 1,
      phase: 'accumulation',
      focus: 'x',
      days: [{ order: 1, title: 'Día', focus: 'x', blocks: [bloquePress] }],
    },
  ],
} as Mesocycle;

const DOS_DE_NUEVE: LoadItem[] = [
  { id: crypto.randomUUID(), kind: 'dumbbell', weightKg: 9, count: 2 },
];
const AMPLIADO: LoadItem[] = [
  ...DOS_DE_NUEVE,
  { id: crypto.randomUUID(), kind: 'dumbbell', weightKg: 12, count: 2 },
];

describe('volumen por semana', () => {
  it('agrupa las sesiones por semana y las ordena', () => {
    const semanas = volumeByWeek(
      [
        sesion(2, '2026-08-08T10:00:00.000Z', [
          { blockKey: 'press', exerciseId: 'press', sets: [serie({ reps: 10, weightKg: 9 })] },
        ]),
        sesion(1, '2026-08-01T10:00:00.000Z', [
          { blockKey: 'press', exerciseId: 'press', sets: [serie({ reps: 10, weightKg: 9 })] },
        ]),
      ],
      catalogo,
    );
    expect(semanas.map((week) => week.weekOrder)).toEqual([1, 2]);
    expect(semanas[0]?.totals.externalVolumeKg).toBe(90);
  });

  it('suma varias sesiones de la misma semana', () => {
    const unaSerie = [
      { blockKey: 'press', exerciseId: 'press' as Slug, sets: [serie({ reps: 10, weightKg: 9 })] },
    ];
    const semanas = volumeByWeek(
      [
        sesion(1, '2026-08-01T10:00:00.000Z', unaSerie),
        sesion(1, '2026-08-03T10:00:00.000Z', unaSerie),
      ],
      catalogo,
    );
    expect(semanas).toHaveLength(1);
    expect(semanas[0]?.sessions).toBe(2);
    expect(semanas[0]?.totals.externalVolumeKg).toBe(180);
  });

  it('ignora las sesiones sin terminar', () => {
    const semanas = volumeByWeek(
      [sesion(1, '2026-08-01T10:00:00.000Z', [], { status: 'in_progress' })],
      catalogo,
    );
    expect(semanas).toHaveLength(0);
  });
});

describe('barras por músculo', () => {
  it('ordena de más a menos y la mayor llena el ancho', () => {
    const barras = muscleBars(
      new Map([
        ['chest', 6],
        ['triceps', 3],
        ['front_delts', 12],
      ]),
    );
    expect(barras.map((bar) => bar.muscle)).toEqual(['front_delts', 'chest', 'triceps']);
    expect(barras[0]?.ratio).toBe(1);
    expect(barras[1]?.ratio).toBe(0.5);
  });

  it('recorta a los más trabajados para no llenar la pantalla de ruido', () => {
    const muchos = new Map(
      (
        [
          'chest',
          'triceps',
          'lats',
          'quads',
          'glutes',
          'core',
          'biceps',
          'calves',
          'traps',
        ] as const
      ).map((muscle, index) => [muscle, 10 - index]),
    );
    expect(muscleBars(muchos, 4)).toHaveLength(4);
  });

  it('sin datos no divide por cero', () => {
    expect(muscleBars(new Map())).toEqual([]);
  });
});

describe('lista de sesiones', () => {
  it('las devuelve de la más reciente a la más antigua con su duración', () => {
    const filas = sessionRows([
      sesion(1, '2026-08-01T10:00:00.000Z', [], { finishedAt: '2026-08-01T11:00:00.000Z' }),
      sesion(2, '2026-08-08T10:00:00.000Z', [], { finishedAt: '2026-08-08T10:45:00.000Z' }),
    ]);
    expect(filas.map((row) => row.session.weekOrder)).toEqual([2, 1]);
    expect(filas[0]?.durationSeconds).toBe(2700);
  });

  it('una sesión sin hora de fin no inventa una duración', () => {
    const filas = sessionRows([
      sesion(1, '2026-08-01T10:00:00.000Z', [], { finishedAt: undefined }),
    ]);
    expect(filas[0]?.durationSeconds).toBe(0);
  });
});

describe('avisos de subir peso', () => {
  const alTope = (startedAt: string): SessionLog =>
    sesion(1, startedAt, [
      {
        blockKey: 'press',
        exerciseId: 'press',
        sets: [
          serie({ setIndex: 1, reps: 12, weightKg: 9 }),
          serie({ setIndex: 2, reps: 12, weightKg: 9 }),
          serie({ setIndex: 3, reps: 13, weightKg: 9 }),
        ],
      },
    ]);

  it('avisa tras dos sesiones seguidas al tope y dice el siguiente peso', () => {
    const avisos = loadAlerts(
      [alTope('2026-08-01T10:00:00.000Z'), alTope('2026-08-08T10:00:00.000Z')],
      trackedBlocksOf(mesociclo),
      AMPLIADO,
    );
    expect(avisos).toHaveLength(1);
    expect(avisos[0]?.advice.status).toBe('raise-load');
    expect(avisos[0]?.advice.nextKg).toBe(12);
  });

  it('con una sola sesión al tope no avisa', () => {
    expect(
      loadAlerts([alTope('2026-08-08T10:00:00.000Z')], trackedBlocksOf(mesociclo), AMPLIADO),
    ).toEqual([]);
  });

  it('avisa también cuando te has quedado sin material más pesado', () => {
    const avisos = loadAlerts(
      [alTope('2026-08-01T10:00:00.000Z'), alTope('2026-08-08T10:00:00.000Z')],
      trackedBlocksOf(mesociclo),
      DOS_DE_NUEVE,
    );
    expect(avisos[0]?.advice.status).toBe('at-equipment-limit');
  });

  it('sin historial de ese bloque no dice nada', () => {
    expect(loadAlerts([], trackedBlocksOf(mesociclo), AMPLIADO)).toEqual([]);
  });

  it('extrae cada bloque una sola vez aunque aparezca en varias semanas', () => {
    const cuatroSemanas: Mesocycle = {
      ...mesociclo,
      weeks: [1, 2, 3, 4].map((order) => ({ ...mesociclo.weeks[0]!, order })),
    };
    const avisos = loadAlerts(
      [alTope('2026-08-01T10:00:00.000Z'), alTope('2026-08-08T10:00:00.000Z')],
      trackedBlocksOf(cuatroSemanas),
      AMPLIADO,
    );
    expect(avisos).toHaveLength(1);
  });
});
