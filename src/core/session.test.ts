import { describe, expect, it } from 'vitest';

import type { Day, Exercise, ExerciseBlock, Slug } from '@/core/model';
import type { ExerciseCatalog } from '@/core/training';
import {
  buildSessionPlan,
  completedKeysOf,
  createSession,
  nextPendingIndex,
  recordStep,
  recordedValuesOf,
  restSecondsFor,
  sessionProgress,
} from '@/core/session';

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
  ['flexiones', ejercicio('flexiones')],
  ['remo', ejercicio('remo', { unilateral: true })],
  ['curl', ejercicio('curl')],
  ['fondos', ejercicio('fondos')],
  ['plancha', ejercicio('plancha', { isometric: true })],
]);

const bloque = (extra: Partial<ExerciseBlock> = {}): ExerciseBlock =>
  ({
    exerciseId: 'flexiones',
    sets: 3,
    repRange: { min: 10, max: 12 },
    restSeconds: 90,
    perSideLogging: false,
    ...extra,
  }) as ExerciseBlock;

const dia = (blocks: ExerciseBlock[]): Day => ({
  order: 1,
  title: 'Un día',
  focus: 'Un foco',
  blocks,
});

const RELOJ = { now: '2026-08-22T10:00:00.000Z', uuid: 'aaaaaaaa-1111-4111-8111-111111111111' };

const sesionVacia = () =>
  createSession({
    profileId: '00000000-0000-4000-8000-000000000001',
    mesocycleId: 'meso-01',
    weekOrder: 1,
    dayOrder: 1,
    now: RELOJ.now,
    uuid: 'bbbbbbbb-1111-4111-8111-111111111111',
  });

describe('plan de la sesión', () => {
  it('un bloque normal son tantos pasos como series', () => {
    const plan = buildSessionPlan(dia([bloque({ sets: 3 })]), catalogo);
    expect(plan.map((step) => step.setIndex)).toEqual([1, 2, 3]);
    expect(plan.every((step) => step.chained === false)).toBe(true);
  });

  it('las superseries se recorren en rondas, alternando ejercicios', () => {
    const plan = buildSessionPlan(
      dia([
        bloque({ exerciseId: 'curl', sets: 3, restSeconds: 10, supersetGroup: 'brazos' }),
        bloque({ exerciseId: 'fondos', sets: 3, restSeconds: 120, supersetGroup: 'brazos' }),
      ]),
      catalogo,
    );

    expect(plan.map((step) => `${step.exerciseId}${step.setIndex}`)).toEqual([
      'curl1',
      'fondos1',
      'curl2',
      'fondos2',
      'curl3',
      'fondos3',
    ]);
  });

  it('dentro de la superserie el descanso es corto, y largo al cerrar la ronda', () => {
    const plan = buildSessionPlan(
      dia([
        bloque({ exerciseId: 'curl', sets: 2, restSeconds: 10, supersetGroup: 'brazos' }),
        bloque({ exerciseId: 'fondos', sets: 2, restSeconds: 120, supersetGroup: 'brazos' }),
      ]),
      catalogo,
    );
    expect(plan.map((step) => step.restSeconds)).toEqual([10, 120, 10, 120]);
    expect(plan.map((step) => step.chained)).toEqual([true, false, true, false]);
  });

  it('si un ejercicio de la superserie tiene menos series, deja de aparecer en las rondas finales', () => {
    const plan = buildSessionPlan(
      dia([
        bloque({ exerciseId: 'curl', sets: 3, supersetGroup: 'brazos' }),
        bloque({ exerciseId: 'fondos', sets: 2, supersetGroup: 'brazos' }),
      ]),
      catalogo,
    );
    expect(plan.map((step) => step.exerciseId)).toEqual([
      'curl',
      'fondos',
      'curl',
      'fondos',
      'curl',
    ]);
    // La última ronda la cierra el curl, así que su descanso pasa a ser el largo.
    expect(plan.at(-1)?.chained).toBe(false);
  });

  it('un unilateral con registro por lados genera dos pasos por serie', () => {
    const plan = buildSessionPlan(
      dia([
        bloque({
          exerciseId: 'remo',
          sets: 2,
          perSideLogging: true,
          intraSideRestSeconds: 40,
          restSeconds: 90,
        }),
      ]),
      catalogo,
    );
    expect(plan.map((step) => `${step.setIndex}${step.side}`)).toEqual([
      '1left',
      '1right',
      '2left',
      '2right',
    ]);
    // Entre lados se descansa poco; el descanso del bloque va tras el segundo.
    expect(plan.map((step) => step.restSeconds)).toEqual([40, 90, 40, 90]);
  });

  it('sin registro por lados, un unilateral es un solo paso por serie', () => {
    const plan = buildSessionPlan(dia([bloque({ exerciseId: 'remo', sets: 2 })]), catalogo);
    expect(plan).toHaveLength(2);
    expect(plan[0]?.side).toBeUndefined();
  });

  it('una serie a tiempo arrastra sus segundos al paso', () => {
    const plan = buildSessionPlan(
      dia([bloque({ exerciseId: 'plancha', repRange: undefined, workSeconds: 45, sets: 2 })]),
      catalogo,
    );
    expect(plan.every((step) => step.workSeconds === 45)).toBe(true);
  });

  it('las claves de los pasos son únicas', () => {
    const plan = buildSessionPlan(
      dia([
        bloque({ exerciseId: 'remo', sets: 3, perSideLogging: true }),
        bloque({ exerciseId: 'curl', sets: 3 }),
      ]),
      catalogo,
    );
    expect(new Set(plan.map((step) => step.key)).size).toBe(plan.length);
  });
});

describe('progreso y navegación', () => {
  const plan = buildSessionPlan(dia([bloque({ sets: 3 })]), catalogo);

  it('cuenta lo hecho sobre el total', () => {
    expect(sessionProgress(plan, new Set())).toEqual({ done: 0, total: 3, ratio: 0 });
    expect(sessionProgress(plan, new Set([plan[0]!.key])).ratio).toBeCloseTo(1 / 3);
  });

  it('un plan vacío no deja la barra a medias', () => {
    expect(sessionProgress([], new Set()).ratio).toBe(1);
  });

  it('el siguiente pendiente salta lo ya hecho', () => {
    expect(nextPendingIndex(plan, new Set([plan[0]!.key]))).toBe(1);
  });

  it('si vas por el final y quedan huecos atrás, vuelve a por ellos', () => {
    const hechos = new Set([plan[1]!.key, plan[2]!.key]);
    expect(nextPendingIndex(plan, hechos, 2)).toBe(0);
  });

  it('sin pendientes devuelve null, que es lo que cierra la sesión', () => {
    expect(nextPendingIndex(plan, new Set(plan.map((step) => step.key)))).toBeNull();
  });

  it('el multiplicador aprieta los descansos y nunca los deja negativos', () => {
    const step = plan[0]!;
    expect(restSecondsFor(step, 1)).toBe(90);
    expect(restSecondsFor(step, 0.8)).toBe(72);
    expect(restSecondsFor({ ...step, restSeconds: 0 }, 1.5)).toBe(0);
  });
});

describe('registro de lo hecho', () => {
  const plan = buildSessionPlan(dia([bloque({ sets: 3 })]), catalogo);

  it('anota una serie con su peso y sus repeticiones', () => {
    const sesion = recordStep(sesionVacia(), plan[0]!, { reps: 12, weightKg: 9 }, RELOJ);
    expect(sesion.exercises).toHaveLength(1);
    expect(sesion.exercises[0]?.sets[0]).toMatchObject({ setIndex: 1, reps: 12, weightKg: 9 });
    expect(sesion.updatedAt).toBe(RELOJ.now);
  });

  it('no muta la sesión anterior', () => {
    const antes = sesionVacia();
    recordStep(antes, plan[0]!, { reps: 12 }, RELOJ);
    expect(antes.exercises).toHaveLength(0);
  });

  it('marcar dos veces la misma serie la corrige, no la duplica', () => {
    let sesion = recordStep(sesionVacia(), plan[0]!, { reps: 10, weightKg: 9 }, RELOJ);
    sesion = recordStep(sesion, plan[0]!, { reps: 12, weightKg: 9 }, RELOJ);
    expect(sesion.exercises[0]?.sets).toHaveLength(1);
    expect(sesion.exercises[0]?.sets[0]?.reps).toBe(12);
  });

  it('agrupa las series bajo el bloque al que pertenecen', () => {
    let sesion = sesionVacia();
    for (const step of plan) sesion = recordStep(sesion, step, { reps: 10 }, RELOJ);
    expect(sesion.exercises).toHaveLength(1);
    expect(sesion.exercises[0]?.sets).toHaveLength(3);
  });

  it('distingue los dos lados de un unilateral', () => {
    const porLados = buildSessionPlan(
      dia([bloque({ exerciseId: 'remo', sets: 1, perSideLogging: true })]),
      catalogo,
    );
    let sesion = recordStep(sesionVacia(), porLados[0]!, { reps: 12 }, RELOJ);
    sesion = recordStep(sesion, porLados[1]!, { reps: 11 }, RELOJ);
    expect(sesion.exercises[0]?.sets.map((set) => set.side)).toEqual(['left', 'right']);
  });

  it('una serie saltada queda registrada como saltada', () => {
    const sesion = recordStep(sesionVacia(), plan[0]!, { skipped: true }, RELOJ);
    expect(sesion.exercises[0]?.sets[0]?.skipped).toBe(true);
  });
});

describe('reanudar tras recargar', () => {
  const plan = buildSessionPlan(dia([bloque({ sets: 3 })]), catalogo);

  it('reconstruye por dónde ibas desde lo que hay guardado', () => {
    let sesion = recordStep(sesionVacia(), plan[0]!, { reps: 12 }, RELOJ);
    sesion = recordStep(sesion, plan[1]!, { reps: 11 }, RELOJ);

    const hechos = completedKeysOf(sesion, plan);
    expect(hechos.size).toBe(2);
    expect(nextPendingIndex(plan, hechos)).toBe(2);
  });

  it('recupera los valores exactos que anotaste', () => {
    const sesion = recordStep(sesionVacia(), plan[1]!, { reps: 11, weightKg: 9 }, RELOJ);
    expect(recordedValuesOf(sesion, plan[1]!)).toMatchObject({ reps: 11, weightKg: 9 });
    expect(recordedValuesOf(sesion, plan[0]!)).toBeUndefined();
  });
});
