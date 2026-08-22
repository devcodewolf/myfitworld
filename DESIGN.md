---
name: My Fitness World
description: Un mesociclo a oscuras con una sola luz encendida sobre lo que toca ahora.
colors:
  ground: "#05070a"
  surface: "#0e1116"
  raised: "#171b22"
  line: "#232a35"
  line-strong: "#39424f"
  ink: "#f3f6f8"
  ink-dim: "#9aa7b6"
  ink-faint: "#828d9c"
  volt: "#ccf24a"
  volt-ink: "#0e1405"
typography:
  display:
    fontFamily: "Archivo, 'Segoe UI Variable Display', 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 6vw, 5rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  figure:
    fontFamily: "Archivo, 'Segoe UI Variable Display', 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum' 1"
  headline:
    fontFamily: "Archivo, 'Segoe UI Variable Display', 'Segoe UI', system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Archivo, 'Segoe UI Variable Display', 'Segoe UI', system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Archivo, 'Segoe UI Variable Display', 'Segoe UI', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo, 'Segoe UI Variable Display', 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.2em"
rounded:
  card: "14px"
  nav: "12px"
  focus: "4px"
  pill: "999px"
spacing:
  xs: "0.375rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3.5rem"
components:
  button-primary:
    backgroundColor: "{colors.volt}"
    textColor: "{colors.volt-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 2rem"
    height: "3.5rem"
  button-disabled:
    backgroundColor: "transparent"
    textColor: "{colors.ink-faint}"
    rounded: "{rounded.pill}"
    padding: "0 2rem"
    height: "3.5rem"
  card-day:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "1.5rem"
  card-day-hover:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
  chip-muscle:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.625rem"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.nav}"
    padding: "0 0.75rem"
    height: "3rem"
  nav-item-active:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.nav}"
  ledger-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    padding: "1.25rem 0.25rem"
  ledger-row-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  media-frame:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-faint}"
    rounded: "{rounded.card}"
---

# Design System: My Fitness World

## Overview

**Creative North Star: "La sala a oscuras con una sola luz encendida"**

Es de noche, la pantalla está apoyada a dos o tres metros y las manos están ocupadas. Todo el sistema
parte de ahí: la sala está casi a oscuras (`ground` es un negro azulado, no un gris de dashboard), los
planos se separan por luz y no por sombra, y hay exactamente una luz encendida —el verde volt— apuntando
a lo único que importa en ese momento: lo que toca AHORA. Cuando esa luz se enciende en una pantalla,
señala una sola cosa; si señalara tres, no señalaría ninguna.

La densidad no es uniforme, y esa desigualdad es el argumento del producto hecho materia visual. La
semana en curso se abre en tarjetas grandes con cifras a tamaño de titular; las semanas 2 a 4 se
comprimen en un libro de cuentas de filas finas separadas por hairlines. El sistema rechaza
explícitamente la rejilla de cuatro tarjetas de semana idénticas: la jerarquía la impone el estado real
del plan, no la simetría. Las páginas secundarias —semana, día, catálogo, ejercicio— heredan el mismo
material pero sin una sola gota de volt: allí no hay nada ocurriendo ahora mismo.

El material es deliberadamente barato de renderizar y caro de imitar: tres superficies casi negras, dos
grosores de línea de un píxel, una familia tipográfica variable auto-alojada, cero sombras, cero
degradados, cero librerías de iconos. La riqueza sale del peso tipográfico, de las cifras tabulares
cuadrando en columna y del contraste brutal entre el titular a `clamp(2.75rem, 6vw, 5rem)` y la etiqueta
a `0.72rem` con `0.2em` de tracking.

**Key Characteristics:**

- Casi negro por capas: `ground` → `surface` → `raised`, cada plano un escalón de luz.
- Hairlines de 1px como único recurso de separación; ni una sombra en todo el build.
- Un solo acento (`volt`), reservado por ley a lo que ocurre ahora.
- Archivo variable (400–900), display apretado a `-0.03em`, etiquetas abiertas a `0.2em`.
- Toda cifra comparable en cifras tabulares mediante la utilidad `.figures`.
- Ningún estado se distingue solo por color: sobrevive en escala de grises.
- Un único momento animado en toda la aplicación, y arranca ya visible.

## Colors

Una paleta de tres superficies casi negras y una sola tinta viva; todo lo demás es texto en tres niveles
de luz sobre esas superficies.

### Primary

- **Volt** (`--color-volt`): el verde ácido de la aplicación. En estado de reposo aparece exactamente en
  tres sitios, los tres en la portada del mesociclo: el CTA primario (`Empezar Día N`), la etiqueta
  `AHORA` de la semana en curso y la regla `#barra-ahora` que subraya esa semana. Las páginas de semana,
  día, catálogo y ejercicio no contienen volt en absoluto, y es correcto que así sea.
- **Volt Ink** (`--color-volt-ink`): el verde casi negro que se escribe *sobre* volt. Es el único texto
  admitido encima del acento; nunca `ground` ni `ink`.

Existe además `--color-volt-dim` (`#7f9622`), declarado en `@theme` pero **sin ningún uso en el build**.
No es una licencia para introducir un segundo tono de acento: mientras no haya una superficie que lo
justifique, tratarlo como reserva vacía.

### Neutral

- **Ground / Suelo de sala** (`--color-ground`): el fondo de `html` y `body`, y el canal de la barra de
  scroll. Es el plano más lejano; nada se dibuja por debajo.
- **Surface / Plano de trabajo** (`--color-surface`): tarjetas, marco de media, rail de navegación,
  contenedor de superserie. Un escalón de luz por encima del suelo.
- **Raised / Plano próximo** (`--color-raised`): solo estados —el hover de una tarjeta y el ítem activo
  de la navegación. Es el plano que responde al usuario.
- **Line** (`--color-line`): el hairline por defecto. Separa filas del libro de cuentas, cierra tarjetas
  y subraya cabeceras de sección.
- **Line Strong** (`--color-line-strong`): el hairline con voz. Marca el hover de una tarjeta, el borde
  del contenedor de superserie, el botón deshabilitado, la cita de los errores comunes y el pulgar de la
  barra de scroll.
- **Ink** (`--color-ink`): texto primario y cifras. Casi blanco, con temperatura fría.
- **Ink Dim** (`--color-ink-dim`): texto secundario —descripciones, focos de sesión, unidades. Contraste
  medido de 8.24 / 7.72 / 7.05 sobre `ground` / `surface` / `raised`.
- **Ink Faint** (`--color-ink-faint`): texto terciario —etiquetas en mayúsculas, numeración de filas,
  estados vacíos honestos. Contraste medido de 5.99 / 5.62 / 5.13 sobre las tres superficies. Los dos
  niveles atenuados superan 4.5:1 en cualquier superficie del sistema.

### Named Rules

**Regla del Volt Reservado.** El acento está reservado por ley a lo que está ocurriendo AHORA. En reposo
vive en tres sitios y solo en la portada: el CTA primario, la etiqueta `AHORA` y `#barra-ahora`. Antes de
pintar algo de volt, la pregunta es una sola: ¿esto es lo que toca en este instante? Si no, no lleva
volt. El anillo de foco, `::selection` y el skip link —que solo existe visualmente bajo foco de teclado—
son superficies del navegador tematizadas y no cuentan para ese recuento; tampoco autorizan a extender el
acento al contenido.

**Regla del Gris que Sobrevive.** Ningún estado puede distinguirse solo por color. La página actual en la
navegación se marca con superficie, peso y luz a la vez (`bg-raised`, `font-bold`, `text-ink`) más
`aria-current="page"`; la semana en curso se marca con la palabra literal `AHORA` y una regla, no con un
tono. Prueba de auditoría: en escala de grises, todo estado sigue siendo legible.

**Regla del Suelo de Contraste.** Ningún texto baja de 4.5:1 contra la superficie sobre la que se apoya.
Si hace falta un cuarto nivel de jerarquía, se toma del tamaño o del peso —nunca bajando el valor por
debajo del suelo.

## Typography

**Display Font:** Archivo variable, pesos 400–900 (reserva: `Segoe UI Variable Display`, `Segoe UI`,
`system-ui`, `sans-serif`)
**Body Font:** la misma Archivo. El sistema es de una sola familia.

Archivo se auto-aloja como dos woff2 subseteados (latin y latin-ext) en `src/assets/fonts/`,
referenciados desde CSS para que Vite reescriba las URLs con el `base` del despliegue, con
`font-display: swap`.

**Character:** una grotesca de rejilla estrecha que aguanta el peso 900 sin engordar y las cifras sin
bailar. Apretada y casi arquitectónica en display, neutra y silenciosa en cuerpo: toda la expresión del
sistema está en el salto de escala y de peso, no en un segundo tipo de letra.

### Hierarchy

- **Display** (900, `clamp(2.75rem, 6vw, 5rem)`, `line-height: 0.95`, `letter-spacing: -0.03em`): el `h1`
  de cada página —nombre del mesociclo, fase de la semana, título del día, nombre del ejercicio. Con
  `text-balance` cuando el título puede partir en dos líneas.
- **Figure** (800, `clamp(1.75rem, 3vw, 2.5rem)`, `line-height: 1`, `letter-spacing: -0.02em`, tabular):
  la escala de las cifras que se leen a tres metros —series de un día, prescripción `4 × 8-10`, número de
  semana en el libro de cuentas, `Semana 01` en la portada. Es la única escala compartida entre texto y
  número.
- **Headline** (800, `1.5rem`, `letter-spacing: -0.02em`): el título de una tarjeta de día.
- **Title** (700, `1.125rem`–`1.25rem`): el nombre de un ejercicio en el listado del día y la fase en una
  fila del libro de cuentas.
- **Body** (400, `1rem`, `line-height: 1.625`): notas, claves de técnica, textos de estado. La entradilla
  bajo un `h1` sube a `1.125rem` en `ink-dim`. Toda columna de prosa se corta con una medida explícita:
  `55ch`, `60ch`, `62ch` o `65ch` según el ancho del contenedor.
- **Label** (700, `0.72rem`, `letter-spacing: 0.2em`, mayúsculas, en `ink-faint`): el rótulo de sección
  —`CALENTAMIENTO`, `EJERCICIOS`, `EL RESTO DEL MESOCICLO`, `TU HISTORIAL`. Variante a `0.16em` para
  etiquetas dentro de una ficha y a `0.22em` para la marca del rail. Nunca hace de titular.

### Named Rules

**Regla de las Cifras Tabulares.** Toda cantidad comparable se compone con la utilidad `.figures`
(`tabular-nums` + `font-feature-settings: 'tnum' 1`). Series, días, minutos, número de semana, número de
posición: si dos números pueden acabar uno debajo del otro, cuadran en columna. Se aplica al contenedor
—`dl`, `p`, fila—, no a cada número suelto.

**Regla de un Solo Display por Página.** La escala display es el ancla de orientación de la página. Hay
exactamente un `h1` a esa escala; cualquier segundo nivel baja a `figure` o a `label`.

## Layout

Dos zonas: navegación y contenido. A partir de `lg` (1024px) la navegación es un rail izquierdo de
`15rem` (`lg:w-60`), pegajoso y de alto de viewport, separado del contenido por un hairline vertical; por
debajo de `lg` es una barra inferior fija de alto mínimo `3.5rem` con `bg-surface/95` y `backdrop-blur`,
y el contenido reserva `pb-24` para no quedar debajo.

El contenido vive en un contenedor centrado: `max-w-6xl` (72rem) en las páginas de rejilla —portada,
semana, catálogo— y `max-w-5xl` (64rem) en las de lectura —día y ficha de ejercicio. El acolchado
horizontal escala en tres pasos (`px-5` → `sm:px-8` → `lg:px-12`) y el vertical en dos (`py-10` →
`lg:py-16`).

Las rejillas son pocas y explícitas: los días de una semana van a tres columnas desde `md`, el catálogo a
dos desde `sm` y tres desde `lg`, y la ficha de ejercicio parte en `[1fr_20rem]` desde `lg` con la media
en la columna estrecha. El libro de cuentas de semanas usa una rejilla que se reorganiza en vez de
truncarse: `[auto_1fr_auto]` en móvil y `[4.5rem_1fr_auto_auto_auto_auto]` desde `sm`, revelando
progresivamente días y duración conforme hay sitio.

El ritmo vertical se apoya en pocos escalones: `0.375rem` entre chips, `1rem` entre celdas de rejilla,
`1.5rem` de acolchado interior de tarjeta, `2rem` entre bloques de una cabecera y `3.5rem` entre secciones
mayores. Las separaciones de sección se hacen con `border-b border-line` más acolchado, no con márgenes
sueltos.

**Regla del Ancho de 375.** Ningún contenido provoca desbordamiento horizontal a 375px de ancho
(`document.documentElement.scrollWidth === 375`, verificado). Toda celda que pueda recibir texto largo
lleva `min-w-0`, y el texto que no cabe se trunca (`truncate`) en vez de ensanchar la fila.

## Elevation & Depth

**No hay ni una sombra en todo el build.** La profundidad se construye por dos medios y solo dos: un
escalón de luz de superficie (`ground` → `surface` → `raised`) y un hairline de 1px (`line`, o
`line-strong` cuando el elemento tiene voz). Un elemento elevado se declara **una sola vez**: o cambia de
superficie, o cambia de línea; nunca borde más sombra, y nunca sombra sola.

El hover no levanta nada del plano: la tarjeta de día pasa de `surface` a `raised` y su borde de `line` a
`line-strong`; la fila del libro de cuentas se ilumina de transparente a `surface`. El movimiento
aparente lo hace el color, no el eje Z.

### Named Rules

**Regla de la Elevación Declarada Una Vez.** Cada nivel se anuncia con un único recurso —superficie o
línea. Si un elemento ya tiene borde, no lleva sombra; si algún día llevara sombra, pierde el borde. En
este sistema la respuesta correcta siempre ha sido el borde.

**Regla del Momento Único.** Toda la aplicación tiene una sola animación autoral: la marca de la semana en
curso al cargar la portada. `#barra-ahora` hace `scaleX(0.82 → 1)` desde `transform-origin: left center`
con un asentamiento de opacidad, y `#marcador-ahora` hace `translateY(3px → 0)`; ambas a `700ms
cubic-bezier(0.16, 1, 0.3, 1)` y ambas anuladas bajo `prefers-reduced-motion`. Arranca desde un estado ya
visible por diseño: interrumpirla a media reproducción nunca deja un elemento truncado. Todo lo demás que
se mueve es una transición de estado disparada por el usuario (`transition-colors`, un `translate-x-1` de
flecha, un `scale-[1.02]` en el CTA).

## Shapes

Dos radios y una píldora. Las superficies de contenido —tarjeta de día, tarjeta de catálogo, marco de
media, contenedor de superserie— llevan una curva contenida de 14px (`--radius-card`), suficiente para
que el rectángulo no corte pero sin llegar a redondear el mundo. El ítem del rail de navegación usa 12px
(`rounded-xl`), porque es más pequeño y la curva tiene que escalar con él. Todo lo que es una acción o una
etiqueta breve es una píldora completa: el CTA primario, el botón deshabilitado, los chips de grupo
muscular, el skip link y el pulgar de la barra de scroll. El anillo de foco global redondea a 4px.

Las filas no tienen forma propia: el libro de cuentas de semanas y la lista de bloques de un día son
rectángulos sin radio separados por hairlines, con `last:border-b-0` para que la última fila no cierre la
serie con una línea suelta. Esa ausencia de forma es lo que las hace leerse como registro y no como
tarjetas.

Los iconos son un sistema propio dibujado a mano en `Icon.astro`: `viewBox` de 24, `fill: none`,
`stroke: currentColor`, grosor único `1.75`, terminaciones y uniones redondeadas, `aria-hidden`. Seis
glifos —`mesocycle`, `catalog`, `history`, `settings`, `arrow-right`, `check`—, todos como un solo `path`.
La flecha `arrow-right` girada 180° hace de flecha de vuelta; no existe un glifo `arrow-left`.

## Components

### Buttons

- **Shape:** píldora completa (`rounded-full`), altura mínima táctil de `3.5rem` (`min-h-14`).
- **Primary:** fondo `volt` con texto `volt-ink` a peso 800 y `tracking-[-0.01em]`, acolchado `px-6 py-3`
  que sube a `px-8` y `text-lg` desde `sm`, con la flecha `arrow-right` de 20px al final. Hay **uno por
  aplicación**: el `Empezar Día N` de la portada.
- **Hover / Focus:** `hover:scale-[1.02]` y `active:scale-100` sobre `transition-transform`; el foco lo da
  el anillo global de 2px en `volt` con `outline-offset: 3px`.
- **Disabled:** sin relleno, borde `line-strong`, texto `ink-faint`, `cursor-not-allowed`. Es la forma
  honesta de una acción que todavía no existe (el botón `Entrenar`), y va siempre acompañada de una frase
  que explica por qué está apagada. No inventar un deshabilitado en volt atenuado.

### Chips

- **Style:** píldora de borde `line` sobre fondo transparente, texto `ink-dim` a `0.72rem` peso 600,
  acolchado `px-2.5 py-1`. Se usan para los grupos musculares de una tarjeta de día, un máximo de cuatro.
- **State:** son informativos, no interactivos. No tienen estado seleccionado; si algún día filtran, el
  seleccionado debe cambiar superficie y peso, no solo color.

### Cards / Containers

- **Corner Style:** 14px (`rounded-card`).
- **Background:** `surface` en reposo, `raised` en hover.
- **Shadow Strategy:** ninguna. Ver *Elevation & Depth*.
- **Border:** hairline `line`, que pasa a `line-strong` en hover.
- **Internal Padding:** `1.5rem` (`p-6`) en la tarjeta de día; `1.25rem` (`p-5`) en la de catálogo, que es
  más pequeña y lleva media dentro.
- La tarjeta de día es `flex flex-col` con la fila de cierre en `mt-auto`, así que todas las tarjetas de
  una fila terminan su llamada a la acción a la misma altura aunque el texto de arriba difiera.

### Navigation

Rail izquierdo desde `lg`, barra inferior fija por debajo. En el rail, la marca `MY FITNESS WORLD` va en
label a `0.22em` sobre `ink-faint` y se oculta en móvil. Cada ítem combina icono de 22px y etiqueta: en
móvil apilados en columna a `0.72rem`; en rail, en fila a `0.95rem` con `rounded-xl`.

- **Default:** texto `ink-dim`, fondo transparente.
- **Hover:** texto `ink`, y en rail fondo `raised/60`.
- **Active:** `bg-raised` + `font-bold` + `text-ink` **a la vez**, más `aria-current="page"`. Tres señales
  redundantes, y ninguna de ellas es el color del acento.

### ExerciseMedia (componente de firma)

Única puerta de entrada a la media de un ejercicio, y la razón de que el layout no salte nunca. Reserva
siempre el hueco por `aspect-ratio` (`4/3` por defecto) dentro de un marco `surface` con hairline `line` y
radio de tarjeta, exista o no el asset. Cuatro modos: `image` y `croquis` (`object-cover` y
`object-contain` con `p-4`), `video` silencioso en bucle, y `embed`, que **no carga nada de terceros hasta
que se pulsa**: hasta entonces solo hay un botón con un disco de 4rem en `ink` sobre `ground` y la
etiqueta `Ver la ejecución en vídeo`.

El estado vacío es honesto y forma parte del diseño, no es un fallo: rótulo `CROQUIS PENDIENTE` en label
sobre `ink-faint` y una línea que nombra el ejercicio que falta. No sustituir por un esqueleto animado ni
por una silueta genérica.

### WeekRow (componente de firma)

La fila del libro de cuentas, y la contrapartida material de la tesis: las semanas que no están en curso
no son tarjetas. Número de semana a dos dígitos (`padStart(2, '0')`) en escala `figure` sobre `ink-faint`,
fase y foco a la izquierda, cifras a la derecha, flecha al final, hairline inferior y `last:border-b-0`.
En hover la fila se ilumina a `surface`, el número sube a `ink` y la flecha avanza `translate-x-1`.

## Do's and Don'ts

### Do:

- **Do** preguntarse "¿esto es lo que ocurre AHORA?" antes de escribir `volt` en cualquier sitio. Si la
  respuesta no es un sí evidente, el color correcto es `ink`, `ink-dim` o `ink-faint`.
- **Do** marcar todo estado con al menos dos señales (superficie + peso, o palabra + regla) y añadir el
  atributo ARIA correspondiente; debe sobrevivir en escala de grises.
- **Do** envolver en `.figures` cualquier contenedor con cantidades comparables.
- **Do** declarar la elevación una sola vez: o superficie, o hairline.
- **Do** poner medida explícita (`55ch`–`65ch`) a toda columna de prosa, y `min-w-0` a toda celda de
  rejilla que reciba texto variable.
- **Do** dar un estado vacío honesto y nombrado (`CROQUIS PENDIENTE`, `Todavía no has registrado…`) en vez
  de esconder el hueco.
- **Do** dibujar los iconos nuevos en `Icon.astro` con `viewBox` 24, un solo `path` y grosor `1.75`.

### Don't:

- **Don't** usar volt en una página secundaria. Semana, día, catálogo y ficha de ejercicio no contienen
  acento, y esa ausencia es la que hace que la portada signifique algo.
- **Don't** introducir un segundo acento ni recurrir a `--color-volt-dim`: está declarado y sin uso a
  propósito.
- **Don't** añadir `box-shadow` a nada. No hay ni una sombra en el sistema; el borde ya hizo ese trabajo.
- **Don't** combinar borde y sombra en el mismo elemento si algún día se introdujera una sombra.
- **Don't** distinguir un estado únicamente por tono, ni marcar la semana en curso solo con color en lugar
  de la palabra `AHORA`.
- **Don't** bajar `ink-faint` por debajo del suelo de 4.5:1 para recuperar jerarquía; tomarla del tamaño o
  del peso.
- **Don't** añadir animaciones de entrada. El sistema tiene un único momento autoral; lo demás se mueve
  solo como respuesta a una acción del usuario y siempre respetando `prefers-reduced-motion`.
- **Don't** cargar iframes, fuentes o imágenes de terceros en la carga inicial: el vídeo incrustado se crea
  al pulsar, y las fuentes van auto-alojadas.
- **Don't** usar emoji ni una librería de iconos como sustituto de `Icon.astro`.
- **Don't** cifrar la jerarquía de las semanas en una rejilla de tarjetas iguales: la semana en curso se
  abre, el resto es registro.

## Known tension

Al subir `--color-ink-faint` de `#6c7787` a `#828d9c` para cruzar el suelo de contraste, el hueco con
`--color-ink-dim` se estrechó: donde ambos valores aparecen adyacentes, la jerarquía de tres niveles de
texto se lee más cerca de dos. Es una regresión aceptada, no un descuido. El remedio, si alguna vez
importa, es tomar el tercer nivel del tamaño o del peso —nunca devolviendo el valor por debajo del suelo.
