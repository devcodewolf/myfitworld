/**
 * Los perfiles.
 *
 * Aquí vivían también `snapshot` y `restore`, que exportaban e importaban el
 * estado entero. Se fueron con los botones de copia en JSON: tu entreno vive en
 * la base y las copias son las del servidor. `restore` además era la acción más
 * destructiva del proyecto —reemplazaba todo lo guardado— y no la echa de menos
 * nadie.
 */
import { defineAction } from 'astro:actions';
import { asc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { rowToProfile } from '@/db/mappers';
import { profiles } from '@/db/schema';
import { ensureProfile, requireUserId } from '@/actions/context';

export const getActiveProfile = defineAction({
  handler: async (_input, context) => ensureProfile(requireUserId(context)),
});

export const listProfiles = defineAction({
  handler: async (_input, context) => {
    const userId = requireUserId(context);
    // `ensureProfile` primero: listar no debería ser la única operación que
    // devuelve vacío en una cuenta recién creada.
    await ensureProfile(userId);
    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .orderBy(asc(profiles.createdAt));
    return rows.map(rowToProfile);
  },
});
