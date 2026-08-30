/**
 * La conexión a Postgres. El único sitio del proyecto que la abre.
 *
 * Se crea una sola vez y se reutiliza: en un servidor de Node el módulo se
 * evalúa una vez por proceso, así que un `pool` aquí es un `pool` para toda la
 * vida del contenedor. Abrir una conexión por petición agotaría el servidor.
 *
 * Este módulo **solo lo importan `src/db/` y las acciones**. Nada de `core/`,
 * de `components/` ni de `pages/` puede tocarlo: es la misma regla que impedía
 * que alguien llamara a `localStorage` desde una plantilla.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from '@/db/schema';

/**
 * Falla en el arranque y no en la primera consulta.
 *
 * Un servidor que levanta sin cadena de conexión y revienta cuando alguien
 * entra en su historial es mucho peor de diagnosticar que uno que no levanta.
 */
function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'Falta DATABASE_URL. Copia .env.example a .env y pon ahí la cadena de conexión de Postgres.',
    );
  }
  return url;
}

export const pool = new Pool({ connectionString: connectionString() });

export const db = drizzle(pool, { schema });

export type Database = typeof db;
