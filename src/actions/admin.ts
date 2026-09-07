/**
 * Administración de cuentas.
 *
 * Las pantallas **no llaman a los endpoints del plugin `admin`**, aunque estén
 * publicados bajo `/api/auth/admin/*`. Pasan por aquí, y aquí se comprueba
 * quién eres antes de delegar en Better Auth. Un solo transporte para todo lo
 * que hace la app, y un solo sitio donde mirar quién puede qué.
 *
 * ── LO QUE UN ADMIN NO PUEDE HACER ────────────────────────────────────────
 * Leer el entreno de otro. Las políticas de `drizzle/0001_rls.sql` no tienen
 * excepción para administradores: sus consultas se declaran con SU id, así que
 * las filas de los demás no existen para él. La única forma es suplantar, que
 * emite una sesión a nombre del otro y **deja firma** en `impersonatedBy`.
 *
 * ── LA PAPELERA ───────────────────────────────────────────────────────────
 * Borrar una cuenta de verdad arrastra en cascada su perfil, sus ajustes y
 * todo su historial. No se deshace y no hay copia en ningún navegador. Por eso
 * `trash` solo marca una fecha: la cuenta deja de poder entrar y no pierde
 * nada. `removeForever` es el segundo acto, deliberado, desde la papelera.
 */
import { ActionError, defineAction, type ActionAPIContext } from 'astro:actions';
import { and, asc, eq, isNotNull, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { auth, isAdminUser } from '@/auth';
import { MIN_PASSWORD_LENGTH } from '@/auth-contract';
import { db } from '@/db';
import { user as userTable } from '@/db/auth-schema';

/** El rol es una lista separada por comas; `admin` puede venir acompañado. */
function hasAdminRole(role: string | null | undefined): boolean {
  return (role ?? '')
    .split(',')
    .map((r) => r.trim())
    .includes('admin');
}

/** Quién llama, y que sea administrador. */
function requireAdmin(context: ActionAPIContext): string {
  const caller = context.locals.user;
  if (!caller) {
    throw new ActionError({ code: 'UNAUTHORIZED', message: 'Hay que entrar para hacer esto.' });
  }
  if (isAdminUser(caller)) return caller.id;

  // NOT_FOUND y no FORBIDDEN: para quien no es admin, esto no existe. Un
  // «prohibido» confirma que hay algo detrás; un «no existe», no.
  throw new ActionError({ code: 'NOT_FOUND', message: 'No existe.' });
}

/** Nadie se quita a sí mismo de en medio sin querer. */
function refuseSelf(callerId: string, targetId: string, quePasaria: string): void {
  if (callerId === targetId) {
    throw new ActionError({ code: 'BAD_REQUEST', message: quePasaria });
  }
}

/** Lo que la pantalla necesita saber de una cuenta. */
const ACCOUNT_COLUMNS = {
  id: userTable.id,
  name: userTable.name,
  email: userTable.email,
  role: userTable.role,
  banned: userTable.banned,
  banReason: userTable.banReason,
  createdAt: userTable.createdAt,
  deletedAt: userTable.deletedAt,
} as const;

export const listAccounts = defineAction({
  input: z.object({ trashed: z.boolean().default(false) }),
  handler: async ({ trashed }, context) => {
    requireAdmin(context);
    const rows = await db
      .select(ACCOUNT_COLUMNS)
      .from(userTable)
      .where(trashed ? isNotNull(userTable.deletedAt) : isNull(userTable.deletedAt))
      .orderBy(asc(userTable.createdAt));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: hasAdminRole(row.role) ? 'admin' : 'user',
      banned: row.banned ?? false,
      banReason: row.banReason,
      createdAt: row.createdAt.toISOString(),
      deletedAt: row.deletedAt?.toISOString() ?? null,
    }));
  },
});

export const createAccount = defineAction({
  input: z.object({
    email: z.email(),
    name: z.string().min(1).max(40),
    password: z.string().min(MIN_PASSWORD_LENGTH),
    role: z.enum(['user', 'admin']).default('user'),
  }),
  handler: async ({ email, name, password, role }, context) => {
    requireAdmin(context);
    // Sin código de invitación: crear cuentas es justo lo que puede hacer un
    // admin, y el código existe para el registro abierto, no para esto.
    await auth.api.createUser({
      body: { email, name, password, role },
      headers: context.request.headers,
    });
    return null;
  },
});

export const setRole = defineAction({
  input: z.object({ userId: z.string(), role: z.enum(['user', 'admin']) }),
  handler: async ({ userId, role }, context) => {
    const callerId = requireAdmin(context);
    refuseSelf(callerId, userId, 'No puedes cambiarte el rol a ti mismo.');
    await auth.api.setRole({ body: { userId, role }, headers: context.request.headers });
    return null;
  },
});

export const setPassword = defineAction({
  input: z.object({ userId: z.string(), password: z.string().min(MIN_PASSWORD_LENGTH) }),
  handler: async ({ userId, password }, context) => {
    requireAdmin(context);
    await auth.api.setUserPassword({
      body: { userId, newPassword: password },
      headers: context.request.headers,
    });
    return null;
  },
});

export const banAccount = defineAction({
  input: z.object({ userId: z.string(), reason: z.string().max(200).optional() }),
  handler: async ({ userId, reason }, context) => {
    const callerId = requireAdmin(context);
    refuseSelf(callerId, userId, 'No puedes suspenderte a ti mismo.');
    await auth.api.banUser({
      body: { userId, ...(reason ? { banReason: reason } : {}) },
      headers: context.request.headers,
    });
    return null;
  },
});

export const unbanAccount = defineAction({
  input: z.object({ userId: z.string() }),
  handler: async ({ userId }, context) => {
    requireAdmin(context);
    await auth.api.unbanUser({ body: { userId }, headers: context.request.headers });
    return null;
  },
});

export const trashAccount = defineAction({
  input: z.object({ userId: z.string() }),
  handler: async ({ userId }, context) => {
    const callerId = requireAdmin(context);
    refuseSelf(callerId, userId, 'No puedes mandarte a la papelera a ti mismo.');

    await db
      .update(userTable)
      .set({ deletedAt: new Date() })
      .where(and(eq(userTable.id, userId), isNull(userTable.deletedAt)));

    // Si estaba dentro, que salga: la cuenta ya no puede entrar, pero una
    // sesión abierta seguiría funcionando hasta caducar.
    await auth.api.revokeUserSessions({ body: { userId }, headers: context.request.headers });
    return null;
  },
});

export const restoreAccount = defineAction({
  input: z.object({ userId: z.string() }),
  handler: async ({ userId }, context) => {
    requireAdmin(context);
    await db.update(userTable).set({ deletedAt: null }).where(eq(userTable.id, userId));
    return null;
  },
});

export const removeForever = defineAction({
  input: z.object({ userId: z.string() }),
  handler: async ({ userId }, context) => {
    const callerId = requireAdmin(context);
    refuseSelf(callerId, userId, 'No puedes borrarte a ti mismo.');

    // Solo desde la papelera. Que el borrado irreversible exija dos pasos en
    // momentos distintos es toda la protección que hay: en cascada se van el
    // perfil, los ajustes y el historial entero, y no hay de dónde sacarlos.
    const rows = await db
      .select({ deletedAt: userTable.deletedAt })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (rows.length === 0) {
      throw new ActionError({ code: 'NOT_FOUND', message: 'Esa cuenta no existe.' });
    }
    if (rows[0]?.deletedAt == null) {
      throw new ActionError({
        code: 'BAD_REQUEST',
        message: 'Primero hay que mandarla a la papelera.',
      });
    }

    await auth.api.removeUser({ body: { userId }, headers: context.request.headers });
    return null;
  },
});
