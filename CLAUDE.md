# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

App personal de entrenamiento en casa. La documentación y los comentarios del
código están **en español**; los identificadores, en inglés. Mantén las dos cosas.

## Comandos

```bash
pnpm dev                                  # servidor en http://localhost:4321
pnpm check                                # astro check — tipos, debe dar 0/0/0
pnpm test                                 # vitest run, solo src/core/
pnpm test src/core/timer.test.ts          # un solo archivo
pnpm test src/core/timer.test.ts -t "..." # un solo caso, por nombre
pnpm format                               # Prettier sobre todo
pnpm format:check                         # el que hay que dejar limpio
pnpm build                                # dist/client + dist/server
node dist/server/entry.mjs                # servir lo construido

pnpm db:up                                # Postgres local en Docker
pnpm db:down                              # pararlo (los datos se quedan)
pnpm db:generate                          # esquema → SQL en drizzle/, sin conectar
pnpm db:migrate                           # aplicar las migraciones (necesita DATABASE_URL)
pnpm db:studio                            # ver la base en el navegador
```

`pnpm`, siempre. Antes de dar algo por terminado: `check`, `test`, `format:check`
y `build` en verde.

En este entorno el servidor de desarrollo va en segundo plano: `astro dev --background`,
y se maneja con `astro dev status`, `astro dev logs`, `astro dev stop`. **Si algo
se comporta de forma imposible en dev y el build está bien, el servidor está rancio**
— pasó tras tocar `tsconfig`, tras instalar `sharp` y tras instalar Vue. Reinícialo
antes de investigar nada más.

## Arquitectura

Capas, de dentro a fuera. Una capa no conoce a las de fuera.

```
src/core/      dominio puro. Sin DOM, sin almacenamiento, sin Astro.
               model.ts son los esquemas Zod: la única fuente de verdad de los
               tipos (todo sale de z.infer, nada se declara a mano).
               Cada módulo tiene su *.test.ts al lado. Es lo único con tests.
src/storage/   persistencia detrás de AppRepository. Nada de fuera sabe que
               debajo hay localStorage.
src/db/        Postgres: esquema Drizzle, conexión y mapeo fila ↔ tipos de core.
               Solo lo importan las acciones. Ni core/, ni components/, ni
               pages/ pueden tocarlo. Las migraciones van en drizzle/ y se
               versionan: son el historial de la forma de la base.
src/browser/   APIs del navegador (audio, vibración, wake lock) y el punto único
               de composición del repositorio.
src/content/   los datos. Un JSON por ejercicio, uno por mesociclo.
src/components/, src/layouts/, src/pages/   lo que se ve.
src/data.ts    de dónde salen rutinas y ejercicios + comprobación de integridad.
src/routes.ts  todas las URLs internas.
```

**Todo lo asíncrono lo es a propósito.** `data.ts` y el repositorio devuelven
promesas aunque hoy nada lo necesite, para que meter un backend detrás no cambie
ni una firma fuera de su carpeta. `specs.md` tiene los pasos concretos.

### Piezas que hay que conocer antes de tocar nada

- **`src/routes.ts` construye todas las URLs, y solo él.** El sitio se sirve
  desde la raíz: el despliegue en subcarpeta se descartó al montar servidor
  propio. Los assets de `public/` también pasan por `routes.asset()`, que
  distingue una ruta propia de una URL remota; sin eso, una foto de Unsplash
  acabaría pedida como `/https://images.unsplash.com/...`.
- **`output: 'static'` con adaptador de Node, y es a propósito.** El adaptador
  no vuelve dinámico el sitio: permite que rutas concretas se salgan del
  prerender con `export const prerender = false`. Hoy no lo hace ninguna; lo
  harán las que tengan datos personales. Las páginas de contenido del mesociclo
  siguen generándose en el build y así deben seguir.
- **`assertRoutineIntegrity()` en `src/data.ts` rompe el build** si un día
  referencia un `exerciseId` inexistente, si dos bloques comparten clave o si una
  superserie se queda con un solo ejercicio. Se hace ahí y no con `reference()`
  de Astro para poder señalar el bloque exacto. Si añades una regla de
  consistencia entre colecciones, va aquí.
- **`blockKeyOf(block)`** (en `core/training.ts`) es la clave con la que un bloque
  se enlaza con su registro en el historial. Cambiarla desconecta datos ya guardados.
- **`storage/document.ts` nunca borra lo que no entiende:** documento versionado →
  cadena de `MIGRATIONS` → Zod → si falla, **cuarentena** con marca de tiempo. El
  export JSON es la única copia de seguridad que existe. Al cambiar un esquema
  guardado, sube `STORAGE_SCHEMA_VERSION` y añade su migración.
- **Los temporizadores se calculan por marca de tiempo** (`core/timer.ts`), nunca
  acumulando `setInterval`. `requestAnimationFrame` solo repinta.
- **El repositorio recibe `now()` y `uuid()` inyectados** para que los tests sean
  deterministas. `src/browser/repository.ts` es el único sitio donde se decide la
  implementación real.

### Vue

Vanilla por defecto. Vue solo donde hay estado reactivo que lo justifique: hoy,
el modo entreno (`components/session/`), montado con `client:only="vue"` porque
depende entero de lo guardado en ese navegador. Las páginas que solo necesitan un
script (`historial`, `configuracion`) pasan sus datos por un `<script type="application/json">`
y los monta un módulo de `src/browser/`, con manejo visible del error: un fallo
silencioso deja la pantalla en blanco sin explicación.

## Diseño

Los tokens viven en `@theme` dentro de `src/styles/global.css` (Tailwind v4,
CSS-first, **no hay `tailwind.config.js`**). `DESIGN.md` describe el mundo visual;
consúltalo antes de tocar estilos.

Reglas que no se ven en el código pero se rompen fácil:

- **Los patrones de clases repetidos se extraen a componentes, no a `@apply`.**
  Si una clase compuesta se repite dentro de un `.vue`, sácala a una constante.
- **El acento cian está reservado** a la acción primaria y a lo que toca _ahora_.
  Nada decorativo lo usa, ni el hover genérico.
- **Sin _eyebrows_** (etiquetas en versalitas encima de un titular).
- Las clases de Tailwind tienen que ser literales: el escáner no ve una clase
  compuesta en tiempo de ejecución.

## Convenciones

- Alias `@/` → `src/`. Sin rutas relativas largas.
- TypeScript `strict`, cero `any`.
- Componentes con una responsabilidad; por encima de ~120 líneas, partir.
- Los comentarios explican el **porqué**, no el qué.
- Peso, repeticiones y descansos **nunca hardcodeados**: salen del plan, del
  historial o del material configurado (`core/prefill.ts`, `core/equipment.ts`).
- LF en todo el repositorio (`.gitattributes`). Prettier escribe LF; sin eso,
  cada pasada marcaba cuarenta archivos como modificados sin un cambio real.
- **Los commits los hace el usuario.** Cuando cierres una fase, dale el texto del
  commit: corto y en español.

## Documentos del proyecto

| Archivo            | Para qué                                                  |
| ------------------ | --------------------------------------------------------- |
| `README.md`        | comandos, despliegue en subcarpeta, cómo editar la rutina |
| `instrucciones.md` | cómo se usa la app de verdad, para el usuario             |
| `specs.md`         | especificación técnica y los pasos para meter un backend  |
| `PRODUCT.md`       | decisiones de producto tomadas y por qué                  |
| `DESIGN.md`        | el mundo visual: color, tipografía, materiales            |
