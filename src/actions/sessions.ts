/**
 * Las sesiones de entrenamiento, contra Postgres.
 *
 * Traduce una a una las operaciones de `WorkoutLogRepository`. Dos cosas que no
 * se ven en las firmas:
 *
 * - **La sesión en curso no vive en una clave aparte** como en `localStorage`,
 *   sino en la misma tabla con `status = 'in_progress'`. El índice único
 *   parcial de la base garantiza que no haya dos a la vez, y esa garantía es
 *   más fuerte que la que daba una clave del navegador.
 * - **El `profileId` que manda el cliente no se cree.** Se sustituye por el del
 *   perfil real de quien llama. Si no, bastaría con retocar el JSON para
 *   escribir dentro del perfil de otro.
 */
import { ActionError, defineAction } from 'astro:actions';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { SessionLogSchema, SessionStatusSchema, type SessionLog } from '@/core/model';
import { db } from '@/db';
import { rowToSession, sessionToRow } from '@/db/mappers';
import { workoutSessions } from '@/db/schema';
import { currentUserId, ensureProfile, requireUserId } from '@/actions/context';

const QuerySchema = z
  .object({
    mesocycleId: z.string().optional(),
    weekOrder: z.number().int().optional(),
    dayOrder: z.number().int().optional(),
    status: SessionStatusSchema.optional(),
    profileId: z.string().optional(),
    limit: z.number().int().positive().optional(),
  })
  .optional();

/**
 * Fila → sesión, saltándose lo que no se pueda leer.
 *
 * Una fila escrita por una versión anterior que ya no valide no puede tumbar el
 * historial entero. Es la misma decisión que la cuarentena de
 * `storage/document.ts`: no se borra nada, se aparta y se sigue.
 */
function toSessions(
  rows: ReadonlyArray<{ payload: unknown; schemaVersion: number }>,
): SessionLog[] {
  const out: SessionLog[] = [];
  for (const row of rows) {
    try {
      out.push(rowToSession(row));
    } catch (error) {
      console.error('[sesiones] fila ilegible, se omite:', error);
    }
  }
  return out;
}

/** El índice `workout_sessions_one_active_idx`, visto desde el error de Postgres. */
function isSingleActiveViolation(error: unknown): boolean {
  const cause = error instanceof Error && 'cause' in error ? error.cause : error;
  const code = (cause as { code?: unknown } | null)?.code;
  const constraint = (cause as { constraint?: unknown } | null)?.constraint;
  return code === '23505' && constraint === 'workout_sessions_one_active_idx';
}

export const listSessions = defineAction({
  input: QuerySchema,
  /**
   * **La única acción que no exige sesión.** La ficha de ejercicio es pública y
   * pide el historial para enseñar con qué pesos lo hiciste; para quien no ha
   * entrado la respuesta correcta es «nada», no un error en una página abierta.
   */
  handler: async (query, context) => {
    const userId = currentUserId(context);
    if (userId === null) return [];

    const where = [eq(workoutSessions.userId, userId)];
    if (query?.mesocycleId) where.push(eq(workoutSessions.mesocycleId, query.mesocycleId));
    if (query?.weekOrder !== undefined) where.push(eq(workoutSessions.weekOrder, query.weekOrder));
    if (query?.dayOrder !== undefined) where.push(eq(workoutSessions.dayOrder, query.dayOrder));
    if (query?.status) where.push(eq(workoutSessions.status, query.status));
    if (query?.profileId) where.push(eq(workoutSessions.profileId, query.profileId));

    const rows = await db
      .select({ payload: workoutSessions.payload, schemaVersion: workoutSessions.schemaVersion })
      .from(workoutSessions)
      .where(and(...where))
      .orderBy(desc(workoutSessions.startedAt))
      .limit(query?.limit ?? 500);

    return toSessions(rows);
  },
});

export const getSession = defineAction({
  input: z.object({ id: z.string() }),
  handler: async ({ id }, context) => {
    const userId = requireUserId(context);
    const rows = await db
      .select({ payload: workoutSessions.payload, schemaVersion: workoutSessions.schemaVersion })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId)))
      .limit(1);
    return toSessions(rows)[0] ?? null;
  },
});

export const getActiveSession = defineAction({
  handler: async (_input, context) => {
    const userId = requireUserId(context);
    const rows = await db
      .select({ payload: workoutSessions.payload, schemaVersion: workoutSessions.schemaVersion })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.status, 'in_progress')))
      .limit(1);
    return toSessions(rows)[0] ?? null;
  },
});

export const saveActiveSession = defineAction({
  input: SessionLogSchema,
  handler: async (session, context) => {
    const userId = requireUserId(context);
    const profile = await ensureProfile(userId);

    const updated: SessionLog = {
      ...session,
      profileId: profile.id,
      status: 'in_progress',
      updatedAt: new Date().toISOString(),
    };
    const row = sessionToRow(updated, userId);

    try {
      await db
        .insert(workoutSessions)
        .values(row)
        .onConflictDoUpdate({
          target: workoutSessions.id,
          set: {
            status: row.status,
            weekOrder: row.weekOrder,
            dayOrder: row.dayOrder,
            mesocycleId: row.mesocycleId,
            startedAt: row.startedAt,
            finishedAt: row.finishedAt,
            payload: row.payload,
            schemaVersion: row.schemaVersion,
            updatedAt: row.updatedAt,
          },
          // Que la fila exista no basta: tiene que ser tuya.
          setWhere: eq(workoutSessions.userId, userId),
        });
    } catch (error) {
      // El índice único parcial de la base salta si ya hay otra sesión en curso.
      // Sin esto sale un 500 con el error de Postgres dentro, que no le dice
      // nada a nadie; y el navegador lo tomaría por un fallo de red y lo
      // reintentaría para siempre.
      if (isSingleActiveViolation(error)) {
        throw new ActionError({
          code: 'CONFLICT',
          message: 'Ya tienes otra sesión a medias. Ciérrala o descártala antes de empezar otra.',
        });
      }
      throw error;
    }

    return updated;
  },
});

export const completeActiveSession = defineAction({
  input: z.object({ finishedAt: z.string() }),
  handler: async ({ finishedAt }, context) => {
    const userId = requireUserId(context);

    const rows = await db
      .select({ payload: workoutSessions.payload, schemaVersion: workoutSessions.schemaVersion })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.status, 'in_progress')))
      .limit(1);

    const active = toSessions(rows)[0];
    if (!active) return null;

    const completed: SessionLog = {
      ...active,
      status: 'completed',
      finishedAt,
      updatedAt: new Date().toISOString(),
    };
    const row = sessionToRow(completed, userId);

    await db
      .update(workoutSessions)
      .set({
        status: row.status,
        finishedAt: row.finishedAt,
        payload: row.payload,
        schemaVersion: row.schemaVersion,
        updatedAt: row.updatedAt,
      })
      .where(and(eq(workoutSessions.id, row.id), eq(workoutSessions.userId, userId)));

    return completed;
  },
});

export const discardActiveSession = defineAction({
  handler: async (_input, context) => {
    const userId = requireUserId(context);
    await db
      .delete(workoutSessions)
      .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.status, 'in_progress')));
    return null;
  },
});

export const deleteSession = defineAction({
  input: z.object({ id: z.string() }),
  handler: async ({ id }, context) => {
    const userId = requireUserId(context);
    const removed = await db
      .delete(workoutSessions)
      .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId)))
      .returning({ id: workoutSessions.id });

    // Borrar algo que no existe o que no es tuyo se cuenta igual: no confirmes
    // un borrado que no ha ocurrido.
    if (removed.length === 0) {
      throw new ActionError({ code: 'NOT_FOUND', message: 'Esa sesión no existe.' });
    }
    return null;
  },
});
