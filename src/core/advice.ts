/**
 * El resumen que se le daría a un modelo para que aconseje sobre el entreno.
 *
 * Vive en `core/` y no en la pantalla porque es una decisión de producto, no de
 * presentación: **define exactamente qué sale del dispositivo**. Hoy solo se
 * enseña; cuando exista el backend, será literalmente lo que viaje.
 *
 * Dos reglas lo gobiernan:
 *
 * 1. **Agregados, nunca el registro crudo.** Un mesociclo entero son cientos de
 *    series; mandarlas todas cuesta tokens y no mejora el consejo. Lo que hace
 *    falta es el reparto por músculo, la progresión por semana y dónde te has
 *    atascado.
 * 2. **Nada que no haga falta.** Sin identificadores de perfil, sin marcas de
 *    tiempo exactas, sin nada que no cambie la respuesta.
 */
import type { LoadItem, MuscleGroup, SessionLog, WeekPhase } from '@/core/model';
import type { TrackedBlock } from '@/core/history';
import { loadAlerts, volumeByWeek } from '@/core/history';
import { achievableLoads } from '@/core/equipment';
import type { MuscleSource } from '@/core/volume';

export interface BriefWeek {
  readonly week: number;
  readonly phase: WeekPhase;
  readonly sessions: number;
  readonly sets: number;
  readonly volumeKg: number;
}

export interface BriefMuscle {
  readonly muscle: MuscleGroup;
  readonly sets: number;
}

export interface BriefStuck {
  readonly exercise: string;
  /** Kilos a los que puede subir, si su material lo permite. */
  readonly nextKg?: number;
}

export interface TrainingBrief {
  /** Cuántas sesiones del plan van hechas. */
  readonly progress: { readonly done: number; readonly planned: number; readonly week: number };
  /** Cargas que se pueden montar de verdad, en kilos. Sin esto no hay consejo útil. */
  readonly equipmentKg: readonly number[];
  readonly bodyweightKg?: number;
  readonly weeks: readonly BriefWeek[];
  readonly byMuscle: readonly BriefMuscle[];
  /** Ejercicios que topan el rango y ya pueden subir de peso. */
  readonly readyToRaise: readonly BriefStuck[];
  /** Ejercicios al máximo de su material: no hay salto disponible. */
  readonly atCeiling: readonly string[];
}

export interface BriefInput {
  readonly sessions: readonly SessionLog[];
  readonly catalog: MuscleSource;
  readonly names: Readonly<Record<string, string>>;
  readonly blocks: readonly TrackedBlock[];
  readonly equipment: readonly LoadItem[];
  readonly phases: Readonly<Record<number, WeekPhase>>;
  readonly plannedSessions: number;
  readonly bodyweightKg?: number;
}

/**
 * Construye el resumen. Puro y determinista: las mismas sesiones dan siempre el
 * mismo objeto, que es lo que permite enseñarlo antes de enviarlo.
 */
export function buildTrainingBrief({
  sessions,
  catalog,
  names,
  blocks,
  equipment,
  phases,
  plannedSessions,
  bodyweightKg,
}: BriefInput): TrainingBrief {
  const completed = sessions.filter((session) => session.status === 'completed');
  const weeks = volumeByWeek(completed, catalog);

  const byMuscle = new Map<MuscleGroup, number>();
  for (const week of weeks) {
    for (const [muscle, sets] of week.byMuscle) {
      byMuscle.set(muscle, (byMuscle.get(muscle) ?? 0) + sets);
    }
  }

  const alerts = loadAlerts(completed, blocks, equipment);
  const readyToRaise = alerts
    .filter((alert) => alert.advice.status === 'raise-load')
    .map((alert) => ({
      exercise: names[alert.exerciseId] ?? alert.exerciseId,
      ...(alert.advice.nextKg !== undefined ? { nextKg: alert.advice.nextKg } : {}),
    }));
  const atCeiling = alerts
    .filter((alert) => alert.advice.status !== 'raise-load')
    .map((alert) => names[alert.exerciseId] ?? alert.exerciseId);

  return {
    progress: {
      done: completed.length,
      planned: plannedSessions,
      week: weeks.at(-1)?.weekOrder ?? 0,
    },
    equipmentKg: achievableLoads(equipment, { mode: 'perHand', pairs: true }),
    ...(bodyweightKg !== undefined ? { bodyweightKg } : {}),
    weeks: weeks.map((week) => ({
      week: week.weekOrder,
      phase: phases[week.weekOrder] ?? 'accumulation',
      sessions: week.sessions,
      sets: week.totals.workingSets,
      volumeKg: week.totals.externalVolumeKg,
    })),
    byMuscle: [...byMuscle.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([muscle, sets]) => ({ muscle, sets: Math.round(sets * 10) / 10 })),
    readyToRaise,
    atCeiling,
  };
}

/** Tamaño aproximado del resumen, para poder decirlo en pantalla. */
export function briefSizeBytes(brief: TrainingBrief): number {
  return new TextEncoder().encode(JSON.stringify(brief)).length;
}
