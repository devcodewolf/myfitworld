/**
 * Perfiles y el estado completo: lo que exporta e importa Ajustes.
 *
 * `restoreState` es **la acción más destructiva del proyecto**: reemplaza todo
 * lo que tienes guardado. Por eso borra y escribe dentro de una transacción —o
 * queda todo el estado nuevo, o queda intacto el viejo, nunca la mitad de cada
 * uno— y por eso todo lo que entra se reescribe con el `userId` de quien llama,
 * ignorando el que trajera el archivo.
 */
import { defineAction } from 'astro:actions';
import { asc, eq } from 'drizzle-orm';

import {
  STORAGE_SCHEMA_VERSION,
  StoredStateV1Schema,
  type Profile,
  type SessionLog,
  type Settings,
  type StoredState,
} from '@/core/model';
import { db } from '@/db';
import {
  profileToRow,
  rowToProfile,
  rowToSession,
  rowToSettings,
  sessionToRow,
  settingsToRow,
} from '@/db/mappers';
import { profiles, settings as settingsTable, workoutSessions } from '@/db/schema';
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

export const getSnapshot = defineAction({
  handler: async (_input, context): Promise<StoredState> => {
    const userId = requireUserId(context);

    const [profileRows, sessionRows, settingsRows] = await Promise.all([
      db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .orderBy(asc(profiles.createdAt)),
      db
        .select({ payload: workoutSessions.payload, schemaVersion: workoutSessions.schemaVersion })
        .from(workoutSessions)
        .where(eq(workoutSessions.userId, userId))
        .orderBy(asc(workoutSessions.startedAt)),
      db
        .select({ data: settingsTable.data, schemaVersion: settingsTable.schemaVersion })
        .from(settingsTable)
        .where(eq(settingsTable.userId, userId)),
    ]);

    // Una fila ilegible no puede impedir que te lleves el resto de la copia.
    const readAll = <TRow, TOut>(rows: readonly TRow[], read: (row: TRow) => TOut): TOut[] => {
      const out: TOut[] = [];
      for (const row of rows) {
        try {
          out.push(read(row));
        } catch (error) {
          console.error('[copia] fila ilegible, se omite:', error);
        }
      }
      return out;
    };

    return {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      profiles: readAll<(typeof profileRows)[number], Profile>(profileRows, rowToProfile),
      sessions: readAll<(typeof sessionRows)[number], SessionLog>(sessionRows, rowToSession),
      settings: readAll<(typeof settingsRows)[number], Settings>(settingsRows, rowToSettings),
    };
  },
});

export const restoreState = defineAction({
  input: StoredStateV1Schema,
  handler: async (state, context) => {
    const userId = requireUserId(context);

    await db.transaction(async (tx) => {
      // El orden importa: las sesiones y los ajustes apuntan a los perfiles.
      await tx.delete(workoutSessions).where(eq(workoutSessions.userId, userId));
      await tx.delete(settingsTable).where(eq(settingsTable.userId, userId));
      await tx.delete(profiles).where(eq(profiles.userId, userId));

      if (state.profiles.length > 0) {
        await tx.insert(profiles).values(state.profiles.map((item) => profileToRow(item, userId)));
      }

      // Un perfil al que apunte una sesión y que no venga en el archivo haría
      // fallar la clave ajena a mitad de la transacción. Se filtran antes.
      const known = new Set(state.profiles.map((item) => item.id));
      const sessions = state.sessions.filter((item) => known.has(item.profileId));
      const settingsIn = state.settings.filter((item) => known.has(item.profileId));

      if (sessions.length > 0) {
        await tx.insert(workoutSessions).values(sessions.map((item) => sessionToRow(item, userId)));
      }
      if (settingsIn.length > 0) {
        await tx
          .insert(settingsTable)
          .values(settingsIn.map((item) => settingsToRow(item, userId)));
      }
    });

    return null;
  },
});
