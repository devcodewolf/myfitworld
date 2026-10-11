# Procedencia de las fotografías

> **Los cuatro archivos de esta carpeta ya no se usan.** Las fotos de portada y de
> día pasaron a Unsplash (ver más abajo) para que las doce sesiones del mesociclo
> tengan cada una la suya. Se conservan por si algún día quieres volver a servir
> imágenes locales; para eso, `src/theme.ts` es el único archivo que hay que tocar.

Todas son de **StockSnap.io** con licencia **CC0** (dominio público): uso libre,
sin atribución obligatoria y sin restricción comercial. Se conservan aquí sus
identificadores por si hace falta volver al original en alta resolución.

| Archivo | Origen | Id | Licencia |
|---|---|---|---|
| `hoy-mancuernas-zapatillas.jpg` | StockSnap, "Sneakers Weights" | `DAVLOF8C3R` | CC0 |
| `dia-1-mancuernas-suelo.jpg` | StockSnap, "Fitness Weights" | `CYK8OIFEIE` | CC0 |
| `dia-2-discos-cenital.jpg` | StockSnap, "Fitness Weights" | `TDRGG50ZRR` | CC0 |
| `dia-3-suelo-madera.jpg` | StockSnap, "Fitness Weights" | `9FOM4OTWR9` | CC0 |

Descargadas a 960 px de ancho, que es de sobra para el tamaño en el que se
muestran. El original está disponible hasta 6000 px en `stocksnap.io/photo/<id>`.

**Son provisionales.** Están aquí para que el diseño funcione hoy; la intención
es sustituirlas por fotos del espacio real. Cambiar una foto es reemplazar el
archivo manteniendo el nombre: no hay que tocar ningún componente.

## Fotos remotas: portada, sesiones y ejercicios

Todas las fotos que se ven hoy son de **Unsplash**, servidas desde
`images.unsplash.com`. Las de los ejercicios se declaran en `media.thumbnail` de
cada `src/content/exercises/*.json`; las de la portada y las doce sesiones, en
`src/theme.ts` (`SESSION_PHOTOS` y `SCENE_PHOTOS`). No se descargan: la URL lleva ya los parámetros
de tamaño y calidad (`w=900&q=72&auto=format`), así que Unsplash sirve AVIF o
WebP según el navegador.

La licencia de Unsplash permite uso comercial sin atribución obligatoria.

**Consecuencia que hay que conocer:** al no pasar por `astro:assets`, estas fotos
no se optimizan en el build ni se sirven en varios anchos, y **la app necesita
red para mostrarlas**. Si algún día quieres que funcione sin conexión, hay que
descargarlas a `src/assets/photos/` y cambiar `kind: 'image'` por una referencia
local; `routes.asset()` ya distingue una URL remota de una ruta propia, así que
el cambio es de datos, no de componentes.

**Hoy casi todos los ejercicios tienen vídeo propio**, en `public/ejercicios/`,
generado con IA para que salgan siempre el mismo hombre y el mismo cuarto. El
vídeo manda sobre la lámina y la foto en todas las pantallas, así que las fotos
de Unsplash de los ejercicios solo se ven en los que aún no lo tienen.

## Láminas anatómicas (locales)

Los diez GIF de `public/croquis/` salen de **ExerciseDB**, del endpoint libre
`oss.exercisedb.dev`, y se sirven **desde este proyecto**, no enlazados. Se
descargaron una vez (180×180 cada uno). Eran doce: los de fondos entre bancos y
zancadas se borraron al salir esos ejercicios de la rutina.

| Ejercicio | Nombre en origen |
| --- | --- |
| `flexiones-declinadas` | decline push-up |
| `press-militar-mancuernas` | dumbbell one arm shoulder press |
| `elevaciones-laterales` | dumbbell lateral raise |
| `pajaros-vuelos-posteriores` | dumbbell reverse fly |
| `curl-biceps-supino` | dumbbell biceps curl |
| `curl-martillo` | dumbbell seated hammer curl |
| `extension-triceps-tras-nuca` | dumbbells seated triceps extension |
| `sentadilla-goblet` | dumbbell goblet squat |
| `sentadilla-bulgara` | dumbbell single leg split squat |
| `peso-muerto-rumano` | dumbbell romanian deadlift |

**Por qué locales y no enlazados.** Su propio repositorio dice que el endpoint
libre «es solo para exploración y no se recomienda para integración en
producción». Además tiene límite de ráfaga: con noventa llamadas seguidas a
120 ms deja de responder y devuelve HTML, aunque se recupera en menos de medio
minuto. Un megabyte en el repositorio elimina de golpe esa dependencia.

El código del API es AGPL-3.0. La licencia de los medios del servidor libre no
está escrita en ninguna parte, que es un cabo suelto conocido: si algún día esto
deja de ser una app personal, hay que preguntarles antes de seguir.

**Siete ejercicios no tienen lámina**: `flexiones`, `remo-mancuerna-una-mano` y
`floor-press`, que no tenían coincidencia decente en el catálogo de origen, y los
cuatro que entraron después en la rutina (`press-frances-suelo`,
`remo-inclinado-mancuernas`, `curl-concentrado` y `curl-inverso`). Todos tienen
vídeo, que es lo que se enseña primero.
