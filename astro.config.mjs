// @ts-check
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
