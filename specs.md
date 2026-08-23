# Especificación técnica

Documento para una persona programadora o un agente que tenga que trabajar sobre este código. Describe
cómo está montada la aplicación, qué reglas la gobiernan y qué pasos hay que dar para añadirle un
backend o una base de datos.

Para la visión de producto está `PRODUCT.md`. Para el sistema visual, `DESIGN.md`. Para el uso diario,
`instrucciones.md`.

---

## 1. Stack y restricciones

| Pieza | Elección | Por qué |
|---|---|---|
| Framework | Astro 7, `output: 'static'` | 36 páginas prerenderizadas; no hay servidor que mantener |
| Lenguaje | TypeScript `strict`, sin `any` | Los tipos se infieren de los esquemas Zod |
| Validación | Zod 4 | Fuente de verdad compartida entre contenido, persistencia y futuro servidor |
| Estilos | Tailwind v4, CSS-first | Tokens en `@theme` dentro de `src/styles/global.css`; no hay `tailwind.config.js` |
| Imágenes | `astro:assets` + sharp | Conversión a WebP y `srcset` en build |
| Tests | Vitest | Solo sobre `src/core/` y `src/storage/`, que son puros |
| Formato | Prettier + plugins de Astro y Tailwind | `.prettierrc.json`; `.gitattributes` fuerza LF |
| Paquetes | pnpm | Todos los comandos con `pnpm`, nunca `npm` |

Restricciones vigentes, decididas y no negociables sin hablarlo con el propietario:

- **Sin PWA.** No hay service worker ni modo offline instalable.
- **Cero dependencias innecesarias.** Nada de librerías de UI, de gráficas, de fechas ni de audio. El
  sonido se genera con la Web Audio API y los gráficos se dibujan con SVG a mano.
- **Vue solo como isla**, y únicamente en el modo entreno (`client:only="vue"`). Todo lo demás es
  Astro y JavaScript plano. Es la única isla del proyecto y así debe seguir: si una pantalla nueva
  parece necesitar Vue, primero hay que justificar por qué no basta con vanilla.
- **El peso nunca se escribe a mano** en datos ni en UI. Sale siempre de `src/core/equipment.ts`.

---

## 2. Arquitectura

### La regla de dependencias

```
pages → components → browser → storage → core
```

Las flechas van en un solo sentido. En concreto:

- **`src/core/` no importa nada.** Ni de Astro, ni del DOM, ni de `storage/`. Solo Zod. Si un módulo de
  `core/` necesita saber la hora o generar un id, se le **inyecta** como función. Es lo que permite
  testearlo entero sin navegador y con resultados deterministas.
- **`src/storage/` es lo único que sabe que existe `localStorage`**, y ni siquiera directamente: habla
  con la interfaz `KeyValueStore`.
- **`src/browser/` es lo único que toca APIs del navegador** (audio, vibración, wake lock, descargas).
- **`src/components/` y `src/pages/` no calculan nada.** Si aparece aritmética en una plantilla, ese
  cálculo pertenece a `core/`.

### El mapa de carpetas

```
src/
├─ content.config.ts     Colecciones de Astro; envuelve los esquemas de core/model.ts
├─ content/
│  ├─ exercises/*.json   Catálogo. El nombre del archivo ES el id del ejercicio.
│  └─ mesocycles/*.json  Mesociclos. `isActive` marca el que sirven las rutas cortas.
├─ data.ts               Lectura de contenido + comprobación de integridad
├─ routes.ts             TODAS las URLs internas se construyen aquí
├─ theme.ts              Códigos de dominio → clases de presentación y fotos
├─ core/                 Dominio puro
│  ├─ model.ts           Esquemas Zod y tipos inferidos. La fuente de verdad.
│  ├─ labels.ts          Códigos en inglés → texto en español
│  ├─ training.ts        Recuentos, duración estimada, músculos, superseries
│  ├─ timer.ts           Matemática de los temporizadores
│  ├─ volume.ts          Agregados de volumen
│  ├─ equipment.ts       Cargas alcanzables con el material declarado
│  ├─ progression.ts     Regla de subir peso y marcas personales
│  ├─ prefill.ts         Última actuación → valores prellenados
│  ├─ session.ts         Plan de pasos de una sesión y registro de lo hecho
│  └─ history.ts         Volumen por semana, barras por músculo y avisos de carga
├─ storage/              Persistencia
│  ├─ kv.ts              Puerto `KeyValueStore` + memoria + localStorage
│  ├─ document.ts        Documento versionado, migraciones y cuarentena
│  ├─ repository.ts      Interfaces del repositorio + implementación local
│  └─ backup.ts          Exportar e importar JSON
├─ browser/              Adaptadores de navegador: audio, vibración, wake lock, repositorio
├─ components/  layouts/  pages/  styles/  assets/
```

---

## 3. Modelo de datos

Los esquemas Zod son lo primario; los tipos TypeScript se infieren con `z.infer`. Todo está en
`src/core/model.ts`.

### La distinción que gobierna el modelo

**Prescripción** y **registro** son cosas distintas y no se mezclan nunca:

```
Mesocycle → Week → Day → ExerciseBlock        (lo que toca hacer)
SessionLog → ExerciseLog → SetLog             (lo que hiciste)
```

`Exercise` es el catálogo reutilizable (nombre, músculos, material, claves de técnica, media).
`ExerciseBlock` es la prescripción de ese ejercicio en ese día concreto (series, rango de reps, tempo,
descanso). Un cambio en el plan no reescribe el historial, y un mal día no cambia el plan.

### Claves e identidad

- Los ejercicios y mesociclos usan **slug** en kebab-case, que es el nombre de su archivo.
- Los registros (`SetLog`, `SessionLog`, `Profile`, `LoadItem`) usan **UUID v4 generado en cliente**,
  más `createdAt` y `updatedAt` en ISO 8601. Esto no es decoración: es lo que hará posible sincronizar
  y resolver conflictos sin rediseñar el modelo.
- `ExerciseLog.blockKey` enlaza con `ExerciseBlock.key ?? exerciseId` (ver `blockKeyOf`).
  `ExerciseLog.exerciseId` está **desnormalizado a propósito** para que el historial sobreviva a que
  el bloque desaparezca de la rutina.

### Integridad del contenido

`assertRoutineIntegrity()` en `src/data.ts` **rompe el build** si un día referencia un ejercicio
inexistente, si dos bloques comparten clave, si los órdenes de semana o día tienen huecos, o si una
superserie se queda con un solo ejercicio. No se usa `reference()` de Astro para no mezclar dos
instancias de Zod y para poder señalar el bloque exacto que falla.

---

## 4. La capa de persistencia

Esta es la parte que hay que entender antes de tocar nada del backend.

### Contrato

`src/storage/repository.ts` define las interfaces y una implementación local:

```ts
interface AppRepository {
  readonly sessions: WorkoutLogRepository;
  readonly settings: SettingsRepository;
  readonly profiles: ProfileRepository;
  snapshot(): Promise<StoredState>;
  restore(state: StoredState): Promise<void>;
  lastReadStatus(): ReadStatus;
}

function createLocalRepository(deps: {
  store: KeyValueStore;
  now: () => string;   // inyectado: los tests son deterministas
  uuid: () => string;
}): AppRepository;
```

**Todos los métodos son asíncronos aunque `localStorage` sea síncrono.** Es deliberado: el día que
detrás haya red, las firmas no cambian.

### Decisiones que hay que respetar

1. **Dos claves separadas.** `mfw:state` guarda perfiles, ajustes y sesiones terminadas. La sesión en
   curso vive aparte en `mfw:active-session`, porque se escribe en cada serie marcada y no puede
   arrastrar todo el historial en cada escritura.
2. **Nada entra sin validar.** Lo que sale del almacenamiento es dato no confiable: se parsea, se
   migra y se valida con Zod antes de tocar la app.
3. **Nada se borra en silencio.** Lo que no se puede leer se mueve a `mfw:quarantine:<timestamp>` con
   su contenido original intacto, y la UI avisa. El export JSON es la única copia del usuario.
4. **Degradación en lugar de excepción.** `createBrowserStore()` cae a memoria si `localStorage` está
   lleno o deshabilitado. Una escritura fallida no puede tumbar una sesión a medias.
5. **Migraciones encadenadas.** `MIGRATIONS` en `document.ts` es una lista de `{ from, to, migrate }`
   que se aplica en orden. Al cambiar el esquema guardado: sube `STORAGE_SCHEMA_VERSION`, añade el
   paso, y añade un test que parta de un documento de la versión anterior.

---

## 5. Convenciones

- **Identificadores y código en inglés; textos de UI y comentarios en español.** La traducción vive en
  `src/core/labels.ts`; ninguna plantilla traduce a mano.
- **Imports con alias `@/`**, nunca rutas relativas.
- **Nada de clases de Tailwind compuestas en tiempo de ejecución.** El escáner lee el código fuente,
  así que `text-${color}` no genera nada. Los mapas de clases van completos y literales en
  `src/theme.ts`.
- **Comentar el porqué, no el qué.** Un comentario que describe lo que la línea ya dice sobra.
- **Componentes de una sola responsabilidad.** Por encima de ~120 líneas, se parte.
- Antes de dar algo por terminado: `pnpm build`, `pnpm check`, `pnpm test`, `pnpm format:check`.

---

## 6. Añadir un backend o una base de datos

### 6.1 Qué NO hay que tocar

Si el trabajo se hace bien, **el único directorio que cambia es `src/storage/`**. `core/`,
`components/` y `pages/` no se enteran. Cualquier plan que requiera tocarlos es señal de que se está
saltando la interfaz.

### 6.2 Recomendación: Supabase

Para el caso real (un usuario, quizá un segundo perfil, sincronizar entre móvil y ordenador,
eventualmente un panel para editar rutinas) la opción de menor coste es **Supabase**: Postgres
gestionado, autenticación y Row Level Security, con cliente JavaScript. La app sigue siendo estática:
el navegador habla directamente con Supabase y no hace falta adaptador de servidor.

Alternativa si se prefiere control total y no depender de terceros: **Astro con adaptador de servidor
+ Postgres o SQLite (Turso) + Drizzle**. Cuesta más porque hay que escribir la autenticación y los
endpoints a mano.

### 6.3 Esquema de tablas

Traducción directa de los esquemas Zod. Los tipos ya son compatibles: los ids son UUID y las fechas
son ISO 8601.

```sql
create table profiles (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  name text not null,
  created_at timestamptz not null
);

create table settings (
  profile_id uuid primary key references profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  data jsonb not null,          -- valida con SettingsSchema al leer
  updated_at timestamptz not null
);

create table sessions (
  id uuid primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  mesocycle_id text not null,
  week_order int not null,
  day_order int not null,
  status text not null,
  started_at timestamptz not null,
  finished_at timestamptz,
  data jsonb not null,          -- el SessionLog completo, valida con SessionLogSchema
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index on sessions (user_id, started_at desc);
```

Los campos que se consultan van en columnas; el resto del registro va en `jsonb` y se valida con el
mismo esquema Zod que usa el cliente. Eso mantiene una sola fuente de verdad para la forma de los
datos. Si más adelante hacen falta consultas analíticas por serie, se normaliza `sets` a su propia
tabla; hoy no compensa.

RLS en las tres tablas: `using (auth.uid() = user_id)`.

### 6.4 Pasos, en orden

1. **Añadir `AuthContext`.** Un tipo `{ userId: string }` que entra como dependencia en la factoría del
   repositorio. El punto exacto está marcado con un comentario `COSTURA DE SINCRONIZACIÓN` en
   `src/storage/repository.ts`. `profileId` ya existe en `SessionLog` y `Settings`: se mapea a
   `user_id` sin cambiar el modelo.
2. **Escribir `createRemoteRepository`** en `src/storage/remote.repository.ts`, implementando
   `AppRepository`. Validar con Zod **también lo que llega del servidor**: una respuesta de red es tan
   poco confiable como `localStorage`.
3. **Cambiar el punto de composición.** `src/browser/repository.ts` es el único sitio donde se decide
   qué implementación se usa: una sola llamada a la factoría, dentro de `getRepository()`.
4. **Decidir la estrategia offline.** La recomendable: el repositorio local pasa a ser **caché**, no
   almacén. Se escribe en local primero (para que marcar una serie sin cobertura no falle) y se
   encola la escritura remota. Esto se implementa como un tercer `AppRepository` que envuelve a los
   otros dos; el resto de la app sigue sin enterarse.
5. **Resolver conflictos por `updatedAt`.** Gana el más reciente, que es exactamente lo que ya hace
   `importBackup` en modo fusión: esa función sirve como referencia y como test de la política.
6. **Migrar los datos existentes.** El export JSON actual es el formato de entrada: `BackupDocument`
   ya contiene perfiles, ajustes y sesiones. Un script que lo lea y haga `insert` cubre la migración
   completa sin escribir un formato intermedio.
7. **Añadir tests contra la nueva implementación.** El archivo `src/storage/storage.test.ts` está
   escrito contra la interfaz, no contra `localStorage`: la mayoría de sus casos se pueden reejecutar
   contra el repositorio remoto con un doble de red.

### 6.5 El caso especial: rutinas editables desde un panel

Hoy las rutinas vienen de Content Collections, que se leen **en build**. Si se quiere un panel de
administración que las edite en caliente, hay que asumir una consecuencia:

- Las rutas `/semana/[week]` y `/semana/[week]/dia/[day]` usan `getStaticPaths`. Con rutinas
  dinámicas, esas rutas necesitan **renderizado en servidor** (adaptador de Astro) o pasar a
  renderizarse en cliente. No hay tercera vía.
- La ruta de menor coste es introducir un `RoutineSource` con dos implementaciones —contenido y
  repositorio— y convertir solo esas rutas a SSR, dejando el resto estático.
- `assertRoutineIntegrity()` debe ejecutarse también en el guardado del panel, no solo en build. La
  función ya es pura respecto a su entrada, así que se reutiliza tal cual.

### 6.6 Lo que se romperá si se ignora la arquitectura

- Meter llamadas a Supabase dentro de un componente `.astro` o de `core/`: rompe los tests y ata la
  UI al proveedor.
- Confiar en lo que llega del servidor sin validarlo con Zod: es el mismo error que confiar en
  `localStorage`, y la cuarentena existe precisamente porque ese error ya se contempló.
- Hacer los métodos síncronos "porque ahora sí hay promesas de verdad": ya lo son. No hay nada que
  cambiar.

---

## 7. Estado actual

**Construido y verificado:** navegación del mesociclo, semanas y días; catálogo y fichas de ejercicio;
ajustes conectados a la persistencia; temporizador circular con avisos de Web Audio, vibración y wake
lock; **modo entreno completo** (plan de pasos con superseries en rondas, registro por serie,
autoguardado, reanudación tras recarga y resumen con comparativa); historial con volumen por semana
y avisos de subir peso; dominio y almacenamiento con 129 tests.

**Pendiente, por orden previsto:** sistema de croquis SVG · extras (sustituciones de ejercicio,
generador de mesociclo a partir del anterior).

**Deuda declarada:**

- El mundo visual actual **no ha pasado la revisión de acabado** de impeccable; el anterior sí. Está
  anotado en `DESIGN.md`.
- Las fotografías son de stock CC0 y provisionales (`src/assets/photos/PROCEDENCIA.md`).
- `historial.astro` es un estado vacío honesto, sin lógica detrás todavía.
- Subir `--color-ink-faint` para cumplir el suelo de contraste acercó el tercer nivel de texto al
  segundo. Si molesta, se recupera con tamaño o peso, nunca bajando el valor.
