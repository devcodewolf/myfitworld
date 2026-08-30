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
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from '@/db';
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

export const auth = betterAuth({
  secret: secret(),
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:4321',

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
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
