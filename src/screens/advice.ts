/**
 * La pantalla de consejos, con la funcionalidad todavía sin construir.
 *
 * Lo único que hace hoy es **enseñar el resumen que se enviaría**, calculado de
 * verdad a partir de tus sesiones. No es una maqueta: es el mismo objeto que
 * viajará cuando exista el backend, así que mirarlo ya sirve para decidir si
 * sobra o falta algo antes de que salga del dispositivo.
 */
import type { MuscleGroup, Slug, WeekPhase } from '@/core/model';
import type { TrackedBlock } from '@/core/history';
import { briefSizeBytes, buildTrainingBrief, type TrainingBrief } from '@/core/advice';
import { MUSCLE_LABELS, PHASE_LABELS } from '@/core/labels';
import type { MuscleSource } from '@/core/volume';
import { getRepository } from '@/repository';

export interface AdvicePayload {
  readonly muscles: Record<
    string,
    { primaryMuscles: MuscleGroup[]; secondaryMuscles: MuscleGroup[] }
  >;
  readonly names: Record<string, string>;
  readonly blocks: TrackedBlock[];
  readonly phases: Record<number, WeekPhase>;
  readonly plannedSessions: number;
}

const el = (id: string): HTMLElement | null => document.getElementById(id);

function node(tag: string, className: string, text?: string): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

/** Un renglón del resumen: la etiqueta a la izquierda, el dato a la derecha. */
function row(label: string, value: string): HTMLElement {
  const item = node('li', 'flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5');
  item.append(
    node('span', 'text-sm text-ink-dim', label),
    node('span', 'figures text-sm font-bold text-ink', value),
  );
  return item;
}

function renderBrief(brief: TrainingBrief): HTMLElement {
  const list = node('ul', 'flex flex-col divide-y divide-line border-t border-line');

  list.append(row('Sesiones completadas', `${brief.progress.done} de ${brief.progress.planned}`));
  if (brief.progress.week > 0) {
    list.append(row('Semana en curso', String(brief.progress.week)));
  }
  list.append(
    row(
      'Cargas que puedes montar',
      brief.equipmentKg.length > 0 ? `${brief.equipmentKg.join(', ')} kg` : 'ninguna declarada',
    ),
  );
  if (brief.bodyweightKg !== undefined) {
    list.append(row('Peso corporal', `${brief.bodyweightKg} kg`));
  }

  for (const week of brief.weeks) {
    list.append(
      row(
        `Semana ${week.week} · ${PHASE_LABELS[week.phase]}`,
        `${week.sessions} ${week.sessions === 1 ? 'sesión' : 'sesiones'} · ${week.sets} series` +
          (week.volumeKg > 0 ? ` · ${week.volumeKg} kg` : ''),
      ),
    );
  }

  if (brief.byMuscle.length > 0) {
    list.append(
      row(
        'Series por músculo',
        brief.byMuscle
          .slice(0, 4)
          .map((entry) => `${MUSCLE_LABELS[entry.muscle]} ${entry.sets}`)
          .join(' · ') + (brief.byMuscle.length > 4 ? ` · y ${brief.byMuscle.length - 4} más` : ''),
      ),
    );
  }
  if (brief.readyToRaise.length > 0) {
    list.append(
      row(
        'Listos para subir peso',
        brief.readyToRaise
          .map((item) => (item.nextKg ? `${item.exercise} → ${item.nextKg} kg` : item.exercise))
          .join(' · '),
      ),
    );
  }
  if (brief.atCeiling.length > 0) {
    list.append(row('Al máximo de tu material', String(brief.atCeiling.length)));
  }

  return list;
}

export async function mountAdvicePage(payload: AdvicePayload): Promise<void> {
  const box = el('resumen-envio');
  const meta = el('resumen-peso');
  if (!box) return;

  const repo = getRepository();
  const [sessions, settings] = await Promise.all([
    repo.sessions.listSessions({ status: 'completed' }),
    repo.settings.get(),
  ]);

  const catalog: MuscleSource = new Map(
    Object.entries(payload.muscles).map(([id, muscles]) => [id as Slug, muscles]),
  );

  const brief = buildTrainingBrief({
    sessions,
    catalog,
    names: payload.names,
    blocks: payload.blocks,
    equipment: settings.availableLoads,
    phases: payload.phases,
    plannedSessions: payload.plannedSessions,
    ...(settings.bodyweightKg !== undefined ? { bodyweightKg: settings.bodyweightKg } : {}),
  });

  box.replaceChildren();

  if (sessions.length === 0) {
    box.append(
      node(
        'p',
        'text-sm leading-relaxed text-ink-faint',
        'Todavía no hay nada que resumir. En cuanto entrenes una vez, aquí verás exactamente qué se enviaría.',
      ),
    );
    if (meta) meta.textContent = '';
    return;
  }

  box.append(renderBrief(brief));
  if (meta) {
    const bytes = briefSizeBytes(brief);
    meta.textContent = `Todo esto ocupa ${bytes} bytes. Ni una serie suelta, ni fechas, ni tu identificador.`;
  }
}
