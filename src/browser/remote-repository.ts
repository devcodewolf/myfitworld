/**
 * El repositorio contra el servidor.
 *
 * Implementa exactamente la misma interfaz que `createLocalRepository`, así que
 * las seis pantallas que lo consumen no se enteran del cambio. Por dentro, cada
 * operación es una acción de Astro contra Postgres.
 *
 * Dos reglas gobiernan este archivo:
 *
 * 1. **Lo que llega del servidor se valida con Zod.** Una respuesta de red es
 *    dato tan poco confiable como uno de `localStorage`; que lo haya escrito
 *    nuestro propio servidor no lo convierte en verdad. Es la misma lección de
 *    `storage/document.ts`.
 * 2. **La sesión en curso se escribe antes en el navegador que en el servidor.**
 *    Ver `active-session-mirror.ts`: la pantalla de entreno no captura errores,
 *    y una serie marcada no se puede perder por un parpadeo de wifi.
 *
 * El resto de lecturas no se cachean: van al servidor cada vez. Pintar al
 * instante con lo último visto exigiría que las pantallas supieran refrescarse
 * después, y son justo las que este paso no toca.
 */
import { actions } from 'astro:actions';
import { z } from 'zod';

import {
  ProfileSchema,
  SessionLogSchema,
  SettingsSchema,
  StoredStateV1Schema,
  type Profile,
  type SessionLog,
  type StoredState,
} from '@/core/model';
import { createActiveSessionMirror } from '@/browser/active-session-mirror';
import type { ReadStatus } from '@/storage/document';
import type { KeyValueStore } from '@/storage/kv';
import type { AppRepository, SessionQuery } from '@/storage/repository';

/** Lo que devuelve una acción de Astro: o dato, o error, nunca las dos cosas. */
type ActionResult =
  { data: unknown; error: undefined } | { data: undefined; error: { message: string } };

/**
 * El servidor contestó, y contestó que no.
 *
 * Se distingue de un fallo de red porque **no tiene sentido reintentarla**: si
 * ya tienes otra sesión a medias, la tendrás igual dentro de diez segundos.
 * Sin esta distinción, un rechazo permanente se confundiría con un parpadeo de
 * wifi y el navegador lo reintentaría en cada lectura para siempre.
 */
export class ServerRefusal extends Error {}

/**
 * Llama a una acción y valida lo que vuelve.
 *
 * Lanza en los dos casos en que no hay respuesta buena: que el servidor
 * conteste un error, y que conteste algo que no encaja con el esquema. Lo
 * segundo no debería pasar nunca, y precisamente por eso hay que enterarse
 * cuando pase, en vez de colar un objeto a medias hacia el dominio.
 */
async function call<TIn, TOut>(
  // El tipo de entrada se toma de la propia acción, así que una llamada con la
  // forma equivocada no compila. Es lo que se gana con Astro Actions en vez de
  // una API a mano: los dos lados comparten el mismo esquema Zod.
  action: (input: TIn) => Promise<ActionResult>,
  input: TIn,
  schema: z.ZodType<TOut>,
): Promise<TOut> {
  const result = await action(input);
  if (result.error) throw new ServerRefusal(result.error.message);

  const parsed = schema.safeParse(result.data);
  if (!parsed.success) {
    throw new Error(`El servidor devolvió algo que no encaja: ${parsed.error.message}`);
  }
  return parsed.data;
}

const SessionListSchema = z.array(SessionLogSchema);
const ProfileListSchema = z.array(ProfileSchema);
const NullableSessionSchema = SessionLogSchema.nullable();

export interface RemoteRepositoryDeps {
  /** Solo para el espejo de la sesión en curso. Nada más se guarda aquí. */
  readonly store: KeyValueStore;
  readonly now: () => string;
}

export function createRemoteRepository({ store, now }: RemoteRepositoryDeps): AppRepository {
  const mirror = createActiveSessionMirror(store);
  let status: ReadStatus = 'empty';

  /**
   * Sube lo que quedó pendiente por un fallo de red.
   *
   * Se llama antes de cada lectura: si la última serie no llegó a subir, el
   * historial que estás a punto de mirar no puede salir sin ella. Falla en
   * silencio a propósito —sigue pendiente y se reintentará— porque quien
   * llamaba pedía otra cosa y no se le puede romper la pantalla por esto.
   */
  const flush = async (): Promise<void> => {
    const pending = mirror.read();
    if (!pending || pending.synced) return;

    try {
      const uploaded = await call(
        actions.sessions.saveActive,
        { ...pending.session, status: 'in_progress' as const },
        SessionLogSchema,
      );

      if (pending.session.status === 'completed' && pending.session.finishedAt) {
        await call(
          actions.sessions.completeActive,
          { finishedAt: pending.session.finishedAt },
          NullableSessionSchema,
        );
        mirror.clear();
        return;
      }
      mirror.write(uploaded, true);
    } catch (error) {
      // Sigue pendiente. El próximo intento la arrastra: cada envío manda la
      // sesión entera, no lo que cambió desde el anterior.
      //
      // Salvo que el servidor la haya rechazado: eso no se arregla esperando,
      // y hay que poder verlo. No se descarta igualmente —perder un entreno es
      // peor que reintentar de más— pero deja de ser silencioso.
      if (error instanceof ServerRefusal) {
        console.error('[sesión] el servidor rechazó la sesión pendiente:', error.message);
      }
    }
  };

  const sessions: AppRepository['sessions'] = {
    async listSessions(query: SessionQuery = {}) {
      await flush();
      const list = await call(actions.sessions.list, query, SessionListSchema);
      status = 'ok';
      return list;
    },

    async getSession(id) {
      return call(actions.sessions.get, { id }, NullableSessionSchema);
    },

    async getActiveSession() {
      await flush();

      let remote: SessionLog | null;
      try {
        remote = await call(actions.sessions.getActive, undefined, NullableSessionSchema);
      } catch {
        // Servidor inalcanzable: lo que haya en el espejo es lo mejor que hay.
        return mirror.read()?.session ?? null;
      }

      const local = mirror.read();

      // El servidor dice que no hay ninguna, y lo dice pudiendo hablar. Si el
      // espejo aún guarda algo sin subir, `flush()` ya lo intentó y falló, así
      // que se conserva; si estaba subido, es que se cerró en otro sitio.
      if (remote === null) {
        if (local && !local.synced) return local.session;
        mirror.clear();
        return null;
      }

      // La misma sesión en los dos lados: gana la marca de tiempo más reciente.
      // El espejo puede ir por delante porque es el buffer de escritura.
      if (local && local.session.id === remote.id && local.session.updatedAt > remote.updatedAt) {
        return local.session;
      }

      mirror.write(remote, true);
      return remote;
    },

    async saveActiveSession(session) {
      const optimistic: SessionLog = { ...session, status: 'in_progress', updatedAt: now() };
      // Primero al espejo: es lo que garantiza que la serie no se pierda.
      mirror.write(optimistic, false);

      try {
        const saved = await call(actions.sessions.saveActive, session, SessionLogSchema);
        mirror.write(saved, true);
        return saved;
      } catch (error) {
        // No se propaga: la pantalla de entreno no captura, y romper el
        // entrenamiento es peor que ir con retraso. Se reintenta al siguiente.
        if (error instanceof ServerRefusal) {
          console.error('[sesión] el servidor rechazó el guardado:', error.message);
        }
        return optimistic;
      }
    },

    async completeActiveSession(finishedAt) {
      try {
        const done = await call(
          actions.sessions.completeActive,
          { finishedAt },
          NullableSessionSchema,
        );
        mirror.clear();
        return done;
      } catch {
        const local = mirror.read();
        if (!local) {
          throw new Error('No se pudo cerrar la sesión y no hay copia en este navegador.');
        }

        // Se marca terminada en el espejo y se deja pendiente. La próxima
        // lectura la sube entera, incluido el cierre.
        const completed: SessionLog = {
          ...local.session,
          status: 'completed',
          finishedAt,
          updatedAt: now(),
        };
        mirror.write(completed, false);
        return completed;
      }
    },

    async discardActiveSession() {
      mirror.clear();
      await call(actions.sessions.discardActive, undefined, z.null());
    },

    async deleteSession(id) {
      await call(actions.sessions.remove, { id }, z.null());
    },
  };

  const settings: AppRepository['settings'] = {
    async get() {
      const value = await call(actions.settings.get, undefined, SettingsSchema);
      status = 'ok';
      return value;
    },

    async save(patch) {
      // De quién son y cuándo se tocaron lo decide el servidor, no el cliente.
      const { profileId: _profileId, updatedAt: _updatedAt, ...rest } = patch;
      return call(actions.settings.save, rest, SettingsSchema);
    },
  };

  const profiles: AppRepository['profiles'] = {
    async getActive(): Promise<Profile> {
      return call(actions.profiles.getActive, undefined, ProfileSchema);
    },
    async list() {
      return call(actions.profiles.list, undefined, ProfileListSchema);
    },
  };

  return {
    sessions,
    settings,
    profiles,

    async snapshot(): Promise<StoredState> {
      await flush();
      const state = await call(actions.state.snapshot, undefined, StoredStateV1Schema);
      status = 'ok';
      return state;
    },

    async restore(state) {
      await call(actions.state.restore, StoredStateV1Schema.parse(state), z.null());
      // El espejo hablaba del estado anterior. Después de reemplazarlo todo, lo
      // que dijera ya no significa nada.
      mirror.clear();
    },

    lastReadStatus: () => status,
  };
}
