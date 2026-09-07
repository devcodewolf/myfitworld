/**
 * Los ajustes: material declarado, descansos, sonido, peso corporal.
 *
 * Uno por perfil, así que la clave primaria es el perfil y guardar es siempre
 * un «inserta o actualiza». El `profileId` y el `updatedAt` los pone el
 * servidor: son suyos, no del cliente.
 */
import { defineAction } from 'astro:actions';
import { and, eq } from 'drizzle-orm';

import { SettingsSchema, STORAGE_SCHEMA_VERSION, type Settings } from '@/core/model';
import { rowToSettings, settingsToRow } from '@/db/mappers';
import { settings as settingsTable } from '@/db/schema';
import { ensureProfile, withUser, type Tx } from '@/actions/context';

/** Lo que el cliente puede cambiar: todo menos de quién son y cuándo se tocaron. */
const PatchSchema = SettingsSchema.partial().omit({ profileId: true, updatedAt: true });

/**
 * Los ajustes de un perfil, creándolos con los valores por defecto la primera
 * vez.
 */
async function readOrCreate(tx: Tx, userId: string, profileId: string): Promise<Settings> {
  const rows = await tx
    .select({ data: settingsTable.data, schemaVersion: settingsTable.schemaVersion })
    .from(settingsTable)
    .where(and(eq(settingsTable.profileId, profileId), eq(settingsTable.userId, userId)))
    .limit(1);

  const found = rows[0];
  if (found) return rowToSettings(found);

  // Los valores por defecto los pone el propio esquema Zod: no hay una segunda
  // lista de valores iniciales que se pueda desincronizar de la primera.
  const fresh = SettingsSchema.parse({ profileId, updatedAt: new Date().toISOString() });
  await tx.insert(settingsTable).values(settingsToRow(fresh, userId)).onConflictDoNothing();
  return fresh;
}

export const getSettings = defineAction({
  handler: async (_input, context) =>
    withUser(context, async (tx, userId) => {
      const profile = await ensureProfile(tx, userId);
      return readOrCreate(tx, userId, profile.id);
    }),
});

export const saveSettings = defineAction({
  input: PatchSchema,
  handler: async (patch, context) =>
    withUser(context, async (tx, userId) => {
      const profile = await ensureProfile(tx, userId);
      const current = await readOrCreate(tx, userId, profile.id);

      const updated = SettingsSchema.parse({
        ...current,
        ...patch,
        profileId: profile.id,
        updatedAt: new Date().toISOString(),
      });

      await tx
        .insert(settingsTable)
        .values(settingsToRow(updated, userId))
        .onConflictDoUpdate({
          target: settingsTable.profileId,
          set: {
            data: updated,
            schemaVersion: STORAGE_SCHEMA_VERSION,
            updatedAt: new Date(updated.updatedAt),
          },
          setWhere: eq(settingsTable.userId, userId),
        });

      return updated;
    }),
});
