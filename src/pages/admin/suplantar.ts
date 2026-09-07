/**
 * Entrar como otra persona.
 *
 * Ruta propia y solo `POST`, por lo mismo que `/salir`: la respuesta trae la
 * cookie de la sesión nueva, y eso pide una navegación de verdad. Un enlace lo
 * seguiría cualquier precarga del navegador.
 *
 * **Es el único camino por el que un administrador llega al entreno de otro.**
 * Las políticas de la base no tienen excepción para administradores, así que
 * mientras es él mismo no ve nada ajeno; al suplantar, la sesión pasa a ser la
 * de la otra persona y las políticas la dejan ver lo suyo. Queda firmado en
 * `session.impersonatedBy` y caduca a la media hora.
 */
import type { APIRoute } from 'astro';

import { auth, isAdminUser } from '@/auth';
import { routes } from '@/routes';

export const prerender = false;

export const POST: APIRoute = async ({ request, url, locals }) => {
  const origin = request.headers.get('origin');
  if (origin !== null && origin !== url.origin) {
    return new Response(null, { status: 403 });
  }

  // El middleware ya corta /admin/* a quien no sea admin, pero esta ruta
  // escribe una sesión: no se apoya en que otra capa haya hecho su trabajo.
  if (!isAdminUser(locals.user)) return new Response(null, { status: 404 });

  const form = await request.formData();
  const userId = String(form.get('userId') ?? '');
  if (!userId) return new Response(null, { status: 400 });

  const headers = new Headers({ Location: routes.home() });
  try {
    const suplantada = await auth.api.impersonateUser({
      body: { userId },
      headers: request.headers,
      asResponse: true,
    });
    for (const cookie of suplantada.headers.getSetCookie()) headers.append('Set-Cookie', cookie);
  } catch {
    return new Response(null, { status: 400 });
  }

  return new Response(null, { status: 303, headers });
};
