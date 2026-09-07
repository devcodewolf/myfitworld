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

import * as authSchema from '@/db/auth-schema';
import * as appSchema from '@/db/schema';

/** Las tablas de Better Auth y las nuestras viven en la misma base. */
const schema = { ...authSchema, ...appSchema };

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

/**
 * Aviso si la aplicación se conecta con privilegios que no debería tener.
 *
 * Las políticas de seguridad por fila **no se le aplican a un superusuario**.
 * Si `DATABASE_URL` apunta a uno, quedan escritas y desactivadas, y eso no se
 * nota mirando: las consultas siguen funcionando y devolviendo lo correcto
 * mientras solo haya un usuario. Se comprueba al arrancar, una vez, porque el
 * día que falle hay que enterarse antes de que haya dos cuentas y no después.
 */
async function warnIfPrivileged(): Promise<void> {
  try {
    const result = await pool.query<{ peligroso: boolean }>(
      'select (rolsuper or rolbypassrls) as peligroso from pg_roles where rolname = current_user',
    );
    if (result.rows[0]?.peligroso) {
      console.error(
        '[db] AVISO DE SEGURIDAD: la aplicación se conecta con un rol que se salta ' +
          'las políticas por fila. Cada usuario podría ver los datos de los demás. ' +
          'Crea el rol de aplicación (scripts/rol-de-app.sql) y apunta ahí DATABASE_URL.',
      );
    }
  } catch {
    // Que no se pueda comprobar no es motivo para no arrancar.
  }
}

export const pool = new Pool({ connectionString: connectionString() });

export const db = drizzle(pool, { schema });

void warnIfPrivileged();

export type Database = typeof db;
