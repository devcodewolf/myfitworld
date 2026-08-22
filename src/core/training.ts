/**
 * Agregados de la prescripción: cuánto trabajo hay y cuánto va a durar.
 * Funciones puras sobre los datos de la rutina; ni DOM ni almacenamiento.
 */
import type { Day, Exercise, ExerciseBlock, MuscleGroup, Slug, Week } from '@/core/model';

export type ExerciseCatalog = ReadonlyMap<Slug, Exercise>;

/** Clave estable del bloque dentro del día: es lo que enlaza el historial. */
export function blockKeyOf(block: ExerciseBlock): string {
  return block.key ?? block.exerciseId;
}

export function daySetCount(day: Day): number {
  return day.blocks.reduce((total, block) => total + block.sets, 0);
}

export function weekSetCount(week: Week): number {
  return week.days.reduce((total, day) => total + daySetCount(day), 0);
}

/** Segundos por repetición según el tempo; 3 s si no hay tempo declarado. */
function secondsPerRep(block: ExerciseBlock): number {
  const tempo = block.tempo;
  if (!tempo) return 3;
  return (
    tempo.eccentricSeconds +
    tempo.bottomPauseSeconds +
    tempo.concentricSeconds +
    tempo.topPauseSeconds
  );
}

/** Duración de una serie: el trabajo prescrito, o las reps medias por su tempo. */
function setSeconds(block: ExerciseBlock, exercise: Exercise | undefined): number {
  if (block.workSeconds !== undefined) return block.workSeconds;
  const range = block.repRange;
  const averageReps = range ? (range.min + range.max) / 2 : 10;
  const work = averageReps * secondsPerRep(block);
  // Un unilateral se ejecuta dos veces, con su descanso entre lados.
  if (exercise?.unilateral) return work * 2 + (block.intraSideRestSeconds ?? 0);
  return work;
}

/**
 * Trabajo más descanso de todas las series, incluida la última: después de la
 * última serie también se descansa antes de recolocar el material.
 */
export function estimateBlockSeconds(
  block: ExerciseBlock,
  catalog: ExerciseCatalog,
  restMultiplier = 1,
): number {
  const exercise = catalog.get(block.exerciseId);
  const work = setSeconds(block, exercise) * block.sets;
  const rest = block.restSeconds * restMultiplier * block.sets;
  return work + rest;
}

/** Cinco minutos de calentamiento cuando el día lo prescribe. */
const WARMUP_SECONDS = 300;

export function estimateDaySeconds(day: Day, catalog: ExerciseCatalog, restMultiplier = 1): number {
  const blocks = day.blocks.reduce(
    (total, block) => total + estimateBlockSeconds(block, catalog, restMultiplier),
    0,
  );
  return Math.round(blocks + (day.warmupNotes ? WARMUP_SECONDS : 0));
}

export function estimateWeekSeconds(
  week: Week,
  catalog: ExerciseCatalog,
  restMultiplier = 1,
): number {
  return week.days.reduce(
    (total, day) => total + estimateDaySeconds(day, catalog, restMultiplier),
    0,
  );
}

/** Grupos musculares del día, ordenados por número de series que reciben. */
export function dayMuscleGroups(day: Day, catalog: ExerciseCatalog): MuscleGroup[] {
  const setsByMuscle = new Map<MuscleGroup, number>();
  for (const block of day.blocks) {
    const exercise = catalog.get(block.exerciseId);
    if (!exercise) continue;
    for (const muscle of exercise.primaryMuscles) {
      setsByMuscle.set(muscle, (setsByMuscle.get(muscle) ?? 0) + block.sets);
    }
  }
  return [...setsByMuscle.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([muscle]) => muscle);
}

/** Bloques agrupados por superserie, conservando el orden de la rutina. */
export function groupSupersets(day: Day): ExerciseBlock[][] {
  const groups: ExerciseBlock[][] = [];
  const indexByGroup = new Map<string, number>();
  for (const block of day.blocks) {
    const group = block.supersetGroup;
    if (group === undefined) {
      groups.push([block]);
      continue;
    }
    const existing = indexByGroup.get(group);
    if (existing === undefined) {
      indexByGroup.set(group, groups.length);
      groups.push([block]);
    } else {
      groups[existing]!.push(block);
    }
  }
  return groups;
}
