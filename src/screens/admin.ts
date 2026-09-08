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

function announce(message: string, tone: 'ok' | 'error' = 'ok'): void {
  const box = el<HTMLParagraphElement>('aviso');
  if (!box) return;
  box.textContent = message;
  box.dataset['tone'] = tone;
  box.hidden = message === '';
}

/* ── El diálogo ─────────────────────────────────────────────────────────── */

interface DialogoOpciones {
  readonly titulo: string;
  readonly texto: string;
  readonly confirmar: string;
  /** Rojo solo cuando lo que se va a hacer no tiene vuelta atrás. */
  readonly destructivo?: boolean;
  /** Si se pide un valor: cómo es el campo. Sin esto, es una confirmación. */
  readonly campo?: {
    readonly etiqueta: string;
    readonly tipo?: string;
    readonly ayuda?: string;
    readonly obligatorio?: boolean;
  };
}

/** Lo escrito, o `null` si se canceló. En una confirmación, cadena vacía. */
type Respuesta = string | null;

/**
 * Abre el diálogo y espera a que se cierre.
 *
 * Sustituye a `prompt` y `confirm` del navegador, que además de no poder
 * vestirse tampoco se pueden escribir: `confirm` solo sabe decir «Aceptar» y
 * «Cancelar», y en un borrado irreversible el botón tiene que decir qué hace.
 *
 * Es un `<dialog>` de verdad, así que atrapa el foco, cierra con Escape y
 * oscurece lo de detrás sin que haya que programar ninguna de las tres cosas.
 */
function preguntar(opciones: DialogoOpciones): Promise<Respuesta> {
  const dialogo = el<HTMLDialogElement>('dialogo');
  const confirmar = el<HTMLButtonElement>('dialogo-confirmar');
  const campo = el<HTMLLabelElement>('dialogo-campo');
  const valor = el<HTMLInputElement>('dialogo-valor');
  if (!dialogo || !confirmar || !campo || !valor) return Promise.resolve(null);

  const titulo = el<HTMLHeadingElement>('dialogo-titulo');
  const texto = el<HTMLParagraphElement>('dialogo-texto');
  if (titulo) titulo.textContent = opciones.titulo;
  if (texto) texto.textContent = opciones.texto;

  confirmar.textContent = opciones.confirmar;
  // El único rojo del proyecto, y solo aquí: lo que destruye datos sin vuelta
  // atrás. El resto de lo destructivo se distingue por el borde, no por color.
  const destructivo = opciones.destructivo === true;
  confirmar.classList.toggle('bg-error', destructivo);
  confirmar.classList.toggle('text-error-content', destructivo);
  confirmar.classList.toggle('accion-primaria', !destructivo);
  confirmar.classList.toggle('text-accent-ink', !destructivo);

  campo.hidden = opciones.campo === undefined;
  valor.disabled = opciones.campo === undefined;
  valor.value = '';
  if (opciones.campo) {
    const etiqueta = el<HTMLSpanElement>('dialogo-etiqueta');
    const ayuda = el<HTMLSpanElement>('dialogo-ayuda');
    if (etiqueta) etiqueta.textContent = opciones.campo.etiqueta;
    if (ayuda) ayuda.textContent = opciones.campo.ayuda ?? '';
    valor.type = opciones.campo.tipo ?? 'text';
    valor.required = opciones.campo.obligatorio === true;
    valor.autocomplete = 'off';
  }

  return new Promise<Respuesta>((resolve) => {
    const alCerrar = (): void => {
      dialogo.removeEventListener('close', alCerrar);
      // `returnValue` lo pone el botón que envió el formulario. El fondo y la
      // tecla Escape lo dejan vacío, que también es cancelar.
      resolve(dialogo.returnValue === 'confirmar' ? valor.value.trim() : null);
    };
    dialogo.addEventListener('close', alCerrar);
    dialogo.returnValue = '';
    dialogo.showModal();
    if (opciones.campo) valor.focus();
  });
}

/* ── Las acciones de una fila ───────────────────────────────────────────── */

interface Accion {
  readonly texto: string;
  readonly destructiva?: boolean;
  /** El aviso que se enseña, o cadena vacía si se canceló. */
  run(cuenta: Account): Promise<string>;
}

async function llamar(
  promesa: Promise<{ error?: { message: string } | undefined }>,
): Promise<void> {
  const { error } = await promesa;
  if (error) throw new Error(error.message);
}

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
        const clave = await preguntar({
          titulo: 'Cambiar contraseña',
          texto: `Se le pondrá una contraseña nueva a ${cuenta.email}.`,
          confirmar: 'Cambiarla',
          campo: {
            etiqueta: 'Contraseña nueva',
            tipo: 'password',
            ayuda: 'Mínimo 10 caracteres.',
            obligatorio: true,
          },
        });
        if (clave === null || clave === '') return '';
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
        const motivo = await preguntar({
          titulo: 'Suspender la cuenta',
          texto: `${cuenta.email} dejará de poder entrar. Sus datos no se tocan y puedes reactivarla cuando quieras.`,
          confirmar: 'Suspender',
          campo: { etiqueta: 'Motivo', ayuda: 'Opcional. Se guarda con la suspensión.' },
        });
        if (motivo === null) return '';
        await llamar(
          actions.admin.ban({ userId: cuenta.id, ...(motivo ? { reason: motivo } : {}) }),
        );
        return `${cuenta.email} suspendida.`;
      },
    },
    {
      texto: 'A la papelera',
      async run(cuenta) {
        // Se pregunta aunque no sea irreversible: la cuenta deja de poder
        // entrar y sus sesiones abiertas se cierran, y eso no es un cambio que
        // deba ocurrir por un clic de más. Sin rojo: esto se deshace.
        const confirmado = await preguntar({
          titulo: 'Mandar a la papelera',
          texto:
            `${cuenta.email} dejará de poder entrar y se le cerrarán las sesiones que tenga ` +
            'abiertas.\n\n' +
            'Sus entrenos, sus ajustes y su perfil no se tocan: desde la papelera puedes ' +
            'restaurarla tal y como estaba.',
          confirmar: 'A la papelera',
        });
        if (confirmado === null) return '';
        await llamar(actions.admin.trash({ userId: cuenta.id }));
        return `${cuenta.email} está en la papelera. Sus datos siguen intactos.`;
      },
    },
  ];
}

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
      destructiva: true,
      async run(cuenta) {
        // El aviso dice exactamente qué se pierde. «¿Seguro?» no informa de nada.
        const confirmado = await preguntar({
          titulo: 'Borrar para siempre',
          texto:
            `Se borrará la cuenta ${cuenta.email} y con ella su historial de entrenamiento ` +
            'entero, sus ajustes y su perfil.\n\n' +
            'No se puede deshacer y no hay ninguna copia de donde sacarlo.',
          confirmar: 'Borrar para siempre',
          destructivo: true,
        });
        if (confirmado === null) return '';
        await llamar(actions.admin.removeForever({ userId: cuenta.id }));
        return `${cuenta.email} borrada definitivamente.`;
      },
    },
  ];
}

/* ── La tabla ───────────────────────────────────────────────────────────── */

/** Los tres puntos: hay más opciones y hay que pulsar para verlas. */
function puntosSuspensivos(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'size-5');
  for (const cx of [5, 12, 19]) {
    const punto = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    punto.setAttribute('cx', String(cx));
    punto.setAttribute('cy', '12');
    punto.setAttribute('r', '1.75');
    svg.append(punto);
  }
  return svg;
}

function badge(texto: string, fuerte = false): HTMLElement {
  return node(
    'span',
    `badge badge-sm border-line font-bold whitespace-nowrap ${
      fuerte ? 'bg-raised text-ink' : 'bg-transparent text-ink-dim'
    }`,
    texto,
  );
}

/**
 * El menú de una fila.
 *
 * Va con la **API de popover**, no con el desplegable normal, y por un motivo
 * concreto: la tabla vive dentro de un contenedor que recorta lo que se sale
 * —lo necesita para poder deslizarse en horizontal en un móvil— y un menú
 * corriente se quedaba cortado por el borde. Un popover se dibuja en la capa
 * superior del navegador, por encima de todo, así que el recorte no le afecta.
 *
 * De regalo: se cierra solo al pulsar fuera y con la tecla Escape, sin
 * escribir una línea para ello.
 */
function menuDeFila(cuenta: Account, acciones: Accion[], alCambiar: () => void): HTMLElement {
  const contenedor = node('div', 'inline-block');
  const idMenu = `menu-${cuenta.id}`;
  const ancla = `--ancla-${cuenta.id}`;

  const disparador = document.createElement('button');
  disparador.type = 'button';
  disparador.className =
    'btn btn-square btn-ghost h-10 min-h-10 w-10 rounded-full text-ink-dim hover:bg-raised hover:text-ink';
  disparador.setAttribute('popovertarget', idMenu);
  disparador.style.setProperty('anchor-name', ancla);
  disparador.setAttribute('aria-label', `Opciones de ${cuenta.email}`);
  disparador.append(puntosSuspensivos());

  const lista = node(
    'ul',
    'dropdown dropdown-end menu w-60 rounded-card border border-line bg-raised p-2',
  );
  lista.id = idMenu;
  lista.setAttribute('popover', '');
  lista.style.setProperty('position-anchor', ancla);

  const ejecutar = async (accion: Accion, boton: HTMLButtonElement): Promise<void> => {
    // Cerrar antes de nada: si se abre un diálogo con el menú aún desplegado,
    // el menú se queda flotando por detrás.
    lista.hidePopover();
    boton.disabled = true;
    try {
      const mensaje = await accion.run(cuenta);
      if (mensaje) {
        announce(mensaje);
        alCambiar();
      }
    } catch (error) {
      announce(error instanceof Error ? error.message : String(error), 'error');
    } finally {
      boton.disabled = false;
    }
  };

  for (const accion of acciones) {
    const item = document.createElement('li');
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = accion.destructiva ? 'font-bold text-error' : 'text-ink-dim hover:text-ink';
    boton.textContent = accion.texto === 'Suspender' && cuenta.banned ? 'Reactivar' : accion.texto;
    boton.addEventListener('click', () => void ejecutar(accion, boton));
    item.append(boton);
    lista.append(item);
  }

  // Suplantar va como formulario: la respuesta trae la cookie de la sesión
  // nueva, y eso solo funciona con una navegación de verdad.
  if (!cuenta.deletedAt) {
    const item = document.createElement('li');
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = IMPERSONATE_PATH;
    form.className = 'text-ink-dim hover:text-ink';
    const oculto = document.createElement('input');
    oculto.type = 'hidden';
    oculto.name = 'userId';
    oculto.value = cuenta.id;
    const boton = document.createElement('button');
    boton.type = 'submit';
    boton.className = 'w-full cursor-pointer text-left';
    boton.textContent = 'Entrar como';
    form.append(oculto, boton);
    item.append(form);
    lista.append(item);
  }

  contenedor.append(disparador, lista);
  return contenedor;
}

function fila(cuenta: Account, acciones: Accion[], alCambiar: () => void): HTMLTableRowElement {
  const tr = document.createElement('tr');
  tr.className = 'border-line';

  const quien = document.createElement('td');
  quien.append(
    node('span', 'block font-bold text-ink', cuenta.name),
    node('span', 'block text-sm text-ink-faint', cuenta.email),
  );

  const estado = document.createElement('td');
  estado.className = 'space-x-1.5 whitespace-nowrap';
  estado.append(badge(cuenta.role === 'admin' ? 'Admin' : 'Usuario', cuenta.role === 'admin'));
  if (cuenta.banned) estado.append(badge('Suspendida', true));

  const cuando = document.createElement('td');
  cuando.className = 'figures text-sm whitespace-nowrap text-ink-faint';
  cuando.textContent = fecha(cuenta.deletedAt ?? cuenta.createdAt);

  const opciones = document.createElement('td');
  opciones.className = 'text-right';
  opciones.append(menuDeFila(cuenta, acciones, alCambiar));

  tr.append(quien, estado, cuando, opciones);
  return tr;
}

/**
 * Pinta la tabla.
 *
 * `yaCargadas` es la lista que vino dentro de la página: con ella la primera
 * pintada no espera a nadie. Sin ella —después de cambiar algo— se piden al
 * servidor, que es lo correcto: acabas de tocar los datos y hay que releerlos.
 */
async function pintar(
  cuerpo: HTMLElement,
  vacio: HTMLElement,
  trashed: boolean,
  yaCargadas?: readonly Account[],
): Promise<void> {
  let cuentas: Account[];
  if (yaCargadas) {
    cuentas = [...yaCargadas];
  } else {
    const { data, error } = await actions.admin.list({ trashed });
    if (error) throw new Error(error.message);
    cuentas = (data ?? []) as Account[];
  }

  cuerpo.replaceChildren();
  vacio.hidden = cuentas.length > 0;

  const acciones = trashed ? accionesPapelera() : accionesActivas();
  const recargar = (): void => void pintar(cuerpo, vacio, trashed);
  for (const cuenta of cuentas) cuerpo.append(fila(cuenta, acciones, recargar));
}

export interface AdminPayload {
  /** Qué vista es: cuentas activas o papelera. */
  readonly trashed: boolean;
  /** Las cuentas, ya resueltas por el servidor al montar la página. */
  readonly cuentas: readonly Account[];
}

/**
 * El código de invitación: verlo, cambiarlo, o generar uno nuevo.
 *
 * Solo está en `/admin`, no en la papelera, así que si no encuentra el
 * formulario se va sin ruido.
 */
function mountInviteCode(): void {
  const formulario = el<HTMLFormElement>('form-invitacion');
  const campo = el<HTMLInputElement>('codigo');
  if (!formulario || !campo) return;

  el<HTMLButtonElement>('generar-codigo')?.addEventListener('click', () => {
    // Tres grupos de cinco: largo de sobra y todavía se puede dictar por
    // teléfono, que es como se comparte de verdad un código así.
    const alfabeto = 'abcdefghijkmnpqrstuvwxyz23456789';
    const azar = crypto.getRandomValues(new Uint8Array(15));
    const letras = [...azar].map((n) => alfabeto[n % alfabeto.length]).join('');
    campo.value = [letras.slice(0, 5), letras.slice(5, 10), letras.slice(10, 15)].join('-');
    campo.focus();
  });

  formulario.addEventListener('submit', (event) => {
    event.preventDefault();
    void (async () => {
      try {
        await llamar(actions.admin.setInviteCode({ code: campo.value.trim() }));
        announce(
          campo.value.trim() === ''
            ? 'Registro cerrado: sin código, nadie puede crear una cuenta.'
            : 'Código de invitación cambiado.',
        );
      } catch (error) {
        announce(error instanceof Error ? error.message : String(error), 'error');
      }
    })();
  });
}

export async function mountAdminPage(payload: AdminPayload): Promise<void> {
  const { trashed } = payload;
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

  mountInviteCode();

  await pintar(cuerpo, vacio, trashed, payload.cuentas);
}
