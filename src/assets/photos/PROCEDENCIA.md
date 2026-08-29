# Procedencia de las fotografías

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

## Fotos de ejercicio (remotas)

Las dieciséis fichas del catálogo llevan una foto de **Unsplash**, servida desde
`images.unsplash.com` y declarada en `media.thumbnail` de cada
`src/content/exercises/*.json`. No se descargan: la URL lleva ya los parámetros
de tamaño y calidad (`w=900&q=72&auto=format`), así que Unsplash sirve AVIF o
WebP según el navegador.

La licencia de Unsplash permite uso comercial sin atribución obligatoria.

**Consecuencia que hay que conocer:** al no pasar por `astro:assets`, estas fotos
no se optimizan en el build ni se sirven en varios anchos, y **la app necesita
red para mostrarlas**. Si algún día quieres que funcione sin conexión, hay que
descargarlas a `src/assets/photos/` y cambiar `kind: 'image'` por una referencia
local; `routes.asset()` ya distingue una URL remota de una ruta propia, así que
el cambio es de datos, no de componentes.

Las dos que llevan vídeo propio (`flexiones` y `remo-mancuerna-una-mano`) usan su
vídeo y no tienen foto remota.
