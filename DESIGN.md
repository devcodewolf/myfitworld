---
name: My Fitness World
description: Suelo negro azulado, fotografía a sangre y un único cian encendido sobre lo que toca ahora.
colors:
  ground: "#091017"
  surface: "#141d26"
  raised: "#1e2934"
  line: "#2c3947"
  line-strong: "#45576a"
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
---

<!-- ESTADO: este documento describe el mundo tal y como está construido hoy, después
     del rediseño. La revisión de acabado NO se ha ejecutado sobre esta versión: lo que
     sigue es lo que el código hace, no un veredicto de calidad. -->

# Design System: My Fitness World

## Overview

**Creative North Star: "La sala a oscuras con la luz encendida sobre la barra"**

Es un plan por el que se avanza por fecha, no un panel que se lee. El eje de la interfaz es el
raíl de semanas y días: siempre sabes en qué punto del mesociclo estás antes de saber ninguna
otra cosa. Sobre ese raíl, la sesión que toca ocupa la pantalla como una tarjeta fotográfica a
sangre con una sola acción encima. La app se mira de pie, a dos o tres metros, con las manos
ocupadas y casi siempre de noche: de ahí el fondo negro azulado, el tamaño desmesurado de las
cifras y el hecho de que solo haya un color encendido en toda la pantalla.

El material es fotografía. Bodegones reales de mancuernas, discos y suelo de madera, apagados al
70 % de opacidad y desaturados al 65 %, que llenan el ancho de las tarjetas de día y de la sesión
protagonista. No son ilustración de relleno: son lo que da temperatura y peso a una interfaz que,
sin ellas, sería una lista. Debajo del texto siempre cae un degradado que arranca del propio
fondo de la app, así que el contraste no depende nunca de qué foto haya puesta. El suelo de la
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
- Fotografía a sangre bajo degradado garantizado, con metadatos como chips de cristal
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

Contenedor único de 80rem (`max-w-7xl`) centrado, con canal de 1rem que crece a 1,5rem en `sm` y a
2rem en `lg`; el aire vertical es de 2rem, 2,5rem en `lg`. Los puntos de ruptura son los de
Tailwind sin tocar: 640, 768, 1024 y 1280 px.

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
terminaciones y uniones redondeadas, `currentColor` y siempre `aria-hidden`. Seis nombres
(`mesocycle`, `catalog`, `history`, `settings`, `arrow-right`, `check`) y ninguna dependencia
externa.

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
- **State:** los chips son informativos, no filtros; no tienen estado seleccionado. El único
  interactivo es el de ejercicio alternativo, que aclara filete y tinta en hover.

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

### Tarjeta fotográfica (componente firma)

`PhotoCard` es la pieza de la que vive la interfaz. Reserva su hueco con `aspect-ratio` (21:9 la
protagonista, con 19rem de alto mínimo; 5:4 las tarjetas de día), recorta la foto a `object-cover`
al 70 % de opacidad y 65 % de saturación y encima —siempre, sin excepción— tiende un degradado de
tres paradas que va del suelo opaco abajo, al suelo al 72 % en el 46 % de la altura, y termina en
un 14 % de acento arriba. El contenido se ancla abajo con 1,25–1,5rem de padding. En hover la foto
escala a 1,03 en medio segundo; el marco no se mueve. La imagen se sirve por `astro:assets` en dos
anchos (480 y 960) y solo la protagonista carga en `eager`.

Las fotografías son cuatro, viven en `src/assets/photos/`, se convierten a WebP en build y son
**provisionales**: cambiar una es reemplazar el archivo con el mismo nombre, sin tocar ningún
componente. Su procedencia (StockSnap, licencia CC0) y sus identificadores están en
`src/assets/photos/PROCEDENCIA.md`.

### Filas de datos

Las listas largas —las cuatro semanas, los ejercicios de un día— no son tarjetas: son filas
separadas por un filete inferior que desaparece en la última. La fila de semana usa una rejilla de
tres columnas en móvil que se abre a seis en `sm`, con el ordinal en tamaño *figure* y una flecha
que avanza 0,25rem en hover. La fila de bloque coloca la posición a la izquierda, el ejercicio en
el centro y la prescripción alineada a la derecha en `sm`.

### Hueco de media

`ExerciseMedia` es la única puerta a la media de un ejercicio y resuelve cuatro tipos (croquis,
vídeo, embed e imagen) más el estado vacío. Reserva el hueco por `aspect-ratio` siempre —4:3 por
defecto—, así que el layout no salta cuando el asset todavía no existe. El estado vacío es honesto
y está diseñado: un foco radial tenue de acento al 7 %, el icono de mancuerna en `line-strong`, el
rótulo «Croquis pendiente» y una línea que nombra el ejercicio que falta. El vídeo de terceros no
carga nada hasta que se pulsa: el botón de reproducción es un círculo de 4rem en `ink` sobre
`ground`, y el iframe se crea en el clic.

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
- **Do** sustituir una fotografía reemplazando el archivo de `src/assets/photos/` con el mismo
  nombre, y mantener actualizado `PROCEDENCIA.md` con su origen y su licencia.

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
- **Don't** cargar media de terceros antes de que el usuario la pida.
