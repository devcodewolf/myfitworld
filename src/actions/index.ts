/**
 * Las acciones del servidor: el transporte del repositorio remoto.
 *
 * Astro las publica bajo `/_actions/...` y valida la entrada con los mismos
 * esquemas Zod de `core/model.ts` que usa el navegador. No hay una API escrita
 * a mano ni un segundo juego de tipos que mantener al día.
 *
 * **Ninguna acepta un `userId` por parámetro.** Sale siempre de la sesión, en
 * `src/actions/context.ts`. Es la única defensa que hay: sin RLS en Postgres,
 * una acción que se olvide de filtrar deja los datos de todos a la vista.
 */
import {
  completeActiveSession,
  deleteSession,
  discardActiveSession,
  getActiveSession,
  getSession,
  listSessions,
  saveActiveSession,
} from '@/actions/sessions';
import { getSettings, saveSettings } from '@/actions/settings';
import {
  banAccount,
  createAccount,
  listAccounts,
  removeForever,
  restoreAccount,
  setPassword,
  setRole,
  trashAccount,
  unbanAccount,
} from '@/actions/admin';
import { getActiveProfile, listProfiles } from '@/actions/profiles';

export const server = {
  sessions: {
    list: listSessions,
    get: getSession,
    getActive: getActiveSession,
    saveActive: saveActiveSession,
    completeActive: completeActiveSession,
    discardActive: discardActiveSession,
    remove: deleteSession,
  },
  settings: {
    get: getSettings,
    save: saveSettings,
  },
  profiles: {
    getActive: getActiveProfile,
    list: listProfiles,
  },
  /**
   * Administración de cuentas. Todas comprueban que quien llama sea admin
   * antes de nada, y responden `NOT_FOUND` a quien no lo sea: para el resto de
   * la gente, esto no existe.
   */
  admin: {
    list: listAccounts,
    create: createAccount,
    setRole,
    setPassword,
    ban: banAccount,
    unban: unbanAccount,
    trash: trashAccount,
    restore: restoreAccount,
    removeForever,
  },
};
