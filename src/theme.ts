/**
 * Traducción de códigos de dominio a decisiones de presentación.
 *
 * Vive fuera de `core/` porque son decisiones visuales, no dominio. Las clases
 * se escriben enteras y literales a propósito: Tailwind escanea el código
 * fuente, así que una clase compuesta en tiempo de ejecución no se genera.
 */
import type { ImageMetadata } from 'astro';

import type { WeekPhase } from '@/core/model';
import hoy from '@/assets/photos/hoy-mancuernas-zapatillas.jpg';
import dia1 from '@/assets/photos/dia-1-mancuernas-suelo.jpg';
import dia2 from '@/assets/photos/dia-2-discos-cenital.jpg';
import dia3 from '@/assets/photos/dia-3-suelo-madera.jpg';

export interface PhasePalette {
  /** Texto y cifras de la fase. */
  readonly text: string;
  /** Filete o punto que la identifica. */
  readonly mark: string;
  /** Tinte de fondo, siempre por debajo del acento en presencia. */
  readonly wash: string;
}

export const PHASE_PALETTE: Record<WeekPhase, PhasePalette> = {
  accumulation: {
    text: 'text-phase-accumulation',
    mark: 'bg-phase-accumulation',
    wash: 'bg-phase-accumulation/10',
  },
  progression: {
    text: 'text-phase-progression',
    mark: 'bg-phase-progression',
    wash: 'bg-phase-progression/10',
  },
  intensification: {
    text: 'text-phase-intensification',
    mark: 'bg-phase-intensification',
    wash: 'bg-phase-intensification/10',
  },
  deload: {
    text: 'text-phase-deload',
    mark: 'bg-phase-deload',
    wash: 'bg-phase-deload/10',
  },
};

/**
 * Fotografía de cada día del mesociclo. Son de stock y provisionales: para
 * cambiarlas basta con reemplazar el archivo en `src/assets/photos/`
 * manteniendo el nombre, sin tocar ningún componente. Procedencia y licencia
 * en `src/assets/photos/PROCEDENCIA.md`.
 */
const DAY_PHOTOS: readonly ImageMetadata[] = [dia1, dia2, dia3];

export function dayPhoto(dayOrder: number): ImageMetadata {
  return DAY_PHOTOS[(dayOrder - 1) % DAY_PHOTOS.length]!;
}

export const TODAY_PHOTO = hoy;
