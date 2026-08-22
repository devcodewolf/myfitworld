import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import { ExerciseSchema, MesocycleSchema } from '@/core/model';

/**
 * El id de cada entrada es el nombre de su archivo: `flexiones.json` → `flexiones`.
 *
 * La integridad entre colecciones (que todo exerciseId referenciado exista) se
 * comprueba en src/data.ts en vez de con `reference()`, para no mezclar dos
 * instancias de Zod en un mismo esquema y para poder dar errores que digan
 * exactamente qué bloque de qué día falla.
 */
const exercises = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/exercises' }),
  schema: ExerciseSchema,
});

const mesocycles = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/mesocycles' }),
  schema: MesocycleSchema,
});

export const collections = { exercises, mesocycles };
