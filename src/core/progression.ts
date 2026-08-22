/**
 * La regla que decide cuándo toca subir peso.
 *
 * Acordada así: cuando superas el tope alto del rango de repeticiones en
 * **todas** las series durante **dos sesiones seguidas**, el estímulo se ha
 * quedado corto y la carga tiene que subir. Mientras eso no ocurra, la
 * progresión va por repeticiones, tempo o variante, no por peso.
 *
 * Funciones puras sobre el historial: ni almacenamiento ni fechas del sistema.
 */
import type { ExerciseLog, LoadItem, RepRange, SetLog } from '@/core/model';
import { type LoadOptions, nextLoadStep } from '@/core/equipment';

export type ProgressionStatus = 'not-enough-data' | 'hold' | 'raise-load' | 'at-equipment-limit';

export interface ProgressionAdvice {
  readonly status: ProgressionStatus;
  /** Sesiones consecutivas, desde la más reciente, tocando el tope del rango. */
  readonly sessionsAtTop: number;
  readonly requiredSessions: number;
  /** Presente solo cuando toca subir y el material lo permite. */
  readonly nextKg?: number;
  readonly incrementKg?: number;
}

/** Series que cuentan: las hechas de verdad, no las saltadas ni las vacías. */
function workingSets(log: ExerciseLog): SetLog[] {
  return log.sets.filter((set) => !set.skipped && set.reps !== undefined);
}

/** Una sesión toca techo si todas sus series llegan al tope alto del rango. */
export function toppedOut(log: ExerciseLog, range: RepRange): boolean {
  const sets = workingSets(log);
  if (sets.length === 0) return false;
  return sets.every((set) => (set.reps ?? 0) >= range.max);
}

/** El peso de trabajo de una sesión: el más repetido, y a igualdad el mayor. */
export function workingWeightOf(log: ExerciseLog): number | undefined {
  const weights = workingSets(log)
    .map((set) => set.weightKg)
    .filter((weight): weight is number => weight !== undefined);
  if (weights.length === 0) return undefined;

  const counts = new Map<number, number>();
  for (const weight of weights) counts.set(weight, (counts.get(weight) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]![0];
}

export interface ProgressionInput {
  /** Historial de ese bloque, **de la más reciente a la más antigua**. */
  readonly history: readonly ExerciseLog[];
  readonly repRange: RepRange;
  readonly equipment: readonly LoadItem[];
  readonly loadOptions: LoadOptions;
  /** Sesiones seguidas tocando techo que hacen falta. Por defecto, dos. */
  readonly requiredSessions?: number;
}

export function evaluateLoadProgression({
  history,
  repRange,
  equipment,
  loadOptions,
  requiredSessions = 2,
}: ProgressionInput): ProgressionAdvice {
  let sessionsAtTop = 0;
  for (const log of history) {
    if (!toppedOut(log, repRange)) break;
    sessionsAtTop += 1;
  }

  if (history.length < requiredSessions) {
    return { status: 'not-enough-data', sessionsAtTop, requiredSessions };
  }
  if (sessionsAtTop < requiredSessions) {
    return { status: 'hold', sessionsAtTop, requiredSessions };
  }

  // Toca subir. Cuánto, lo dice el material declarado.
  const current = workingWeightOf(history[0]!) ?? 0;
  const step = nextLoadStep(current, equipment, loadOptions);
  if (step === null) {
    return { status: 'at-equipment-limit', sessionsAtTop, requiredSessions };
  }
  return {
    status: 'raise-load',
    sessionsAtTop,
    requiredSessions,
    nextKg: step.nextKg,
    incrementKg: step.incrementKg,
  };
}

export interface PersonalRecords {
  /** Peso más alto movido en una serie completada. */
  readonly heaviestKg?: number;
  /** Mejor volumen en una sola serie: peso por repeticiones. */
  readonly bestSetVolumeKg?: number;
  /** Más repeticiones en una serie, mirando solo las del peso más alto. */
  readonly mostRepsAtHeaviest?: number;
  /** Isométricos: aguante más largo. */
  readonly longestHoldSeconds?: number;
}

export function personalRecords(logs: readonly ExerciseLog[]): PersonalRecords {
  const sets = logs.flatMap(workingSets);
  if (sets.length === 0) return {};

  const weighted = sets.filter((set) => (set.weightKg ?? 0) > 0);
  const heaviestKg =
    weighted.length > 0 ? Math.max(...weighted.map((s) => s.weightKg!)) : undefined;

  const bestSetVolumeKg =
    weighted.length > 0
      ? Math.max(...weighted.map((set) => set.weightKg! * (set.reps ?? 0)))
      : undefined;

  const mostRepsAtHeaviest =
    heaviestKg === undefined
      ? undefined
      : Math.max(...weighted.filter((s) => s.weightKg === heaviestKg).map((s) => s.reps ?? 0));

  const holds = logs.flatMap((log) => log.sets).filter((set) => (set.seconds ?? 0) > 0);
  const longestHoldSeconds =
    holds.length > 0 ? Math.max(...holds.map((s) => s.seconds!)) : undefined;

  return { heaviestKg, bestSetVolumeKg, mostRepsAtHeaviest, longestHoldSeconds };
}
