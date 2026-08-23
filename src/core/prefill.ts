/**
 * Con qué valores llega cada serie ya rellena al modo entreno.
 *
 * Dos orígenes y ninguno más: **lo que hiciste la última vez**, y si no hay
 * historial, **lo que dice el plan y tu inventario** (el mínimo del rango y el
 * peso más ligero que puedas montar). Nada sale de la nada, y cada valor sabe
 * de dónde viene para poder decirlo en pantalla: escribir un peso que nunca
 * has levantado sería peor que dejar el campo vacío.
 */
import type {
  ExerciseBlock,
  ExerciseLog,
  LoadItem,
  LoadType,
  SessionLog,
  SetLog,
  Slug,
} from '@/core/model';
import { achievableLoads } from '@/core/equipment';
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

export interface DefaultValues {
  readonly reps?: number;
  readonly weightKg?: number;
  readonly seconds?: number;
  /** De dónde sale cada valor, para poder decirlo en pantalla. */
  readonly source: 'history' | 'suggested' | 'none';
}

export interface DefaultsInput {
  readonly block: ExerciseBlock;
  readonly loadType: LoadType;
  /** Lo registrado la última vez, si lo hay. */
  readonly last?: SetLog | undefined;
  readonly equipment: readonly LoadItem[];
}

/**
 * Con qué llega rellena una serie antes de tocarla.
 *
 * Orden de preferencia: lo que hiciste la última vez, y si no hay historial, lo
 * prescrito. Las repeticiones parten del mínimo del rango, que es el objetivo a
 * batir, y el peso del más ligero que puedas montar a dos manos con tu material.
 *
 * Sigue sin inventarse nada: una sugerencia sale del plan o de tu inventario,
 * nunca de la nada, y se marca como sugerencia para que sepas de dónde viene.
 */
export function defaultValuesFor({
  block,
  loadType,
  last,
  equipment,
}: DefaultsInput): DefaultValues {
  if (last) {
    return {
      ...(last.reps !== undefined ? { reps: last.reps } : {}),
      ...(last.weightKg !== undefined ? { weightKg: last.weightKg } : {}),
      ...(last.seconds !== undefined ? { seconds: last.seconds } : {}),
      source: 'history',
    };
  }

  const reps = block.repRange?.min;
  const seconds = block.workSeconds;
  const needsWeight = loadType !== 'bodyweight';
  const weightKg = needsWeight
    ? achievableLoads(equipment, { mode: 'perHand', pairs: true })[0]
    : undefined;

  if (reps === undefined && seconds === undefined && weightKg === undefined) {
    return { source: 'none' };
  }

  return {
    ...(reps !== undefined ? { reps } : {}),
    ...(seconds !== undefined ? { seconds } : {}),
    ...(weightKg !== undefined ? { weightKg } : {}),
    source: 'suggested',
  };
}
