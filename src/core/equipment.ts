/**
 * Qué cargas puedes montar con el material que tienes declarado.
 *
 * Este módulo es la razón por la que en ningún sitio de la app hay un 9 escrito
 * a mano: el salto de peso que se sugiere sale siempre de aquí, y cambia solo
 * cuando cambias tu material en configuración.
 */
import type { LoadItem } from '@/core/model';

/** Peso sostenido en una mano, o masa total levantada. */
export type LoadMode = 'perHand' | 'total';

export interface LoadOptions {
  readonly mode: LoadMode;
  /** Los ejercicios a dos manos con mancuernas necesitan dos iguales. */
  readonly pairs?: boolean;
}

const round = (kg: number): number => Math.round(kg * 100) / 100;

/** Sumas distintas que se pueden formar con los discos disponibles. */
function plateSums(plates: readonly LoadItem[]): number[] {
  const sums = new Set<number>([0]);
  for (const plate of plates) {
    for (let used = 0; used < plate.count; used += 1) {
      for (const sum of [...sums]) {
        sums.add(round(sum + plate.weightKg));
      }
    }
  }
  return [...sums];
}

/**
 * Todas las cargas alcanzables, ordenadas de menor a mayor y sin repetidos.
 *
 * Mancuernas y kettlebells aportan su propio peso. Los discos solo cuentan si
 * hay barra, y se cargan simétricos: la barra más el doble de cada combinación.
 */
export function achievableLoads(
  items: readonly LoadItem[],
  { mode, pairs = false }: LoadOptions,
): number[] {
  const minimumCount = pairs ? 2 : 1;
  const loads = new Set<number>();

  for (const item of items) {
    if (item.kind !== 'dumbbell' && item.kind !== 'kettlebell') continue;
    if (item.count < minimumCount) continue;
    loads.add(round(mode === 'total' && pairs ? item.weightKg * 2 : item.weightKg));
  }

  const bars = items.filter((item) => item.kind === 'barbell');
  const plates = items.filter((item) => item.kind === 'plate');
  for (const bar of bars) {
    // Los discos se reparten a pares, uno en cada extremo.
    const perSide = plates.map((plate) => ({ ...plate, count: Math.floor(plate.count / 2) }));
    for (const sum of plateSums(perSide)) {
      const total = round(bar.weightKg + sum * 2);
      loads.add(mode === 'perHand' ? round(total / 2) : total);
    }
  }

  return [...loads].sort((a, b) => a - b);
}

export interface LoadStep {
  readonly nextKg: number;
  readonly incrementKg: number;
}

/**
 * El siguiente peso disponible por encima del actual, o `null` si ya estás en
 * el tope de tu material: ahí la progresión tiene que venir por repeticiones,
 * tempo o variante más difícil, no por carga.
 */
export function nextLoadStep(
  currentKg: number,
  items: readonly LoadItem[],
  options: LoadOptions,
): LoadStep | null {
  const next = achievableLoads(items, options).find((load) => load > currentKg + 0.001);
  if (next === undefined) return null;
  return { nextKg: next, incrementKg: round(next - currentKg) };
}

/** La carga más pesada que puedes montar, para saber cuándo te has quedado corto. */
export function heaviestLoad(items: readonly LoadItem[], options: LoadOptions): number | null {
  const loads = achievableLoads(items, options);
  return loads.at(-1) ?? null;
}
