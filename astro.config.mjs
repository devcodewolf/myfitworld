// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

/**
 * `base` se decide en tiempo de build, no en el código.
 * Astro no sabe emitir rutas relativas (`base: './'` produce `/./`), así que la
 * portabilidad entre subcarpetas se resuelve reconstruyendo con otra variable:
 *
 *   BASE_PATH=/entreno pnpm build
 *
 * Todos los enlaces internos se construyen en src/routes.ts, que es lo que
 * mantiene esta decisión en un solo sitio.
 */
export default defineConfig({
  output: 'static',
  base: process.env.BASE_PATH ?? '/',
  vite: {
    plugins: [tailwindcss()],
  },
});
