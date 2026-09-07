/**
 * Controlador de las pantallas de administración de cuentas.
 *
 * Una sola tabla que sirve para las dos vistas —cuentas activas y papelera—
 * porque son la misma lista con acciones distintas. Vanilla, como el resto de
 * lo que no es el modo entreno.
 *
 * Todo pasa por las acciones de `src/actions/admin.ts`, que comprueban quién
 * llama. Aquí no hay ninguna decisión de permisos: esconder un botón no es
 * seguridad, y si esta pantalla se equivoca lo peor que pasa es que el servidor
 * conteste que no.
 */
import { actions } from 'astro:actions';

import { routes } from '@/routes';

const IMPERSONATE_PATH = routes.impersonate();

export interface Account {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: 'user' | 'admin';
  readonly banned: boolean;
  readonly banReason: string | null;
  readonly createdAt: string;
  readonly deletedAt: string | null;
}

const el = <T extends HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;

const fecha = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

function node(tag: string, className: string, text?: string): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

/** Botón de fila. Sin acento: el cian está reservado a la acción primaria. */
const ACTION =
  'min-h-9 rounded-full border border-line px-3.5 text-sm font-semibold text-ink-dim transition-colors hover:border-line-strong hover:text-ink';

/** El único destructivo de verdad. Se distingue por el borde, no por color. */
const DANGER =
  'min-h-9 rounded-full border border-line-strong px-3.5 text-sm font-bold text-ink transition-colors hover:border-ink';

const CELL = 'px-4 py-3 align-middle';

function announce(message: string, tone: 'ok' | 'error' = 'ok'): void {
  const box = el<HTMLParagraphElement>('aviso');
  if (!box) return;
  box.textContent = message;
  box.dataset['tone'] = tone;
  box.hidden = message === '';
}

/** Una etiqueta de estado: rol, suspendida, en papelera. */
function badge(text: string, strong = false): HTMLElement {
  return node(
    'span',
    `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${
      strong ? 'border-line-strong text-ink' : 'border-line text-ink-dim'
    }`,
    text,
  );
}

interface Accion {
  readonly texto: string;
  readonly peligrosa?: boolean;
  run(cuenta: Account): Promise<string>;
}

/** Envuelve una llamada a una acción y devuelve su mensaje de error, si lo hay. */
async function llamar(
  promesa: Promise<{ error?: { message: string } | undefined }>,
): Promise<void> {
  const { error } = await promesa;
  if (error) throw new Error(error.message);
}

function pedir(mensaje: string, valorPorDefecto = ''): string | null {
  const valor = window.prompt(mensaje, valorPorDefecto);
  return valor === null || valor.trim() === '' ? null : valor.trim();
}

/** Las acciones de una cuenta activa. */
function accionesActivas(): Accion[] {
  return [
    {
      texto: 'Cambiar rol',
      async run(cuenta) {
        const nuevo = cuenta.role === 'admin' ? 'user' : 'admin';
        await llamar(actions.admin.setRole({ userId: cuenta.id, role: nuevo }));
        return `${cuenta.email} ahora es ${nuevo}.`;
      },
    },
    {
      texto: 'Cambiar contraseña',
      async run(cuenta) {
        const clave = pedir(`Nueva contraseña para ${cuenta.email}:`);
        if (clave === null) return '';
        await llamar(actions.admin.setPassword({ userId: cuenta.id, password: clave }));
        return `Contraseña de ${cuenta.email} cambiada.`;
      },
    },
    {
      texto: 'Suspender',
      async run(cuenta) {
        if (cuenta.banned) {
          await llamar(actions.admin.unban({ userId: cuenta.id }));
          return `${cuenta.email} vuelve a poder entrar.`;
        }
        const motivo = pedir(`Motivo para suspender a ${cuenta.email} (opcional):`) ?? undefined;
        await llamar(
          actions.admin.ban({ userId: cuenta.id, ...(motivo ? { reason: motivo } : {}) }),
        );
        return `${cuenta.email} suspendida.`;
      },
    },
    {
      texto: 'A la papelera',
      async run(cuenta) {
        await llamar(actions.admin.trash({ userId: cuenta.id }));
        return `${cuenta.email} está en la papelera. Sus datos siguen intactos.`;
      },
    },
  ];
}

/** Las acciones de una cuenta en la papelera. */
function accionesPapelera(): Accion[] {
  return [
    {
      texto: 'Restaurar',
      async run(cuenta) {
        await llamar(actions.admin.restore({ userId: cuenta.id }));
        return `${cuenta.email} vuelve a estar activa.`;
      },
    },
    {
      texto: 'Borrar para siempre',
      peligrosa: true,
      async run(cuenta) {
        // El aviso dice exactamente qué se pierde. «¿Seguro?» no informa de nada.
        const confirmado = window.confirm(
          `Se va a borrar la cuenta ${cuenta.email} y CON ELLA su historial de ` +
            'entrenamiento entero, sus ajustes y su perfil.\n\n' +
            'No se puede deshacer y no hay ninguna copia de donde sacarlo.\n\n' +
            '¿Continuar?',
        );
        if (!confirmado) return '';
        await llamar(actions.admin.removeForever({ userId: cuenta.id }));
        return `${cuenta.email} borrada definitivamente.`;
      },
    },
  ];
}

function fila(cuenta: Account, acciones: Accion[], onCambio: () => void): HTMLTableRowElement {
  const tr = document.createElement('tr');
  tr.className = 'border-t border-line';

  const quien = node('td', CELL);
  quien.append(
    node('span', 'block text-sm font-bold text-ink', cuenta.name),
    node('span', 'block text-sm text-ink-faint', cuenta.email),
  );

  const estado = node('td', `${CELL} space-x-1.5 whitespace-nowrap`);
  estado.append(badge(cuenta.role === 'admin' ? 'Admin' : 'Usuario', cuenta.role === 'admin'));
  if (cuenta.banned) estado.append(badge('Suspendida', true));

  const alta = node('td', `${CELL} figures text-sm whitespace-nowrap text-ink-faint`);
  alta.textContent = fecha(cuenta.deletedAt ?? cuenta.createdAt);

  const botones = node('td', `${CELL} text-right`);
  const grupo = node('div', 'flex flex-wrap justify-end gap-2');
  for (const accion of acciones) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = accion.peligrosa ? DANGER : ACTION;
    boton.textContent = accion.texto === 'Suspender' && cuenta.banned ? 'Reactivar' : accion.texto;
    boton.addEventListener('click', () => {
      void (async () => {
        boton.disabled = true;
        try {
          const mensaje = await accion.run(cuenta);
          if (mensaje) {
            announce(mensaje);
            onCambio();
          }
        } catch (error) {
          announce(error instanceof Error ? error.message : String(error), 'error');
        } finally {
          boton.disabled = false;
        }
      })();
    });
    grupo.append(boton);
  }
  // Suplantar va aparte, y como formulario: la respuesta trae la cookie de la
  // sesión nueva, y eso solo funciona con una navegación de verdad. Es lo
  // mismo que hace el botón de salir.
  if (!cuenta.deletedAt) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = IMPERSONATE_PATH;
    const oculto = document.createElement('input');
    oculto.type = 'hidden';
    oculto.name = 'userId';
    oculto.value = cuenta.id;
    const boton = document.createElement('button');
    boton.type = 'submit';
    boton.className = ACTION;
    boton.textContent = 'Entrar como';
    form.append(oculto, boton);
    grupo.append(form);
  }

  botones.append(grupo);

  tr.append(quien, estado, alta, botones);
  return tr;
}

async function pintar(cuerpo: HTMLElement, vacio: HTMLElement, trashed: boolean): Promise<void> {
  const { data, error } = await actions.admin.list({ trashed });
  if (error) throw new Error(error.message);

  const cuentas = (data ?? []) as Account[];
  cuerpo.replaceChildren();
  vacio.hidden = cuentas.length > 0;

  const acciones = trashed ? accionesPapelera() : accionesActivas();
  const recargar = (): void => void pintar(cuerpo, vacio, trashed);
  for (const cuenta of cuentas) cuerpo.append(fila(cuenta, acciones, recargar));
}

export async function mountAdminPage(trashed: boolean): Promise<void> {
  const cuerpo = el<HTMLTableSectionElement>('cuentas');
  const vacio = el<HTMLElement>('sin-cuentas');
  if (!cuerpo || !vacio) throw new Error('Falta la tabla de cuentas.');

  const formulario = el<HTMLFormElement>('form-cuenta');
  formulario?.addEventListener('submit', (event) => {
    event.preventDefault();
    void (async () => {
      const datos = new FormData(formulario);
      try {
        await llamar(
          actions.admin.create({
            email: String(datos.get('correo') ?? '').trim(),
            name: String(datos.get('nombre') ?? '').trim(),
            password: String(datos.get('clave') ?? ''),
            role: datos.get('rol') === 'admin' ? 'admin' : 'user',
          }),
        );
        formulario.reset();
        announce('Cuenta creada.');
        await pintar(cuerpo, vacio, trashed);
      } catch (error) {
        announce(error instanceof Error ? error.message : String(error), 'error');
      }
    })();
  });

  await pintar(cuerpo, vacio, trashed);
}
