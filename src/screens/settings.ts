/**
 * Controlador de la página de ajustes.
 *
 * Vanilla a propósito: son formularios y una lista corta. La única isla de Vue
 * del proyecto se reserva para el modo entreno, donde el estado reactivo sí lo
 * justifica.
 *
 * Aquí vivían el exportar y el importar en JSON, y el botón que traía a la
 * cuenta lo que hubiera en `localStorage`. Se fueron los tres cuando la
 * persistencia pasó a Postgres: la copia de seguridad ya no es un archivo que
 * te descargas y guardas tú, son las copias del servidor.
 */
import type { LoadItem, Settings } from '@/core/model';
import { achievableLoads } from '@/core/equipment';
import { getRepository } from '@/repository';

const KIND_LABELS: Record<LoadItem['kind'], string> = {
  dumbbell: 'Mancuerna',
  kettlebell: 'Kettlebell',
  barbell: 'Barra',
  plate: 'Disco',
};

const el = <T extends HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;

function announce(message: string, tone: 'ok' | 'error' = 'ok'): void {
  const box = el<HTMLParagraphElement>('aviso');
  if (!box) return;
  box.textContent = message;
  box.dataset['tone'] = tone;
  box.hidden = message === '';
}

function renderLoads(loads: readonly LoadItem[]): void {
  const list = el<HTMLUListElement>('lista-material');
  const summary = el<HTMLParagraphElement>('resumen-cargas');
  if (!list) return;

  list.replaceChildren();
  if (loads.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'text-sm text-ink-faint';
    empty.textContent =
      'Todavía no has declarado material. Sin él no puedo sugerirte saltos de peso.';
    list.append(empty);
  }

  for (const load of loads) {
    const item = document.createElement('li');
    item.className =
      'flex items-center justify-between gap-4 rounded-card border border-line px-4 py-3';
    const label = document.createElement('span');
    label.className = 'figures text-sm text-ink';
    label.textContent = `${load.count} × ${KIND_LABELS[load.kind]} de ${load.weightKg} kg`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className =
      'min-h-11 rounded-full border border-line px-4 text-sm font-semibold text-ink-dim transition-colors hover:border-line-strong hover:text-ink';
    remove.textContent = 'Quitar';
    remove.dataset['removeLoad'] = load.id;
    item.append(label, remove);
    list.append(item);
  }

  if (summary) {
    const perHand = achievableLoads(loads, { mode: 'perHand' });
    summary.textContent =
      perHand.length === 0
        ? 'Sin cargas disponibles.'
        : `Cargas por mano que puedes montar: ${perHand.map((kg) => `${kg} kg`).join(' · ')}.`;
  }
}

function renderSettings(settings: Settings): void {
  renderLoads(settings.availableLoads);

  const bind = (id: string, value: string | boolean): void => {
    const field = el<HTMLInputElement>(id);
    if (!field) return;
    if (typeof value === 'boolean') field.checked = value;
    else field.value = value;
  };

  bind('sonido', settings.soundEnabled);
  bind('vibracion', settings.vibrationEnabled);
  bind('pantalla', settings.keepScreenAwake);
  bind('descanso-auto', settings.autoStartRest);
  bind('descanso', String(settings.restSeconds));
  bind('peso-corporal', settings.bodyweightKg === undefined ? '' : String(settings.bodyweightKg));

  const readout = el<HTMLOutputElement>('descanso-valor');
  if (readout) readout.textContent = `${settings.restSeconds} s`;
}

export async function mountSettingsPage(): Promise<void> {
  const repo = getRepository();
  let settings = await repo.settings.get();
  renderSettings(settings);

  const save = async (patch: Partial<Settings>): Promise<void> => {
    try {
      settings = await repo.settings.save(patch);
      renderSettings(settings);
      announce('Guardado.');
    } catch {
      announce('Ese valor no es válido, así que no se ha guardado.', 'error');
    }
  };

  el<HTMLFormElement>('form-material')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const weightKg = Number(data.get('peso'));
    const count = Number(data.get('unidades'));
    if (!Number.isFinite(weightKg) || weightKg <= 0 || !Number.isFinite(count) || count < 1) {
      announce('Revisa el peso y las unidades: tienen que ser números mayores que cero.', 'error');
      return;
    }
    const item: LoadItem = {
      id: crypto.randomUUID(),
      kind: data.get('tipo') as LoadItem['kind'],
      weightKg,
      count,
    };
    void save({ availableLoads: [...settings.availableLoads, item] });
    form.reset();
  });

  el<HTMLUListElement>('lista-material')?.addEventListener('click', (event) => {
    const id = (event.target as HTMLElement).dataset['removeLoad'];
    if (!id) return;
    void save({ availableLoads: settings.availableLoads.filter((load) => load.id !== id) });
  });

  const toggles: ReadonlyArray<[string, keyof Settings]> = [
    ['sonido', 'soundEnabled'],
    ['vibracion', 'vibrationEnabled'],
    ['pantalla', 'keepScreenAwake'],
    ['descanso-auto', 'autoStartRest'],
  ];
  for (const [id, key] of toggles) {
    el<HTMLInputElement>(id)?.addEventListener('change', (event) => {
      void save({ [key]: (event.currentTarget as HTMLInputElement).checked } as Partial<Settings>);
    });
  }

  el<HTMLInputElement>('descanso')?.addEventListener('change', (event) => {
    void save({ restSeconds: Number((event.currentTarget as HTMLInputElement).value) });
  });

  el<HTMLInputElement>('peso-corporal')?.addEventListener('change', (event) => {
    const raw = (event.currentTarget as HTMLInputElement).value;
    void save({ bodyweightKg: raw === '' ? undefined : Number(raw) });
  });
}
