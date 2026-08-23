/**
 * Cuánto trabajo has hecho de verdad.
 *
 * El volumen externo y las repeticiones de peso corporal **no se mezclan nunca
 * en una sola cifra**: sumar 9 kg × 12 reps con 20 flexiones da un número que
 * no significa nada. Se cuentan por separado y se muestran por separado.
 */
import type { Exercise, MuscleGroup, SessionLog, SetLog, Slug } from '@/core/model';

export interface VolumeTotals {
  /** Suma de peso por repeticiones, en kg. Solo series con peso registrado. */
  readonly externalVolumeKg: number;
  /** Repeticiones hechas sin carga externa. */
  readonly bodyweightReps: number;
  readonly workingSets: number;
  readonly totalReps: number;
  /** Segundos de isométrico o de serie a tiempo. */
  readonly holdSeconds: number;
}

export const EMPTY_VOLUME: VolumeTotals = {
  externalVolumeKg: 0,
  bodyweightReps: 0,
  workingSets: 0,
  totalReps: 0,
  holdSeconds: 0,
};

const isWorking = (set: SetLog): boolean =>
  !set.skipped && ((set.reps ?? 0) > 0 || (set.seconds ?? 0) > 0);

export function sessionVolume(session: SessionLog): VolumeTotals {
  let externalVolumeKg = 0;
  let bodyweightReps = 0;
  let workingSets = 0;
  let totalReps = 0;
  let holdSeconds = 0;

  for (const exercise of session.exercises) {
    for (const set of exercise.sets) {
      if (!isWorking(set)) continue;
      workingSets += 1;
      const reps = set.reps ?? 0;
      totalReps += reps;
      holdSeconds += set.seconds ?? 0;
      if ((set.weightKg ?? 0) > 0) {
        externalVolumeKg += set.weightKg! * reps;
      } else {
        bodyweightReps += reps;
      }
    }
  }

  return {
    externalVolumeKg: Math.round(externalVolumeKg * 10) / 10,
    bodyweightReps,
    workingSets,
    totalReps,
    holdSeconds,
  };
}

export function totalsAcross(sessions: readonly SessionLog[]): VolumeTotals {
  return sessions.reduce<VolumeTotals>((total, session) => {
    const volume = sessionVolume(session);
    return {
      externalVolumeKg: Math.round((total.externalVolumeKg + volume.externalVolumeKg) * 10) / 10,
      bodyweightReps: total.bodyweightReps + volume.bodyweightReps,
      workingSets: total.workingSets + volume.workingSets,
      totalReps: total.totalReps + volume.totalReps,
      holdSeconds: total.holdSeconds + volume.holdSeconds,
    };
  }, EMPTY_VOLUME);
}

/**
 * Lo único que hace falta saber de un ejercicio para repartir series.
 *
 * Más estrecho que el catálogo entero a propósito: así la pantalla de historial
 * puede mandar al cliente solo los músculos, en vez de las claves de técnica y
 * los errores comunes de los dieciséis ejercicios.
 */
export type MuscleSource = ReadonlyMap<Slug, Pick<Exercise, 'primaryMuscles' | 'secondaryMuscles'>>;

/**
 * Series efectivas por grupo muscular. Las secundarias cuentan media serie,
 * que es la convención habitual para no inflar el volumen de los accesorios.
 */
export function setsByMuscle(
  sessions: readonly SessionLog[],
  catalog: MuscleSource,
): Map<MuscleGroup, number> {
  const byMuscle = new Map<MuscleGroup, number>();
  const add = (muscle: MuscleGroup, amount: number): void => {
    byMuscle.set(muscle, (byMuscle.get(muscle) ?? 0) + amount);
  };

  for (const session of sessions) {
    for (const log of session.exercises) {
      const exercise = catalog.get(log.exerciseId);
      if (!exercise) continue;
      const sets = log.sets.filter(isWorking).length;
      if (sets === 0) continue;
      for (const muscle of exercise.primaryMuscles) add(muscle, sets);
      for (const muscle of exercise.secondaryMuscles) add(muscle, sets / 2);
    }
  }

  return byMuscle;
}

export interface VolumeComparison {
  readonly externalVolumeKg: number;
  readonly totalReps: number;
  readonly workingSets: number;
  /** Variación del volumen externo entre 0 y 1, o `null` si antes no había nada. */
  readonly externalRatio: number | null;
}

/** Diferencia de `current` respecto a `previous`, para la comparativa de sesión. */
export function compareVolume(current: VolumeTotals, previous: VolumeTotals): VolumeComparison {
  return {
    externalVolumeKg: Math.round((current.externalVolumeKg - previous.externalVolumeKg) * 10) / 10,
    totalReps: current.totalReps - previous.totalReps,
    workingSets: current.workingSets - previous.workingSets,
    externalRatio:
      previous.externalVolumeKg === 0
        ? null
        : Math.round((current.externalVolumeKg / previous.externalVolumeKg) * 100) / 100,
  };
}
