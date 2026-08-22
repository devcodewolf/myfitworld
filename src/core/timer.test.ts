import { describe, expect, it } from 'vitest';

import {
  adjustTimer,
  displaySeconds,
  formatClock,
  isFinalCountdown,
  pauseTimer,
  readTimer,
  resumeTimer,
  startTimer,
  toggleTimer,
} from '@/core/timer';

const T0 = 1_000_000;

describe('cuenta atrás', () => {
  it('descuenta contra el reloj, no sumando intervalos', () => {
    const state = startTimer(T0, 'countdown', 90_000);
    expect(readTimer(state, T0).remainingMs).toBe(90_000);
    expect(readTimer(state, T0 + 30_000).remainingMs).toBe(60_000);
  });

  it('sigue siendo correcto tras un salto largo, como al volver de segundo plano', () => {
    const state = startTimer(T0, 'countdown', 120_000);
    // La pestaña estuvo dormida diez minutos: no hubo ni un solo tick.
    const reading = readTimer(state, T0 + 600_000);
    expect(reading.remainingMs).toBe(0);
    expect(reading.finished).toBe(true);
  });

  it('no baja de cero ni deja el progreso por encima de uno', () => {
    const state = startTimer(T0, 'countdown', 10_000);
    const reading = readTimer(state, T0 + 999_999);
    expect(reading.remainingMs).toBe(0);
    expect(reading.progress).toBe(1);
  });

  it('vacía el arco a medida que pasa el tiempo', () => {
    const state = startTimer(T0, 'countdown', 100_000);
    expect(readTimer(state, T0 + 25_000).progress).toBeCloseTo(0.25);
  });
});

describe('cuenta arriba', () => {
  it('acumula el tiempo corrido', () => {
    const state = startTimer(T0, 'countup');
    expect(readTimer(state, T0 + 42_000).elapsedMs).toBe(42_000);
  });

  it('sin objetivo no termina nunca y el arco no avanza', () => {
    const state = startTimer(T0, 'countup');
    const reading = readTimer(state, T0 + 500_000);
    expect(reading.finished).toBe(false);
    expect(reading.progress).toBe(0);
  });

  it('con objetivo llena el arco y termina al alcanzarlo', () => {
    const state = startTimer(T0, 'countup', 60_000);
    expect(readTimer(state, T0 + 30_000).progress).toBeCloseTo(0.5);
    expect(readTimer(state, T0 + 60_000).finished).toBe(true);
  });
});

describe('pausa', () => {
  it('congela la lectura mientras está pausado', () => {
    const running = startTimer(T0, 'countdown', 60_000);
    const paused = pauseTimer(running, T0 + 10_000);
    expect(readTimer(paused, T0 + 10_000).remainingMs).toBe(50_000);
    // Pasan veinte segundos de mundo real sin que el temporizador se mueva.
    expect(readTimer(paused, T0 + 30_000).remainingMs).toBe(50_000);
    expect(readTimer(paused, T0 + 30_000).isPaused).toBe(true);
  });

  it('al reanudar no cuenta el tiempo que estuvo parado', () => {
    let state = startTimer(T0, 'countdown', 60_000);
    state = pauseTimer(state, T0 + 10_000);
    state = resumeTimer(state, T0 + 40_000); // treinta segundos en pausa
    // Ha corrido diez segundos antes de la pausa y diez después: veinte de sesenta.
    expect(readTimer(state, T0 + 50_000).remainingMs).toBe(40_000);
  });

  it('aguanta varias pausas seguidas', () => {
    let state = startTimer(T0, 'countup');
    state = pauseTimer(state, T0 + 5_000);
    state = resumeTimer(state, T0 + 15_000);
    state = pauseTimer(state, T0 + 20_000);
    state = resumeTimer(state, T0 + 30_000);
    // Ha corrido cinco más cinco segundos; veinte estuvo parado.
    expect(readTimer(state, T0 + 30_000).elapsedMs).toBe(10_000);
  });

  it('pausar dos veces o reanudar sin pausa no cambia nada', () => {
    const state = pauseTimer(startTimer(T0, 'countdown', 60_000), T0 + 5_000);
    expect(pauseTimer(state, T0 + 9_000)).toBe(state);
    const running = startTimer(T0, 'countdown', 60_000);
    expect(resumeTimer(running, T0 + 5_000)).toBe(running);
  });

  it('el interruptor alterna entre parar y seguir', () => {
    const running = startTimer(T0, 'countdown', 60_000);
    const paused = toggleTimer(running, T0 + 1_000);
    expect(paused.pausedAt).toBe(T0 + 1_000);
    expect(toggleTimer(paused, T0 + 2_000).pausedAt).toBeNull();
  });
});

describe('ajuste de tiempo', () => {
  it('en cuenta atrás, +15 s añade quince segundos a lo que queda', () => {
    const state = startTimer(T0, 'countdown', 60_000);
    const ajustado = adjustTimer(state, 15_000, T0 + 10_000);
    expect(readTimer(ajustado, T0 + 10_000).remainingMs).toBe(65_000);
  });

  it('en cuenta atrás, −15 s no puede dejar la duración en negativo', () => {
    const state = startTimer(T0, 'countdown', 10_000);
    const ajustado = adjustTimer(state, -30_000, T0);
    expect(ajustado.durationMs).toBe(0);
    expect(readTimer(ajustado, T0).finished).toBe(true);
  });

  it('en cuenta arriba mueve el tiempo ya corrido', () => {
    const state = startTimer(T0, 'countup');
    const ajustado = adjustTimer(state, 15_000, T0 + 10_000);
    expect(readTimer(ajustado, T0 + 10_000).elapsedMs).toBe(25_000);
  });

  it('en cuenta arriba tampoco deja el corrido en negativo', () => {
    const state = startTimer(T0, 'countup');
    const ajustado = adjustTimer(state, -30_000, T0 + 5_000);
    expect(readTimer(ajustado, T0 + 5_000).elapsedMs).toBe(0);
  });
});

describe('lo que se ve en el círculo', () => {
  it('la cuenta atrás redondea hacia arriba: 0,4 s restantes se muestran como 1', () => {
    const state = startTimer(T0, 'countdown', 10_000);
    expect(displaySeconds(readTimer(state, T0 + 9_600), 'countdown')).toBe(1);
  });

  it('la cuenta arriba redondea hacia abajo: a los 9,9 s aún se muestra 9', () => {
    const state = startTimer(T0, 'countup');
    expect(displaySeconds(readTimer(state, T0 + 9_900), 'countup')).toBe(9);
  });

  it('avisa en los últimos cinco segundos y no después de terminar', () => {
    const state = startTimer(T0, 'countdown', 10_000);
    expect(isFinalCountdown(readTimer(state, T0 + 4_000), 'countdown')).toBe(false);
    expect(isFinalCountdown(readTimer(state, T0 + 5_100), 'countdown')).toBe(true);
    expect(isFinalCountdown(readTimer(state, T0 + 10_000), 'countdown')).toBe(false);
  });

  it('la cuenta arriba nunca entra en aviso final', () => {
    const state = startTimer(T0, 'countup', 10_000);
    expect(isFinalCountdown(readTimer(state, T0 + 9_000), 'countup')).toBe(false);
  });

  it('formatea el reloj con dos dígitos en los segundos', () => {
    expect(formatClock(95)).toBe('1:35');
    expect(formatClock(9)).toBe('0:09');
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(-5)).toBe('0:00');
    expect(formatClock(3_600)).toBe('60:00');
  });
});
