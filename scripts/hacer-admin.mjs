/**
 * Asciende una cuenta a administrador.
 *
 *   pnpm db:make-admin tu@correo.com
 *   pnpm db:make-admin tu@correo.com --quitar
 *
 * Hace exactamente lo mismo que el botón «Cambiar rol» de `/admin`: escribe
 * `admin` en la columna `role`. Existe para resolver el huevo y la gallina —esa
 * pantalla solo la ve un admin, así que el primero no puede nombrarse desde
 * dentro— sin tener que escribir SQL a mano.
 *
 * ── LA OTRA VÍA, Y CUÁNDO USAR CADA UNA ───────────────────────────────────
 * `ADMIN_EMAILS` en el entorno es la de producción: se pone antes de desplegar
 * y quien se registre con uno de esos correos ya nace administrador. Sin
 * buscar ids, sin SQL en el servidor y sin redesplegar.
 *
 * Este script es el atajo de desarrollo, para ascender una cuenta que ya
 * existe sin tener que tocar el entorno ni reiniciar. Hace falta acceso a la
 * base, así que en producción no es el camino.
 *
 * Usa `DATABASE_OWNER_URL`: la app se conecta con un rol que solo lee y escribe
 * filas, y cambiar quién manda no es cosa suya.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const env = Object.fromEntries(
  readFileSync(fileURLToPath(new URL('../.env', import.meta.url)), 'utf8')
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#') && line.includes('='))
    .map((line) => [
      line.slice(0, line.indexOf('=')).trim(),
      line.slice(line.indexOf('=') + 1).trim(),
    ]),
);

const quitar = process.argv.includes('--quitar');
const correo = process.argv.slice(2).find((arg) => !arg.startsWith('--'));

if (!correo) {
  console.error('Falta el correo.\n\n  pnpm db:make-admin tu@correo.com\n');
  console.error('Para ver qué cuentas hay:  pnpm db:users\n');
  process.exit(1);
}

const url = env['DATABASE_OWNER_URL'];
if (!url) {
  console.error('Falta DATABASE_OWNER_URL en .env.');
  process.exit(1);
}

const cliente = new pg.Client({ connectionString: url });
await cliente.connect();

try {
  const { rows } = await cliente.query(
    `update "user" set role = $1 where email = $2 returning id, email, role`,
    [quitar ? 'user' : 'admin', correo],
  );

  if (rows.length === 0) {
    console.error(`No hay ninguna cuenta con el correo ${correo}.`);
    console.error('Regístrate primero en /login, y luego vuelve aquí.');
    process.exitCode = 1;
  } else {
    const cuenta = rows[0];
    console.log(`${cuenta.email} ahora es ${cuenta.role}.`);
    console.log(`id: ${cuenta.id}`);
    if (!quitar) console.log('\nRecarga la app: «Cuentas» aparece arriba a la derecha.');
  }
} finally {
  await cliente.end();
}
