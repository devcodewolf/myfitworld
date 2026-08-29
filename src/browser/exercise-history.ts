/**
 * Lo que has hecho de verdad en un ejercicio, en su propia ficha.
 *
 * Antes esta sección afirmaba en HTML que no habías registrado nada, y esa
 * frase se volvía mentira en cuanto entrenabas una vez. Ahora se lee del
 * repositorio en el navegador, que es el único sitio donde vive esa verdad.
 *
 * Vanilla y de solo lectura: no hay estado reactivo que justifique Vue.
 */
import type { ExerciseLog, SessionLog, SetLog, Slug } from '@/core/model';
import { personalRecords } from '@/core/progression';
import { getRepository } from '@/browser/repository';

const fecha = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

function node(tag: string, className: string, text?: string): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

/** Una serie en una línea: "10 × 9 kg", "45 s" o "12 reps". */
function setLabel(set: SetLog): string {
  if (set.seconds !== undefined) return `${set.seconds} s`;
  const reps = set.reps ?? 0;
  return set.weightKg !== undefined ? `${reps} × ${set.weightKg} kg` : `${reps} reps`;
}

interface Appearance {
  readonly session: SessionLog;
  readonly log: ExerciseLog;
}

/** Cada vez que hiciste el ejercicio, de la más reciente a la más antigua. */
function appearances(sessions: readonly SessionLog[], exerciseId: Slug): Appearance[] {
  return sessions
    .filter((session) => session.status === 'completed')
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .flatMap((session) => {
      const log = session.exercises.find(
        (item) => item.exerciseId === exerciseId && item.sets.some((set) => !set.skipped),
      );
      return log ? [{ session, log }] : [];
    });
}

const RECORD_LABELS: Array<[keyof ReturnType<typeof personalRecords>, string, string]> = [
  ['heaviestKg', 'Más peso', 'kg'],
  ['mostRepsAtHeaviest', 'Reps a ese peso', ''],
  ['bestSetVolumeKg', 'Mejor serie', 'kg'],
  ['longestHoldSeconds', 'Más aguante', 's'],
];

export async function mountExerciseHistory(exerciseId: Slug): Promise<void> {
  const root = document.getElementById('historial-cuerpo');
  if (!root) return;

  const sessions = await getRepository().sessions.listSessions();
  const done = appearances(sessions, exerciseId);

  root.replaceChildren();

  if (done.length === 0) {
    root.append(
      node(
        'p',
        'max-w-[55ch] text-base text-ink-faint',
        'Todavía no has registrado ninguna serie de este ejercicio. Cuando entrenes, aquí verás con qué pesos y repeticiones lo hiciste, sesión a sesión.',
      ),
    );
    return;
  }

  const records = personalRecords(done.map((item) => item.log));
  const figures = RECORD_LABELS.flatMap(([key, label, unit]) => {
    const value = records[key];
    return value === undefined ? [] : [{ label, value: unit ? `${value} ${unit}` : String(value) }];
  });

  if (figures.length > 0) {
    const list = node('dl', 'flex flex-wrap gap-x-8 gap-y-4');
    for (const figure of figures) {
      const cell = node('div', 'min-w-20');
      cell.append(
        node(
          'dt',
          'text-[0.7rem] font-bold tracking-[0.16em] text-ink-faint uppercase',
          figure.label,
        ),
        node('dd', 'figures mt-1 text-2xl font-extrabold text-ink', figure.value),
      );
      list.append(cell);
    }
    root.append(list);
  }

  // Las cinco últimas veces bastan para ver la tendencia sin convertir la ficha
  // en un listado infinito; el historial completo ya vive en su propia página.
  const recent = node('ol', 'mt-8 flex flex-col divide-y divide-line border-t border-line');
  for (const { session, log } of done.slice(0, 5)) {
    const row = node('li', 'flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3');
    row.append(
      node('span', 'text-sm font-bold text-ink', fecha(session.startedAt)),
      node(
        'span',
        'figures text-sm text-ink-dim',
        log.sets
          .filter((set) => !set.skipped)
          .map(setLabel)
          .join(' · '),
      ),
    );
    recent.append(row);
  }
  root.append(recent);
}
