/**
 * Con qué valores llega cada serie ya rellena al modo entreno.
 *
 * Regla: **solo se prellena con lo que hiciste de verdad**. Si no hay historial
 * de ese ejercicio, los campos se quedan vacíos y la UI enseña el rango como
 * pista. Prellenar un peso inventado sería peor que no prellenar nada, porque
 * acabaría registrado como si lo hubieras levantado.
 */
import type { ExerciseBlock, ExerciseLog, SessionLog, Slug } from '@/core/model';
import { blockKeyOf } from '@/core/training';

export interface LastPerformance {
  readonly session: SessionLog;
  readonly log: ExerciseLog;
}

/**
 * La última vez que hiciste ese ejercicio, mirando cualquier sesión completada.
 * Busca por `exerciseId`, no por bloque: si el ejercicio cambia de sitio en la
 * rutina, el historial te sigue.
 */
export function findLastPerformance(
  sessions: readonly SessionLog[],
  exerciseId: Slug,
  { excludeSessionId }: { excludeSessionId?: string } = {},
): LastPerformance | null {
  const candidates = sessions
    .filter((session) => session.status === 'completed' && session.id !== excludeSessionId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  for (const session of candidates) {
    const log = session.exercises.find(
      (item) => item.exerciseId === exerciseId && item.sets.some((set) => !set.skipped),
    );
    if (log) return { session, log };
  }
  return null;
}

export interface PrefilledSet {
  readonly setIndex: number;
  readonly side?: 'left' | 'right';
  readonly reps?: number;
  readonly weightKg?: number;
  readonly seconds?: number;
  /** De dónde sale el valor: de tu historial, o de ningún sitio. */
  readonly source: 'history' | 'none';
}

/**
 * Las series que hay que enseñar para un bloque, ya rellenas cuando se puede.
 *
 * Si el bloque tiene más series que la última vez, las nuevas heredan los
 * valores de la última serie registrada: es lo que hiciste más recientemente y
 * la mejor pista disponible.
 */
export function prefillSets(
  block: ExerciseBlock,
  last: ExerciseLog | null,
  { perSide = false }: { perSide?: boolean } = {},
): PrefilledSet[] {
  const sides: ReadonlyArray<'left' | 'right' | undefined> = perSide
    ? ['left', 'right']
    : [undefined];
  const rows: PrefilledSet[] = [];

  for (let index = 1; index <= block.sets; index += 1) {
    for (const side of sides) {
      const previous = findPreviousSet(last, index, side);
      rows.push({
        setIndex: index,
        ...(side ? { side } : {}),
        ...(previous
          ? { reps: previous.reps, weightKg: previous.weightKg, seconds: previous.seconds }
          : {}),
        source: previous ? 'history' : 'none',
      });
    }
  }

  return rows;
}

function findPreviousSet(
  last: ExerciseLog | null,
  setIndex: number,
  side: 'left' | 'right' | undefined,
): { reps?: number; weightKg?: number; seconds?: number } | null {
  if (!last) return null;
  const done = last.sets.filter((set) => !set.skipped);
  if (done.length === 0) return null;

  const sameSide = side ? done.filter((set) => set.side === side) : done;
  const pool = sameSide.length > 0 ? sameSide : done;
  // Si la rutina ha ganado series, las nuevas heredan de la última registrada.
  const match = pool.find((set) => set.setIndex === setIndex) ?? pool.at(-1)!;
  return { reps: match.reps, weightKg: match.weightKg, seconds: match.seconds };
}

/** Clave con la que se guarda el registro de este bloque. */
export function logKeyFor(block: ExerciseBlock): string {
  return blockKeyOf(block);
}
