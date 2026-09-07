# Pruebas contra el servidor construido

**No son los tests del proyecto.** `pnpm test` sigue siendo Vitest sobre
`src/core/` y nada más, como dice `CLAUDE.md`. Esto es otra cosa: tres scripts
que se lanzan a mano contra la aplicación ya construida y corriendo, porque hay
cosas que solo se pueden comprobar así.

Existen porque el paso 6 movió la persistencia al servidor, y ahí aparecieron
dos preguntas que ningún test unitario contesta: **¿de verdad cada acción filtra
por usuario?** y **¿las pantallas siguen funcionando en un navegador?**

## Antes de lanzarlas

```bash
pnpm db:up                                     # Postgres local
pnpm build
node --env-file=.env dist/server/entry.mjs     # en otra terminal
```

## Las tres

| Script          | Qué comprueba                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------- |
| `acciones.mjs`  | Las acciones por HTTP. **Sobre todo el aislamiento**: que un usuario no vea ni toque lo de otro |
| `pantallas.mjs` | Las seis pantallas en un navegador real, cazando errores de consola                             |
| `mudanza.mjs`   | El puente que sube a la cuenta lo que quedó en `localStorage`                                   |

```bash
node pruebas/acciones.mjs <SIGNUP_INVITE_CODE>
node pruebas/pantallas.mjs           # añade --ver para abrir una ventana y mirarla
node pruebas/mudanza.mjs             # añade --ver
```

`pantallas.mjs` y `mudanza.mjs` necesitan **Playwright** (instalado global) y
usan el Chrome del sistema con `channel: 'chrome'`, para no descargar un
Chromium propio. `acciones.mjs` no necesita navegador.

Las dos de navegador esperan una cuenta `prueba@ejemplo.com` con contraseña
`contrasena-larga-1`. La crea `acciones.mjs`, o se hace a mano desde `/login`.

## Aviso

**Escriben en la base a la que apuntes.** Son para la de desarrollo. Contra la
de producción borrarían datos de verdad.
