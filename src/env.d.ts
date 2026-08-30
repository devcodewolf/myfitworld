/**
 * Tipos que Astro no puede inferir solo.
 *
 * `Astro.locals` es el saco donde el middleware deja cosas para que las lean
 * las páginas de la misma petición. Declararlo aquí es lo que hace que
 * `Astro.locals.user` tenga tipo en vez de ser `any`, y que el compilador avise
 * si alguien se olvida de comprobar el `null`.
 *
 * El middleware que lo rellena llega en el paso siguiente; el tipo va antes
 * para que nada se escriba a ciegas.
 */
declare namespace App {
  interface Locals {
    /** Quién está entrando, o `null` si no hay sesión. */
    user: import('better-auth').User | null;
    /** La sesión abierta, con su caducidad. `null` si no hay. */
    session: import('better-auth').Session | null;
  }
}
