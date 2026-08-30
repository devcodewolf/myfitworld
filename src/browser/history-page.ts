/**
 * Controlador de la página de historial.
 *
 * Vanilla: es una vista de solo lectura, así que no necesita Vue. Lee las
 * sesiones del repositorio, agrega con las funciones puras de `core/history` y
 * pinta. Si no hay sesiones, lo dice y no pinta gráficas vacías.
 *
 * El esqueleto del bento lo pone `historial.astro`; aquí solo se rellenan sus
 * huecos. La foto y los iconos viven allí porque son decisiones de Astro.
 */
import type { MuscleGroup, SessionLog, Slug, WeekPhase } from '@/core/model';
import type { MuscleMatrix, TrackedBlock } from '@/core/history';
import {
  loadAlerts,
  muscleMatrix,
  sessionRows,
  volumeByWeek,
  type WeekVolume,
} from '@/core/history';
import { MUSCLE_LABELS, PHASE_LABELS, formatDuration } from '@/core/labels';
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
  /** La forma del mesociclo: es el calendario sobre el que se marcan las sesiones. */
  readonly plan: ReadonlyArray<{
    order: number;
    days: ReadonlyArray<{ order: number; title: string; href: string }>;
  }>;
}

const el = <T extends HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;

const fecha = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

function node(tag: string, className: string, text?: string): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

/**
 * Una celda de la matriz: la cifra exacta y, debajo, su barra.
 *
 * El primer intento pintaba la celda con un tinte proporcional. En un tema
 * oscuro no discrimina: entre el 6 % y el 36 % de tinta hay demasiado poco
 * salto visual, y el tope no se puede subir porque a partir del 36 % la cifra
 * baja de 4,5:1 sobre su propia celda. La longitud no tiene ese problema y
 * además es más precisa que el color para comparar cantidades.
 */
function matrixCell(sets: number, ratio: number, label: string): HTMLElement {
  const cell = node('div', 'flex flex-col items-center gap-1.5');
  cell.append(
    node(
      'span',
      sets > 0 ? 'figures text-sm font-bold text-ink' : 'figures text-sm text-ink-faint',
      sets > 0 ? String(sets) : '·',
    ),
  );

  const track = node('span', 'block h-1.5 w-full overflow-hidden rounded-full bg-line');
  const fill = node('span', 'block h-full rounded-full bg-ink-dim');
  // Un mínimo visible: una serie no puede desaparecer del todo.
  fill.style.width = ratio > 0 ? `${Math.max(4, Math.round(ratio * 100))}%` : '0';
  track.append(fill);
  cell.append(track);

  cell.title = label;
  return cell;
}

/** Fila de cifras del resumen: dt arriba, dd grande debajo. */
function figure(label: string, value: string): HTMLElement {
  const cell = node('div', 'min-w-24');
  cell.append(
    node('dt', 'text-[0.7rem] font-bold tracking-[0.16em] text-ink-faint uppercase', label),
    node('dd', 'figures mt-1 text-2xl font-extrabold whitespace-nowrap text-ink', value),
  );
  return cell;
}

/**
 * La respuesta que traes a esta pantalla: ¿voy a más o a menos?
 *
 * Compara la última semana con datos contra la anterior, **pero solo si las dos
 * están completas**. Una semana a medias siempre tiene menos series que una
 * entera, así que compararlas dibujaría una caída inventada: con la semana en
 * curso se dice por dónde vas y ya está.
 */
function renderSummary(
  weeks: readonly WeekVolume[],
  sessions: readonly SessionLog[],
  plan: HistoryPayload['plan'],
): void {
  const head = el('resumen-encabezado');
  const title = el('resumen-titular');
  const figures = el('resumen-cifras');
  if (!head || !title || !figures) return;

  const last = weeks.at(-1);
  const previous = weeks.at(-2);
  if (!last) return;

  const plannedSessions = (weekOrder: number): number =>
    plan.find((week) => week.order === weekOrder)?.days.length ?? 0;
  const isComplete = (week: WeekVolume): boolean =>
    week.sessions >= plannedSessions(week.weekOrder);
  const totalPlanned = plan.reduce((total, week) => total + week.days.length, 0);

  head.textContent = `Semana ${String(last.weekOrder).padStart(2, '0')} · ${sessions.length} de ${totalPlanned} sesiones`;

  if (!isComplete(last)) {
    const left = plannedSessions(last.weekOrder) - last.sessions;
    title.textContent =
      left === 1
        ? 'Te queda una sesión de esta semana'
        : `Te quedan ${left} sesiones de esta semana`;
  } else if (previous && isComplete(previous) && previous.totals.workingSets > 0) {
    const delta = last.totals.workingSets - previous.totals.workingSets;
    const pct = Math.round((delta / previous.totals.workingSets) * 100);
    title.textContent =
      delta === 0
        ? 'Mismo volumen que la semana pasada'
        : `${delta > 0 ? '+' : ''}${pct} % de series que la semana pasada`;
  } else {
    title.textContent = 'Semana completada';
  }

  figures.replaceChildren();
  figures.append(figure('Series', String(last.totals.workingSets)));
  if (last.totals.externalVolumeKg > 0) {
    figures.append(figure('Volumen', `${last.totals.externalVolumeKg} kg`));
  }
  const seconds = sessions.reduce((total, session) => total + (session.activeSeconds ?? 0), 0);
  if (seconds > 0) figures.append(figure('Tiempo total', formatDuration(seconds)));
}

/**
 * Los avisos de carga.
 *
 * Con un solo par de mancuernas **todos** los ejercicios están siempre en su
 * peso máximo, así que pintar una fila por cada uno convierte el aviso en
 * ruido. Los que no tienen salto disponible se resumen en una línea; la fila
 * individual se reserva para el caso accionable, que es el que trae un peso
 * concreto al que subir.
 */
function renderAlerts(alerts: ReturnType<typeof loadAlerts>, names: Record<string, string>): void {
  const box = el('avisos');
  if (!box) return;
  box.replaceChildren();

  if (alerts.length === 0) {
    box.append(
      node(
        'p',
        'text-sm leading-relaxed text-ink-faint',
        'Nada que subir todavía. El aviso aparece cuando superas el tope del rango en todas las series durante dos sesiones seguidas.',
      ),
    );
    return;
  }

  const actionable = alerts.filter((alert) => alert.advice.status === 'raise-load');
  const capped = alerts.filter((alert) => alert.advice.status !== 'raise-load');

  if (actionable.length > 0) {
    const list = node('ul', 'flex flex-col divide-y divide-line border-t border-line');
    for (const alert of actionable) {
      const item = node('li', 'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3');
      item.append(
        node('p', 'text-sm font-bold text-ink', names[alert.exerciseId] ?? alert.exerciseId),
        node(
          'p',
          'figures text-sm font-bold text-accent',
          `${alert.advice.nextKg} kg · +${alert.advice.incrementKg}`,
        ),
      );
      list.append(item);
    }
    box.append(list);
  }

  if (capped.length > 0) {
    const summary = node(
      'div',
      actionable.length > 0
        ? 'mt-5 rounded-card border border-line bg-surface p-4'
        : 'rounded-card border border-line bg-surface p-4',
    );
    summary.append(
      node(
        'p',
        'figures text-sm font-bold text-ink',
        `${capped.length} ${capped.length === 1 ? 'ejercicio' : 'ejercicios'} al máximo de tu material`,
      ),
      node(
        'p',
        'mt-1.5 text-sm leading-relaxed text-ink-faint',
        'No hay salto de peso disponible con lo que tienes declarado. Sube por repeticiones, tempo o variante, o añade material en Ajustes.',
      ),
    );
    box.append(summary);
  }
}

/**
 * Las sesiones como calendario del propio mesociclo.
 *
 * Un calendario de mes para tres sesiones por semana es casi todo huecos
 * vacíos. Esta rejilla es la forma del plan —cuatro semanas por tres días— y
 * cada celda es una sesión planificada: hecha, saltada o pendiente. Así se ve
 * el ritmo y los huecos sin contar días que nunca tuvieron entreno.
 */
function renderCalendar(
  plan: HistoryPayload['plan'],
  phases: Record<number, WeekPhase>,
  rows: ReturnType<typeof sessionRows>,
): void {
  const box = el('calendario');
  if (!box) return;
  box.replaceChildren();

  const done = new Map<string, (typeof rows)[number]>();
  for (const row of rows) done.set(`${row.session.weekOrder}-${row.session.dayOrder}`, row);

  const grid = node('ol', 'flex flex-col gap-3');
  for (const week of plan) {
    const phase = phases[week.order];
    const line = node('li', 'grid grid-cols-[5.5rem_1fr] items-center gap-3');

    const label = node('div', 'min-w-0');
    label.append(
      node('p', 'figures text-sm font-bold text-ink', String(week.order).padStart(2, '0')),
    );
    if (phase) label.append(node('p', 'text-xs leading-tight text-ink-faint', PHASE_LABELS[phase]));
    line.append(label);

    const days = node('div', 'grid grid-cols-1 gap-2 sm:grid-cols-3');
    for (const day of week.days) {
      const row = done.get(`${week.order}-${day.order}`);
      const cell = document.createElement('a');
      cell.href = day.href;
      cell.className = row
        ? 'flex min-h-16 flex-col justify-center gap-0.5 rounded-card border border-ink/70 bg-surface px-3 py-2 transition-colors hover:border-ink'
        : 'flex min-h-16 flex-col justify-center gap-0.5 rounded-card border border-dashed border-line px-3 py-2 transition-colors hover:border-line-strong';

      cell.append(node('span', 'truncate text-xs font-bold text-ink-dim', day.title));
      cell.append(
        row
          ? node(
              'span',
              'figures text-xs text-ink',
              `${fecha(row.session.startedAt)} · ${row.volume.workingSets} series`,
            )
          : node('span', 'text-xs text-ink-faint', 'Pendiente'),
      );
      days.append(cell);
    }
    line.append(days);
    grid.append(line);
  }
  box.append(grid);
}

/**
 * El reparto por músculo, en una tabla con escala común.
 *
 * La cifra va dentro de la celda porque el tinte solo sirve para ver el patrón
 * de un vistazo; el número es el que se lee cuando quieres saber cuánto. Es una
 * tabla de verdad, así que un lector de pantalla la recorre por filas.
 */
function renderMatrix(matrix: MuscleMatrix, phases: Record<number, WeekPhase>): void {
  const box = el('matriz');
  if (!box) return;
  box.replaceChildren();

  if (matrix.rows.length === 0) {
    box.append(node('p', 'text-sm text-ink-faint', 'Sin series registradas todavía.'));
    return;
  }

  const table = node('table', 'w-full min-w-[34rem] border-collapse text-sm');
  const head = node('thead', '');
  const headRow = node('tr', '');
  headRow.append(node('th', 'w-40 pb-2 text-left text-xs font-bold text-ink-faint', 'Músculo'));
  for (const weekOrder of matrix.weeks) {
    const th = node('th', 'px-2 pb-2 text-center text-xs font-bold text-ink-dim');
    th.append(node('span', 'figures block', `Semana ${String(weekOrder).padStart(2, '0')}`));
    const phase = phases[weekOrder];
    if (phase) th.append(node('span', 'block font-semibold text-ink-faint', PHASE_LABELS[phase]));
    headRow.append(th);
  }
  headRow.append(node('th', 'w-16 pb-2 text-right text-xs font-bold text-ink-faint', 'Total'));
  head.append(headRow);
  table.append(head);

  const body = node('tbody', '');
  for (const row of matrix.rows) {
    const tr = node('tr', '');
    tr.append(
      node('th', 'py-1 pr-3 text-left font-semibold text-ink-dim', MUSCLE_LABELS[row.muscle]),
    );
    for (const cell of row.cells) {
      const td = node('td', 'px-2 py-2 align-middle');
      td.append(
        matrixCell(
          cell.sets,
          cell.ratio,
          `Semana ${cell.weekOrder} · ${MUSCLE_LABELS[row.muscle]} · ${cell.sets} series`,
        ),
      );
      tr.append(td);
    }
    tr.append(node('td', 'figures py-2 pl-3 text-right font-bold text-ink', String(row.total)));
    body.append(tr);
  }
  table.append(body);

  const caption = node(
    'p',
    'mt-4 text-xs text-ink-faint',
    `La barra llena equivale a ${matrix.max} series, el máximo de la tabla. Todas las semanas usan esa misma escala.`,
  );

  box.append(table, caption);
}

export async function mountHistoryPage(payload: HistoryPayload): Promise<void> {
  const catalog: MuscleSource = new Map(
    Object.entries(payload.muscles).map(([id, muscles]) => [id as Slug, muscles]),
  );

  const sessions = await getRepository().sessions.listSessions({ status: 'completed' });

  const empty = el('vacio');
  const panel = el('panel-historial');

  if (sessions.length === 0) {
    if (empty) empty.hidden = false;
    return;
  }
  if (panel) panel.hidden = false;

  const weeks = volumeByWeek(sessions, catalog);
  const settings = await getRepository().settings.get();

  renderSummary(weeks, sessions, payload.plan);
  renderAlerts(loadAlerts(sessions, payload.blocks, settings.availableLoads), payload.names);
  renderCalendar(payload.plan, payload.phases, sessionRows(sessions));
  renderMatrix(muscleMatrix(weeks), payload.phases);
}
