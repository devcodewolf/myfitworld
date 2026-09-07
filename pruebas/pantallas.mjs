// Las seis pantallas en un navegador de verdad, contra el servidor construido.
// Lo que se busca sobre todo son errores de consola: el repositorio remoto
// puede compilar y aun así reventar al deserializar algo en tiempo de ejecucion.
const { chromium } =
  await import('file:///C:/Program Files/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs');

const B = 'http://localhost:4321';
const CORREO = 'prueba@ejemplo.com';
const CLAVE = 'contrasena-larga-1';

let fallos = 0;
const ok = (nombre, condicion, detalle = '') => {
  if (!condicion) fallos += 1;
  console.log(`${condicion ? 'OK  ' : 'FALLO'} ${nombre}${detalle ? '  — ' + detalle : ''}`);
};

// `channel: 'chrome'` usa el Chrome ya instalado: el Chromium propio de esta
// version de Playwright no esta descargado y no hace falta bajarlo.
// Con `--ver` se abre una ventana de verdad y va despacio para poder mirarla.
const VER = process.argv.includes('--ver');
const navegador = await chromium.launch({
  channel: 'chrome',
  headless: !VER,
  slowMo: VER ? 350 : 0,
  args: VER ? ['--window-size=1400,950'] : [],
});
const contexto = await navegador.newContext({
  viewport: VER ? { width: 1380, height: 860 } : { width: 1280, height: 800 },
});
const pagina = await contexto.newPage();

const errores = [];
pagina.on('console', (m) => {
  if (m.type() === 'error') errores.push(`consola: ${m.text()}`);
});
pagina.on('pageerror', (e) => errores.push(`excepcion: ${e.message}`));

const erroresDe = async (url, espera) => {
  errores.length = 0;
  await pagina.goto(`${B}${url}`, { waitUntil: 'networkidle' });
  if (espera) await espera();
  return [...errores];
};

try {
  console.log('=== 1. Ficha de ejercicio, SIN sesion (publica y estatica) ===');
  let e = await erroresDe('/ejercicios/flexiones');
  const vacio = await pagina.textContent('#historial-cuerpo');
  ok('la ficha no da errores para un anonimo', e.length === 0, e.join(' | '));
  ok(
    'enseña el estado vacio en vez de romperse',
    (vacio ?? '').includes('Todavía no has registrado'),
    (vacio ?? '').slice(0, 60),
  );
  const pildora = await pagina.textContent('header');
  ok('la barra ofrece Entrar', (pildora ?? '').includes('Entrar'));

  console.log('\n=== 2. Entrar ===');
  await pagina.goto(`${B}/login?volver=%2Fhistorial`);
  await pagina.fill('#correo', CORREO);
  await pagina.fill('#clave', CLAVE);
  errores.length = 0;
  await Promise.all([
    pagina.waitForURL('**/historial', { timeout: 15000 }),
    pagina.click('#enviar'),
  ]);
  ok('entrar lleva al destino guardado', pagina.url().endsWith('/historial'));

  console.log('\n=== 3. Historial (lee del servidor) ===');
  await pagina.waitForLoadState('networkidle');
  const fallo = await pagina
    .locator('#fallo')
    .isVisible()
    .catch(() => false);
  ok('historial sin caja de error', fallo === false);
  ok('historial sin errores de consola', errores.length === 0, errores.join(' | '));

  console.log('\n=== 4. Ajustes (lee y escribe en el servidor) ===');
  e = await erroresDe('/configuracion');
  ok('ajustes sin errores', e.length === 0, e.join(' | '));
  const antes = await pagina.inputValue('#descanso');
  const nuevo = String(Number(antes) === 90 ? 75 : 90);
  await pagina.fill('#descanso', nuevo);
  await pagina.dispatchEvent('#descanso', 'change');
  await pagina.waitForTimeout(1200);
  const aviso = await pagina.textContent('#aviso');
  ok('guardar avisa', (aviso ?? '').includes('Guardado'), (aviso ?? '').slice(0, 40));

  await pagina.reload({ waitUntil: 'networkidle' });
  const persistido = await pagina.inputValue('#descanso');
  ok(
    'el cambio sobrevive a recargar (esta en Postgres)',
    persistido === nuevo,
    `${antes} -> ${persistido}`,
  );

  const cuenta = await pagina.textContent('#cuenta ~ *, section[aria-labelledby="cuenta"]');
  ok('ajustes enseña la cuenta', (cuenta ?? '').includes(CORREO), (cuenta ?? '').slice(0, 60));

  console.log('\n=== 5. Consejos ===');
  e = await erroresDe('/consejos');
  ok('consejos sin errores', e.length === 0, e.join(' | '));

  console.log('\n=== 6. Entrenar (isla de Vue + guardado por serie) ===');
  e = await erroresDe('/semana/1/dia/1/entrenar', async () => {
    await pagina.waitForTimeout(2000);
  });
  ok('la pantalla de entreno monta sin errores', e.length === 0, e.join(' | '));
  const textoEntreno = await pagina.textContent('body');
  ok('el modo entreno ha pintado algo', (textoEntreno ?? '').length > 500);

  console.log('\n=== 7. La sesion en curso llega al servidor ===');
  // La pantalla crea y guarda la sesion nada mas montar.
  const activa = await pagina.evaluate(async () => {
    const res = await fetch('/_actions/sessions.getActive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    return { estado: res.status, cuerpo: (await res.text()).slice(0, 120) };
  });
  ok(
    'hay sesion en curso en Postgres',
    activa.estado === 200 && !activa.cuerpo.startsWith('[null'),
    JSON.stringify(activa),
  );

  const espejo = await pagina.evaluate(() =>
    window.localStorage.getItem('mfw:remote:active-session'),
  );
  ok(
    'y tambien espejo en el navegador',
    typeof espejo === 'string' && espejo.includes('"synced":true'),
    espejo ? espejo.slice(0, 60) : 'sin espejo',
  );

  console.log('\n=== 8. La barra reconoce la cuenta ===');
  await pagina.goto(`${B}/`, { waitUntil: 'networkidle' });
  await pagina.waitForTimeout(800);
  const barra = await pagina.textContent('header');
  ok(
    'la isla de la barra enseña Salir',
    (barra ?? '').includes('Salir'),
    (barra ?? '').replace(/\s+/g, ' ').slice(0, 80),
  );
} catch (error) {
  fallos += 1;
  console.log(`FALLO excepcion en la prueba: ${error.message}`);
} finally {
  await navegador.close();
}

console.log(`\n${fallos === 0 ? 'TODO EN VERDE' : `${fallos} FALLO(S)`}`);
process.exit(fallos === 0 ? 0 : 1);
