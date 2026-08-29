/**
 * Traducción de códigos de dominio a decisiones de presentación.
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

/** Tamaño y calidad con los que Unsplash sirve una foto de portada o de día. */
const PHOTO = '?w=1400&q=74&auto=format&fit=crop&crop=entropy';

const url = (id: string): string => `https://images.unsplash.com/photo-${id}${PHOTO}`;

/**
 * Fotografía de cada sesión del mesociclo: **una distinta para las doce**.
 *
 * Antes se elegía solo por el número de día, así que el día 1 de la semana 1 y
 * el de la semana 4 enseñaban la misma foto y el mesociclo entero parecía la
 * misma pantalla repetida. La clave es ahora la sesión completa.
 *
 * El tema sigue al día —empuje, pierna y tracción, cuerpo entero— y cambia de
 * imagen cada semana, así que avanzar por el plan se nota también al mirarlo.
 * Procedencia y licencia en `src/assets/photos/PROCEDENCIA.md`.
 */
const SESSION_PHOTOS: Record<number, readonly string[]> = {
  1: ['1581009146145-b5ef050c2e1e', '1541534741688-6078c6bfb5c5', '1592588253414-887759037c2a'],
  2: ['1584863265045-f9d10ca7fa61', '1609899517237-77d357b047cf', '1532384748853-8f54a8f476e2'],
  3: ['1574680096145-d05b474e2155', '1517838277536-f5f99be501cd', '1534258936925-c58bed479fcb'],
  4: ['1574680088814-c9e8a10d8a4d', '1571731956672-f2b94d7dd0cb', '1591258370814-01609b341790'],
};

/** Fotos sueltas del mismo mundo, para las pantallas que no son el plan. */
export const SCENE_PHOTOS = {
  hall: url('1599058917212-d750089bc07e'),
  rack: url('1784798228092-659924b1a15b'),
  floor: url('1671970922029-0430d2ae122c'),
  plates: url('1764595753275-d9278a0b8f56'),
  portrait: url('1550345332-09e3ac987658'),
} as const;

export function dayPhoto(weekOrder: number, dayOrder: number): string {
  const week = SESSION_PHOTOS[weekOrder] ?? SESSION_PHOTOS[1]!;
  return url(week[(dayOrder - 1) % week.length]!);
}

export const TODAY_PHOTO = SCENE_PHOTOS.hall;
