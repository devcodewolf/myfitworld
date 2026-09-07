/**
 * Controlador de la pantalla de entrada.
 *
 * Vanilla, como ajustes e historial: dos campos y un botón no justifican una
 * isla de Vue. Lo único con estado aquí es en cuál de los dos modos estás, y
 * eso es una clase y tres atributos.
 *
 * Al terminar bien se navega con `location.assign`, no con `history.pushState`:
 * hace falta una petición de verdad para que el servidor vea la cookie nueva y
 * el middleware te deje pasar.
 */
import { authClient, authErrorMessage, type AuthFailure } from '@/auth-client';
import { INVITE_HEADER } from '@/auth-contract';

export interface LoginPayload {
  /** A dónde se vuelve al entrar. Lo valida el servidor, aquí ya llega limpio. */
  readonly destination: string;
}

type Mode = 'entrar' | 'crear';

const el = <T extends HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;

/** Un campo que solo existe en uno de los dos modos. */
interface OptionalField {
  readonly wrapper: HTMLElement | null;
  readonly input: HTMLInputElement | null;
}

function optional(id: string): OptionalField {
  return { wrapper: el(`campo-${id}`), input: el<HTMLInputElement>(id) };
}

/**
 * Esconder un campo no basta: un `required` invisible bloquea el envío con un
 * «campo no enfocable» que no se ve por ninguna parte. Se desactiva además de
 * ocultarse, y así tampoco viaja en el formulario.
 */
function toggleField(field: OptionalField, visible: boolean): void {
  if (field.wrapper) field.wrapper.hidden = !visible;
  if (field.input) field.input.disabled = !visible;
}

export function mountLoginPage(payload: LoginPayload): void {
  const form = el<HTMLFormElement>('form-entrada');
  const submit = el<HTMLButtonElement>('enviar');
  const failure = el<HTMLParagraphElement>('fallo');
  const tabs = [el<HTMLButtonElement>('modo-entrar'), el<HTMLButtonElement>('modo-crear')];
  const name = optional('nombre');
  const invite = optional('invitacion');
  const password = el<HTMLInputElement>('clave');

  if (!form || !submit) throw new Error('Falta el formulario de entrada.');

  let mode: Mode = 'entrar';
  let busy = false;

  const say = (message: string): void => {
    if (!failure) return;
    failure.textContent = message;
    failure.hidden = message === '';
  };

  const setMode = (next: Mode): void => {
    mode = next;
    say('');
    toggleField(name, next === 'crear');
    toggleField(invite, next === 'crear');
    submit.textContent = next === 'crear' ? 'Crear cuenta' : 'Entrar';
    if (password) {
      // El navegador ofrece guardar una contraseña nueva o rellenar la que ya
      // tiene según este atributo. Con el valor equivocado, ni una cosa ni otra.
      password.autocomplete = next === 'crear' ? 'new-password' : 'current-password';
    }
    for (const tab of tabs) {
      tab?.setAttribute('aria-pressed', String(tab.id === `modo-${next}`));
    }
  };

  const setBusy = (value: boolean): void => {
    busy = value;
    submit.disabled = value;
    // `aria-busy` es lo que le dice a un lector de pantalla que hay algo en
    // marcha; el texto del botón solo lo ve quien mira.
    form.setAttribute('aria-busy', String(value));
  };

  for (const tab of tabs) {
    tab?.addEventListener('click', () => {
      if (busy) return;
      setMode(tab.id === 'modo-crear' ? 'crear' : 'entrar');
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (busy) return;

    const data = new FormData(form);
    const email = String(data.get('correo') ?? '').trim();
    const clave = String(data.get('clave') ?? '');

    void (async () => {
      setBusy(true);
      say('');
      try {
        const { error } = await (mode === 'crear'
          ? authClient.signUp.email(
              { email, password: clave, name: String(data.get('nombre') ?? '').trim() },
              // El código viaja en cabecera: el cuerpo lo valida el esquema del
              // endpoint y descarta lo que no reconoce.
              { headers: { [INVITE_HEADER]: String(data.get('invitacion') ?? '').trim() } },
            )
          : authClient.signIn.email({ email, password: clave }));

        if (error) {
          say(authErrorMessage(error as AuthFailure));
          setBusy(false);
          return;
        }

        // Sin `setBusy(false)`: la página se va, y reactivar el botón solo
        // sirve para que se pueda pulsar dos veces mientras se va.
        window.location.assign(payload.destination);
      } catch {
        say('No se pudo hablar con el servidor. Mira la conexión y vuelve a probar.');
        setBusy(false);
      }
    })();
  });

  setMode('entrar');
}
