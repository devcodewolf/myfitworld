// El puente del paso 7: subir a la cuenta lo que este navegador guardaba antes.
// Se siembra un `mfw:state` con la forma que escribia el repositorio local y se
// comprueba que el boton aparece, sube y no borra el original.
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

const uuid = () => crypto.randomUUID();
const ahora = new Date('2026-08-01T10:00:00.000Z').toISOString();
const perfilViejo = uuid();

const estadoViejo = {
  schemaVersion: 1,
  profiles: [{ id: perfilViejo, name: 'Yo', createdAt: ahora }],
  sessions: [
    {
      id: uuid(),
      profileId: perfilViejo,
      mesocycleId: 'mesociclo-viejo',
      weekOrder: 1,
      dayOrder: 2,
      status: 'completed',
      startedAt: ahora,
      finishedAt: new Date('2026-08-01T11:00:00.000Z').toISOString(),
      restMultiplier: 1,
      exercises: [
        {
          blockKey: 'flexiones',
          exerciseId: 'flexiones',
          sets: [
            { id: uuid(), setIndex: 1, reps: 12, weightKg: 0, skipped: false, completedAt: ahora },
          ],
        },
      ],
      createdAt: ahora,
      updatedAt: ahora,
    },
  ],
  settings: [],
};

// Con `--ver` se abre una ventana de verdad y va despacio para poder mirarla.
const VER = process.argv.includes('--ver');
const navegador = await chromium.launch({
  channel: 'chrome',
  headless: !VER,
  slowMo: VER ? 350 : 0,
  args: VER ? ['--window-size=1400,950'] : [],
});
const pagina = await (
  await navegador.newContext({ viewport: { width: 1380, height: 860 } })
).newPage();
const errores = [];
pagina.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
pagina.on('pageerror', (e) => errores.push(e.message));

try {
  await pagina.goto(`${B}/login`);
  await pagina.fill('#correo', CORREO);
  await pagina.fill('#clave', CLAVE);
  await Promise.all([pagina.waitForURL(`${B}/`, { timeout: 15000 }), pagina.click('#enviar')]);

  // `writeDocument` guarda el estado tal cual, sin sobre: el numero de version
  // viaja dentro, en `schemaVersion`. Envolverlo lo manda a cuarentena.
  await pagina.evaluate((estado) => {
    for (const k of Object.keys(window.localStorage)) {
      if (k.startsWith('mfw:quarantine:')) window.localStorage.removeItem(k);
    }
    window.localStorage.setItem('mfw:state', JSON.stringify(estado));
  }, estadoViejo);

  console.log('=== El panel de mudanza aparece ===');
  errores.length = 0;
  await pagina.goto(`${B}/configuracion`, { waitUntil: 'networkidle' });
  await pagina.waitForTimeout(1000);
  const visible = await pagina.locator('#mudanza').isVisible();
  ok('el panel aparece porque hay algo que traer', visible);
  const resumen = await pagina.textContent('#mudanza-resumen');
  ok('dice cuanto hay', (resumen ?? '').includes('1 sesión'), resumen ?? '');
  ok('sin errores al detectarlo', errores.length === 0, errores.join(' | '));

  console.log('\n=== Subir a la cuenta ===');
  errores.length = 0;
  await pagina.click('#traer-local');
  await pagina.waitForTimeout(2500);
  const aviso = await pagina.textContent('#aviso');
  ok(
    'avisa de lo que ha traido',
    (aviso ?? '').includes('Traído a tu cuenta'),
    (aviso ?? '').slice(0, 80),
  );
  ok('sin errores al subir', errores.length === 0, errores.join(' | '));
  ok('el panel desaparece al terminar', (await pagina.locator('#mudanza').isVisible()) === false);

  const original = await pagina.evaluate(() => window.localStorage.getItem('mfw:state'));
  ok(
    'NO se ha borrado lo de este navegador',
    typeof original === 'string' && original.includes('mesociclo-viejo'),
  );

  console.log('\n=== Esta de verdad en el servidor ===');
  const enServidor = await pagina.evaluate(async () => {
    const res = await fetch('/_actions/state.snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    return (await res.text()).includes('mesociclo-viejo');
  });
  ok('la copia del servidor contiene la sesion vieja', enServidor);

  errores.length = 0;
  await pagina.goto(`${B}/historial`, { waitUntil: 'networkidle' });
  await pagina.waitForTimeout(1200);
  const historial = await pagina.textContent('body');
  ok(
    'el historial ya no esta vacio',
    !(historial ?? '').includes('Todavía no hay ninguna sesión'),
    '',
  );
  ok('historial sin errores', errores.length === 0, errores.join(' | '));

  console.log('\n=== Repetirlo no duplica ===');
  await pagina.goto(`${B}/configuracion`, { waitUntil: 'networkidle' });
  await pagina.waitForTimeout(1000);
  if (await pagina.locator('#mudanza').isVisible()) {
    await pagina.click('#traer-local');
    await pagina.waitForTimeout(2500);
    const segundo = await pagina.textContent('#aviso');
    ok(
      'la segunda vez no añade nada nuevo',
      (segundo ?? '').includes('0 sesiones nuevas'),
      (segundo ?? '').slice(0, 80),
    );
  } else {
    ok('la segunda vez no añade nada nuevo', false, 'el panel no volvio a aparecer');
  }
} catch (error) {
  fallos += 1;
  console.log(`FALLO excepcion: ${error.message}`);
} finally {
  await navegador.close();
}

console.log(`\n${fallos === 0 ? 'TODO EN VERDE' : `${fallos} FALLO(S)`}`);
process.exit(fallos === 0 ? 0 : 1);
