import { describe, expect, it } from 'vitest';

import type {
  Exercise,
  ExerciseBlock,
  ExerciseLog,
  LoadItem,
  SessionLog,
  SetLog,
  Slug,
} from '@/core/model';
import type { ExerciseCatalog } from '@/core/training';
import { compareVolume, sessionVolume, setsByMuscle, totalsAcross } from '@/core/volume';
import { defaultValuesFor, findLastPerformance, prefillSets } from '@/core/prefill';

const serie = (extra: Partial<SetLog> = {}): SetLog => ({
  id: crypto.randomUUID(),
  setIndex: 1,
  skipped: false,
  completedAt: '2026-08-22T10:00:00.000Z',
  ...extra,
});

const sesion = (exercises: ExerciseLog[], extra: Partial<SessionLog> = {}): SessionLog => ({
  id: crypto.randomUUID(),
  profileId: crypto.randomUUID(),
  mesocycleId: 'meso-01',
  weekOrder: 1,
  dayOrder: 1,
  status: 'completed',
  startedAt: '2026-08-22T10:00:00.000Z',
  restMultiplier: 1,
  exercises,
  createdAt: '2026-08-22T10:00:00.000Z',
  updatedAt: '2026-08-22T10:00:00.000Z',
  ...extra,
});

const ejercicio = (
  id: Slug,
  primary: Exercise['primaryMuscles'],
  secondary: Exercise['secondaryMuscles'] = [],
): Exercise => ({
  id,
  name: id,
  primaryMuscles: primary,
  secondaryMuscles: secondary,
  equipment: ['dumbbell'],
  difficulty: 'beginner',
  loadType: 'external',
  unilateral: false,
  isometric: false,
  cues: ['una clave', 'otra clave'],
  commonMistakes: ['un error'],
  substitutions: [],
});

const catalogo: ExerciseCatalog = new Map([
  ['press-militar-mancuernas', ejercicio('press-militar-mancuernas', ['front_delts'], ['triceps'])],
  ['flexiones', ejercicio('flexiones', ['chest'], ['triceps'])],
]);

describe('volumen de una sesión', () => {
  it('no mezcla kilos con repeticiones de peso corporal', () => {
    const volumen = sessionVolume(
      sesion([
        {
          blockKey: 'press-militar-mancuernas',
          exerciseId: 'press-militar-mancuernas',
          sets: [serie({ reps: 12, weightKg: 9 }), serie({ reps: 10, weightKg: 9 })],
        },
        {
          blockKey: 'flexiones',
          exerciseId: 'flexiones',
          sets: [serie({ reps: 20 }), serie({ reps: 18 })],
        },
      ]),
    );

    expect(volumen.externalVolumeKg).toBe(198); // 9 × 12 + 9 × 10
    expect(volumen.bodyweightReps).toBe(38);
    expect(volumen.totalReps).toBe(60);
    expect(volumen.workingSets).toBe(4);
  });

  it('las series saltadas y las vacías no cuentan', () => {
    const volumen = sessionVolume(
      sesion([
        {
          blockKey: 'flexiones',
          exerciseId: 'flexiones',
          sets: [serie({ reps: 10 }), serie({ reps: 12, skipped: true }), serie({})],
        },
      ]),
    );
    expect(volumen.workingSets).toBe(1);
    expect(volumen.bodyweightReps).toBe(10);
  });

  it('cuenta los segundos de isométrico aparte', () => {
    const volumen = sessionVolume(
      sesion([{ blockKey: 'plancha', exerciseId: 'plancha', sets: [serie({ seconds: 45 })] }]),
    );
    expect(volumen.holdSeconds).toBe(45);
    expect(volumen.totalReps).toBe(0);
    expect(volumen.workingSets).toBe(1);
  });

  it('una sesión sin nada registrado da todo a cero', () => {
    expect(sessionVolume(sesion([]))).toEqual({
      externalVolumeKg: 0,
      bodyweightReps: 0,
      workingSets: 0,
      totalReps: 0,
      holdSeconds: 0,
    });
  });
});

describe('agregados', () => {
  const unaSesion = sesion([
    {
      blockKey: 'press-militar-mancuernas',
      exerciseId: 'press-militar-mancuernas',
      sets: [serie({ reps: 10, weightKg: 9 }), serie({ reps: 10, weightKg: 9 })],
    },
  ]);

  it('suma varias sesiones', () => {
    const total = totalsAcross([unaSesion, unaSesion]);
    expect(total.externalVolumeKg).toBe(360);
    expect(total.workingSets).toBe(4);
  });

  it('reparte series por músculo, contando las secundarias a media serie', () => {
    const porMusculo = setsByMuscle([unaSesion], catalogo);
    expect(porMusculo.get('front_delts')).toBe(2);
    expect(porMusculo.get('triceps')).toBe(1);
  });

  it('un ejercicio que no está en el catálogo no rompe el reparto', () => {
    const rara = sesion([
      { blockKey: 'desconocido', exerciseId: 'desconocido', sets: [serie({ reps: 10 })] },
    ]);
    expect(setsByMuscle([rara], catalogo).size).toBe(0);
  });

  it('compara con la semana anterior y evita dividir por cero', () => {
    const ahora = sessionVolume(unaSesion);
    const antes = sessionVolume(sesion([]));
    const diff = compareVolume(ahora, antes);
    expect(diff.externalVolumeKg).toBe(180);
    expect(diff.externalRatio).toBeNull();
    expect(compareVolume(ahora, ahora).externalRatio).toBe(1);
  });
});

describe('prellenado desde el historial', () => {
  const bloque = {
    exerciseId: 'press-militar-mancuernas',
    sets: 3,
    restSeconds: 90,
    perSideLogging: false,
  } as const;

  const antigua = sesion(
    [
      {
        blockKey: 'press-militar-mancuernas',
        exerciseId: 'press-militar-mancuernas',
        sets: [
          serie({ setIndex: 1, reps: 10, weightKg: 9 }),
          serie({ setIndex: 2, reps: 9, weightKg: 9 }),
        ],
      },
    ],
    { startedAt: '2026-08-15T10:00:00.000Z' },
  );
  const reciente = sesion(
    [
      {
        blockKey: 'press-militar-mancuernas',
        exerciseId: 'press-militar-mancuernas',
        sets: [
          serie({ setIndex: 1, reps: 12, weightKg: 9 }),
          serie({ setIndex: 2, reps: 11, weightKg: 9 }),
        ],
      },
    ],
    { startedAt: '2026-08-22T10:00:00.000Z' },
  );

  it('encuentra la sesión más reciente aunque lleguen desordenadas', () => {
    const last = findLastPerformance([antigua, reciente], 'press-militar-mancuernas');
    expect(last?.log.sets[0]?.reps).toBe(12);
  });

  it('ignora las sesiones sin terminar', () => {
    const enCurso = sesion(
      [
        {
          blockKey: 'press-militar-mancuernas',
          exerciseId: 'press-militar-mancuernas',
          sets: [serie({ reps: 99, weightKg: 20 })],
        },
      ],
      { status: 'in_progress', startedAt: '2026-08-29T10:00:00.000Z' },
    );
    const last = findLastPerformance([reciente, enCurso], 'press-militar-mancuernas');
    expect(last?.log.sets[0]?.reps).toBe(12);
  });

  it('puede excluir la sesión que estás haciendo ahora', () => {
    const last = findLastPerformance([reciente, antigua], 'press-militar-mancuernas', {
      excludeSessionId: reciente.id,
    });
    expect(last?.log.sets[0]?.reps).toBe(10);
  });

  it('sin historial no devuelve nada', () => {
    expect(findLastPerformance([], 'press-militar-mancuernas')).toBeNull();
    expect(findLastPerformance([reciente], 'flexiones')).toBeNull();
  });

  it('rellena cada serie con lo que hiciste, y las nuevas heredan de la última', () => {
    const last = findLastPerformance([reciente], 'press-militar-mancuernas');
    const filas = prefillSets(bloque, last!.log);
    expect(filas).toHaveLength(3);
    expect(filas[0]).toMatchObject({ setIndex: 1, reps: 12, weightKg: 9, source: 'history' });
    expect(filas[1]).toMatchObject({ setIndex: 2, reps: 11 });
    // La tercera serie no existía la última vez: hereda de la segunda.
    expect(filas[2]).toMatchObject({ setIndex: 3, reps: 11, source: 'history' });
  });

  it('sin historial deja los campos vacíos en vez de inventar un peso', () => {
    const filas = prefillSets(bloque, null);
    expect(filas).toHaveLength(3);
    expect(filas[0]).toEqual({ setIndex: 1, source: 'none' });
  });

  it('en registro por lados genera una fila por lado', () => {
    const filas = prefillSets({ ...bloque, sets: 2 }, null, { perSide: true });
    expect(filas.map((f) => `${f.setIndex}${f.side}`)).toEqual([
      '1left',
      '1right',
      '2left',
      '2right',
    ]);
  });
});

describe('valores por defecto de una serie', () => {
  const bloque = {
    exerciseId: 'press-militar-mancuernas',
    sets: 3,
    repRange: { min: 10, max: 12 },
    restSeconds: 90,
    perSideLogging: false,
  } as ExerciseBlock;

  const material: LoadItem[] = [
    { id: crypto.randomUUID(), kind: 'dumbbell', weightKg: 9, count: 2 },
    { id: crypto.randomUUID(), kind: 'dumbbell', weightKg: 12, count: 2 },
  ];

  it('lo que hiciste la última vez manda sobre cualquier sugerencia', () => {
    const valores = defaultValuesFor({
      block: bloque,
      loadType: 'external',
      last: serie({ reps: 11, weightKg: 12 }),
      equipment: material,
    });
    expect(valores).toEqual({ reps: 11, weightKg: 12, source: 'history' });
  });

  it('sin historial sugiere el mínimo del rango y el peso más ligero que puedas montar', () => {
    const valores = defaultValuesFor({ block: bloque, loadType: 'external', equipment: material });
    expect(valores).toEqual({ reps: 10, weightKg: 9, source: 'suggested' });
  });

  it('un ejercicio de peso corporal no sugiere kilos', () => {
    const valores = defaultValuesFor({
      block: bloque,
      loadType: 'bodyweight',
      equipment: material,
    });
    expect(valores.weightKg).toBeUndefined();
    expect(valores.reps).toBe(10);
  });

  it('sin material declarado sugiere repeticiones pero no peso', () => {
    const valores = defaultValuesFor({ block: bloque, loadType: 'external', equipment: [] });
    expect(valores).toEqual({ reps: 10, source: 'suggested' });
  });

  it('una serie a tiempo sugiere sus segundos, no repeticiones', () => {
    const isometrico = { ...bloque, repRange: undefined, workSeconds: 45 } as ExerciseBlock;
    const valores = defaultValuesFor({
      block: isometrico,
      loadType: 'bodyweight',
      equipment: material,
    });
    expect(valores).toEqual({ seconds: 45, source: 'suggested' });
  });

  it('sin nada que sugerir lo dice, en vez de inventar un cero', () => {
    const vacio = { ...bloque, repRange: undefined } as ExerciseBlock;
    const valores = defaultValuesFor({ block: vacio, loadType: 'bodyweight', equipment: [] });
    expect(valores).toEqual({ source: 'none' });
  });
});
