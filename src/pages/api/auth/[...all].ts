/**
 * La única ruta de API escrita a mano de todo el proyecto.
 *
 * Better Auth no expone endpoints sueltos: expone **un manejador** que atiende
 * todo lo suyo bajo un mismo prefijo —entrar, registrarse, salir, leer la
 * sesión, verificar el correo— y decide internamente qué hacer según la URL.
 * Por eso la ruta es un comodín (`[...all]`) y por eso responde a cualquier
 * método (`ALL`).
 *
 * Lleva `prerender = false` porque es la primera ruta del proyecto que **no**
 * puede generarse en el build: depende de quién llama y de sus cookies. Todo lo
 * demás sigue siendo estático.
 */
import type { APIRoute } from 'astro';

import { auth } from '@/auth';

export const prerender = false;

export const ALL: APIRoute = ({ request }) => auth.handler(request);
