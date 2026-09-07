/**
 * El cliente de Better Auth en el navegador.
 *
 * Solo lo carga la pantalla de entrada. El resto de la aplicación no lo
 * necesita: quién eres lo dice el servidor, y salir es un formulario contra
 * `/salir`. Meterlo en el layout lo llevaría a las treinta y cinco páginas
 * estáticas para nada.
 */
import { createAuthClient } from 'better-auth/client';

import { routes } from '@/routes';

export const authClient = createAuthClient({
  // El prefijo lo sigue decidiendo `routes.ts`, como todas las URLs internas.
  basePath: routes.authApi(),
});

/**
 * Los códigos que devuelve Better Auth, en cristiano.
 *
 * Un `INVALID_EMAIL_OR_PASSWORD` en pantalla no le dice nada a nadie, y el
 * mensaje que trae la librería viene en inglés. Lo que no esté en esta tabla
 * cae en un texto genérico: es preferible a enseñar un código crudo.
 *
 * **«El correo o la contraseña no son correctos» es deliberadamente vago.**
 * Distinguir «ese correo no existe» de «la contraseña falla» le confirma a
 * cualquiera qué cuentas hay dadas de alta.
 */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'El correo o la contraseña no son correctos.',
  INVALID_EMAIL: 'Ese correo no tiene buena pinta. Revísalo.',
  USER_ALREADY_EXISTS: 'Ya hay una cuenta con ese correo. Entra en vez de crearla.',
  PASSWORD_TOO_SHORT: 'La contraseña se queda corta.',
  PASSWORD_TOO_LONG: 'Esa contraseña es demasiado larga.',
  FAILED_TO_CREATE_USER: 'No se pudo crear la cuenta.',
  TOO_MANY_REQUESTS: 'Demasiados intentos seguidos. Espera un poco y vuelve a probar.',
};

export interface AuthFailure {
  readonly code?: string | undefined;
  readonly message?: string | undefined;
  readonly status?: number | undefined;
}

/**
 * El texto que se le enseña a quien está delante.
 *
 * El orden importa: primero la tabla de códigos, y solo si no hay entrada se
 * usa el mensaje del servidor. Nuestro enganche del código de invitación
 * responde con un `403` y un texto ya escrito en español, y esa rama es la que
 * lo deja pasar tal cual.
 */
export function authErrorMessage(error: AuthFailure | null | undefined): string {
  if (!error) return 'Algo ha fallado y no sé decirte qué. Vuelve a intentarlo.';
  const known = error.code ? MESSAGES[error.code] : undefined;
  if (known) return known;
  if (error.status === 403 && error.message) return error.message;
  return error.message ?? 'Algo ha fallado. Vuelve a intentarlo.';
}
