/**
 * Vibración, con caída silenciosa.
 *
 * Acompaña a cada aviso sonoro para que la app funcione entera con el sonido
 * apagado. Escritorio no la soporta y no pasa nada: no es la única señal.
 */

export const HAPTIC = {
  setStart: 40,
  countdownTick: 25,
  restOver: [70, 60, 70],
  sessionDone: [40, 40, 40, 40, 140],
} as const;

export function vibrate(pattern: number | readonly number[], enabled = true): void {
  if (!enabled || typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(pattern as number | number[]);
  } catch {
    // Que un fallo de vibración no interrumpa un entrenamiento.
  }
}
