/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// getViteConfig hereda la configuración de Astro, y con ella el alias `@/`
// del tsconfig: los tests importan igual que la app.
export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
