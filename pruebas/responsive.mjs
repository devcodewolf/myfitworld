/**
 * Que ninguna pantalla se desborde a lo ancho en el móvil.
 *
 * Recorre todas las pantallas a varias anchuras de teléfono y mide dos cosas:
 * si la página entera se puede deslizar de lado (el fallo que se ve), y qué
 * elementos se salen por la derecha (la causa). Un elemento dentro de un
 * contenedor que se desliza a propósito —una tabla ancha, por ejemplo— no
 * cuenta: ese desbordamiento es una decisión, no un fallo.
 *
 * Necesita entrar en las pantallas privadas y en las de administración, así
 * que crea una cuenta desechable, la asciende a admin y la borra al acabar,
 * pase lo que pase. Usa `DATABASE_OWNER_URL` para eso.
 *
 *   node --env-file=.env pruebas/responsive.mjs            # contra pnpm dev
 *   node --env-file=.env pruebas/responsive.mjs --ver      # con ventana
 *
 * Sale con código 1 si alguna pantalla se desborda.
 */
import pg from 'pg';

const { chromium } =
  await import('file:///C:/Program Files/nodejs/node_modules/@playwright/cli/node_modules/playwright/index.mjs');

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const WIDTHS = [360, 390, 768];
const ROUTES = [
  '/',
  '/semana/1',
  '/semana/1/dia/1',
  '/semana/1/dia/3',
  '/semana/1/dia/1/entrenar',
  '/ejercicios',
  '/ejercicios/flexiones',
  '/ejercicios/curl-concentrado',
  '/historial',
  '/configuracion',
  '/consejos',
  '/admin',
  '/admin/papelera',
  '/no-existe',
];

const EMAIL = `responsive-${Date.now()}@ejemplo.com`;
const PASSWORD = 'contrasena-desechable-1';

const db = new pg.Client({ connectionString: process.env.DATABASE_OWNER_URL });
await db.connect();

const browser = await chromium.launch({
  channel: 'chrome',
  headless: !process.argv.includes('--ver'),
});
let failures = 0;

try {
  // ── Cuenta desechable ──────────────────────────────────────────────────
  const invite = await db.query(`select value from app_config where key = 'signup_invite_code'`);
  const code = invite.rows[0]?.value ?? process.env.SIGNUP_INVITE_CODE ?? '';

  const context = await browser.newContext();
  const signUp = await context.request.post(`${BASE}/api/auth/sign-up/email`, {
    headers: { origin: BASE, 'x-codigo-invitacion': code },
    data: { email: EMAIL, password: PASSWORD, name: 'Responsive' },
  });
  if (!signUp.ok()) throw new Error(`No se pudo crear la cuenta de prueba: ${signUp.status()}`);
  await db.query(`update "user" set role = 'admin' where email = $1`, [EMAIL]);

  // ── El recorrido ───────────────────────────────────────────────────────
  const page = await context.newPage();
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 800 });
    for (const route of ROUTES) {
      await page.goto(BASE + route, { waitUntil: 'networkidle' });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );

      // Para encontrar la causa, se fija la columna del `<body>` al ancho de la
      // pantalla. Sin esto, un solo elemento ancho estira la rejilla entera y lo
      // único que se ve es que «la cabecera y el contenido se salen», que es el
      // síntoma, no el culpable. Solo afecta al diagnóstico: el resultado de
      // arriba ya se midió con la página tal cual.
      await page.addStyleTag({
        content:
          'body { grid-template-columns: minmax(0, 1fr) !important } body > * { min-width: 0 !important }',
      });
      const report = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;

        /** ¿Lo recorta o lo desliza a propósito algún antepasado? */
        const contained = (el) => {
          for (
            let node = el.parentElement;
            node && node !== document.body;
            node = node.parentElement
          ) {
            const style = getComputedStyle(node);
            if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) return true;
          }
          return false;
        };
        const describe = (el) => {
          const cls =
            typeof el.className === 'string'
              ? el.className.trim().split(/\s+/).slice(0, 6).join('.')
              : '';
          const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
          return `<${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}> «${text}»`;
        };

        const offenders = [];
        for (const el of document.body.querySelectorAll('*')) {
          if (el.closest('astro-dev-toolbar, dialog:not([open]), [popover]:not(:popover-open)'))
            continue;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.right <= viewport + 1) continue;
          if (getComputedStyle(el).position === 'fixed' || contained(el)) continue;
          // Solo el más externo: si el padre ya se sale, el hijo no aporta nada nuevo.
          const parent = el.parentElement;
          if (parent && parent.getBoundingClientRect().right > viewport + 1 && !contained(parent))
            continue;
          offenders.push(`${describe(el)} → se sale ${Math.round(rect.right - viewport)} px`);
        }
        return { offenders: offenders.slice(0, 6) };
      });

      const ok = overflow <= 0 && report.offenders.length === 0;
      if (!ok) failures++;
      console.log(
        `${ok ? 'ok  ' : 'MAL '} ${String(width).padStart(4)} px  ${route}` +
          (overflow > 0 ? `  (la página se desliza ${overflow} px)` : ''),
      );
      for (const line of report.offenders) console.log(`        ${line}`);
    }
  }
} finally {
  await browser.close();
  // La cuenta y todo lo que arrastre (perfil, ajustes, sesiones) se van en cascada.
  await db.query(`delete from "user" where email = $1`, [EMAIL]);
  await db.end();
}

console.log(
  failures === 0 ? '\nNinguna pantalla se desborda.' : `\n${failures} pantallas se desbordan.`,
);
process.exit(failures === 0 ? 0 : 1);
