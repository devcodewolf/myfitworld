// Prueba de extremo a extremo del paso 6, contra el servidor construido.
// Lo que de verdad se está comprobando: que el filtro por user_id existe en
// cada accion. Sin RLS, una accion que se olvide deja los datos de todos a la vista.
// Las acciones responden en `application/json+devalue`, no en JSON plano. pnpm
// no eleva las dependencias transitivas y devalue es de Astro, no nuestra, asi
// que hay que buscarla en el almacen en vez de importarla por su nombre.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const almacen = fileURLToPath(new URL('../node_modules/.pnpm/', import.meta.url));
const carpeta = readdirSync(almacen).find((d) => d.startsWith('devalue@'));
if (!carpeta) throw new Error('No encuentro devalue en node_modules/.pnpm');
const { parse: devalueParse } = await import(
  pathToFileURL(join(almacen, carpeta, 'node_modules/devalue/index.js')).href
);

// El codigo de invitacion: por argumento, o del .env si no se pasa. Sin el, el
// registro devuelve 403 y todo lo demas falla con un «usuario no encontrado»
// que no explica nada.
const env = Object.fromEntries(
  readFileSync(fileURLToPath(new URL('../.env', import.meta.url)), 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

const B = 'http://localhost:4321';
const CODIGO = process.argv[2] ?? env['SIGNUP_INVITE_CODE'];
if (!CODIGO) throw new Error('Falta SIGNUP_INVITE_CODE (por argumento o en .env)');

let fallos = 0;
function ok(nombre, condicion, detalle = '') {
  const marca = condicion ? 'OK  ' : 'FALLO';
  if (!condicion) fallos += 1;
  console.log(`${marca} ${nombre}${detalle ? '  — ' + detalle : ''}`);
}

async function entrar(email) {
  const cabeceras = { 'Content-Type': 'application/json', origin: B };
  await fetch(`${B}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { ...cabeceras, 'x-codigo-invitacion': CODIGO },
    body: JSON.stringify({ email, password: 'contrasena-larga-1', name: email.split('@')[0] }),
  });
  const res = await fetch(`${B}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: cabeceras,
    body: JSON.stringify({ email, password: 'contrasena-larga-1' }),
  });
  const cookies = res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
  if (!cookies) throw new Error(`no se pudo entrar como ${email}`);
  return cookies;
}

async function accion(nombre, input, cookie) {
  const res = await fetch(`${B}/_actions/${nombre}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      origin: B,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(input ?? {}),
  });
  const texto = await res.text();
  if (!res.ok) {
    let mensaje = texto;
    try {
      mensaje = JSON.parse(texto).code ?? JSON.parse(texto).message;
    } catch {}
    return { error: { status: res.status, code: mensaje } };
  }
  if (texto === '') return { data: undefined };
  return { data: devalueParse(texto, { URL: (h) => new URL(h) }) };
}

function nuevaSesion(profileId, id) {
  const ahora = new Date().toISOString();
  return {
    id,
    profileId,
    mesocycleId: 'mesociclo-prueba',
    weekOrder: 1,
    dayOrder: 1,
    status: 'in_progress',
    startedAt: ahora,
    restMultiplier: 1,
    exercises: [
      {
        blockKey: 'press-banca',
        exerciseId: 'press-banca',
        sets: [
          {
            id: crypto.randomUUID(),
            setIndex: 1,
            reps: 10,
            weightKg: 40,
            skipped: false,
            completedAt: ahora,
          },
        ],
      },
    ],
    createdAt: ahora,
    updatedAt: ahora,
  };
}

const sufijo = Date.now();
const correoA = `p6-a-${sufijo}@ejemplo.com`;
const correoB = `p6-b-${sufijo}@ejemplo.com`;

// La cuenta fija que esperan las pruebas de navegador.
await entrar('prueba@ejemplo.com');

const A = await entrar(correoA);
const Bk = await entrar(correoB);

console.log('\n=== 1. Anonimo ===');
const anonLista = await accion('sessions.list', {}, null);
ok(
  'sessions.list sin sesion devuelve vacio',
  Array.isArray(anonLista.data) && anonLista.data.length === 0,
  JSON.stringify(anonLista.data ?? anonLista.error),
);
const anonAjustes = await accion('settings.get', {}, null);
ok(
  'settings.get sin sesion rechaza',
  anonAjustes.error?.status === 401,
  `status ${anonAjustes.error?.status}`,
);
const anonGuardar = await accion(
  'sessions.saveActive',
  nuevaSesion('x', crypto.randomUUID()),
  null,
);
ok(
  'sessions.saveActive sin sesion rechaza',
  anonGuardar.error !== undefined,
  `status ${anonGuardar.error?.status}`,
);

console.log('\n=== 2. Usuario A entrena ===');
const perfilA = await accion('profiles.getActive', {}, A);
ok('perfil creado solo', typeof perfilA.data?.id === 'string', perfilA.data?.id);

const idSesionA = crypto.randomUUID();
const guardada = await accion('sessions.saveActive', nuevaSesion(perfilA.data.id, idSesionA), A);
ok('guardar sesion en curso', guardada.data?.id === idSesionA);

const activa = await accion('sessions.getActive', {}, A);
ok('leer sesion en curso', activa.data?.id === idSesionA);

const ajustesA = await accion('settings.save', { restSeconds: 90 }, A);
ok('guardar ajustes', ajustesA.data?.restSeconds === 90, String(ajustesA.data?.restSeconds));

const cerrada = await accion(
  'sessions.completeActive',
  { finishedAt: new Date().toISOString() },
  A,
);
ok('cerrar sesion', cerrada.data?.status === 'completed');

const sinActiva = await accion('sessions.getActive', {}, A);
ok('ya no hay sesion en curso', sinActiva.data === null);

const listaA = await accion('sessions.list', { status: 'completed' }, A);
ok('A ve su sesion en el historial', listaA.data?.length === 1, `${listaA.data?.length} sesiones`);

console.log('\n=== 3. AISLAMIENTO: B no puede ver ni tocar lo de A ===');
const listaB = await accion('sessions.list', {}, Bk);
ok('B NO ve las sesiones de A', listaB.data?.length === 0, `${listaB.data?.length} sesiones`);

const robo = await accion('sessions.get', { id: idSesionA }, Bk);
ok(
  'B NO puede leer la sesion de A por id',
  robo.data === null,
  JSON.stringify(robo.data ?? robo.error),
);

const borrado = await accion('sessions.remove', { id: idSesionA }, Bk);
ok(
  'B NO puede borrar la sesion de A',
  borrado.error !== undefined,
  `status ${borrado.error?.status}`,
);

const sigueViva = await accion('sessions.get', { id: idSesionA }, A);
ok('la sesion de A sigue ahi despues del intento', sigueViva.data?.id === idSesionA);

const ajustesB = await accion('settings.get', {}, Bk);
ok(
  'B tiene sus propios ajustes, no los de A',
  ajustesB.data?.restSeconds === 60,
  `restSeconds ${ajustesB.data?.restSeconds}`,
);

const listaBFinal = await accion('sessions.list', { status: 'completed' }, Bk);
ok(
  'B sigue sin ver nada de A tras todos los intentos',
  listaBFinal.data?.length === 0,
  `${listaBFinal.data?.length} sesiones`,
);

console.log('\n=== 4. Una sola sesion en curso ===');
const s1 = crypto.randomUUID();
const s2 = crypto.randomUUID();
await accion('sessions.saveActive', nuevaSesion(perfilA.data.id, s1), A);
const segunda = await accion('sessions.saveActive', nuevaSesion(perfilA.data.id, s2), A);
const activaFinal = await accion('sessions.getActive', {}, A);
ok(
  'la base impide dos sesiones en curso',
  segunda.error !== undefined || activaFinal.data?.id === s2,
  segunda.error
    ? `rechazada: ${segunda.error.code}`
    : `activa: ${activaFinal.data?.id === s2 ? 's2' : 'otra'}`,
);

console.log(`\n${fallos === 0 ? 'TODO EN VERDE' : `${fallos} FALLO(S)`}`);
console.log(`correos de prueba: ${correoA} ${correoB}`);
process.exit(fallos === 0 ? 0 : 1);
