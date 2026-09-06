/**
 * Cerrar sesión.
 *
 * Existe como ruta propia para que salir sea **un formulario, no JavaScript**.
 * Así el botón funciona igual en Ajustes que dentro de la píldora de la barra
 * de navegación, no arrastra el cliente de Better Auth a las treinta y cinco
 * páginas estáticas, y sigue funcionando si un script falla al cargar.
 *
 * Solo responde a `POST`. Con `GET` bastaría con que alguien te colara un
 * `<img src="/salir">` —o con que el navegador precargara el enlace— para
 * echarte de la aplicación.
 */
import type { APIRoute } from 'astro';

import { auth } from '@/auth';
import { routes } from '@/routes';

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  // Un formulario de otro sitio también puede hacer POST aquí. No es grave
  // —lo peor que consigue es echarte—, pero es gratis no permitirlo.
  const origin = request.headers.get('origin');
  if (origin !== null && origin !== url.origin) {
    return new Response(null, { status: 403 });
  }

  const headers = new Headers({ Location: routes.home() });

  try {
    // `asResponse` porque lo que interesa no es el cuerpo, sino la cabecera
    // `Set-Cookie` que borra la sesión del navegador.
    const cleared = await auth.api.signOut({ headers: request.headers, asResponse: true });
    for (const cookie of cleared.headers.getSetCookie()) {
      headers.append('Set-Cookie', cookie);
    }
  } catch {
    // Sin sesión que cerrar, ya estás fuera: llevarte a la portada es la
    // respuesta correcta igualmente.
  }

  // 303: el navegador cambia el POST por un GET, así que recargar la portada
  // no reenvía nada.
  return new Response(null, { status: 303, headers });
};
