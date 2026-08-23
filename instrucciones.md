# Cómo funciona My Fitness World

Este documento explica cómo se usa la aplicación en el día a día, cómo está organizada por dentro y
qué está construido a día de hoy. Está escrito para ti, no para un programador.

---

## 1. Qué es esto

Una aplicación para ejecutar **tu** mesociclo de entrenamiento en casa. No es un catálogo de rutinas
ni un tracker genérico: contiene tu plan concreto de cuatro semanas y tres días por semana, y está
diseñada para usarse **de pie, a dos o tres metros de la pantalla, con las manos ocupadas**.

Todo vive en tu navegador. No hay servidor, no hay cuenta, no hay nadie más viendo tus datos.

---

## 2. El recorrido de un día de entreno

Esto ya funciona de principio a fin. Lo que falta, en la sección 7.

**Abres la app.** Lo primero que ves es dónde estás: el raíl de semanas arriba (Semana 01 a 04, cada
una con el color de su fase) y debajo el raíl de días de esa semana. No hay que buscar nada.

**La sesión que toca ocupa la pantalla.** Una tarjeta grande con su fotografía, el nombre del día
(*Torso / Empuje*), y tres datos: cuántas series, cuántos ejercicios y cuántos minutos te va a costar.
Al lado, los otros dos días de la semana, más pequeños.

**Entras en el día.** Ves la lista completa de ejercicios en orden, cada uno con:

- La prescripción en grande: `4 × 10-20 REPS` significa cuatro series de entre diez y veinte
  repeticiones.
- Cuánto cuesta ese ejercicio en total, el descanso entre series, y los detalles que importan
  (excéntrica de 3 s, por lado, 40 s entre lados).
- Las superseries van agrupadas en su propio recuadro, porque se encadenan sin descanso real.

**Pulsas Entrenar.** A partir de aquí empieza el modo entreno: un ejercicio a la vez, con su croquis a
la vista, el temporizador circular llevándote el ritmo, y una lista de series que vas marcando. Cada
vez que marcas una, anotas el peso y las repeticiones reales, y arranca solo el descanso.

**Terminas.** Resumen de la sesión: volumen total, duración real y comparativa con la misma sesión de
la semana anterior.

**Y en Historial** queda todo: cada sesión con su fecha, las series por grupo muscular de cada semana,
y el aviso de en qué ejercicios has tocado techo dos veces seguidas y toca subir peso.

---

## 3. Cómo está organizado tu plan

Cinco niveles, de mayor a menor:

| Nivel | Qué es | Ejemplo |
|---|---|---|
| **Mesociclo** | El bloque completo de entrenamiento | Full body en casa, 4 semanas |
| **Semana** | Una fase con su intención | Semana 03 · Intensificación |
| **Día** | Una sesión | Día 1 · Torso / Empuje |
| **Bloque** | Un ejercicio con su prescripción de ese día | Flexiones, 4 × 10-20, 90 s |
| **Serie** | Lo que hiciste de verdad | 14 reps con peso corporal |

La distinción importante: **el bloque es lo que toca hacer y la serie es lo que hiciste**. Nunca se
mezclan. El plan no cambia porque un día rindas menos.

### Las cuatro semanas

Cada semana tiene una intención distinta, y por eso tiene su propio color:

1. **Acumulación** — Fijar técnica y anotar con qué pesos trabajas. Deja 3-4 repeticiones en reserva.
2. **Progresión** — Las mismas series con una o dos repeticiones más. Deja 2-3 en reserva.
3. **Intensificación** — Una serie más en los básicos y cerca del fallo. La semana dura.
4. **Descarga** — Alrededor del 55 % del volumen de la 3 y lejos del fallo. Existe para que la
   siguiente valga algo.

---

## 4. Cómo sabe la app cuándo subir peso

Esta es la regla, y es la única:

> Cuando superas el tope alto del rango de repeticiones **en todas las series** durante **dos sesiones
> seguidas**, la carga se ha quedado corta y toca subirla.

Ejemplo: en press militar tienes `3 × 10-12`. Si un día haces 12, 13 y 12, esa sesión toca techo. Si
la siguiente vuelve a tocarlo, la app te avisa.

**Cuánto subir lo decide tu material, no un número inventado.** En Ajustes declaras qué mancuernas
tienes; la app calcula qué cargas puedes montar y te propone la siguiente. Si ya estás en tu peso más
alto, te lo dice en lugar de sugerirte algo que no tienes: ahí la progresión va por repeticiones,
tempo más lento o variante más difícil.

Por eso **en ningún sitio de la app hay un peso escrito a mano**. El plan se expresa en repeticiones y
esfuerzo; el peso es un dato tuyo que registras en cada serie.

---

## 5. Editar tu rutina sin tocar código

Los datos son archivos de texto. Para cambiar la rutina no hace falta programar.

**Los ejercicios** están en `src/content/exercises/`, uno por archivo. El nombre del archivo es su
identificador: `flexiones.json` es el ejercicio `flexiones`. Dentro va su nombre, qué músculos
trabaja, qué material necesita, sus claves de técnica y sus errores comunes.

**El mesociclo** está en `src/content/mesocycles/meso-01.json`: las cuatro semanas con sus días y sus
bloques.

**Si te equivocas, el build falla y te dice exactamente dónde.** Si un día referencia un ejercicio que
no existe, verás un mensaje como:

```
La rutina no es válida:
  · meso-01 › semana 1 › día 3 › bloque 5 › el ejercicio "curl-inventado" no existe en el catálogo
```

Eso es a propósito: es preferible que no compile a que la app se abra con un hueco silencioso.

**Para cambiar una fotografía**, sustituye el archivo en `src/assets/photos/` manteniendo el mismo
nombre. No hay que tocar nada más. Las actuales son de stock con licencia libre y están puestas para
que el diseño funcione mientras no tengas las tuyas; su procedencia está en
`src/assets/photos/PROCEDENCIA.md`.

---

## 6. Tus datos y tu copia de seguridad

**Dónde están.** En el almacenamiento local de este navegador, en este ordenador. En ningún otro
sitio.

**Qué significa eso.** Si borras los datos del navegador, cambias de ordenador o usas otro navegador,
**el historial no está**. No hay nube que lo recupere.

**La copia.** En Ajustes → Tus datos → *Exportar copia (JSON)* se descarga un archivo con todo:
perfiles, ajustes y sesiones. Guárdalo en otro sitio. Es tu única copia de seguridad, así que hazla de
vez en cuando.

**Al importar** eliges entre fusionar o reemplazar. Fusionando, **nunca se pisa un registro más
reciente con uno más antiguo**, así que puedes importar una copia vieja sin miedo a perder lo nuevo.

**Si algún dato se corrompe**, la app no lo borra: lo aparta con su fecha y te avisa en Ajustes. El
original sigue ahí para poder rescatarlo.

---

## 7. Qué está construido a día de hoy

Sé honesto con esto al usarlo: hay partes que todavía no existen.

### Funciona

- Navegar el mesociclo: portada, semanas y días, con el raíl de calendario.
- La lista completa de ejercicios de cada día con su prescripción, descansos y tempos.
- El catálogo de ejercicios y la ficha de cada uno, con sus claves de técnica y errores comunes.
- Volver al día del que venías al entrar en un ejercicio desde una sesión.
- **El modo entreno**, con todo lo descrito en la sección 2: un ejercicio a la vez, temporizador
  circular, avisos sonoros y vibración, registro de peso y repeticiones, autoguardado en cada serie,
  reanudación si recargas, y resumen al terminar.
- **Ajustes**: declarar tu material, ver qué cargas puedes montar, sonido, vibración, mantener la
  pantalla encendida, multiplicador de descanso, peso corporal, y exportar e importar tus datos.
- **El historial**: tus sesiones una a una, las series por grupo muscular de cada semana, y el aviso
  de en qué ejercicios toca subir peso, con cuánto según tu material.

### Todavía no

- **Los croquis de los ejercicios.** Donde tienen que ir se ve "Croquis pendiente".
- **Sustituciones de ejercicio** y **generador de mesociclo nuevo** a partir del anterior.

---

## 8. Comandos

```bash
pnpm dev        # servidor de desarrollo en http://localhost:4321
pnpm test       # los tests del dominio
pnpm check      # comprobación de tipos
pnpm build      # generar el sitio en dist/
```

Para desplegarlo en una subcarpeta de tu servidor:

```bash
BASE_PATH=/entreno pnpm build    # vivirá en https://tu-servidor/entreno/
```

Y luego se copia el contenido de `dist/` dentro de esa carpeta.

---

## 9. Cómo está montado por dentro

Por si algún día vuelves al código, o se lo enseñas a alguien:

```
src/
├─ content/   LOS DATOS. Lo único que editas para cambiar la rutina.
├─ core/      LO QUE PIENSA. Cálculos puros: temporizadores, volumen, progresión.
│             No sabe que existe un navegador. Es lo que está cubierto por tests.
├─ storage/   LO QUE RECUERDA. Lo único que sabe que existe localStorage.
├─ browser/   LO QUE TOCA EL HARDWARE. Audio, vibración, pantalla.
├─ components/ + pages/   LO QUE SE VE.
└─ styles/    Los colores, tipografías y espaciados del sistema de diseño.
```

La razón de esta separación es concreta: el día que quieras sincronizar entre el móvil y el ordenador,
solo hay que escribir una implementación nueva dentro de `storage/`. Nada de lo demás se entera.
