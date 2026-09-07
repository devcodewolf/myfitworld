// Administración de cuentas.
//
// Lo que de verdad se comprueba aquí: que un usuario normal no pueda llamar a
// NINGUNA acción de administración. Todo lo demás —crear, banear, papelera,
// borrar— es funcionalidad; eso es seguridad.
//
//   node pruebas/admin.mjs <SIGNUP_INVITE_CODE>
//
// Necesita el servidor construido en marcha y Postgres levantado.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pg from 'pg';

const almacen = fileURLToPath(new URL('../node_modules/.pnpm/', import.meta.url));
const carpeta = readdirSync(almacen).find((d) => d.startsWith('devalue@'));
const { parse: devalueParse } = await import(
  pathToFileURL(join(almacen, carpeta, 'node_modules/devalue/index.js')).href
);

const env = Object.fromEntries(
  readFileSync(fileURLToPath(new URL('../.env', import.meta.url)), 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

const B = 'http://localhost:4321';
const CODIGO = process.argv[2] ?? env['SIGNUP_INVITE_CODE'];
const CLAVE = 'contrasena-larga-1';

let fallos = 0;
const ok = (nombre, condicion, detalle = '') => {
  if (!condicion) fallos += 1;
  console.log(`${condicion ? 'OK  ' : 'FALLO'} ${nombre}${detalle ? '  — ' + detalle : ''}`);
};

async function registrar(email) {
  await fetch(`${B}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      origin: B,
      'x-codigo-invitacion': CODIGO,
    },
    body: JSON.stringify({ email, password: CLAVE, name: email.split('@')[0] }),
  });
}

async function entrar(email, clave = CLAVE) {
  const res = await fetch(`${B}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin: B },
    body: JSON.stringify({ email, password: clave }),
  });
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
  return { estado: res.status, cookie };
}

async function accion(nombre, input, cookie) {
  const res = await fetch(`${B}/_actions/${nombre}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin: B, ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(input ?? {}),
  });
  const texto = await res.text();
  if (!res.ok) {
    let codigo = texto;
    try {
      codigo = JSON.parse(texto).code ?? JSON.parse(texto).message;
    } catch {}
    return { error: { status: res.status, code: codigo } };
  }
  return { data: texto === '' ? undefined : devalueParse(texto, { URL: (h) => new URL(h) }) };
}

async function pagina(ruta, cookie) {
  const res = await fetch(`${B}${ruta}`, {
    redirect: 'manual',
    headers: cookie ? { cookie } : {},
  });
  return res.status;
}

const sufijo = Date.now();
const ADMIN = `admin-${sufijo}@ejemplo.com`;
const NORMAL = `normal-${sufijo}@ejemplo.com`;
const VICTIMA = `victima-${sufijo}@ejemplo.com`;

const cliente = new pg.Client({ connectionString: env['DATABASE_OWNER_URL'] });
await cliente.connect();

try {
  await registrar(ADMIN);
  await registrar(NORMAL);
  await registrar(VICTIMA);

  // Se asciende por la columna `role`, que es exactamente lo que hace el botón
  // «Cambiar rol». El arranque por ADMIN_USER_IDS se prueba a mano: exige
  // reiniciar el servidor con la variable puesta.
  await cliente.query(`update "user" set role = 'admin' where email = $1`, [ADMIN]);

  const admin = await entrar(ADMIN);
  const normal = await entrar(NORMAL);
  ok('el admin y el usuario normal entran', admin.estado === 200 && normal.estado === 200);

  // La victima entrena: sin datos suyos, la papelera no demuestra nada.
  const suya = await entrar(VICTIMA);
  const ahora = new Date().toISOString();
  const perfil = await accion('profiles.getActive', {}, suya.cookie);
  await accion(
    'sessions.saveActive',
    {
      id: crypto.randomUUID(),
      profileId: perfil.data.id,
      mesocycleId: 'mesociclo-prueba',
      weekOrder: 1,
      dayOrder: 1,
      status: 'in_progress',
      startedAt: ahora,
      restMultiplier: 1,
      exercises: [
        {
          blockKey: 'flexiones',
          exerciseId: 'flexiones',
          sets: [
            { id: crypto.randomUUID(), setIndex: 1, reps: 10, skipped: false, completedAt: ahora },
          ],
        },
      ],
      createdAt: ahora,
      updatedAt: ahora,
    },
    suya.cookie,
  );
  const contarSuyo = async () => {
    const r = await cliente.query(
      `select
         (select count(*) from profiles where user_id = u.id)::int as perfiles,
         (select count(*) from workout_sessions where user_id = u.id)::int as sesiones
       from "user" u where u.email = $1`,
      [VICTIMA],
    );
    return r.rows[0] ?? { perfiles: 0, sesiones: 0 };
  };
  const antesDeTodo = await contarSuyo();
  ok(
    'la victima tiene datos que perder',
    antesDeTodo.perfiles === 1 && antesDeTodo.sesiones === 1,
    `${antesDeTodo.perfiles} perfiles, ${antesDeTodo.sesiones} sesiones`,
  );

  console.log('\n=== 1. LO QUE IMPORTA: un usuario normal no administra nada ===');
  const prohibidas = [
    ['admin.list', { trashed: false }],
    ['admin.create', { email: `colado-${sufijo}@ejemplo.com`, name: 'Colado', password: CLAVE }],
    ['admin.setRole', { userId: 'x', role: 'admin' }],
    ['admin.setPassword', { userId: 'x', password: CLAVE }],
    ['admin.ban', { userId: 'x' }],
    ['admin.unban', { userId: 'x' }],
    ['admin.trash', { userId: 'x' }],
    ['admin.restore', { userId: 'x' }],
    ['admin.removeForever', { userId: 'x' }],
  ];
  for (const [nombre, input] of prohibidas) {
    const r = await accion(nombre, input, normal.cookie);
    ok(
      `  ${nombre} le responde que no existe`,
      r.error?.status === 404,
      `status ${r.error?.status}`,
    );
  }

  const sinNadie = await accion('admin.list', { trashed: false }, null);
  ok('  y a un anonimo tampoco', sinNadie.error !== undefined, `status ${sinNadie.error?.status}`);

  console.log('\n=== 2. Las paginas tampoco ===');
  ok('/admin da 404 a un usuario normal', (await pagina('/admin', normal.cookie)) === 404);
  ok(
    '/admin/papelera da 404 a un usuario normal',
    (await pagina('/admin/papelera', normal.cookie)) === 404,
  );
  ok('/admin da 404 a un anonimo', (await pagina('/admin', null)) === 404);
  ok('/admin lo ve el admin', (await pagina('/admin', admin.cookie)) === 200);

  console.log('\n=== 3. El admin administra ===');
  const lista = await accion('admin.list', { trashed: false }, admin.cookie);
  ok(
    'lista las cuentas activas',
    Array.isArray(lista.data) && lista.data.length >= 3,
    `${lista.data?.length}`,
  );

  const victima = lista.data?.find((c) => c.email === VICTIMA);
  ok('encuentra a la victima', victima !== undefined);

  const creada = await accion(
    'admin.create',
    { email: `creada-${sufijo}@ejemplo.com`, name: 'Creada', password: CLAVE, role: 'user' },
    admin.cookie,
  );
  ok(
    'crea una cuenta sin codigo de invitacion',
    creada.error === undefined,
    JSON.stringify(creada.error),
  );

  const rol = await accion('admin.setRole', { userId: victima.id, role: 'admin' }, admin.cookie);
  ok('cambia el rol', rol.error === undefined, JSON.stringify(rol.error));
  await accion('admin.setRole', { userId: victima.id, role: 'user' }, admin.cookie);

  const clave = await accion(
    'admin.setPassword',
    { userId: victima.id, password: 'otra-contrasena-larga-2' },
    admin.cookie,
  );
  ok('cambia la contrasena', clave.error === undefined, JSON.stringify(clave.error));
  const conNueva = await entrar(VICTIMA, 'otra-contrasena-larga-2');
  ok('y la nueva contrasena funciona', conNueva.estado === 200, `status ${conNueva.estado}`);

  console.log('\n=== 4. Nadie se dispara en el pie ===');
  const yoMismo = lista.data.find((c) => c.email === ADMIN);
  const aSiMismo = await accion('admin.trash', { userId: yoMismo.id }, admin.cookie);
  ok(
    'no puede mandarse a si mismo a la papelera',
    aSiMismo.error?.status === 400,
    `status ${aSiMismo.error?.status}`,
  );

  const directo = await accion('admin.removeForever', { userId: victima.id }, admin.cookie);
  ok(
    'no puede borrar sin pasar por la papelera',
    directo.error?.status === 400,
    `status ${directo.error?.status}`,
  );

  console.log('\n=== 5. La papelera ===');
  const aPapelera = await accion('admin.trash', { userId: victima.id }, admin.cookie);
  ok(
    'manda una cuenta a la papelera',
    aPapelera.error === undefined,
    JSON.stringify(aPapelera.error),
  );

  const bloqueada = await entrar(VICTIMA, 'otra-contrasena-larga-2');
  ok(
    'una cuenta en la papelera NO puede entrar',
    bloqueada.estado !== 200,
    `status ${bloqueada.estado}`,
  );

  const enPapelera = await accion('admin.list', { trashed: true }, admin.cookie);
  ok(
    'sale en la papelera',
    enPapelera.data?.some((c) => c.email === VICTIMA),
  );

  const activas = await accion('admin.list', { trashed: false }, admin.cookie);
  ok('y ya no sale entre las activas', !activas.data?.some((c) => c.email === VICTIMA));

  const enLaPapelera = await contarSuyo();
  ok(
    'SUS DATOS SIGUEN INTACTOS: la papelera no borra nada',
    enLaPapelera.perfiles === antesDeTodo.perfiles &&
      enLaPapelera.sesiones === antesDeTodo.sesiones,
    `${enLaPapelera.perfiles} perfiles, ${enLaPapelera.sesiones} sesiones`,
  );

  const restaurada = await accion('admin.restore', { userId: victima.id }, admin.cookie);
  ok('se restaura', restaurada.error === undefined);
  const vuelve = await entrar(VICTIMA, 'otra-contrasena-larga-2');
  ok('y vuelve a poder entrar', vuelve.estado === 200, `status ${vuelve.estado}`);

  console.log('\n=== 6. El borrado definitivo se lleva todo ===');
  await accion('admin.trash', { userId: victima.id }, admin.cookie);
  const borrada = await accion('admin.removeForever', { userId: victima.id }, admin.cookie);
  ok('borra desde la papelera', borrada.error === undefined, JSON.stringify(borrada.error));

  const queda = await cliente.query(`select count(*)::int as n from "user" where email = $1`, [
    VICTIMA,
  ]);
  ok('la cuenta ya no existe', queda.rows[0].n === 0);

  const suyoTrasBorrar = await contarSuyo();
  ok(
    'y en cascada se llevo su entreno',
    suyoTrasBorrar.perfiles === 0 && suyoTrasBorrar.sesiones === 0,
    `${suyoTrasBorrar.perfiles} perfiles, ${suyoTrasBorrar.sesiones} sesiones`,
  );

  const huerfanos = await cliente.query(
    `select
       (select count(*) from profiles p left join "user" u on u.id = p.user_id where u.id is null)::int as perfiles,
       (select count(*) from workout_sessions s left join "user" u on u.id = s.user_id where u.id is null)::int as sesiones`,
  );
  ok(
    'sin dejar filas huerfanas',
    huerfanos.rows[0].perfiles === 0 && huerfanos.rows[0].sesiones === 0,
    `${huerfanos.rows[0].perfiles} perfiles, ${huerfanos.rows[0].sesiones} sesiones sueltas`,
  );

  console.log('\n=== 7. De donde sale que alguien sea admin ===');
  // La variable la lee el servidor al arrancar, asi que aqui se comprueba la
  // mitad que se puede sin reiniciarlo: que `isAdminUser` mire SOLO la columna
  // `role`. Si alguien volviera a meter una segunda fuente, esto lo caza.
  const enLista = (env['ADMIN_EMAILS'] ?? '').toLowerCase().includes(ADMIN.toLowerCase());
  const degradado = await cliente.query(`update "user" set role = 'user' where email = $1`, [
    ADMIN,
  ]);
  ok('se le puede quitar el rol por la columna', degradado.rowCount === 1);
  const yaNo = await entrar(ADMIN);
  const sinRol = await accion('admin.list', { trashed: false }, yaNo.cookie);
  ok(
    enLista
      ? 'esta en ADMIN_EMAILS: al entrar se le repara el rol'
      : 'sin `admin` en la columna, deja de administrar',
    enLista ? sinRol.error === undefined : sinRol.error?.status === 404,
    `status ${sinRol.error?.status ?? 200}`,
  );
  await cliente.query(`update "user" set role = 'admin' where email = $1`, [ADMIN]);
  admin.cookie = (await entrar(ADMIN)).cookie;

  console.log('\n=== 8. Ni siquiera un admin lee el entreno de otro ===');
  // Las politicas de la base no tienen excepcion para administradores: sus
  // consultas se declaran con SU id. Suplantar es el unico camino, y deja firma.
  const suyas = await accion('sessions.list', {}, admin.cookie);
  ok(
    'el historial que ve el admin es solo el suyo',
    Array.isArray(suyas.data) && suyas.data.length === 0,
    `${suyas.data?.length} sesiones`,
  );
} catch (error) {
  fallos += 1;
  console.log(`FALLO excepcion: ${error.message}`);
} finally {
  await cliente
    .query(`delete from "user" where email like $1`, [`%-${sufijo}@ejemplo.com`])
    .catch(() => {});
  await cliente.end();
}

console.log(`\n${fallos === 0 ? 'TODO EN VERDE' : `${fallos} FALLO(S)`}`);
process.exit(fallos === 0 ? 0 : 1);
