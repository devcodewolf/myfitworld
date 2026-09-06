/**
 * Lo poco que el navegador y el servidor tienen que acordar sobre la entrada.
 *
 * Está en un módulo suyo, y no en `src/auth.ts`, porque `auth.ts` importa la
 * base de datos: cualquier cosa que lo importe desde el navegador se llevaría
 * el controlador de Postgres al paquete del cliente. Aquí no hay más que dos
 * constantes, así que puede cruzar la frontera sin arrastrar nada.
 */

/**
 * Longitud mínima de la contraseña.
 *
 * La usan la configuración de Better Auth, el `minlength` del campo y el texto
 * de ayuda. Tres sitios con la misma regla escrita a mano acaban discrepando.
 */
export const MIN_PASSWORD_LENGTH = 10;

/**
 * La cabecera por la que viaja el código de invitación al crear una cuenta.
 *
 * Va en una cabecera y no en el cuerpo porque el cuerpo lo valida el esquema
 * del endpoint de Better Auth, que descarta lo que no reconoce. La cabecera
 * llega intacta al enganche que la comprueba.
 */
export const INVITE_HEADER = 'x-codigo-invitacion';
