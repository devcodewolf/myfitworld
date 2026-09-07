/**
 * La configuración de Better Auth. El único sitio donde se decide cómo se
 * entra en la aplicación.
 *
 * Better Auth **no envía correos**. Lo que hace es llamarte a ti con el enlace
 * o el código ya generados, y tú decides por dónde salen. Hoy no hay proveedor
 * de correo, así que la verificación por email está apagada a propósito: una
 * verificación que nadie puede completar dejaría la cuenta inservible. El sitio
 * exacto donde engancharla está marcado más abajo.
 *
 * Las tablas que necesita (`user`, `session`, `account`, `verification`) las
 * genera su CLI contra este archivo y viven en `src/db/auth-schema.ts`.
 */
import { createHash, timingSafeEqual } from 'node:crypto';

import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins/admin';
import { eq } from 'drizzle-orm';

import { INVITE_HEADER, MIN_PASSWORD_LENGTH } from '@/auth-contract';
import { db } from '@/db';
import { user as userTable } from '@/db/auth-schema';
import * as authSchema from '@/db/auth-schema';

/**
 * El secreto con el que se firman las sesiones. Sin él, cualquiera podría
 * fabricarse una cookie válida, así que se exige en el arranque en vez de
 * dejar que la app levante con una autenticación de mentira.
 */
function secret(): string {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      'Falta BETTER_AUTH_SECRET, o es demasiado corto (mínimo 32 caracteres). ' +
        'Genera uno con: openssl rand -base64 32',
    );
  }
  return value;
}

/**
 * ¿Es válido el código que trae quien intenta registrarse?
 *
 * **Sin `SIGNUP_INVITE_CODE` configurado no se registra nadie.** Es
 * deliberado: un despliegue al que se le olvidó la variable debe quedarse con
 * la puerta cerrada, no abierta a internet.
 *
 * La comparación se hace sobre los resúmenes SHA-256, que siempre miden lo
 * mismo: así `timingSafeEqual` no necesita que las dos cadenas tengan igual
 * longitud y de paso no se filtra cuánto mide el código bueno.
 */
function inviteAccepted(given: string | null): boolean {
  const expected = process.env.SIGNUP_INVITE_CODE;
  if (!expected || !given) return false;
  const digest = (value: string): Buffer => createHash('sha256').update(value.trim()).digest();
  return timingSafeEqual(digest(given), digest(expected));
}

/**
 * Los correos que nacen siendo administradores.
 *
 * Resuelve el huevo y la gallina: la pantalla que asciende a la gente solo la
 * ve un admin, así que el primero no puede nombrarse desde dentro. Se pone esta
 * variable **antes** de desplegar, y quien se registre con uno de esos correos
 * ya entra siendo admin. Sin buscar ids, sin SQL en producción, sin redesplegar.
 *
 * A partir del primero, los demás se ascienden desde `/admin` y la lista deja
 * de hacer falta: la verdad de quién manda vive en la columna `role`.
 *
 * Se compara en minúsculas porque un correo no distingue mayúsculas y la lista
 * la escribe una persona a mano.
 */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/** ¿Este correo está en la lista de administradores del entorno? */
function isBootstrapAdmin(email: string): boolean {
  return adminEmails().includes(email.trim().toLowerCase());
}

/**
 * ¿Es administrador quien está delante?
 *
 * **Solo mira la columna `role`.** La lista del entorno no se consulta aquí: lo
 * que hace es escribir esa columna al crear la cuenta y al entrar. Así hay un
 * único sitio donde vive la verdad, y Better Auth —que hace sus propias
 * comprobaciones antes de banear o cambiar un rol— ve exactamente lo mismo que
 * nosotros. Con dos fuentes, nuestra pantalla habría dejado pasar a alguien a
 * quien la librería luego le habría dicho que no.
 *
 * Vive aquí porque quién manda es una decisión de autenticación, y este es el
 * único sitio donde se decide cómo se entra. Lo usan el middleware, las
 * acciones de administración y la barra de navegación.
 */
export function isAdminUser(user: { id: string; role?: string | null } | null): boolean {
  if (!user) return false;
  return (user.role ?? '')
    .split(',')
    .map((role) => role.trim())
    .includes('admin');
}

/**
 * Lo que hay que saber de una cuenta justo antes de dejarla entrar.
 *
 * Una sola consulta para dos cosas que ocurren en el mismo momento: comprobar
 * que no esté en la papelera, y reparar el rol si el correo está en la lista
 * del entorno pero la columna todavía no lo dice. Lo segundo cubre el caso de
 * añadir la variable **después** de haberse registrado; sin ello habría que
 * borrar la cuenta y volver a crearla, que es un consejo horrible.
 */
async function checkOnSignIn(email: string): Promise<{ trashed: boolean }> {
  const rows = await db
    .select({ id: userTable.id, role: userTable.role, deletedAt: userTable.deletedAt })
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

  const found = rows[0];
  if (!found) return { trashed: false };
  if (found.deletedAt != null) return { trashed: true };

  if (isBootstrapAdmin(email) && !isAdminUser(found)) {
    await db.update(userTable).set({ role: 'admin' }).where(eq(userTable.id, found.id));
  }
  return { trashed: false };
}

export const auth = betterAuth({
  secret: secret(),
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:4321',

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    /**
     * Apagado mientras no haya proveedor de correo. En cuanto lo haya, esto
     * pasa a `true` y se rellena `emailVerification.sendVerificationEmail`:
     * son dos líneas, no un rediseño.
     */
    requireEmailVerification: false,
  },

  // ── DONDE SE ENGANCHA EL CORREO ─────────────────────────────────────────
  // emailVerification: {
  //   sendOnSignUp: true,
  //   sendVerificationEmail: async ({ user, url }) => {
  //     // Sin `await`: esperar al proveedor filtra por tiempo si un correo
  //     // existe o no. Se dispara y se sigue.
  //     void enviarCorreo({ to: user.email, subject: 'Verifica tu correo', url });
  //   },
  // },
  // Y para entrar con código en vez de contraseña, el plugin `emailOTP`.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * La puerta del registro, y el **único** sitio donde se decide quién puede
   * tener cuenta.
   *
   * Va aquí y no en el formulario porque el formulario no es una puerta: el
   * endpoint `/api/auth/sign-up/email` está publicado y cualquiera puede
   * llamarlo con `curl`. Una comprobación que solo vive en el navegador es
   * decoración.
   *
   * Entrar no pasa por aquí: el código hace falta para crear la cuenta, no
   * para volver a ella.
   */
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // La puerta del registro.
      if (ctx.path === '/sign-up/email') {
        if (inviteAccepted(ctx.headers?.get(INVITE_HEADER) ?? null)) return;
        throw new APIError('FORBIDDEN', {
          message: 'Ese código de invitación no vale. Sin uno válido no se puede crear la cuenta.',
        });
      }

      /**
       * Una cuenta en la papelera no entra.
       *
       * El plugin `admin` ya impide entrar a una cuenta baneada, pero la
       * papelera es nuestra y no la conoce. Y el mensaje es el mismo que el de
       * una contraseña mala a propósito: decir «esa cuenta está borrada» le
       * confirma a cualquiera que existió.
       */
      if (ctx.path === '/sign-in/email') {
        const email = (ctx.body as { email?: unknown } | undefined)?.email;
        if (typeof email === 'string' && (await checkOnSignIn(email)).trashed) {
          throw new APIError('UNAUTHORIZED', {
            message: 'El correo o la contraseña no son correctos.',
          });
        }
      }
    }),
  },

  databaseHooks: {
    user: {
      create: {
        /**
         * Quien se registre con un correo de `ADMIN_EMAILS` nace administrador.
         *
         * Es el arranque en producción: se pone la variable antes de desplegar,
         * te registras, y ya está. El rol queda escrito en la columna, que es
         * donde lo busca todo el mundo —nosotros y Better Auth—.
         */
        before: async (user) =>
          isBootstrapAdmin(user.email) ? { data: { ...user, role: 'admin' } } : undefined,
      },
    },
  },

  user: {
    additionalFields: {
      /**
       * `input: false` para que no llegue nunca desde el cliente: mandar a la
       * papelera es cosa de una acción de administración, no de un formulario
       * de registro.
       */
      deletedAt: { type: 'date', required: false, input: false },
    },
  },

  plugins: [
    /**
     * Roles, baneos y suplantación.
     *
     * Publica quince endpoints bajo `/api/auth/admin/*` en cuanto se activa, y
     * no son opcionales. Nuestras pantallas **no los llaman directamente**:
     * pasan por las acciones de `src/actions/admin.ts`, que comprueban quién
     * eres antes de delegar. Un solo transporte y un solo sitio donde mirar.
     */
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
      // Suplantar es lo único que le permite a un admin ver el entreno de
      // otro, así que dura poco y deja firma en `session.impersonatedBy`.
      impersonationSessionDuration: 60 * 30,
      bannedUserMessage: 'Esta cuenta está suspendida.',
    }),
  ],

  session: {
    // Una semana, y se renueva sola si entras dentro del último día. Entrenas
    // tres veces por semana: pedir la contraseña en cada sesión sobraría.
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  // Los ids los genera Better Auth. Ponerle `generateId: false` significaría
  // «ya los pone la base», y nuestras tablas no tienen valor por defecto para
  // `id`: el registro fallaba con `null value in column "id"`.
});
