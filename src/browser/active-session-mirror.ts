/**
 * El espejo de la sesión en curso en el navegador.
 *
 * Existe por una razón concreta: **la pantalla de entreno guarda en cada serie
 * que marcas, y no captura errores.** Con `localStorage` eso nunca falló. Con
 * el servidor detrás, un parpadeo de wifi en mitad del entreno lanzaría desde
 * `persist()` y rompería la sesión entera.
 *
 * Así que se escribe primero aquí —barato y no falla nunca— y después se
 * intenta subir. Si la subida falla, la serie ya está a salvo y el espejo queda
 * marcado como pendiente; el siguiente envío que salga bien la arrastra, porque
 * cada guardado manda la sesión completa y no un incremento.
 *
 * **Esto no es sincronización.** Es una sola dirección: el navegador nunca
 * inventa datos que el servidor no vaya a tener. Solo cubre el hueco entre que
 * marcas una serie y que el servidor se entera.
 */
import { SessionLogSchema, type SessionLog } from '@/core/model';
import { STORAGE_KEYS, type KeyValueStore } from '@/storage/kv';
import { z } from 'zod';

const MirrorSchema = z.object({
  session: SessionLogSchema,
  /** ¿La tiene ya el servidor tal cual está aquí? */
  synced: z.boolean(),
});

export type Mirror = z.infer<typeof MirrorSchema>;

export interface ActiveSessionMirror {
  read(): Mirror | null;
  write(session: SessionLog, synced: boolean): void;
  clear(): void;
}

export function createActiveSessionMirror(store: KeyValueStore): ActiveSessionMirror {
  const key = STORAGE_KEYS.remoteActiveSession;

  return {
    read() {
      const raw = store.get(key);
      if (raw === null) return null;
      try {
        const parsed = MirrorSchema.safeParse(JSON.parse(raw));
        // Un espejo ilegible se tira sin ruido: la verdad está en el servidor y
        // es de donde se va a releer. Aquí no hay nada que apartar en cuarentena.
        if (!parsed.success) {
          store.remove(key);
          return null;
        }
        return parsed.data;
      } catch {
        store.remove(key);
        return null;
      }
    },

    write(session, synced) {
      store.set(key, JSON.stringify({ session, synced }));
    },

    clear() {
      store.remove(key);
    },
  };
}
