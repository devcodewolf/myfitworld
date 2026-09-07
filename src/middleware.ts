/**
 * Quién entra y a dónde puede entrar.
 *
 * El middleware se ejecuta antes que cualquier página que no esté generada en
 * el build. Hace dos cosas, y solo dos:
 *
 * 1. Lee la cookie de sesión y deja el resultado en `Astro.locals`, para que
 *    ninguna página tenga que volver a preguntar quién está delante.
 * 2. Corta el paso a las rutas con datos personales cuando no hay sesión.
 *
 * Lo que **no** hace: filtrar datos. El filtro por `user_id` lo pone cada
 * acción del servidor. Que aquí haya sesión no significa que una consulta
 * pueda devolver lo de otro; una acción que no filtre sigue siendo un fallo de
 * seguridad aunque el middleware esté bien.
 */
import { defineMiddleware } from 'astro:middleware';

import { auth, isAdminUser } from '@/auth';
import { routes } from '@/routes';

/**
 * Las rutas privadas, enumeradas. La lista es corta a propósito: el contenido
 * del mesociclo es público y se sigue generando en el build, y solo lo que
 * habla de ti concreto pide entrar.
 */
const PRIVATE_PATHS: readonly string[] = [routes.history(), routes.settings(), routes.advice()];

/** El modo entreno no es una ruta sino una por día, así que va como patrón. */
const PRIVATE_PATTERNS: readonly RegExp[] = [/^\/semana\/\d+\/dia\/\d+\/entrenar$/];

function needsSession(pathname: string): boolean {
  // Astro sirve `/historial` y `/historial/` como la misma página; sin
  // normalizar, la segunda forma se colaría sin sesión.
  const path = pathname.replace(/\/+$/, '') || '/';
  return PRIVATE_PATHS.includes(path) || PRIVATE_PATTERNS.some((pattern) => pattern.test(path));
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Por defecto no hay nadie. Se pone antes de cualquier salida temprana para
  // que `locals` nunca esté a medio rellenar según por dónde se haya vuelto.
  context.locals.user = null;
  context.locals.session = null;

  // Las páginas prerenderizadas también pasan por aquí, pero **durante el
  // build**: no hay petición real ni base de datos a la que preguntar. Se sale
  // antes de tocar nada para que construir el sitio no necesite Postgres.
  if (context.isPrerendered) return next();

  // El manejador de Better Auth resuelve su propia sesión por dentro:
  // preguntarla aquí sería una consulta de más en cada entrada y cada salida.
  if (context.url.pathname.startsWith(routes.authApi())) return next();

  const found = await auth.api.getSession({ headers: context.request.headers });
  if (found) {
    context.locals.user = found.user;
    context.locals.session = found.session;
  }

  if (!found && needsSession(context.url.pathname)) {
    // Con el destino puesto: al entrar se vuelve aquí, no a la portada.
    return context.redirect(routes.login(context.url.pathname + context.url.search));
  }

  /**
   * La administración no pide sesión: pide ser administrador, que es otra cosa.
   *
   * Y a quien no lo sea se le responde **404, no 403**. Un «prohibido»
   * confirma que ahí hay algo; un «no existe», no. Vale también para quien ni
   * siquiera ha entrado: sin esto, un desconocido sabría que hay panel.
   */
  if (context.url.pathname.startsWith(routes.admin()) && !isAdminUser(context.locals.user)) {
    return new Response(null, { status: 404 });
  }

  return next();
});
