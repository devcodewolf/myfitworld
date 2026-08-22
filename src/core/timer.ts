/**
 * Matemática de los temporizadores.
 *
 * La regla que gobierna este módulo: el tiempo **nunca se acumula sumando
 * intervalos**, porque `setInterval` deriva y se congela cuando la pestaña pasa
 * a segundo plano. Aquí solo se guardan marcas de tiempo, y cada lectura se
 * calcula restando contra el instante actual. Así el cronómetro sigue siendo
 * correcto tras diez minutos con el móvil bloqueado.
 *
 * Todo son funciones puras sobre milisegundos: ni relojes, ni DOM, ni efectos.
 */

export type TimerMode = 'countdown' | 'countup';

export interface TimerState {
  readonly mode: TimerMode;
  /** Cuenta atrás: lo que dura. Cuenta arriba: objetivo opcional para el arco. */
  readonly durationMs: number;
  readonly startedAt: number;
  /** Tiempo total que ha estado en pausa antes de la pausa actual. */
  readonly pausedAccumMs: number;
  /** Instante en que se pausó, o null si está corriendo. */
  readonly pausedAt: number | null;
}

export interface TimerReading {
  readonly elapsedMs: number;
  /** En cuenta arriba es el tiempo que falta para el objetivo, o 0 si no hay. */
  readonly remainingMs: number;
  /** 0 a 1. En cuenta atrás se vacía, en cuenta arriba se llena. */
  readonly progress: number;
  readonly finished: boolean;
  readonly isPaused: boolean;
}

export function startTimer(now: number, mode: TimerMode, durationMs = 0): TimerState {
  return {
    mode,
    durationMs: Math.max(0, durationMs),
    startedAt: now,
    pausedAccumMs: 0,
    pausedAt: null,
  };
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  if (state.pausedAt !== null) return state;
  return { ...state, pausedAt: now };
}

export function resumeTimer(state: TimerState, now: number): TimerState {
  if (state.pausedAt === null) return state;
  return {
    ...state,
    pausedAccumMs: state.pausedAccumMs + Math.max(0, now - state.pausedAt),
    pausedAt: null,
  };
}

export function toggleTimer(state: TimerState, now: number): TimerState {
  return state.pausedAt === null ? pauseTimer(state, now) : resumeTimer(state, now);
}

/**
 * Suma o resta tiempo (los botones de +15 s y −15 s).
 *
 * En cuenta atrás mueve la duración, porque lo que se ajusta es cuánto queda.
 * En cuenta arriba mueve el inicio, porque lo que se ajusta es lo ya corrido.
 * La duración nunca baja de cero, y el tiempo corrido tampoco.
 */
export function adjustTimer(state: TimerState, deltaMs: number, now: number): TimerState {
  if (state.mode === 'countdown') {
    return { ...state, durationMs: Math.max(0, state.durationMs + deltaMs) };
  }
  const elapsed = readTimer(state, now).elapsedMs;
  const nextElapsed = Math.max(0, elapsed + deltaMs);
  return { ...state, startedAt: state.startedAt - (nextElapsed - elapsed) };
}

/** Milisegundos corridos descontando las pausas. Nunca negativo. */
function elapsedOf(state: TimerState, now: number): number {
  const reference = state.pausedAt ?? now;
  return Math.max(0, reference - state.startedAt - state.pausedAccumMs);
}

export function readTimer(state: TimerState, now: number): TimerReading {
  const elapsedMs = elapsedOf(state, now);
  const isPaused = state.pausedAt !== null;

  if (state.mode === 'countdown') {
    const remainingMs = Math.max(0, state.durationMs - elapsedMs);
    return {
      elapsedMs,
      remainingMs,
      progress: state.durationMs === 0 ? 1 : 1 - remainingMs / state.durationMs,
      finished: remainingMs === 0,
      isPaused,
    };
  }

  const remainingMs = state.durationMs === 0 ? 0 : Math.max(0, state.durationMs - elapsedMs);
  return {
    elapsedMs,
    remainingMs,
    progress: state.durationMs === 0 ? 0 : Math.min(1, elapsedMs / state.durationMs),
    finished: state.durationMs !== 0 && remainingMs === 0,
    isPaused,
  };
}

/** Segundos enteros que muestra el círculo: los que quedan, o los corridos. */
export function displaySeconds(reading: TimerReading, mode: TimerMode): number {
  const ms = mode === 'countdown' ? reading.remainingMs : reading.elapsedMs;
  return mode === 'countdown' ? Math.ceil(ms / 1000) : Math.floor(ms / 1000);
}

/** Los últimos segundos de una cuenta atrás, que disparan aviso y cambio de color. */
export function isFinalCountdown(reading: TimerReading, mode: TimerMode, seconds = 5): boolean {
  if (mode !== 'countdown' || reading.finished) return false;
  return reading.remainingMs <= seconds * 1000;
}

/** 95 → "1:35". Siempre con dos dígitos en los segundos. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
