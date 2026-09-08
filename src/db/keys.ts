/**
 * Las claves de la tabla `app_config`.
 *
 * Viven aquí y **no en `schema.ts`** por un motivo que no se ve mirando ese
 * archivo: `src/db/index.ts` hace `import * as appSchema from '@/db/schema'` y
 * le entrega a Drizzle **todo lo que ese módulo exporte**, dando por hecho que
 * son tablas. Una constante suelta ahí dentro se cuela en el esquema como si
 * fuera una, y eso es pedir un fallo raro y difícil de encontrar.
 *
 * La regla, entonces: **`schema.ts` exporta tablas y nada más.**
 */

/** El código de invitación que hace falta para crear una cuenta. */
export const INVITE_CODE_KEY = 'signup_invite_code';
