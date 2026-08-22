import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ base: process.env.BASE_PATH ?? '/', vite: { plugins: [tailwindcss()] } });
