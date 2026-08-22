/**
 * El temporizador vivo: une la matemática pura de `core/timer.ts` con un bucle
 * de `requestAnimationFrame`.
 *
 * El bucle solo sirve para repintar. El tiempo se calcula siempre contra
 * `Date.now()`, así que un fotograma perdido, una pestaña en segundo plano o
 * un móvil bloqueado no desajustan nada: al volver, la lectura ya es correcta.
 */
import { onUnmounted, readonly, ref, type Ref } from 'vue';

import {
  adjustTimer,
  displaySeconds,
  isFinalCountdown,
  pauseTimer,
  readTimer,
  resumeTimer,
  startTimer,
  type TimerMode,
  type TimerReading,
  type TimerState,
} from '@/core/timer';

export interface UseTimerOptions {
  readonly mode: TimerMode;
  readonly durationSeconds?: number;
  /** Se llama una sola vez al llegar a cero. */
  readonly onFinish?: () => void;
  /** Se llama al entrar en cada uno de los últimos segundos de la cuenta atrás. */
  readonly onFinalSecond?: (secondsLeft: number) => void;
  readonly finalSeconds?: number;
}

export interface TimerHandle {
  readonly reading: Readonly<Ref<TimerReading>>;
  readonly seconds: Readonly<Ref<number>>;
  readonly isFinal: Readonly<Ref<boolean>>;
  readonly isRunning: Readonly<Ref<boolean>>;
  start(durationSeconds?: number): void;
  pause(): void;
  resume(): void;
  toggle(): void;
  /** Los botones de +15 s y −15 s. */
  adjust(deltaSeconds: number): void;
  /** Corta y da por terminado, sin esperar. */
  skip(): void;
  stop(): void;
}

const IDLE: TimerReading = {
  elapsedMs: 0,
  remainingMs: 0,
  progress: 0,
  finished: false,
  isPaused: false,
};

export function useTimer(options: UseTimerOptions): TimerHandle {
  const { mode, onFinish, onFinalSecond, finalSeconds = 5 } = options;

  const reading = ref<TimerReading>(IDLE);
  // En reposo, la cuenta atrás enseña lo que va a durar y la de subida un cero:
  // en subida la duración es solo el objetivo del arco, no la cifra de partida.
  const idleSeconds = (): number => (mode === 'countdown' ? (options.durationSeconds ?? 0) : 0);
  const seconds = ref(idleSeconds());
  const isFinal = ref(false);
  const isRunning = ref(false);

  let state: TimerState | null = null;
  let frame = 0;
  let finished = false;
  let lastAnnounced = -1;

  const stopLoop = (): void => {
    if (frame !== 0) cancelAnimationFrame(frame);
    frame = 0;
  };

  const tick = (): void => {
    if (!state) return;
    const now = Date.now();
    const next = readTimer(state, now);
    reading.value = next;
    seconds.value = displaySeconds(next, mode);
    isFinal.value = isFinalCountdown(next, mode, finalSeconds);

    // Un aviso por segundo, no uno por fotograma.
    if (isFinal.value && seconds.value !== lastAnnounced) {
      lastAnnounced = seconds.value;
      onFinalSecond?.(seconds.value);
    }

    if (next.finished && !finished) {
      finished = true;
      isRunning.value = false;
      stopLoop();
      onFinish?.();
      return;
    }

    frame = requestAnimationFrame(tick);
  };

  const startLoop = (): void => {
    stopLoop();
    frame = requestAnimationFrame(tick);
  };

  onUnmounted(stopLoop);

  return {
    reading: readonly(reading) as Readonly<Ref<TimerReading>>,
    seconds: readonly(seconds) as Readonly<Ref<number>>,
    isFinal: readonly(isFinal) as Readonly<Ref<boolean>>,
    isRunning: readonly(isRunning) as Readonly<Ref<boolean>>,

    start(durationSeconds) {
      const total = (durationSeconds ?? options.durationSeconds ?? 0) * 1000;
      state = startTimer(Date.now(), mode, total);
      finished = false;
      lastAnnounced = -1;
      isRunning.value = true;
      startLoop();
    },

    pause() {
      if (!state || state.pausedAt !== null) return;
      state = pauseTimer(state, Date.now());
      isRunning.value = false;
      tick();
      stopLoop();
    },

    resume() {
      if (!state || state.pausedAt === null) return;
      state = resumeTimer(state, Date.now());
      isRunning.value = true;
      startLoop();
    },

    toggle() {
      if (!state) return;
      if (state.pausedAt === null) this.pause();
      else this.resume();
    },

    adjust(deltaSeconds) {
      if (!state) return;
      state = adjustTimer(state, deltaSeconds * 1000, Date.now());
      finished = false;
      tick();
      if (!isRunning.value) stopLoop();
    },

    skip() {
      if (finished) return;
      finished = true;
      isRunning.value = false;
      stopLoop();
      reading.value = { ...reading.value, remainingMs: 0, progress: 1, finished: true };
      seconds.value = 0;
      isFinal.value = false;
      onFinish?.();
    },

    stop() {
      state = null;
      finished = false;
      isRunning.value = false;
      isFinal.value = false;
      stopLoop();
      reading.value = IDLE;
      seconds.value = idleSeconds();
    },
  };
}
