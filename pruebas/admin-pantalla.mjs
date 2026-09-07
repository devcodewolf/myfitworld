// La pantalla de administración en un navegador real, incluida la suplantación,
// que es lo unico que no se puede probar bien con fetch: necesita que las
// cookies viajen como en una navegacion de verdad.
//
//   node pruebas/admin-pantalla.mjs        (anade --ver para mirarla)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { chromium } =
  await import('file:///C:/Program Files/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs');

const env = Object.fromEntries(
  readFileSync(fileURLToPath(new URL('../.env', import.meta.url)), 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

const B = 'http://localhost:4321';
const CLAVE = 'contrasena-larga-1';
const sufijo = Date.now();
const ADMIN = `pa-admin-${sufijo}@ejemplo.com`;
const OTRO = `pa-otro-${sufijo}@ejemplo.com`;

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
      'x-codigo-invitacion': env['SIGNUP_INVITE_CODE'],
    },
    body: JSON.stringify({ email, password: CLAVE, name: email.split('@')[0] }),
  });
}

const VER = process.argv.includes('--ver');
const navegador = await chromium.launch({
  channel: 'chrome',
  headless: !VER,
  slowMo: VER ? 350 : 0,
});
const pagina = await (
  await navegador.newContext({ viewport: { width: 1380, height: 900 } })
).newPage();

const errores = [];
pagina.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
pagina.on('pageerror', (e) => errores.push(e.message));

const cliente = new pg.Client({ connectionString: env['DATABASE_OWNER_URL'] });
await cliente.connect();

try {
  await registrar(ADMIN);
  await registrar(OTRO);
  await cliente.query(`update "user" set role = 'admin' where email = $1`, [ADMIN]);

  await pagina.goto(`${B}/login`);
  await pagina.fill('#correo', ADMIN);
  await pagina.fill('#clave', CLAVE);
  await Promise.all([pagina.waitForURL(`${B}/`, { timeout: 15000 }), pagina.click('#enviar')]);

  console.log('=== 1. La barra lleva a la administracion ===');
  await pagina.waitForTimeout(900);
  const barra = await pagina.textContent('header');
  ok('la pildora ofrece «Cuentas» a un admin', (barra ?? '').includes('Cuentas'));

  console.log('\n=== 2. La lista de cuentas ===');
  errores.length = 0;
  await pagina.goto(`${B}/admin`, { waitUntil: 'networkidle' });
  await pagina.waitForTimeout(900);
  ok('la pantalla monta sin errores', errores.length === 0, errores.join(' | '));

  const filas = await pagina.locator('#cuentas tr').count();
  ok('pinta las cuentas', filas >= 2, `${filas} filas`);
  const tabla = await pagina.textContent('#cuentas');
  ok('sale el otro usuario', (tabla ?? '').includes(OTRO));
  ok(
    'y las etiquetas de rol',
    (tabla ?? '').includes('Admin') && (tabla ?? '').includes('Usuario'),
  );

  console.log('\n=== 3. Suspender desde la pantalla ===');
  const filaOtro = pagina.locator('#cuentas tr', { hasText: OTRO });
  pagina.once('dialog', (d) => d.accept('prueba'));
  await filaOtro.getByRole('button', { name: 'Suspender' }).click();
  await pagina.waitForTimeout(1500);
  const aviso = await pagina.textContent('#aviso');
  ok('avisa de la suspension', (aviso ?? '').includes('suspendida'), (aviso ?? '').slice(0, 60));
  const trasSuspender = await pagina.textContent('#cuentas');
  ok('y la fila lo refleja', (trasSuspender ?? '').includes('Suspendida'));

  await pagina
    .locator('#cuentas tr', { hasText: OTRO })
    .getByRole('button', { name: 'Reactivar' })
    .click();
  await pagina.waitForTimeout(1500);

  console.log('\n=== 4. La papelera ===');
  await pagina
    .locator('#cuentas tr', { hasText: OTRO })
    .getByRole('button', { name: 'A la papelera' })
    .click();
  await pagina.waitForTimeout(1500);
  await pagina.goto(`${B}/admin/papelera`, { waitUntil: 'networkidle' });
  await pagina.waitForTimeout(900);
  const papelera = await pagina.textContent('#cuentas');
  ok('la cuenta aparece en la papelera', (papelera ?? '').includes(OTRO));
  ok('con el boton de borrar para siempre', (papelera ?? '').includes('Borrar para siempre'));

  await pagina
    .locator('#cuentas tr', { hasText: OTRO })
    .getByRole('button', { name: 'Restaurar' })
    .click();
  await pagina.waitForTimeout(1500);

  console.log('\n=== 5. Suplantar ===');
  await pagina.goto(`${B}/admin`, { waitUntil: 'networkidle' });
  await pagina.waitForTimeout(900);
  errores.length = 0;
  await pagina
    .locator('#cuentas tr', { hasText: OTRO })
    .getByRole('button', { name: 'Entrar como' })
    .click();
  await pagina.waitForURL(`${B}/`, { timeout: 15000 });
  await pagina.waitForTimeout(1200);

  const quienSoy = await pagina.evaluate(async () => {
    const res = await fetch('/api/auth/get-session');
    return res.text();
  });
  ok('la sesion pasa a ser la del otro', quienSoy.includes(OTRO), quienSoy.slice(0, 90));

  const firma = await cliente.query(
    `select count(*)::int as n from session where impersonated_by is not null`,
  );
  ok('y queda firmada en impersonatedBy', firma.rows[0].n >= 1, `${firma.rows[0].n} sesiones`);

  const barraSuplantando = await pagina.textContent('header');
  ok(
    'suplantando ya NO se ofrece la administracion',
    !(barraSuplantando ?? '').includes('Cuentas'),
    (barraSuplantando ?? '').replace(/\s+/g, ' ').slice(0, 70),
  );
} catch (error) {
  fallos += 1;
  console.log(`FALLO excepcion: ${error.message}`);
} finally {
  await navegador.close();
  await cliente
    .query(`delete from "user" where email like $1`, [`%-${sufijo}@ejemplo.com`])
    .catch(() => {});
  await cliente.end();
}

console.log(`\n${fallos === 0 ? 'TODO EN VERDE' : `${fallos} FALLO(S)`}`);
process.exit(fallos === 0 ? 0 : 1);
