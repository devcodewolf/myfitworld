/**
 * El puerto de almacenamiento: lo único que el resto de la capa conoce.
 *
 * Está aquí para dos cosas. Una, poder probar la persistencia entera sin
 * navegador. Y dos, que el día que detrás haya IndexedDB o un servidor, se
 * escriba otra implementación de esta interfaz y no se toque nada más.
 */
export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  /** Claves existentes, para poder barrer las cuarentenas antiguas. */
  keys(): string[];
}

/** Implementación en memoria, para tests y para renderizado en servidor. */
export function createMemoryStore(seed: Record<string, string> = {}): KeyValueStore {
  const data = new Map<string, string>(Object.entries(seed));
  return {
    get: (key) => data.get(key) ?? null,
    set: (key, value) => void data.set(key, value),
    remove: (key) => void data.delete(key),
    keys: () => [...data.keys()],
  };
}

/**
 * `localStorage`, con una red de seguridad.
 *
 * Puede lanzar por cuota llena o por estar deshabilitado en modo privado. Una
 * escritura fallida no puede tumbar un entrenamiento a medias, así que se
 * degrada a memoria y la app sigue funcionando: se perderá al cerrar, pero no
 * se pierde la sesión en curso.
 */
export function createBrowserStore(): KeyValueStore {
  const fallback = createMemoryStore();
  let usable = true;

  try {
    const probe = '__mfw_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
  } catch {
    usable = false;
  }

  if (!usable) return fallback;

  return {
    get: (key) => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return fallback.get(key);
      }
    },
    set: (key, value) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        fallback.set(key, value);
      }
    },
    remove: (key) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        fallback.remove(key);
      }
    },
    keys: () => {
      try {
        return Object.keys(window.localStorage);
      } catch {
        return fallback.keys();
      }
    },
  };
}

export const STORAGE_KEYS = {
  /** Perfiles, ajustes y sesiones terminadas. Se escribe con retardo. */
  state: 'mfw:state',
  /** La sesión en curso, aparte: se escribe en cada serie y debe ser barata. */
  activeSession: 'mfw:active-session',
  /** Prefijo de los datos que no se pudieron leer y se apartaron sin borrarlos. */
  quarantinePrefix: 'mfw:quarantine:',
} as const;
