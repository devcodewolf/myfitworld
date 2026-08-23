/**
 * La sesión de entreno como una secuencia de pasos.
 *
 * Toda la lógica del modo entreno vive aquí, en funciones puras: qué toca
 * ahora, qué viene después, cuánto se descansa y cómo se registra lo hecho. El
 * componente de Vue solo pinta y llama a esto.
 *
 * Las superseries se recorren **en rondas**: A1 serie 1, A2 serie 1, descanso
 * largo, A1 serie 2… Es como se entrenan de verdad, y es lo que hace que el
 * descanso corto del primer ejercicio del grupo signifique algo.
 */
import type { Day, SessionLog, SetLog, Slug } from '@/core/model';
import { blockKeyOf, groupSupersets, type ExerciseCatalog } from '@/core/training';

export interface SessionStep {
  /** Identificador único y estable del paso dentro de la sesión. */
  readonly key: string;
  readonly blockKey: string;
  readonly exerciseId: Slug;
  /** Número de serie dentro de su bloque, empezando en 1. */
  readonly setIndex: number;
  readonly totalSets: number;
  readonly side?: 'left' | 'right';
  /** Segundos de descanso **después** de este paso, ya sin multiplicador. */
  readonly restSeconds: number;
  /** Este paso encadena con otro ejercicio de la misma superserie. */
  readonly chained: boolean;
  /** Serie a tiempo: el cronómetro cuenta hacia abajo en vez de hacia arriba. */
  readonly workSeconds?: number;
}

/**
 * Convierte el día en la lista de pasos que se van a recorrer, en orden.
 */
export function buildSessionPlan(day: Day, catalog: ExerciseCatalog): SessionStep[] {
  const steps: SessionStep[] = [];

  for (const group of groupSupersets(day)) {
    const rounds = Math.max(...group.map((block) => block.sets));

    for (let round = 1; round <= rounds; round += 1) {
      const inRound = group.filter((block) => block.sets >= round);

      inRound.forEach((block, position) => {
        const exercise = catalog.get(block.exerciseId);
        const perSide = block.perSideLogging && (exercise?.unilateral ?? false);
        const sides: ReadonlyArray<'left' | 'right' | undefined> = perSide
          ? ['left', 'right']
          : [undefined];

        sides.forEach((side, sideIndex) => {
          const lastOfRound = position === inRound.length - 1 && sideIndex === sides.length - 1;
          steps.push({
            key: `${blockKeyOf(block)}#${round}${side ? `#${side}` : ''}`,
            blockKey: blockKeyOf(block),
            exerciseId: block.exerciseId,
            setIndex: round,
            totalSets: block.sets,
            ...(side ? { side } : {}),
            // Entre lados se descansa poco; el descanso del bloque va al final.
            restSeconds: side === 'left' ? (block.intraSideRestSeconds ?? 30) : block.restSeconds,
            chained: group.length > 1 && !lastOfRound,
            ...(block.workSeconds !== undefined ? { workSeconds: block.workSeconds } : {}),
          });
        });
      });
    }
  }

  return steps;
}

export interface SessionProgress {
  readonly done: number;
  readonly total: number;
  /** Entre 0 y 1. Vale 1 en un plan vacío para no dejar la barra colgada. */
  readonly ratio: number;
}

export function sessionProgress(
  plan: readonly SessionStep[],
  completedKeys: ReadonlySet<string>,
): SessionProgress {
  const done = plan.filter((step) => completedKeys.has(step.key)).length;
  return {
    done,
    total: plan.length,
    ratio: plan.length === 0 ? 1 : done / plan.length,
  };
}

/** El primer paso sin completar; `null` si ya no queda ninguno. */
export function nextPendingIndex(
  plan: readonly SessionStep[],
  completedKeys: ReadonlySet<string>,
  from = 0,
): number | null {
  for (let index = from; index < plan.length; index += 1) {
    if (!completedKeys.has(plan[index]!.key)) return index;
  }
  for (let index = 0; index < from; index += 1) {
    if (!completedKeys.has(plan[index]!.key)) return index;
  }
  return null;
}

/** Descanso real de un paso, con el multiplicador global de la sesión. */
export function restSecondsFor(step: SessionStep, multiplier: number): number {
  return Math.max(0, Math.round(step.restSeconds * multiplier));
}

export interface NewSessionInput {
  readonly profileId: string;
  readonly mesocycleId: Slug;
  readonly weekOrder: number;
  readonly dayOrder: number;
  readonly restMultiplier?: number;
  readonly bodyweightKg?: number;
  readonly now: string;
  readonly uuid: string;
}

export function createSession(input: NewSessionInput): SessionLog {
  return {
    id: input.uuid,
    profileId: input.profileId,
    mesocycleId: input.mesocycleId,
    weekOrder: input.weekOrder,
    dayOrder: input.dayOrder,
    status: 'in_progress',
    startedAt: input.now,
    restMultiplier: input.restMultiplier ?? 1,
    exercises: [],
    ...(input.bodyweightKg !== undefined ? { bodyweightKg: input.bodyweightKg } : {}),
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export interface RecordedValues {
  readonly reps?: number;
  readonly weightKg?: number;
  readonly seconds?: number;
  readonly rpe?: number;
  readonly skipped?: boolean;
}

/**
 * Añade —o reemplaza— el registro de un paso.
 *
 * Devuelve una sesión nueva: nada se muta. Marcar dos veces la misma serie la
 * corrige en lugar de duplicarla, que es lo que pasa cuando te equivocas al
 * teclear el peso y vuelves atrás.
 */
export function recordStep(
  session: SessionLog,
  step: SessionStep,
  values: RecordedValues,
  { now, uuid }: { now: string; uuid: string },
): SessionLog {
  const set: SetLog = {
    id: uuid,
    setIndex: step.setIndex,
    ...(step.side ? { side: step.side } : {}),
    ...(values.reps !== undefined ? { reps: values.reps } : {}),
    ...(values.weightKg !== undefined ? { weightKg: values.weightKg } : {}),
    ...(values.seconds !== undefined ? { seconds: values.seconds } : {}),
    ...(values.rpe !== undefined ? { rpe: values.rpe } : {}),
    skipped: values.skipped ?? false,
    completedAt: now,
  };

  const existing = session.exercises.find((log) => log.blockKey === step.blockKey);
  const sameSet = (candidate: SetLog): boolean =>
    candidate.setIndex === step.setIndex && candidate.side === step.side;

  const exercises = existing
    ? session.exercises.map((log) =>
        log.blockKey === step.blockKey
          ? {
              ...log,
              sets: log.sets.some(sameSet)
                ? log.sets.map((candidate) => (sameSet(candidate) ? set : candidate))
                : [...log.sets, set],
            }
          : log,
      )
    : [...session.exercises, { blockKey: step.blockKey, exerciseId: step.exerciseId, sets: [set] }];

  return { ...session, exercises, updatedAt: now };
}

/** Claves de los pasos ya registrados, para saber por dónde ibas al reanudar. */
export function completedKeysOf(session: SessionLog, plan: readonly SessionStep[]): Set<string> {
  const keys = new Set<string>();
  for (const step of plan) {
    const log = session.exercises.find((item) => item.blockKey === step.blockKey);
    const done = log?.sets.some((set) => set.setIndex === step.setIndex && set.side === step.side);
    if (done) keys.add(step.key);
  }
  return keys;
}

/** Lo registrado para un paso concreto, si ya se hizo. */
export function recordedValuesOf(session: SessionLog, step: SessionStep): SetLog | undefined {
  return session.exercises
    .find((log) => log.blockKey === step.blockKey)
    ?.sets.find((set) => set.setIndex === step.setIndex && set.side === step.side);
}
