// @ts-check
/**
 * `dotenv` antes que nada: Astro expone el `.env` en `import.meta.env`, pero
 * **no** lo vuelca en `process.env`, y `src/db/` y `src/auth.ts` leen de ahí
 * porque en producción las variables las inyecta el contenedor, no un archivo.
 *
 * Hasta el middleware daba igual: ninguna página evaluaba `src/db/`, así que
 * nadie preguntaba. Desde que el middleware lee la sesión en cada petición,
 * sin esta línea `pnpm dev` arranca y revienta con «Falta DATABASE_URL».
 *
 * Es la misma línea que ya tenía `drizzle.config.ts`. No pisa lo que ya esté
 * definido en el entorno, así que en Dokploy manda Dokploy. El servidor
 * construido no pasa por aquí: ahí se usa `node --env-file=.env` en local, y
 * las variables reales en producción.
 */
import 'dotenv/config';

import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';
import vue from '@astrojs/vue';

/**
 * `output: 'static'` con adaptador: la combinación deliberada.
 *
 * El adaptador **no** convierte el sitio en dinámico. Sigue generándose entero
 * en el build; lo que aporta es la posibilidad de que rutas concretas se salgan
 * del prerender con `export const prerender = false`. Es lo que hará falta para
 * las cuatro pantallas con datos personales y para la autenticación, y lo que
 * mantiene estáticas las treinta y cinco páginas de contenido del mesociclo.
 *
 * Ya no hay `base`: el despliegue en subcarpeta se descartó al montar servidor
 * propio, y con él se va toda la aritmética de prefijos de `src/routes.ts`.
 */
export default defineConfig({
  output: 'static',
  adapter: node({ mode: 'standalone' }),

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [vue()],
});
