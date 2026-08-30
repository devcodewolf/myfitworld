# My Fitness World

App personal de entrenamiento en casa: mesociclos, días, y un modo entreno que lleva el ritmo.

## Comandos

```bash
pnpm install
pnpm dev        # servidor de desarrollo en http://localhost:4321
pnpm check      # comprobación de tipos (TypeScript strict, cero errores)
pnpm test       # tests del dominio puro
pnpm test:watch # los mismos, en observación mientras editas
pnpm format     # Prettier sobre todo el proyecto
pnpm build      # build estático en dist/
pnpm preview    # sirve dist/ para revisarlo antes de subir
```

Los tests cubren solo `src/core/`, que es lógica pura: temporizadores, volumen,
duración estimada, material disponible y progresión. Nada de eso toca el DOM ni
el almacenamiento, así que se puede probar entero sin navegador.

En este entorno el servidor de desarrollo se maneja en segundo plano:

```bash
astro dev --background
astro dev status
astro dev logs
astro dev stop
```

## Desplegar

El build produce dos carpetas: `dist/client/` con las páginas ya generadas y los assets, y
`dist/server/` con el servidor de Node que las sirve.

```bash
pnpm build
node dist/server/entry.mjs        # escucha en el puerto 4321
```

El sitio se sirve desde la raíz del dominio. El despliegue en subcarpeta se descartó al montar
servidor propio: no aportaba nada y complicaba las cookies de sesión.

Todos los enlaces internos salen de `src/routes.ts`, que es lo único que hay que tocar si aparece
una ruta nueva.

## Cómo está organizado

```
src/
├─ content/       LOS DATOS. Lo único que editas para cambiar la rutina.
├─ content.config.ts   define y valida las colecciones con Zod
├─ data.ts        de dónde salen los datos y comprobación de integridad
├─ routes.ts      todas las URLs de la app se construyen aquí
├─ core/          LÓGICA PURA: modelo, cálculos, etiquetas. Sin navegador.
│                 Cada módulo tiene su `*.test.ts` al lado.
├─ components/    lo que se ve
├─ layouts/
├─ pages/         composición y rutas
└─ styles/        tokens del sistema de diseño en @theme
```

Carpetas previstas y todavía sin construir: `storage/` (persistencia tras una interfaz de
repositorio) y `browser/` (audio, vibración, wake lock).

## Editar la rutina

Un archivo JSON por ejercicio en `src/content/exercises/` (el nombre del archivo es su identificador)
y uno por mesociclo en `src/content/mesocycles/`. El build **falla** si un día referencia un ejercicio
que no existe, si dos bloques comparten clave o si una superserie se queda con un solo ejercicio, y el
error dice exactamente qué bloque de qué día lo provoca.
