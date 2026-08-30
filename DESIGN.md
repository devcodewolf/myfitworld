---
name: My Fitness World
description: Suelo negro azulado, fotografía a sangre y un único cian encendido sobre lo que toca ahora.
colors:
  ground: "#091017"
  surface: "#141d26"
  raised: "#1e2934"
  line: "#2c3947"
  line-strong: "#45576a"
  shade: "#04080d"
  plate: "#ffffff"
  ink: "#f0f6fa"
  ink-dim: "#a9becd"
  ink-faint: "#869dae"
  accent: "#34dafa"
  accent-strong: "#00b6eb"
  accent-ink: "#031c30"
  phase-accumulation: "#88c0e1"
  phase-progression: "#7dcece"
  phase-intensification: "#99a6e7"
  phase-deload: "#9dceb7"
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
  title:
    fontFamily: "Archivo, 'Segoe UI Variable Display', 'Segoe UI', system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.33
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Archivo, 'Segoe UI Variable Display', 'Segoe UI', system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Archivo, 'Segoe UI Variable Display', 'Segoe UI', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  meta:
    fontFamily: "Archivo, 'Segoe UI Variable Display', 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo, 'Segoe UI Variable Display', 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.2em"
rounded:
  card: "14px"
  rail: "1rem"
  tile: "0.75rem"
  pill: "999px"
  focus: "4px"
spacing:
  tight: "0.5rem"
  snug: "0.75rem"
  grid: "1.25rem"
  card: "1.25rem"
  card-lg: "1.5rem"
  section: "2rem"
  section-lg: "3rem"
  gutter: "1rem"
  gutter-lg: "2rem"
  container: "80rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.pill}"
    padding: "0 1.75rem"
    height: "3.5rem"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    size: "1.02"
  button-disabled:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-faint}"
    rounded: "{rounded.pill}"
    padding: "0 1.75rem"
    height: "3.5rem"
  chip-glass:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.375rem 0.875rem"
  chip-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.75rem"
  card-photo:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "1.25rem"
  card-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "1.25rem"
  nav-pill:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "2.75rem"
  nav-pill-active:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "2.75rem"
  rail-week:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.rail}"
    padding: "0.5rem 1rem"
    height: "3.5rem"
  rail-week-active:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.rail}"
    padding: "0.5rem 1rem"
    height: "3.5rem"
  rail-day:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "2.75rem"
  rail-day-active:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "2.75rem"
  filter-chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "2.75rem"
  filter-chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "2.75rem"
  switch:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    width: "3rem"
    height: "1.75rem"
  switch-on:
    backgroundColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    width: "3rem"
    height: "1.75rem"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "2.75rem"
  bento-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "1.25rem"
  set-mark:
    backgroundColor: "transparent"
    textColor: "{colors.ink-faint}"
    rounded: "{rounded.pill}"
    size: "2.25rem"
  set-mark-now:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    rounded: "{rounded.pill}"
    size: "2.25rem"
  set-mark-done:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    size: "2.25rem"
---

<!-- ESTADO: este documento describe el mundo tal y como está construido hoy. Se escribió
     tras el rediseño y se fusionó después, al rehacer catálogo, historial, ajustes y modo
     entreno: se conservó lo que seguía siendo cierto y se reescribió lo que el código había
     dejado falso. La revisión de acabado NO se ha ejecutado sobre esta versión: lo que sigue
     es lo que el código hace, no un veredicto de calidad. -->

# Design System: My Fitness World

## Overview

**Creative North Star: "La sala a oscuras con la luz encendida sobre la barra"**

Es un plan por el que se avanza por fecha, no un panel que se lee. El eje de la interfaz es el
raíl de semanas y días: siempre sabes en qué punto del mesociclo estás antes de saber ninguna
otra cosa. Sobre ese raíl, la sesión que toca ocupa la pantalla como una tarjeta fotográfica a
sangre con una sola acción encima. La app se mira de pie, a dos o tres metros, con las manos
ocupadas y casi siempre de noche: de ahí el fondo negro azulado, el tamaño desmesurado de las
cifras y el hecho de que solo haya un color encendido en toda la pantalla.

El material es fotografía, **a plena luz y a plena saturación**: gente entrenando y salas de pesas.
Cada una de las doce sesiones del mesociclo tiene la suya, distinta de las otras once, y cada uno de
los dieciséis ejercicios del catálogo la suya. No son
ilustración de relleno: son lo que da temperatura y peso a una interfaz que, sin ellas, sería una
lista, y una foto apagada al 70 % deja de leerse como foto para convertirse en textura sucia. El
contraste del texto no se compra bajando la imagen entera, sino con un velo que solo existe donde
hay letras: transparente en el 82 % superior y opaco al llegar al pie. Así el motivo se ve y el
texto se lee sea cual sea la foto que haya debajo. El suelo de la
página lo iluminan tres focos radiales fijos —cian, lavanda y verdeazulado, todos por debajo del
15 % de mezcla— que no se mueven con el scroll y no tiñen el contenido.

Lo que este mundo rechaza está tan decidido como lo que abraza: no hay barra lateral, no hay
sombras en ninguna parte, no hay iconos de librería ni emoji haciendo de icono, no hay tarjetas
de solo texto en las superficies principales y no hay ningún segundo color saturado compitiendo
con el cian. La profundidad se declara una vez, con un filete de un píxel; el material de las
tarjetas es un degradado sutil, no una sombra.

**Key Characteristics:**

- Negro azulado con tres focos radiales fijos, nunca gris neutro
- Un único cian saturado (`#34dafa`), reservado a la acción primaria y al AHORA
- Cuatro pasteles de croma bajo que identifican las fases del mesociclo sin competir
- Fotografía a plena luz bajo un velo que solo existe donde hay texto; una por sesión y por ejercicio
- Historial y ajustes en bento: celdas desiguales, la mayor para lo que más pesa en la decisión
- Archivo variable 400–900, cifras tabulares en todo lo comparable
- Filete de un píxel como única declaración de elevación: cero sombras
- Raíl de semanas y días como columna vertebral de la navegación

## Colors

Una paleta fría calculada en OKLCH: tres superficies que comparten tono y escalonan la
luminosidad de forma regular (L ≈ 17 % / 23 % / 28 %), tintas tomadas de la temperatura del fondo
en lugar de gris neutro, un solo croma alto y cuatro pasteles de identificación.

### Primary

- **Cian Encendido** (`accent`): el único croma alto del sistema (C ≈ 0,135 en OKLCH) y por eso el
  que manda la atención. Solo aparece en la acción primaria («Ver la sesión»), en el rótulo y el
  filete de «Tu próxima sesión», en el tinte superior del degradado de las fotos y en el cuadro
  del logotipo. Contraste 11,43 / 10,18 / 8,83 sobre `ground` / `surface` / `raised`.
- **Cian Profundo** (`accent-strong`): existe solo para cerrar el degradado de la acción primaria
  (`.accion-primaria`, 100°, mezclado al 88 % con la lavanda de intensificación). Nunca se usa
  como color plano.
- **Tinta sobre Cian** (`accent-ink`): el azul casi negro que se escribe encima del cian, y solo
  encima del cian. Contraste 10,35 sobre el acento; nunca se pone sobre una superficie.

### Secondary

Las cuatro fases del mesociclo. Son pastel a propósito: identifican la semana de un vistazo y
siempre van acompañadas de su etiqueta en texto, así que jamás son la única señal.

- **Azul Acumulación** (`phase-accumulation`): fase de acumulación.
- **Verdeazulado Progresión** (`phase-progression`): fase de progresión; también el foco radial
  inferior del fondo.
- **Lavanda Intensificación** (`phase-intensification`): fase de intensificación; también el foco
  radial superior derecho y el cierre del degradado de la acción primaria.
- **Verde Descarga** (`phase-deload`): semana de descarga.

Cada fase se sirve en tres presentaciones desde `src/theme.ts`: texto (`text`), filete o punto
(`mark`) y tinte de fondo al 10 % (`wash`).

### Neutral

- **Suelo Negro Azulado** (`ground`): fondo de la página y del `html`, base del degradado de las
  fotos, de los chips de cristal (al 65 %) y de la barra superior (al 82 %).
- **Superficie** (`surface`): fondo de los raíles inactivos, del contenedor de la navegación de
  píldoras, del hueco de media y del hover de las filas de semana.
- **Superficie Elevada** (`raised`): reservada al estado activo —píldora de navegación activa,
  semana activa, día activo— y arranque del degradado de `.panel`.
- **Filete** (`line`): el borde de un píxel de todo: tarjetas, chips, separadores de fila,
  cabecera pegajosa.
- **Filete Marcado** (`line-strong`): el mismo borde cuando algo está activo o en hover, la barra
  lateral de los errores comunes, el icono del estado vacío y el pulgar de la barra de scroll.
- **Tinta** (`ink`): el texto principal y todo lo que hay que leer a tres metros.
- **Tinta Atenuada** (`ink-dim`): la segunda voz —descripciones, metadatos, enlaces inactivos—.
  Contraste 9,96 / 8,86 / 7,69 sobre las tres superficies.
- **Tinta Tenue** (`ink-faint`): la tercera voz —rótulos de sección, unidades, matices, textos de
  estado vacío—. Contraste 6,78 / 6,04 / 5,24 sobre las tres superficies.

### Named Rules

**La regla del único cian.** El cian saturado está reservado a la acción primaria y a lo que está
pasando AHORA. Nada decorativo lo usa, y los pasteles de fase nunca compiten con él. El anillo de
foco, `::selection` y el estado de foco del enlace de salto son superficies del navegador
tematizadas, y quedan fuera de la cuenta.

**La regla del gris.** Ningún estado se distingue solo por color. La navegación activa y los
elementos activos del raíl se leen por superficie (`raised`), por peso (700 → 800) y por
luminosidad de la tinta, además de por `aria-current`: en escala de grises siguen siendo legibles.

**La regla de la etiqueta.** Un color de fase nunca viaja solo: siempre lleva al lado el nombre de
la fase escrito.

**La regla del dato sin color.** Los cuatro pasteles de fase **no valen para distinguir series en
una gráfica**, y no es una opinión: medidos como paleta categórica sobre `surface` fallan las
cuatro comprobaciones. La peor pareja, progresión contra acumulación, se separa ΔE 5,5 en visión
normal —el suelo es 15— y 4,4 en deuteranopía. Sirven para identificar una semana cuando su
nombre está escrito al lado; no para que el ojo distinga cuatro barras vecinas.

La salida no es subirles el croma, que los pondría a competir con el cian reservado: es reconocer
que **las semanas están ordenadas y no son categorías**. Una magnitud se codifica con longitud, y
el orden, con la posición. En el historial la matriz lo hace así y no gasta ni un color.

## Typography

**Display Font:** Archivo variable (con `Segoe UI Variable Display`, `Segoe UI`, `system-ui`)
**Body Font:** Archivo variable, la misma familia en todo el sistema
**Label/Mono Font:** ninguna aparte; las cifras se resuelven con `font-variant-numeric: tabular-nums`

La familia es una sola, variable de 400 a 900, auto-alojada como dos `woff2` subseteados en
`src/assets/fonts/` (latin y latin-ext) y referenciada desde el CSS para que Vite reescriba las
rutas con el `base` del despliegue. Toda la jerarquía se construye con peso y tamaño, nunca con un
cambio de familia.

**Character:** grotesca ancha y de eje vertical, cómoda en negrita extrema. En 900 y con `-0.03em`
de interletraje deja de ser tipografía de interfaz y pasa a ser señalética: es lo que permite leer
el nombre de la sesión desde el otro lado de la habitación.

### Hierarchy

- **Display** (900, `clamp(2.75rem, 6vw, 5rem)`, 0,95, −0,03em): el nombre de la sesión sobre la
  foto, el nombre de la fase en la página de semana y el nombre del ejercicio en su ficha. Uno por
  pantalla.
- **Figure** (800, `clamp(1.75rem, 3vw, 2.5rem)`, 1, −0,02em, tabular): la cifra grande. La
  prescripción de un bloque (`4 × 10-20`), el ordinal de la semana en su fila y —en peso 900— el
  título de las páginas de índice.
- **Title** (800, 1,5rem, −0,02em): el título del día en las tarjetas fotográficas.
- **Headline** (700, 1,125–1,25rem): el nombre del ejercicio en la lista del día, el nombre de la
  fase en la fila de semana.
- **Body** (400, 1rem, 1,625): descripciones y prosa larga, con la medida limitada entre 55 y 65
  caracteres (`max-w-[55ch]` … `max-w-[65ch]`).
- **Meta** (400–700, 0,875rem): la segunda línea de todo —contadores, duraciones, músculos—, con la
  cifra en 700 y `ink` y la palabra en `ink-dim`.
- **Label** (700, 0,72rem, +0,2em, versalitas por `uppercase`): los rótulos de sección
  («Ejercicios», «Calentamiento», «Las cuatro semanas»). Una variante a +0,18em sirve la línea de
  localización sobre las fotos, y otra a 0,7rem / +0,16em los `dt` de la ficha de ejercicio.

### Named Rules

**La regla de las cifras tabulares.** Toda cantidad comparable se compone con la utilidad
`.figures` (`tabular-nums` + `'tnum' 1`): series, semanas, días, duraciones, prescripciones y
ordinales. Si dos números pueden acabar uno debajo del otro, van en cifras tabulares.

**La regla de la unidad al lado.** Una cifra grande nunca viaja sola: `4 × 10-20` no dice si son
repeticiones o segundos, así que la unidad se escribe siempre junto a ella, en 0,875rem, +0,14em y
`ink-faint`.

**La regla del ordinal de dos dígitos.** Semanas y posiciones se rellenan a dos dígitos (`01`,
`02`) para que la columna cuadre.

## Layout

Contenedor de 80rem (`max-w-7xl`) centrado para las pantallas que se recorren —portada, semana,
día, catálogo, ficha—, con canal de 1rem que crece a 1,5rem en `sm` y a 2rem en `lg`; el aire
vertical es de 2rem, 2,5rem en `lg`. Las dos pantallas de rejilla, historial y ajustes, bajan a
72rem (`max-w-6xl`), que es el ancho en el que su bento de tres columnas mantiene celdas legibles
sin estirarlas. El envoltorio del layout llega hasta 92rem. Los puntos de ruptura son los de
Tailwind sin tocar: 640, 768, 1024 y 1280 px.

**Historial y ajustes se componen en bento**: una rejilla de tres columnas en `lg` con celdas de
tamaño desigual, no una columna de tarjetas iguales. La celda mayor es la que más pesa en la
decisión —la primera sesión en historial, el material declarado en ajustes— y ocupa dos columnas;
en ajustes ocupa además dos filas, y a su lado se apilan dos celdas de una. El orden del DOM es el
orden de la rejilla: cambiarlo abre huecos, porque la colocación es automática.

La página se ordena siempre igual: barra superior pegajosa → raíl de semanas y días → la pieza
protagonista → las listas. En la portada, el primer viewport reparte doce columnas en `lg`: cinco
para la sesión siguiente en 21:9 y siete para el resto de la semana en dos columnas de tarjetas
5:4. La rejilla de días de una semana es de una, dos y tres columnas (base / `sm` / `lg`); la del
catálogo, de una, dos y tres (base / `sm` / `xl`). La separación entre tarjetas es siempre de
1,25rem.

La ficha de ejercicio rompe el patrón a propósito: dos columnas asimétricas (`minmax(0,1.15fr)` y
`minmax(0,1fr)`) separadas por 2,5rem que crecen a 3,5rem, con la media pegada al scroll (`sticky`
a 2,5rem del borde) mientras el texto avanza.

Los dos raíles y la navegación de píldoras se desbordan en horizontal con scroll
(`overflow-x-auto`) en lugar de replegarse: en móvil se arrastran, en escritorio caben. Todo lo
que se pulsa mide al menos 2,75rem de alto; la acción primaria y las tarjetas de semana, 3,5rem.
La barra superior es `sticky` a 0 con `z-40` y desenfoque de fondo.

Los tres focos radiales del suelo van con `background-attachment: fixed`: la sala está iluminada,
la luz no viaja con el contenido.

## Elevation & Depth

**No hay ni una sombra en todo el proyecto.** La elevación se declara una sola vez y siempre de la
misma forma: un filete de un píxel en `line`, que pasa a `line-strong` cuando el elemento está
activo o bajo el cursor. Nunca borde y sombra a la vez, porque no hay sombra que sumar.

La profundidad se consigue por otras tres vías, todas ópticas y ninguna proyectada:

1. **Material de tarjeta** (`.panel`): un degradado vertical que aclara la superficie por arriba
   —de `raised` mezclado con un 4 % de acento hasta `surface` al 62 %—, como si a la tarjeta le
   diera la luz de la sala por el borde superior. Sustituye a la sombra.
2. **Tono de estado**: `surface` para lo inactivo, `raised` para lo activo. La jerarquía es tonal,
   no espacial.
3. **Cristal**: los chips sobre fotografía y la barra superior usan el propio fondo de la app
   mezclado con transparencia (65 % y 82 %) más `backdrop-filter: blur`, así que dejan ver lo que
   tienen detrás sin dejar de ser legibles.

### Named Rules

**La regla del filete único.** La elevación se declara una vez: filete de un píxel, nunca borde
más sombra. Si algo tiene que destacar, sube de tono, no de altura.

## Shapes

Dos radios y casi nada en medio. Las superficies rectangulares —tarjetas fotográficas, paneles,
huecos de media— llevan 14px (`--radius-card`), un redondeo lo bastante corto para que la esquina
se lea como recorte y no como blandura. Todo lo que se pulsa o se etiqueta es una cápsula completa
(`999px`): píldoras de navegación, días del raíl, chips, la acción primaria, los enlaces a
ejercicios alternativos. Entre medias solo hay dos excepciones justificadas: las tarjetas de
semana del raíl usan 1rem, y el cuadro del logotipo, 0,75rem.

Las marcas de fase son geometría mínima y siempre en cápsula: un punto de 0,5rem en el raíl, un
filete horizontal de 1,5rem × 2px sobre las fotos y una barra vertical de 4px × 0,875rem en la
fila de semana.

Los iconos están dibujados a mano en `Icon.astro`: lienzo de 24, trazo de 1,75 sin relleno,
terminaciones y uniones redondeadas, `currentColor` y siempre `aria-hidden`. Diez nombres
(`mesocycle`, `catalog`, `history`, `settings`, `arrow-right`, `check`, `trend-up`, `calendar`,
`bars`, `spark`) y ninguna dependencia externa. Los cuatro últimos encabezan las celdas del
historial y de consejos, en `ink-faint` a 20px: acompañan al título, nunca lo sustituyen.

Un icono que no se lee a 20px no vale, por bonito que sea el trazado. El primer intento de
`bars` era un bíceps y se veía como una nube deforme; lo que funciona a ese tamaño es geometría
simple, y tres barras de distinto largo describen la tabla que encabezan mejor que un músculo.

El foco visible es común a todo: contorno de 2px en acento, 3px de separación y 4px de radio.

## Components

### Buttons

- **Shape:** cápsula completa (`999px`), altura mínima 3,5rem, 1,75rem de padding lateral, peso 800.
- **Primary:** el único degradado saturado de la app (`.accion-primaria`): 100°, de `accent` a
  `accent-strong` mezclado al 88 % con la lavanda de intensificación, con la tinta `accent-ink`
  encima. Lleva el icono `arrow-right` a la derecha. Solo hay una por pantalla.
- **Hover / Focus:** escala a 1,02 en hover y vuelve a 1 al pulsar; el foco es el contorno común de
  acento. No cambia de color.
- **Disabled:** cuando la acción todavía no existe (el botón «Entrenar» del día), no se disfraza:
  se dibuja como cristal con filete marcado y tinta tenue, con el cursor bloqueado, y debajo se
  escribe en una línea por qué está apagado.

### Chips

- **Style (cristal, sobre fotografía):** cápsula con filete `line`, fondo del suelo de la app al
  65 % con desenfoque, texto `ink` en 600. Llevan los metadatos de la sesión: series, ejercicios,
  duración estimada, reserva.
- **Style (contorno, sobre superficie):** cápsula con filete `line`, sin fondo, texto `ink-dim` en
  600 y 0,75rem. Se usan para músculos y nivel en el catálogo, y para los ejercicios alternativos.
- **Style (filtro, en el catálogo):** cápsula de 2,75rem con filete `line`, la etiqueta del músculo
  y su recuento en `.figures` a la derecha. Los filtros salen del propio catálogo, no de una lista
  escrita a mano.
- **State:** los chips de cristal y de contorno son informativos y no tienen estado seleccionado.
  Los de filtro sí: activo invierte a fondo `ink` sobre tinta `ground`, sin filete, y lo declara
  con `aria-pressed`. Nunca en acento, que está reservado.

### Cards / Containers

- **Corner Style:** 14px en todas.
- **Background:** `PhotoCard` apoya sobre fotografía; el resto usa el material `.panel`.
- **Shadow Strategy:** ninguna (ver *Elevation & Depth*).
- **Border:** filete de un píxel en `line`; `line-strong` en hover o cuando el contenedor agrupa
  algo especial, como una superserie.
- **Internal Padding:** 1,25rem, que crece a 1,5rem en `sm` en las tarjetas fotográficas.

### Navigation

- **Barra superior:** pegajosa a 0, filete inferior, fondo del suelo al 82 % con desenfoque medio.
  A la izquierda el logotipo (cuadro de 2rem con el degradado de acción y el icono de mancuerna,
  más el nombre a partir de `sm`); a la derecha, la navegación.
- **Píldoras:** cuatro enlaces dentro de un contenedor en cápsula con filete y fondo `surface`, con
  0,25rem de aire interior. Cada uno lleva su icono siempre y su etiqueta a partir de `md`.
- **Estados:** en reposo, tinta atenuada sin fondo; en hover, la tinta sube a `ink`; activo, fondo
  `raised`, peso 800, tinta `ink` y `aria-current="page"`. Nunca color.

### Raíl de semanas y días (componente firma)

La columna vertebral de la app, presente en portada, semana y día. Dos filas apiladas con 0,75rem
de separación:

- **Semanas:** tarjetas de 1rem de radio y 3,5rem de alto, con el punto de color de la fase, el
  ordinal a dos dígitos en cifras tabulares y el nombre de la fase debajo en su color. Inactiva:
  filete `line` sobre `surface`. Activa: filete `line-strong` sobre `raised` y `aria-current`.
- **Días:** píldoras de 2,75rem con «Día N» en negrita tabular y el título del día en `ink-faint` a
  partir de `sm`. Activa: filete marcado, fondo `raised`, peso 800 y `aria-current`.
- Ambas filas se desbordan en horizontal con scroll.

La fila de días es un componente aparte (`DayRail`) y `WeekNav` la incluye salvo que se le diga
`days={false}`. La razón es de contenido, no de código: hay pantallas donde el raíl de días solo
repite lo que ya está justo debajo, y un raíl que repite el contenido inmediato deja de orientar y
pasa a estorbar. `DayRail` también se usa suelto donde haga falta solo esa fila.

### Lámina anatómica

El único campo claro de toda la app, y es **deliberado**: un dibujo de anatomía
sobre `plate` (`#ffffff`) con el músculo trabajado en rojo, ocupando el hueco de media de borde a
borde. Se lee como una lámina de referencia colgada en la pared, no como un agujero en la interfaz.

Tres reglas la sostienen, y las tres salieron de verla fallar:

1. **El campo es blanco puro, no `ink`.** El dibujo trae su propio fondo blanco; con `#f0f6fa`
   debajo aparece una costura rectangular visible.
2. **Llena el hueco, no flota dentro.** Un cuadrado claro pequeño centrado sobre material oscuro
   parece un error de carga. La lámina *es* el material de ese hueco.
3. **El dibujo se contiene, no se estira.** El original mide 180×180: por encima de unas 22rem
   empieza a verse blando, así que se centra con `object-contain` y un tope de ancho.

Dónde aparece: en la **ficha del ejercicio** y en **modo entreno**, que es donde quieres ver el
movimiento y qué músculo trabaja. Nunca en la rejilla del catálogo, que se queda fotográfica y
oscura: mezclar los dos materiales en la misma rejilla rompe las dos.

El orden de media es siempre el mismo, y es el orden de utilidad mientras entrenas: **vídeo, luego
lámina, luego fotografía**. El movimiento animado manda sobre el músculo señalado, y este sobre una
foto que solo ambienta.

### Calendario de sesiones (componente firma)

Las sesiones del historial no son una lista: son **la rejilla del propio mesociclo**, cuatro
semanas por tres días. Un calendario de mes para tres sesiones semanales sería casi todo huecos
vacíos; esta rejilla solo tiene celdas que existen en el plan, así que se ve el ritmo y los huecos
sin contar días que nunca tuvieron entreno.

- **Fila:** el ordinal de la semana y su fase a la izquierda en una columna de 5,5rem; los días a
  la derecha, en tres columnas desde `sm` y apilados por debajo, porque a 390px tres columnas
  truncan el título a «Tors…».
- **Celda hecha:** filete sólido en `ink` al 70 % sobre `surface`, con el título del día, la fecha
  corta y las series registradas.
- **Celda pendiente:** filete **discontinuo** en `line` y la palabra «Pendiente». El estado cambia
  la forma del filete, no solo su color.

### Celda de matriz (componente firma)

El reparto por músculo es una tabla de verdad —un lector de pantalla la recorre por filas— donde
cada celda lleva **la cifra exacta arriba y su barra debajo**, con la barra medida contra el
máximo de toda la tabla.

La escala común es el punto entero. Normalizar cada semana contra su propio máximo hacía que una
semana de descarga con 8 series dibujara una barra tan larga como una de acumulación con 18, y el
ojo leía que eran iguales. La longitud lleva la magnitud porque es más precisa que el color para
comparar cantidades, y la cifra se queda para el valor exacto. Una barra nunca baja del 4 %: una
serie no puede desaparecer del todo.

### Compositor apagado (pantalla de consejos)

Cuando una función está decidida pero sin construir, la pantalla existe y sus controles se
enseñan **apagados con el motivo escrito al lado**, nunca escondidos ni simulando una respuesta.
El compositor de `/consejos` es el caso de referencia: campo y botón deshabilitados al 60 % de
opacidad con cursor bloqueado, y una línea que dice por qué («la clave del modelo no puede vivir
en el navegador»). Las preguntas de ejemplo van en cápsulas de contorno en `ink-faint`: describen
el alcance sin fingir que se pueden pulsar.

### Tarjeta fotográfica (componente firma)

`PhotoCard` es la pieza de la que vive la interfaz. Reserva su hueco con `aspect-ratio` (21:9 la
protagonista, con 19rem de alto mínimo; 5:4 las tarjetas de día), recorta la foto a `object-cover`
**sin filtro de ningún tipo** y encima —siempre, sin excepción— tiende un velo de cuatro paradas
que va del suelo opaco en el pie, al suelo al 88 % en el 28 % de la altura, al 45 % en el 58 %, y
llega a transparente en el 82 %. El velo existe donde hay texto y desaparece donde hay motivo.
El contenido se ancla abajo con 1,25–1,5rem de padding. En hover la foto
escala a 1,03 en medio segundo; el marco no se mueve. Solo la protagonista carga en `eager`.

`PhotoCard` sirve **dos procedencias y quien la usa no tiene que saber cuál es cuál**: un archivo
del proyecto pasa por `astro:assets` en dos anchos (480 y 960); una URL remota llega ya
dimensionada desde su origen y se pinta con un `<img>` normal. `routes.asset()` distingue una de
otra, porque prefijar una URL remota con el `base` del despliegue la rompería.

Hoy todas las fotos son remotas, de Unsplash. **Cada una de las doce sesiones del mesociclo tiene
la suya**, distinta de las otras once: la clave es la sesión completa, no el número de día, porque
repetir foto por día hacía que el mesociclo entero pareciera la misma pantalla cuatro veces. El
tema sigue al día —empuje, pierna y tracción, cuerpo entero— y cambia de imagen cada semana. El
reparto vive en `src/theme.ts` (`SESSION_PHOTOS` para las sesiones, `SCENE_PHOTOS` para portada y
pantallas sueltas); la procedencia y la consecuencia de servirlas remotas, en
`src/assets/photos/PROCEDENCIA.md`.

### Inputs / Fields

- **Style:** todo campo comparte forma: cápsula de 2,75rem de alto, filete `line` sobre `surface`,
  1rem de padding lateral y tinta `ink`. En hover el filete sube a `line-strong`. Los campos que
  reciben una cifra llevan `.figures`; los grandes del modo entreno rompen a 4rem de alto, radio de
  tarjeta y 1,875rem de peso 800, porque se rellenan de pie y a dos metros.
- **Desplegables:** el cromo del sistema operativo dentro de un `<select>` es la pieza que delata
  que una pantalla se ensambló en vez de diseñarse. `.desplegable` lo apaga (`appearance: none`) y
  dibuja su propio galón en `ink-faint`, con 2,75rem de reserva a la derecha para que el texto
  nunca lo pise. La URL del SVG vive en `global.css` porque no cabe en una clase de utilidad.
- **Focus:** el contorno común de acento, 2px con 3px de separación.

### Interruptores

Un interruptor **es un `<input type="checkbox">` con otra piel**, nunca un `<div>` con
`role="switch"` improvisado: así conserva el teclado, el lector de pantalla y el script que lee su
`.checked` sin que ninguno se entere del cambio. `appearance: none`, cápsula de 3rem × 1,75rem con
filete `line-strong` sobre `surface`, y un pulgar de 1,25rem que viaja 1,25rem al encenderse.

- **Encendido va en tinta, no en acento**: fondo `ink` y pulgar `ground`. Cuatro interruptores
  encendidos en acento gastarían el único croma alto del sistema en un estado que no es una acción
  ni es lo que toca ahora.

### Marcas de serie (componente firma)

Bajo el reloj del modo entreno, una fila de círculos de 2,25rem dice cuántas series lleva el
ejercicio y en cuál vas. **Cada estado cambia la forma de la marca además del color**, así que se
lee sin depender de distinguir colores: la serie hecha va maciza (fondo `ink`, tinta `ground`), la
de ahora va anillada (filete y tinta en acento, con `aria-current="step"`) y las que faltan van
huecas (filete `line`, tinta `ink-faint`). Solo aparece cuando el ejercicio tiene más de una serie.

### Celdas de bento

- **Corner Style:** 14px, como toda superficie rectangular.
- **Background:** el material `.panel`; la celda mayor puede abrir con una banda fotográfica de
  9–11rem de alto separada por un filete inferior.
- **Internal Padding:** 1,25rem, que crece a 1,5rem en `sm`.
- **Comportamiento:** la celda no fija su tamaño; lo hace la rejilla con `col-span` y `row-span`.
  Dentro, el contenido fluye desde arriba: empujarlo a los extremos con `justify-between` abre un
  agujero en cuanto la celda vecina es más alta.

### Filas de datos

Las listas largas —las cuatro semanas, los ejercicios de un día— no son tarjetas: son filas
separadas por un filete inferior que desaparece en la última. La fila de semana usa una rejilla de
tres columnas en móvil que se abre a seis en `sm`, con el ordinal en tamaño *figure* y una flecha
que avanza 0,25rem en hover. La fila de bloque coloca la posición a la izquierda, el ejercicio en
el centro y la prescripción alineada a la derecha en `sm`.

### Hueco de media

`ExerciseMedia` es la única puerta a la media de un ejercicio y resuelve cuatro tipos (croquis,
vídeo, embed e imagen) más el estado vacío. Reserva el hueco por `aspect-ratio` siempre —16:9 por
defecto, o el que declare el propio asset—, así que el layout no salta cuando el asset todavía no
existe. El estado vacío es sobrio, no un aviso: el icono de mancuerna en `line` y una línea que
nombra el ejercicio que falta. Ya no grita, porque desde que las dieciséis fichas tienen imagen es
un caso de excepción y no la norma.

El vídeo se comporta según dónde esté. En modo entreno se reproduce solo, en bucle y sin
controles: es lo que miras entre serie y serie. **En una rejilla se despierta al pasar por encima
y se rebobina al salir**, así que la tarjeta en reposo pesa lo que su primer fotograma en vez de
sus megabytes, y nunca compite con las tarjetas de al lado. El vídeo de terceros no carga nada
hasta que se pulsa: el botón de reproducción es un círculo de 4rem en `ink` sobre `ground`, y el
iframe se crea en el clic.

## Do's and Don'ts

### Do:

- **Do** reservar `accent` (`#34dafa`) para la acción primaria y para lo que pasa ahora; como mucho
  una acción primaria por pantalla.
- **Do** acompañar todo color de fase con el nombre de la fase escrito al lado.
- **Do** duplicar la señal de cualquier estado activo: superficie `raised` + peso 800 +
  `aria-current`, para que sobreviva en escala de grises.
- **Do** componer con `.figures` cualquier cantidad comparable, y escribir siempre la unidad junto a
  la cifra grande.
- **Do** meter el contenido de una tarjeta fotográfica dentro de `PhotoCard`, que es quien
  garantiza el degradado de contraste bajo el texto.
- **Do** reservar el hueco de toda media con `aspect-ratio` antes de saber si el asset existe.
- **Do** declarar la elevación con un filete de un píxel en `line`, y subirlo a `line-strong` para
  el estado activo o el hover.
- **Do** dibujar los iconos nuevos en `Icon.astro` con lienzo 24, trazo 1,75 y terminaciones
  redondeadas.
- **Do** dar al menos 2,75rem de alto a todo lo que se pulse (3,5rem a la acción primaria).
- **Do** decir la verdad en los estados vacíos: nombrar lo que falta en lugar de simular contenido.
- **Do** cambiar una fotografía tocando solo datos: `SESSION_PHOTOS` y `SCENE_PHOTOS` en
  `src/theme.ts` para el plan, `media.thumbnail` del JSON del ejercicio para el catálogo. Ningún
  componente se entera, y `PROCEDENCIA.md` se mantiene al día con el origen y la licencia.
- **Do** verificar que una URL de foto responde `200` antes de cablearla: en la última tanda dos de
  cada diez eran `404`, y un hueco roto en una rejilla se ve más que una foto floja.
- **Do** dar a cada sesión del mesociclo su propia fotografía. Repetirla por número de día hace que
  cuatro semanas parezcan la misma pantalla.
- **Do** apagar el cromo del sistema operativo en todo `<select>` con `.desplegable`.
- **Do** construir un interruptor sobre un `<input type="checkbox">` real, y encenderlo en tinta.

### Don't:

- **Don't** usar sombras. No hay ninguna en el proyecto y no se añade la primera; si algo tiene que
  destacar, sube de tono.
- **Don't** poner borde y sombra a la vez, ni dos filetes concéntricos.
- **Don't** distinguir un estado solo por color, ni usar un pastel de fase como color de acción.
- **Don't** introducir un segundo color saturado: los pasteles existen precisamente para no competir
  con el cian.
- **Don't** escribir `accent-ink` sobre una superficie; solo vive encima del acento.
- **Don't** dejar texto sobre una fotografía sin el degradado de `PhotoCard` debajo, ni confiar en
  que la foto concreta ya tenga contraste suficiente.
- **Don't** usar iconos de librería, fuentes de iconos ni emoji haciendo de icono.
- **Don't** meter una segunda familia tipográfica: la jerarquía se hace con peso y tamaño.
- **Don't** poner cifras comparables en tipografía proporcional.
- **Don't** añadir una línea pequeña en versalitas encima de un título si no aporta un dato que el
  título no tiene: la que existe sobre las fotos localiza la sesión (semana, fase, día) o declara el
  estado «Tu próxima sesión»; una etiqueta decorativa en ese sitio no está justificada.
- **Don't** deshabilitar un control sin decir al lado por qué está apagado.
- **Don't** cargar un vídeo de terceros antes de que el usuario lo pida, ni reproducir solo un
  vídeo propio dentro de una rejilla: en una rejilla se despierta al pasar por encima.
- **Don't** apagar una fotografía con opacidad o desaturación para ganar contraste. Una foto al
  70 % deja de leerse como foto y pasa a ser textura sucia; el contraste lo pone el velo, que
  existe donde hay texto y desaparece donde hay motivo.
- **Don't** repetir la misma fotografía en dos sesiones distintas del mesociclo.
- **Don't** prefijar una URL remota con el `base` del despliegue: `routes.asset()` ya distingue una
  ruta propia de una remota, y saltárselo produce `/entreno/https://…`.
- **Don't** estirar una celda de bento con `justify-between`: en cuanto la vecina crece, aparece un
  agujero en medio.
- **Don't** meter algo ancho —una tabla, un raíl— en una celda de rejilla sin `min-w-0`. Todo
  elemento de rejilla nace con `min-width: auto`, así que se niega a encoger, **ensancha la columna
  entera** y arrastra a sus vecinas; el `overflow-x-auto` de dentro nunca llega a recortar. Se ve
  midiendo `scrollWidth` contra `clientWidth`, no mirando la pantalla.
- **Don't** usar los pasteles de fase para separar series en una gráfica. Ver *la regla del dato
  sin color*: la longitud lleva la magnitud y la posición lleva el orden.
- **Don't** comparar dos periodos de distinta duración. Una semana a medias siempre tiene menos
  series que una entera; decir «−65 %» ahí es inventarse una caída. Se compara entre semanas
  completas, o se dice por dónde vas.
- **Don't** repetir en un raíl lo que ya está justo debajo. Para eso `WeekNav` acepta
  `days={false}`.
- **Don't** meter una lámina anatómica en la rejilla del catálogo, ni una fotografía dentro de una
  lámina: son dos materiales y mezclarlos en la misma rejilla rompe los dos.
- **Don't** poner un campo claro pequeño flotando sobre material oscuro. O llena su hueco de borde a
  borde y es material, o no está.
- **Don't** dejar que una utilidad de `display` conviva con el atributo `hidden` sin comprobarlo.
  Aquí funciona porque el preflight declara `[hidden] { display: none !important }`, no por suerte.
