/**
 * Agregaciones para la pantalla de historial.
 *
 * Todo son funciones puras sobre las sesiones ya guardadas: agrupar por semana,
 * repartir series por músculo, y decidir en qué ejercicios toca subir peso.
 */
import type { LoadItem, Mesocycle, MuscleGroup, RepRange, SessionLog } from '@/core/model';
import { blockKeyOf } from '@/core/training';
import { evaluateLoadProgression, type ProgressionAdvice } from '@/core/progression';
import { sessionVolume, setsByMuscle, type MuscleSource, type VolumeTotals } from '@/core/volume';

export interface WeekVolume {
  readonly weekOrder: number;
  readonly sessions: number;
  readonly totals: VolumeTotals;
  readonly byMuscle: ReadonlyMap<MuscleGroup, number>;
}

/** Volumen agrupado por semana del mesociclo, de la primera a la última. */
export function volumeByWeek(sessions: readonly SessionLog[], catalog: MuscleSource): WeekVolume[] {
  const byWeek = new Map<number, SessionLog[]>();
  for (const session of sessions) {
    if (session.status !== 'completed') continue;
    const list = byWeek.get(session.weekOrder) ?? [];
    list.push(session);
    byWeek.set(session.weekOrder, list);
  }

  return [...byWeek.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([weekOrder, weekSessions]) => ({
      weekOrder,
      sessions: weekSessions.length,
      totals: weekSessions.reduce<VolumeTotals>(
        (total, session) => {
          const volume = sessionVolume(session);
          return {
            externalVolumeKg:
              Math.round((total.externalVolumeKg + volume.externalVolumeKg) * 10) / 10,
            bodyweightReps: total.bodyweightReps + volume.bodyweightReps,
            workingSets: total.workingSets + volume.workingSets,
            totalReps: total.totalReps + volume.totalReps,
            holdSeconds: total.holdSeconds + volume.holdSeconds,
          };
        },
        {
          externalVolumeKg: 0,
          bodyweightReps: 0,
          workingSets: 0,
          totalReps: 0,
          holdSeconds: 0,
        },
      ),
      byMuscle: setsByMuscle(weekSessions, catalog),
    }));
}

export interface MuscleBar {
  readonly muscle: MuscleGroup;
  readonly sets: number;
  /** Proporción respecto al músculo más trabajado, entre 0 y 1. */
  readonly ratio: number;
}

/**
 * Barras ordenadas de más a menos series, listas para pintar.
 *
 * La proporción se calcula contra el máximo de **este** conjunto, no contra un
 * tope inventado: la barra más larga siempre llena el ancho disponible.
 */
export function muscleBars(byMuscle: ReadonlyMap<MuscleGroup, number>, limit = 8): MuscleBar[] {
  const entries = [...byMuscle.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const max = entries[0]?.[1] ?? 0;
  return entries.slice(0, limit).map(([muscle, sets]) => ({
    muscle,
    sets: Math.round(sets * 10) / 10,
    ratio: max === 0 ? 0 : sets / max,
  }));
}

export interface MuscleCell {
  readonly weekOrder: number;
  readonly sets: number;
  /** Proporción contra el máximo de **toda** la tabla, entre 0 y 1. */
  readonly ratio: number;
}

export interface MuscleRow {
  readonly muscle: MuscleGroup;
  readonly total: number;
  readonly cells: readonly MuscleCell[];
}

export interface MuscleMatrix {
  readonly weeks: readonly number[];
  readonly rows: readonly MuscleRow[];
  /** El valor más alto de la tabla: el que define la escala común. */
  readonly max: number;
}

/**
 * Series por músculo y semana, en una sola tabla con **escala común**.
 *
 * Es lo que `muscleBars` no puede dar: allí cada semana se normaliza contra su
 * propio máximo, así que una semana de descarga con 8 series dibuja una barra
 * tan larga como una de acumulación con 18 y el ojo lee que son iguales. Aquí
 * el denominador es el máximo de toda la tabla, que es lo que hace comparables
 * dos semanas cualesquiera.
 *
 * Las filas van de más a menos trabajo total, que es el orden en el que se
 * busca: primero lo que más pesa en el mesociclo.
 */
export function muscleMatrix(
  weeks: readonly WeekVolume[],
  { limit = 10 }: { limit?: number } = {},
): MuscleMatrix {
  const order = weeks.map((week) => week.weekOrder);
  const totals = new Map<MuscleGroup, number>();
  for (const week of weeks) {
    for (const [muscle, sets] of week.byMuscle) {
      totals.set(muscle, (totals.get(muscle) ?? 0) + sets);
    }
  }

  let max = 0;
  for (const week of weeks) {
    for (const sets of week.byMuscle.values()) max = Math.max(max, sets);
  }

  const rows = [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([muscle, total]) => ({
      muscle,
      total: Math.round(total * 10) / 10,
      cells: weeks.map((week) => {
        const sets = week.byMuscle.get(muscle) ?? 0;
        return {
          weekOrder: week.weekOrder,
          sets: Math.round(sets * 10) / 10,
          ratio: max === 0 ? 0 : sets / max,
        };
      }),
    }));

  return { weeks: order, rows, max: Math.round(max * 10) / 10 };
}

export interface SessionRow {
  readonly session: SessionLog;
  readonly volume: VolumeTotals;
  readonly durationSeconds: number;
}

export function sessionRows(sessions: readonly SessionLog[]): SessionRow[] {
  return sessions
    .filter((session) => session.status === 'completed')
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .map((session) => ({
      session,
      volume: sessionVolume(session),
      durationSeconds: session.finishedAt
        ? Math.max(
            0,
            Math.round((Date.parse(session.finishedAt) - Date.parse(session.startedAt)) / 1000),
          )
        : 0,
    }));
}

/** Lo mínimo que hace falta de un bloque para juzgar su progresión. */
export interface TrackedBlock {
  readonly blockKey: string;
  readonly exerciseId: string;
  readonly repRange: RepRange;
}

/**
 * Bloques únicos del mesociclo con rango de repeticiones.
 *
 * Se extrae en build y viaja al cliente en vez del mesociclo entero: la página
 * de historial no necesita saber nada más de la rutina.
 */
export function trackedBlocksOf(mesocycle: Mesocycle): TrackedBlock[] {
  const seen = new Set<string>();
  const blocks: TrackedBlock[] = [];
  for (const week of mesocycle.weeks) {
    for (const day of week.days) {
      for (const block of day.blocks) {
        const blockKey = blockKeyOf(block);
        if (seen.has(blockKey) || !block.repRange) continue;
        seen.add(blockKey);
        blocks.push({ blockKey, exerciseId: block.exerciseId, repRange: block.repRange });
      }
    }
  }
  return blocks;
}

export interface LoadAlert {
  readonly exerciseId: string;
  readonly blockKey: string;
  readonly advice: ProgressionAdvice;
}

/**
 * En qué ejercicios toca subir peso.
 *
 * Junta el historial de cada bloque de la sesión más reciente a la más antigua
 * y aplica la regla. Solo devuelve los que de verdad han disparado el aviso:
 * nada de listar "todavía no".
 */
export function loadAlerts(
  sessions: readonly SessionLog[],
  blocks: readonly TrackedBlock[],
  equipment: readonly LoadItem[],
): LoadAlert[] {
  const completed = [...sessions]
    .filter((session) => session.status === 'completed')
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  const alerts: LoadAlert[] = [];
  for (const block of blocks) {
    const history = completed
      .map((session) => session.exercises.find((log) => log.blockKey === block.blockKey))
      .filter((log) => log !== undefined);
    if (history.length === 0) continue;

    const advice = evaluateLoadProgression({
      history,
      repRange: block.repRange,
      equipment,
      loadOptions: { mode: 'perHand', pairs: true },
    });
    if (advice.status === 'raise-load' || advice.status === 'at-equipment-limit') {
      alerts.push({ exerciseId: block.exerciseId, blockKey: block.blockKey, advice });
    }
  }

  return alerts;
}
