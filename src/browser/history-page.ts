/**
 * Controlador de la página de historial.
 *
 * Vanilla: es una vista de solo lectura, así que no necesita Vue. Lee las
 * sesiones del repositorio, agrega con las funciones puras de `core/history` y
 * pinta. Si no hay sesiones, lo dice y no pinta gráficas vacías.
 */
import type { MuscleGroup, SessionLog, Slug } from '@/core/model';
import type { TrackedBlock } from '@/core/history';
import { loadAlerts, muscleBars, sessionRows, volumeByWeek } from '@/core/history';
import { MUSCLE_LABELS, PHASE_LABELS, formatDuration } from '@/core/labels';
import type { WeekPhase } from '@/core/model';
import type { MuscleSource } from '@/core/volume';
import { getRepository } from '@/browser/repository';

export interface HistoryPayload {
  /** Músculos de cada ejercicio, lo único que hace falta para repartir series. */
  readonly muscles: Record<
    string,
    { primaryMuscles: MuscleGroup[]; secondaryMuscles: MuscleGroup[] }
  >;
  readonly names: Record<string, string>;
  readonly blocks: TrackedBlock[];
  readonly phases: Record<number, WeekPhase>;
}

/** Cada fase pinta sus barras de su color; escritas enteras para el escáner. */
const PHASE_BAR: Record<WeekPhase, string> = {
  accumulation: 'bg-phase-accumulation',
  progression: 'bg-phase-progression',
  intensification: 'bg-phase-intensification',
  deload: 'bg-phase-deload',
};

const el = <T extends HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;

const fecha = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

function node(tag: string, className: string, text?: string): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

/**
 * Una semana con sus barras por músculo.
 *
 * Barras finas con el extremo redondeado, separación real entre ellas y el
 * valor escrito al final de cada una: con ocho barras, etiquetar todas se lee
 * mejor que obligar a pasar el ratón por encima.
 */
function renderWeek(
  week: ReturnType<typeof volumeByWeek>[number],
  phase: WeekPhase | undefined,
): HTMLElement {
  const section = node('section', 'panel rounded-card border border-line p-5 sm:p-6');

  const head = node('div', 'flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1');
  const title = node(
    'h3',
    'text-lg font-bold text-ink',
    `Semana ${String(week.weekOrder).padStart(2, '0')}`,
  );
  if (phase) {
    const label = node('span', 'ml-2 text-sm font-bold text-ink-dim', PHASE_LABELS[phase]);
    title.append(label);
  }
  const totals = node(
    'p',
    'figures text-sm text-ink-dim',
    `${week.sessions} sesiones · ${week.totals.workingSets} series` +
      (week.totals.externalVolumeKg > 0 ? ` · ${week.totals.externalVolumeKg} kg` : ''),
  );
  head.append(title, totals);
  section.append(head);

  const bars = muscleBars(week.byMuscle);
  if (bars.length === 0) {
    section.append(node('p', 'mt-4 text-sm text-ink-faint', 'Sin series registradas esta semana.'));
    return section;
  }

  const list = node('ul', 'mt-5 flex flex-col gap-2');
  for (const bar of bars) {
    const row = node('li', 'grid grid-cols-[9rem_1fr_3rem] items-center gap-3');
    row.append(node('span', 'truncate text-sm text-ink-dim', MUSCLE_LABELS[bar.muscle]));

    const track = node('span', 'block h-3 rounded-full bg-line');
    const fill = node('span', `block h-3 rounded-full ${PHASE_BAR[phase ?? 'accumulation']}`);
    fill.style.width = `${Math.max(2, Math.round(bar.ratio * 100))}%`;
    track.append(fill);
    row.append(track);

    row.append(node('span', 'figures text-right text-sm font-bold text-ink', String(bar.sets)));
    list.append(row);
  }
  section.append(list);
  return section;
}

function renderSessions(rows: ReturnType<typeof sessionRows>): HTMLElement {
  const list = node('ul', 'flex flex-col');
  for (const row of rows) {
    const item = node(
      'li',
      'grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-1 border-b border-line py-4 last:border-b-0',
    );
    item.append(
      node(
        'p',
        'figures text-figure font-extrabold text-ink-faint',
        String(row.session.weekOrder).padStart(2, '0'),
      ),
    );

    const middle = node('div', 'min-w-0');
    middle.append(
      node('p', 'text-base font-bold text-ink', `Día ${row.session.dayOrder}`),
      node('p', 'figures text-sm text-ink-dim', fecha(row.session.startedAt)),
    );
    item.append(middle);

    const right = node('p', 'figures text-right text-sm text-ink-dim');
    right.textContent =
      `${row.volume.workingSets} series` +
      (row.volume.externalVolumeKg > 0 ? ` · ${row.volume.externalVolumeKg} kg` : '') +
      (row.durationSeconds > 0 ? ` · ${formatDuration(row.durationSeconds)}` : '');
    item.append(right);

    list.append(item);
  }
  return list;
}

function renderAlerts(
  alerts: ReturnType<typeof loadAlerts>,
  names: Record<string, string>,
): HTMLElement {
  const list = node('ul', 'mt-4 flex flex-col');
  for (const alert of alerts) {
    const item = node(
      'li',
      'flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line py-3 last:border-b-0',
    );
    item.append(
      node('p', 'text-base font-bold text-ink', names[alert.exerciseId] ?? alert.exerciseId),
    );
    item.append(
      node(
        'p',
        'figures text-sm text-ink-dim',
        alert.advice.status === 'raise-load'
          ? `Sube a ${alert.advice.nextKg} kg · ${alert.advice.incrementKg} kg más`
          : 'Estás en tu peso más alto · sube por reps, tempo o variante',
      ),
    );
    list.append(item);
  }
  return list;
}

export async function mountHistoryPage(payload: HistoryPayload): Promise<void> {
  const repo = getRepository();
  const [sessions, settings] = await Promise.all([
    repo.sessions.listSessions({ status: 'completed' }),
    repo.settings.get(),
  ]);

  const empty = el('vacio');
  const content = el('panel-historial');
  if (sessions.length === 0) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  if (content) content.hidden = false;

  const muscles: MuscleSource = new Map(
    Object.entries(payload.muscles).map(([id, value]) => [id as Slug, value]),
  );

  const alerts = loadAlerts(sessions as SessionLog[], payload.blocks, settings.availableLoads);
  const alertsBox = el('avisos');
  if (alertsBox) {
    alertsBox.hidden = alerts.length === 0;
    if (alerts.length > 0) alertsBox.append(renderAlerts(alerts, payload.names));
  }

  const weeksBox = el('semanas');
  if (weeksBox) {
    for (const week of volumeByWeek(sessions, muscles)) {
      weeksBox.append(renderWeek(week, payload.phases[week.weekOrder]));
    }
  }

  const sessionsBox = el('sesiones');
  if (sessionsBox) sessionsBox.append(renderSessions(sessionRows(sessions)));
}
