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

import { rowToProfile } from '@/db/mappers';
import { profiles } from '@/db/schema';
import { ensureProfile, withUser } from '@/actions/context';

export const getActiveProfile = defineAction({
  handler: async (_input, context) => withUser(context, (tx, userId) => ensureProfile(tx, userId)),
});

export const listProfiles = defineAction({
  handler: async (_input, context) =>
    withUser(context, async (tx, userId) => {
      // `ensureProfile` primero: listar no debería ser la única operación que
      // devuelve vacío en una cuenta recién creada.
      await ensureProfile(tx, userId);
      const rows = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .orderBy(asc(profiles.createdAt));
      return rows.map(rowToProfile);
    }),
});
