# My Fitness World

App personal de entrenamiento en casa: mesociclos, días, y un modo entreno que lleva el ritmo.

## Comandos

```bash
pnpm install
pnpm dev        # servidor de desarrollo en http://localhost:4321
pnpm check      # comprobación de tipos (TypeScript strict, cero errores)
pnpm build      # build estático en dist/
pnpm preview    # sirve dist/ para revisarlo antes de subir
```

En este entorno el servidor de desarrollo se maneja en segundo plano:

```bash
astro dev --background
astro dev status
astro dev logs
astro dev stop
```

## Desplegar en una subcarpeta

Astro no sabe emitir rutas relativas: con `base: './'` escribe `/./` y el sitio se rompe fuera de
la raíz. La portabilidad se resuelve en tiempo de build con una variable:

```bash
BASE_PATH=/entreno pnpm build     # el sitio vivirá en https://tu-servidor/entreno/
pnpm build                        # sin variable, se despliega en la raíz
```

Luego se copia el contenido de `dist/` dentro de esa carpeta del servidor. Cambiar de carpeta obliga
a reconstruir, nada más. Todos los enlaces internos salen de `src/routes.ts`, que es lo único que
hay que tocar si aparece una ruta nueva.

## Cómo está organizado

```
src/
├─ content/       LOS DATOS. Lo único que editas para cambiar la rutina.
├─ content.config.ts   define y valida las colecciones con Zod
├─ data.ts        de dónde salen los datos y comprobación de integridad
├─ routes.ts      todas las URLs de la app se construyen aquí
├─ core/          LÓGICA PURA: modelo, cálculos, etiquetas. Sin navegador.
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
