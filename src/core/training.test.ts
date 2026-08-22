import { describe, expect, it } from 'vitest';

import type { Day, Exercise, ExerciseBlock, Slug } from '@/core/model';
import {
  blockKeyOf,
  dayMuscleGroups,
  daySetCount,
  estimateBlockSeconds,
  estimateDaySeconds,
  groupSupersets,
  weekSetCount,
  type ExerciseCatalog,
} from '@/core/training';

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
  [
    'flexiones',
    ejercicio('flexiones', { primaryMuscles: ['chest'], secondaryMuscles: ['triceps'] }),
  ],
  ['remo', ejercicio('remo', { primaryMuscles: ['lats'], unilateral: true })],
  ['plancha', ejercicio('plancha', { primaryMuscles: ['core'], isometric: true })],
]);

const bloque = (extra: Partial<ExerciseBlock> = {}): ExerciseBlock =>
  ({
    exerciseId: 'flexiones',
    sets: 3,
    repRange: { min: 10, max: 10 },
    restSeconds: 60,
    perSideLogging: false,
    ...extra,
  }) as ExerciseBlock;

const dia = (blocks: ExerciseBlock[], extra: Partial<Day> = {}): Day => ({
  order: 1,
  title: 'Un día',
  focus: 'Un foco',
  blocks,
  ...extra,
});

describe('claves y recuentos', () => {
  it('la clave del bloque es su ejercicio salvo que se declare otra', () => {
    expect(blockKeyOf(bloque())).toBe('flexiones');
    expect(blockKeyOf(bloque({ key: 'flexiones-final' }))).toBe('flexiones-final');
  });

  it('suma las series del día y de la semana', () => {
    const d = dia([bloque({ sets: 4 }), bloque({ sets: 3 })]);
    expect(daySetCount(d)).toBe(7);
    expect(weekSetCount({ order: 1, phase: 'accumulation', focus: 'x', days: [d, d] })).toBe(14);
  });
});

describe('estimación de duración', () => {
  it('cuenta trabajo y descanso de todas las series, incluida la última', () => {
    // 3 series × 10 reps × 3 s por rep = 90 s de trabajo, más 3 × 60 s de descanso.
    expect(estimateBlockSeconds(bloque(), catalogo)).toBe(270);
  });

  it('el tempo alarga la serie', () => {
    const lento = bloque({
      tempo: {
        eccentricSeconds: 3,
        bottomPauseSeconds: 1,
        concentricSeconds: 1,
        topPauseSeconds: 0,
      },
    });
    // Ahora cada repetición son 5 s: 150 s de trabajo más 180 s de descanso.
    expect(estimateBlockSeconds(lento, catalogo)).toBe(330);
  });

  it('un unilateral se ejecuta dos veces y suma el descanso entre lados', () => {
    const unilateral = bloque({ exerciseId: 'remo', intraSideRestSeconds: 30 });
    // Por serie: 10 reps × 3 s × 2 lados + 30 s = 90 s. Tres series más 3 × 60 s.
    expect(estimateBlockSeconds(unilateral, catalogo)).toBe(450);
  });

  it('una serie a tiempo dura lo que dice, sin calcular repeticiones', () => {
    const isometrico = bloque({
      exerciseId: 'plancha',
      repRange: undefined,
      workSeconds: 45,
      sets: 2,
      restSeconds: 60,
    });
    expect(estimateBlockSeconds(isometrico, catalogo)).toBe(210);
  });

  it('el multiplicador de descanso solo afecta al descanso, no al trabajo', () => {
    // 90 s de trabajo más 3 × 60 × 0,8 = 144 s de descanso.
    expect(estimateBlockSeconds(bloque(), catalogo, 0.8)).toBe(234);
  });

  it('el día añade cinco minutos cuando prescribe calentamiento', () => {
    const sinCalentar = dia([bloque()]);
    const calentando = dia([bloque()], { warmupNotes: 'Cinco minutos de movilidad.' });
    expect(estimateDaySeconds(sinCalentar, catalogo)).toBe(270);
    expect(estimateDaySeconds(calentando, catalogo)).toBe(570);
  });

  it('un ejercicio que falta del catálogo no rompe la estimación', () => {
    expect(estimateBlockSeconds(bloque({ exerciseId: 'fantasma' }), catalogo)).toBe(270);
  });
});

describe('grupos musculares del día', () => {
  it('ordena por número de series recibidas', () => {
    const d = dia([
      bloque({ exerciseId: 'remo', sets: 5 }),
      bloque({ exerciseId: 'flexiones', sets: 2 }),
    ]);
    expect(dayMuscleGroups(d, catalogo)).toEqual(['lats', 'chest']);
  });

  it('solo cuenta los músculos primarios', () => {
    const d = dia([bloque({ exerciseId: 'flexiones', sets: 3 })]);
    expect(dayMuscleGroups(d, catalogo)).toEqual(['chest']);
  });
});

describe('superseries', () => {
  it('agrupa los bloques que comparten grupo, conservando el orden', () => {
    const grupos = groupSupersets(
      dia([
        bloque({ exerciseId: 'flexiones' }),
        bloque({ exerciseId: 'remo', supersetGroup: 'brazos' }),
        bloque({ exerciseId: 'plancha', supersetGroup: 'brazos' }),
      ]),
    );
    expect(grupos).toHaveLength(2);
    expect(grupos[0]).toHaveLength(1);
    expect(grupos[1]?.map((b) => b.exerciseId)).toEqual(['remo', 'plancha']);
  });

  it('sin superseries, cada bloque va por su cuenta', () => {
    const grupos = groupSupersets(dia([bloque(), bloque({ exerciseId: 'remo' })]));
    expect(grupos.map((g) => g.length)).toEqual([1, 1]);
  });
});
