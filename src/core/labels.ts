/**
 * Códigos en inglés → texto en español. La UI nunca traduce a mano.
 */
import type { Difficulty, Equipment, MuscleGroup, RepRange, WeekPhase } from '@/core/model';

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Pectoral',
  lats: 'Dorsal',
  upper_back: 'Espalda alta',
  traps: 'Trapecio',
  lower_back: 'Lumbar',
  front_delts: 'Hombro anterior',
  side_delts: 'Hombro lateral',
  rear_delts: 'Hombro posterior',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebrazo',
  quads: 'Cuádriceps',
  hamstrings: 'Isquiotibiales',
  glutes: 'Glúteo',
  adductors: 'Aductores',
  calves: 'Gemelos',
  core: 'Core',
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  bodyweight: 'Peso corporal',
  dumbbell: 'Mancuernas',
  kettlebell: 'Kettlebell',
  barbell: 'Barra',
  plate: 'Discos',
  bench: 'Banco',
  chair: 'Silla',
  floor: 'Suelo',
  wall: 'Pared',
  mat: 'Esterilla',
  band: 'Goma',
  pullup_bar: 'Barra de dominadas',
  box: 'Cajón',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Básico',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export const PHASE_LABELS: Record<WeekPhase, string> = {
  accumulation: 'Acumulación',
  progression: 'Progresión',
  intensification: 'Intensificación',
  deload: 'Descarga',
};

/** "10-12" o "12" cuando el rango es un valor fijo. */
export function formatRepRange(range: RepRange): string {
  return range.min === range.max ? `${range.min}` : `${range.min}-${range.max}`;
}

/** 3120 → "52 min"; 9300 → "2 h 35 min". */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** 3.5 → "3-4 reps en reserva". */
export function formatReserve(reps: number): string {
  const low = Math.floor(reps);
  const high = Math.ceil(reps);
  return low === high ? `${low} reps en reserva` : `${low}-${high} reps en reserva`;
}
