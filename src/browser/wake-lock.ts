/**
 * Mantener la pantalla encendida mientras entrenas.
 *
 * El navegador suelta el bloqueo al ocultar la pestaña, así que hay que
 * volver a pedirlo al regresar. Si la API no existe, todo esto es un no-op:
 * la app funciona igual, solo que la pantalla se apagará sola.
 */

export interface ScreenWakeLock {
  request(): Promise<boolean>;
  release(): Promise<void>;
  isActive(): boolean;
  /** Deja de reintentar y suelta lo que haya. */
  dispose(): void;
}

interface WakeLockSentinelLike {
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
}

interface WakeLockCapableNavigator {
  wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> };
}

export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

export function createWakeLock(): ScreenWakeLock {
  let sentinel: WakeLockSentinelLike | null = null;
  let wanted = false;

  const acquire = async (): Promise<boolean> => {
    const api = (navigator as unknown as WakeLockCapableNavigator).wakeLock;
    if (!api) return false;
    try {
      sentinel = await api.request('screen');
      sentinel.addEventListener('release', () => {
        sentinel = null;
      });
      return true;
    } catch {
      sentinel = null;
      return false;
    }
  };

  const onVisibility = (): void => {
    if (wanted && sentinel === null && document.visibilityState === 'visible') void acquire();
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility);
  }

  return {
    async request() {
      wanted = true;
      if (!isWakeLockSupported()) return false;
      return sentinel !== null ? true : acquire();
    },
    async release() {
      wanted = false;
      await sentinel?.release().catch(() => undefined);
      sentinel = null;
    },
    isActive: () => sentinel !== null,
    dispose() {
      wanted = false;
      void sentinel?.release().catch(() => undefined);
      sentinel = null;
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    },
  };
}
