/**
 * Controlador de la página de ajustes.
 *
 * Vanilla a propósito: son formularios y una lista corta. La única isla de Vue
 * del proyecto se reserva para el modo entreno, donde el estado reactivo sí lo
 * justifica.
 */
import type { LoadItem, Settings } from '@/core/model';
import { achievableLoads } from '@/core/equipment';
import { backupFilename, buildBackup, importBackup, type ImportMode } from '@/storage/backup';
import { listQuarantined } from '@/storage/document';
import { createBrowserStore } from '@/storage/kv';
import { downloadJson, getRepository, readJsonFile } from '@/browser/repository';

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
  bind('multiplicador', String(settings.restMultiplier));
  bind('peso-corporal', settings.bodyweightKg === undefined ? '' : String(settings.bodyweightKg));

  const readout = el<HTMLOutputElement>('multiplicador-valor');
  if (readout) readout.textContent = `${Math.round(settings.restMultiplier * 100)} %`;
}

export async function mountSettingsPage(): Promise<void> {
  const repo = getRepository();
  let settings = await repo.settings.get();
  renderSettings(settings);

  // Datos que no se pudieron leer: hay que decirlo, no callarlo.
  const quarantined = listQuarantined(createBrowserStore());
  if (quarantined.length > 0) {
    announce(
      `Hay ${quarantined.length} copia(s) de datos que no se pudieron leer y quedaron apartadas. No se han borrado.`,
      'error',
    );
  }

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

  el<HTMLInputElement>('multiplicador')?.addEventListener('change', (event) => {
    void save({ restMultiplier: Number((event.currentTarget as HTMLInputElement).value) });
  });

  el<HTMLInputElement>('peso-corporal')?.addEventListener('change', (event) => {
    const raw = (event.currentTarget as HTMLInputElement).value;
    void save({ bodyweightKg: raw === '' ? undefined : Number(raw) });
  });

  el<HTMLButtonElement>('exportar')?.addEventListener('click', () => {
    void (async () => {
      const exportedAt = new Date().toISOString();
      const backup = buildBackup(await repo.snapshot(), exportedAt);
      downloadJson(backup, backupFilename(exportedAt));
      announce('Copia descargada. Guárdala en algún sitio que no sea este ordenador.');
    })();
  });

  el<HTMLInputElement>('importar')?.addEventListener('change', (event) => {
    void (async () => {
      const input = event.currentTarget as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      const mode = (el<HTMLSelectElement>('modo-import')?.value ?? 'merge') as ImportMode;
      try {
        const result = importBackup(await readJsonFile(file), mode, await repo.snapshot());
        if (!result.report.ok) {
          announce(result.report.error ?? 'No se pudo importar.', 'error');
          return;
        }
        await repo.restore(result.state);
        settings = await repo.settings.get();
        renderSettings(settings);
        announce(
          `Importado: ${result.report.sessionsAdded} sesiones nuevas, ` +
            `${result.report.sessionsUpdated} actualizadas, ${result.report.sessionsKept} conservadas.`,
        );
      } catch {
        announce('Ese archivo no se pudo leer como JSON.', 'error');
      } finally {
        input.value = '';
      }
    })();
  });
}
