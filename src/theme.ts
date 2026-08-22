/**
 * Traducción de códigos de dominio a clases de presentación.
 *
 * Vive fuera de `core/` porque son decisiones visuales, no dominio. Las clases
 * se escriben enteras y literales a propósito: Tailwind escanea el código
 * fuente, así que una clase compuesta en tiempo de ejecución no se genera.
 */
import type { WeekPhase } from '@/core/model';

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
