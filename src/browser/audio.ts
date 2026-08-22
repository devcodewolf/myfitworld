/**
 * Avisos sonoros generados con osciladores.
 *
 * Sin archivos de audio: no hay nada que descargar ni que cachear, y el aviso
 * suena instantáneo. Tres señales que se distinguen entre sí a oscuras y con
 * música de fondo:
 *
 *   · empezar serie  → un pitido corto y grave
 *   · cuenta atrás   → tres pitidos secos en los últimos segundos del descanso
 *   · fin de descanso→ un tono más largo y agudo, que sube
 *
 * La política de autoplay de los navegadores prohíbe crear un AudioContext
 * fuera de un gesto del usuario, así que `unlock()` se llama en el primer clic
 * y hasta entonces esto no hace absolutamente nada.
 */

type OscillatorType_ = 'sine' | 'square' | 'triangle' | 'sawtooth';

interface Tone {
  readonly frequency: number;
  readonly durationMs: number;
  readonly type?: OscillatorType_;
  readonly gain?: number;
  /** Frecuencia final, para tonos que suben. */
  readonly slideTo?: number;
}

export interface AudioCues {
  /** Llamar en el primer gesto del usuario. Repetirlo es inofensivo. */
  unlock(): void;
  setEnabled(enabled: boolean): void;
  isReady(): boolean;
  /** Arranca la serie. */
  setStart(): void;
  /** Uno de los últimos segundos del descanso. */
  countdownTick(): void;
  /** Se acabó el descanso: toca volver. */
  restOver(): void;
  /** Sesión terminada. */
  sessionDone(): void;
}

function createContext(): AudioContext | null {
  const Ctor =
    typeof window === 'undefined'
      ? undefined
      : (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  try {
    return Ctor ? new Ctor() : null;
  } catch {
    return null;
  }
}

export function createAudioCues(enabled = true): AudioCues {
  let context: AudioContext | null = null;
  let on = enabled;

  const play = (tones: readonly Tone[]): void => {
    if (!on || !context) return;
    // Un contexto suspendido tras cambiar de pestaña se reanuda solo.
    if (context.state === 'suspended') void context.resume();

    let at = context.currentTime;
    for (const tone of tones) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const seconds = tone.durationMs / 1000;
      const peak = tone.gain ?? 0.18;

      oscillator.type = tone.type ?? 'sine';
      oscillator.frequency.setValueAtTime(tone.frequency, at);
      if (tone.slideTo !== undefined) {
        oscillator.frequency.linearRampToValueAtTime(tone.slideTo, at + seconds);
      }

      // Envolvente corta: sin ella cada pitido empieza y acaba con un chasquido.
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(peak, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);

      oscillator.connect(gain).connect(context.destination);
      oscillator.start(at);
      oscillator.stop(at + seconds + 0.02);
      at += seconds + 0.06;
    }
  };

  return {
    unlock() {
      context ??= createContext();
      if (context?.state === 'suspended') void context.resume();
    },
    setEnabled(value) {
      on = value;
    },
    isReady: () => context !== null,
    setStart: () => play([{ frequency: 520, durationMs: 130, type: 'triangle' }]),
    countdownTick: () => play([{ frequency: 660, durationMs: 90, type: 'square', gain: 0.12 }]),
    restOver: () =>
      play([{ frequency: 720, slideTo: 1080, durationMs: 420, type: 'triangle', gain: 0.22 }]),
    sessionDone: () =>
      play([
        { frequency: 660, durationMs: 140 },
        { frequency: 880, durationMs: 140 },
        { frequency: 1180, durationMs: 320 },
      ]),
  };
}
