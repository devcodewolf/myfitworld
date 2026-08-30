/**
 * Configuración de drizzle-kit, la herramienta que genera y aplica migraciones.
 *
 * `generate` lee el esquema y escribe el SQL en `drizzle/`. No necesita base de
 * datos: compara el esquema con la última migración y produce la diferencia.
 * `migrate` sí conecta, y por eso lee `DATABASE_URL`.
 *
 * Las migraciones **se versionan en git**. Son el historial de cómo llegó la
 * base a su forma actual, y sin ellas no se puede reproducir en otra máquina.
 */
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: ['./src/db/schema.ts', './src/db/auth-schema.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  // Avisa antes de generar algo que borre datos.
  strict: true,
  verbose: true,
});
