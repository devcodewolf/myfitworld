/**
 * La persistencia, contra el servidor.
 *
 * Cada operación del contrato es una acción de Astro contra Postgres. La regla
 * que gobierna el archivo: **lo que llega del servidor se valida con Zod**. Una
 * respuesta de red es dato tan poco confiable como uno de un archivo; que lo
 * haya escrito nuestro propio servidor no lo convierte en verdad.
 *
 * **No hay caché ni copia en el navegador.** El servidor es el único sitio
 * donde vive tu entreno. Un fallo de red se nota: la pantalla que lo pidió se
 * entera y lo dice, en vez de fingir que guardó.
 */
import { actions } from 'astro:actions';
import { z } from 'zod';

import { ProfileSchema, SessionLogSchema, SettingsSchema, type Profile } from '@/core/model';
import type { AppRepository, SessionQuery } from '@/repository/contract';

/** Lo que devuelve una acción de Astro: o dato, o error, nunca las dos cosas. */
type ActionResult =
  { data: unknown; error: undefined } | { data: undefined; error: { message: string } };

/**
 * El servidor contestó, y contestó que no.
 *
 * Se distingue de un fallo de red porque significan cosas distintas para quien
 * está delante: «no puedes hacer eso» no se arregla volviendo a intentarlo, y
 * «no llego al servidor» sí.
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

export function createRemoteRepository(): AppRepository {
  const sessions: AppRepository['sessions'] = {
    async listSessions(query: SessionQuery = {}) {
      return call(actions.sessions.list, query, SessionListSchema);
    },

    async getSession(id) {
      return call(actions.sessions.get, { id }, NullableSessionSchema);
    },

    async getActiveSession() {
      return call(actions.sessions.getActive, undefined, NullableSessionSchema);
    },

    async saveActiveSession(session) {
      return call(actions.sessions.saveActive, session, SessionLogSchema);
    },

    async completeActiveSession(finishedAt) {
      return call(actions.sessions.completeActive, { finishedAt }, NullableSessionSchema);
    },

    async discardActiveSession() {
      await call(actions.sessions.discardActive, undefined, z.null());
    },

    async deleteSession(id) {
      await call(actions.sessions.remove, { id }, z.null());
    },
  };

  const settings: AppRepository['settings'] = {
    async get() {
      return call(actions.settings.get, undefined, SettingsSchema);
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

  return { sessions, settings, profiles };
}
