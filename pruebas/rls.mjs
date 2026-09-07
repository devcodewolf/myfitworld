// El segundo cerrojo, probado por separado: que sea POSTGRES quien impida ver
// lo de otro, sin que intervenga una sola línea de la aplicación.
//
// Esta prueba importa más de lo que parece. El filtro por user_id de las
// acciones tapa el resultado: aunque RLS estuviera desactivado, las pruebas de
// `acciones.mjs` seguirían pasando. Aquí se habla con la base a pelo, así que
// lo único que puede hacerla pasar es que las políticas funcionen.
//
//   node pruebas/rls.mjs
//
// Lee DATABASE_URL de .env, o sea la MISMA cadena con la que se conecta la
// aplicación. Si algún día apunta a un superusuario, esto lo caza.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const env = Object.fromEntries(
  readFileSync(fileURLToPath(new URL('../.env', import.meta.url)), 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

let fallos = 0;
const ok = (nombre, condicion, detalle = '') => {
  if (!condicion) fallos += 1;
  console.log(`${condicion ? 'OK  ' : 'FALLO'} ${nombre}${detalle ? '  — ' + detalle : ''}`);
};

const cliente = new pg.Client({ connectionString: env['DATABASE_URL'] });
await cliente.connect();

/** Una transaccion declarando en nombre de quien se actua, como hace la app. */
async function como(userId, sql, params = []) {
  await cliente.query('begin');
  try {
    await cliente.query("select set_config('app.user_id', $1, true)", [userId]);
    const res = await cliente.query(sql, params);
    await cliente.query('commit');
    return { filas: res.rows, cuenta: res.rowCount };
  } catch (error) {
    await cliente.query('rollback');
    return { error };
  }
}

const A = 'rls-usuario-a';
const B = 'rls-usuario-b';
const PERFIL_A = '11111111-1111-8111-8111-111111111111';

try {
  console.log('=== 0. Con quien se conecta la aplicacion ===');
  const quien = await cliente.query(
    'select current_user as usuario, rolsuper, rolbypassrls from pg_roles where rolname = current_user',
  );
  const rol = quien.rows[0];
  ok(
    'NO es superusuario ni se salta RLS',
    rol && !rol.rolsuper && !rol.rolbypassrls,
    `${rol?.usuario}: superusuario=${rol?.rolsuper} se_salta_rls=${rol?.rolbypassrls}`,
  );

  console.log('\n=== 1. Las politicas estan activadas Y forzadas ===');
  const estado = await cliente.query(
    `select relname, relrowsecurity, relforcerowsecurity from pg_class
     where relname in ('profiles','settings','workout_sessions') order by relname`,
  );
  ok(
    'las tres tablas con RLS activado y forzado',
    estado.rows.length === 3 && estado.rows.every((r) => r.relrowsecurity && r.relforcerowsecurity),
    estado.rows.map((r) => `${r.relname}:${r.relrowsecurity}/${r.relforcerowsecurity}`).join(' '),
  );

  // Los usuarios se crean con el rol de la app: la tabla `user` no lleva RLS a
  // proposito, porque Better Auth tiene que buscarte antes de que exista sesion.
  await cliente.query('delete from "user" where id = any($1)', [[A, B]]);
  await cliente.query(
    `insert into "user" (id,name,email,email_verified,created_at,updated_at)
     values ($1,'A','rls-a@ej.com',false,now(),now()), ($2,'B','rls-b@ej.com',false,now(),now())`,
    [A, B],
  );

  console.log('\n=== 2. Aislamiento, sin que intervenga la aplicacion ===');
  const creado = await como(
    A,
    'insert into profiles (id,user_id,name,created_at) values ($1,$2,$3,now())',
    [PERFIL_A, A, 'Yo'],
  );
  ok('A puede crear su perfil', creado.error === undefined, creado.error?.message ?? '');

  const veA = await como(A, 'select count(*)::int as n from profiles');
  ok('A se ve a si mismo', veA.filas?.[0]?.n === 1, `${veA.filas?.[0]?.n} filas`);

  const veB = await como(B, 'select count(*)::int as n from profiles');
  ok('B NO ve nada de A', veB.filas?.[0]?.n === 0, `${veB.filas?.[0]?.n} filas`);

  const sinDeclarar = await cliente.query('select count(*)::int as n from profiles');
  ok(
    'una consulta sin declarar usuario no ve nada (falla cerrado)',
    sinDeclarar.rows[0]?.n === 0,
    `${sinDeclarar.rows[0]?.n} filas`,
  );

  console.log('\n=== 3. B intenta escribir y borrar en la cuenta de A ===');
  const escribe = await como(
    B,
    'insert into profiles (id,user_id,name,created_at) values ($1,$2,$3,now())',
    ['22222222-2222-8222-8222-222222222222', A, 'Robado'],
  );
  ok(
    'la base RECHAZA escribir a nombre de otro',
    escribe.error !== undefined && /row-level security/i.test(escribe.error.message),
    escribe.error?.message ?? 'no dio error, MAL',
  );

  const borra = await como(B, 'delete from profiles where user_id = $1', [A]);
  ok('el borrado de B no alcanza ninguna fila', borra.cuenta === 0, `${borra.cuenta} filas`);

  const sigue = await como(A, 'select count(*)::int as n from profiles');
  ok('el perfil de A sigue ahi', sigue.filas?.[0]?.n === 1, `${sigue.filas?.[0]?.n} filas`);
} catch (error) {
  fallos += 1;
  console.log(`FALLO excepcion: ${error.message}`);
} finally {
  await cliente.query('delete from "user" where id = any($1)', [[A, B]]).catch(() => {});
  await cliente.end();
}

console.log(`\n${fallos === 0 ? 'TODO EN VERDE' : `${fallos} FALLO(S)`}`);
process.exit(fallos === 0 ? 0 : 1);
