# Traspaso: cuentas y base de datos

> **Documento temporal.** Existe para continuar el trabajo en una conversación
> nueva sin perder contexto. **Se borra al terminar el paso 10.**

---

## 1. Cómo trabaja Raúl

- **Los commits los hace él.** Al cerrar cada paso, dale el texto del commit:
  corto y en español. No ejecutes `git commit`.
- **Después de cada paso, explícale qué se ha hecho**: en cristiano, qué
  archivos se crearon o modificaron y por qué. Quiere entender y aprender, no
  solo que funcione. Es su primera vez con Better Auth y Drizzle.
- **Documentación y comentarios en español**; identificadores en inglés.
- **`pnpm` siempre**, nunca `npm`.
- Antes de dar un paso por terminado: `pnpm check`, `pnpm test`,
  `pnpm format:check` y `pnpm build` en verde.
- Si algo falla, **dilo con la evidencia**. Él prefiere un error explicado a un
  «ya está» optimista.

---

## 2. Decisiones tomadas (no volver a abrirlas)

| Decisión                                                      | Motivo                                                                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Postgres**, no SQLite                                       | Dokploy gestiona el volumen y las copias; el riesgo de perder datos sale de sus manos                                      |
| **Drizzle** como ORM, **Better Auth** para cuentas            | Elección suya                                                                                                              |
| `output: 'static'` **+ adaptador de Node**                    | El adaptador no vuelve dinámico el sitio: permite sacar rutas concretas del prerender con `export const prerender = false` |
| **Sin `BASE_PATH`**                                           | El despliegue en subcarpeta se descartó; complicaba las cookies                                                            |
| **Contenido público, datos privados**                         | ~35 páginas siguen estáticas; solo 4 rutas piden sesión                                                                    |
| **El login aparece al pulsar «Entrenar»**, no al abrir la app | Hasta ahí solo miras el plan                                                                                               |
| **Astro Actions** como transporte, no una API a mano          | Valida con los esquemas Zod que ya existen                                                                                 |
| Datos en **`jsonb`**, columnas solo para lo que se filtra     | `core/` no se entera de que hay base de datos                                                                              |
| Sin RLS                                                       | El filtro por `user_id` **lo pone el servidor en cada acción**. Una acción que no filtre es un fallo de seguridad          |

### Lo que se acepta como coste

- **Se acaba el funcionar sin red.** Hoy se entrena sin cobertura porque todo es
  local. Con servidor, no. Está asumido.
- Un VPS encendido siempre.

---

## 3. Los pasos

### ✅ Paso 1 — Adaptador de Node y fuera la subcarpeta

`@astrojs/node` 11.1.4 instalado, `base` eliminado, `src/routes.ts` simplificado.
`specs.md` §6 reescrito (recomendaba Supabase, que ya era falso).
Verificado: las 50 páginas siguen prerenderizándose y `node dist/server/entry.mjs`
las sirve.

### ✅ Paso 2 — Drizzle, esquema y migraciones

`src/db/schema.ts` (`profiles`, `settings`, `workout_sessions`),
`src/db/index.ts` (conexión), `src/db/mappers.ts` + 8 tests,
`drizzle.config.ts`, `compose.dev.yml` (Postgres local con volumen con nombre).

### ✅ Paso 3 — Better Auth

`src/auth.ts`, `src/db/auth-schema.ts` (generado), `src/env.d.ts`,
`src/pages/api/auth/[...all].ts`. Migración única `drizzle/0000_inicial.sql`
con las 7 tablas. Probado con `curl`: registro, sesión, entrar bien, entrar mal
(401), contraseña cifrada, borrado en cascada.

**Correo: apagado a propósito.** Better Auth **no envía correos**, te llama a ti
con el enlace o el código ya generados. Sin proveedor (Resend, Postmark, SMTP…)
la verificación dejaría la cuenta inservible. El hueco está marcado con un
comentario en `src/auth.ts`; activarlo son dos líneas más el proveedor. Para
entrar con código por correo, el plugin `emailOTP` —no necesita tablas nuevas,
reutiliza `verification`.

---

### ✅ Paso 4 — Middleware y mapa de rutas

`src/middleware.ts`: lee la sesión con `auth.api.getSession({ headers })` y la
deja en `context.locals.user` / `context.locals.session`. Sale antes de tocar
nada si `context.isPrerendered` —las páginas estáticas también pasan por el
middleware, pero durante el build, sin petición ni base de datos— y también en
`/api/auth/*`, que resuelve su propia sesión.

Cuatro rutas con `export const prerender = false`: `/historial`,
`/configuracion`, `/consejos` y `/semana/[week]/dia/[day]/entrenar`. Sin sesión
→ `302` a `/login?volver=<ruta>`. **La pantalla `/login` es del paso 5: hasta
que exista, ese redirect acaba en 404.**

`entrenar.astro` pierde su `getStaticPaths` al salir del prerender: la semana y
el día se resuelven ahora desde `Astro.params` con `findWeek`/`findDay`, y una
combinación que no existe devuelve `404` a mano (antes lo daba la ausencia de
archivo).

En `src/routes.ts`: `routes.login(volver?)`, `routes.authApi()` y
`safeReturnTo()`, que rechaza cualquier `volver` que no sea una ruta propia
—`//otro-sitio` convertiría el login en un trampolín a otro dominio—. Lo
consume el paso 5.

Quitada de la portada la frase cableada «aún no has registrado ninguna».

Comprobado contra `node --env-file=.env dist/server/entry.mjs`: 35 páginas
siguen estáticas (eran 50: se van 12 de entreno + 3), las públicas dan 200, las
privadas 302 sin cookie y 200 con ella, y `/semana/99/dia/9/entrenar` da 404
con sesión.

### ✅ Paso 5 — Entrar, registrarse y salir

**Decisiones tomadas contigo, no volver a abrirlas:**

- **Solo correo y contraseña.** Google/GitHub se descartó: con OAuth, entrar por
  primera vez _crea_ la cuenta, así que la puerta habría necesitado además una
  lista de correos permitidos —y redesplegar cada vez que se añade uno—.
- **Registro con código de invitación**, comprobado **en el servidor**.
- **Una sola pantalla** `/login` con conmutador Entrar / Crear cuenta.
- **Salir en dos sitios**: celda «Cuenta» en Ajustes y píldora en la barra.

**La puerta del registro.** `hooks.before` en `src/auth.ts` corta
`/sign-up/email` si no llega un código válido por la cabecera
`x-codigo-invitacion`. Va en cabecera y no en el cuerpo porque el esquema del
endpoint descarta lo que no reconoce. **Sin `SIGNUP_INVITE_CODE` en el entorno
no se registra nadie**: un despliegue al que se le olvidó la variable se queda
con la puerta cerrada, no abierta. Comprobación en tiempo constante sobre
resúmenes SHA-256.

**Salir es un formulario, no JavaScript.** `src/pages/salir.ts`, solo `POST`,
con comprobación de `Origin`. Así el mismo botón vale en Ajustes y dentro de la
isla, y **el cliente de Better Auth no llega a las 35 páginas estáticas**: solo
lo carga `/login`.

**La píldora de cuenta es un server island** (`server:defer`). Las páginas
estáticas siguen siendo archivos y solo ese trozo se pide al servidor. Se
comprobó que la ruta `/_server-islands/[name]` pasa por el middleware, así que
`Astro.locals.user` llega relleno.

**Archivos nuevos:** `src/auth-contract.ts` (las dos constantes que cruzan al
navegador sin arrastrar Postgres), `src/browser/auth-client.ts`,
`src/browser/login-page.ts`, `src/pages/login.astro`, `src/pages/salir.ts`,
`src/components/nav/AccountPill.astro`. **Tocados:** `src/auth.ts`,
`src/routes.ts` (`signOut()`), `AppNav.astro`, `configuracion.astro`,
`.env.example`.

**Sin «he olvidado mi contraseña»**, y la pantalla lo dice. Prometer un enlace
que nunca llega es peor que no ofrecerlo. Llega con el proveedor de correo.

**Comprobado contra el build:** registro sin código y con código equivocado
→ `403` y **ningún usuario creado**; con código → `200`; entrar mal → `401`;
la isla enseña «Entrar» sin cookie y el nombre + «Salir» con ella; `/login` con
sesión abierta redirige al destino; `?volver=//otro-sitio` se descarta y cae en
`/`; `/salir` da `403` desde otro origen y `303` con `Set-Cookie` de borrado.
El cliente de Better Auth se probó tal cual lo usa la página: manda la cabecera.

### ✅ Paso 6 — El repositorio contra el servidor

**Borrada `src/pages/datos-de-prueba.astro`** antes de nada, como avisaba este
documento: llamaba a `repo.restore()` y habría borrado los datos del servidor.

**13 acciones** en `src/actions/` (sesiones, ajustes, perfiles, estado) y
`createRemoteRepository()` en `src/browser/remote-repository.ts`. Se cambió
**solo `src/browser/repository.ts`**: las seis pantallas no se tocaron. Esa era
la promesa de tener una interfaz delante y se cumplió.

**El filtro por `user_id` está en `src/actions/context.ts`** y ninguna acción
acepta un usuario por parámetro: sale siempre de la sesión.

**Lo que llega del servidor se valida con Zod**, igual que lo que venía de
`localStorage`.

**Decisiones tomadas contigo:**

- **`listSessions` es la única acción que no exige sesión**: devuelve lista
  vacía. La ficha de ejercicio es pública y estática, y pide el historial; para
  un anónimo la respuesta correcta es «nada», no un error.
- **La sesión en curso se escribe antes en el navegador que en el servidor**
  (`active-session-mirror.ts`). La pantalla de entreno **no captura errores** en
  `persist()`: sin el espejo, un parpadeo de wifi rompería el entreno. Si el
  envío falla, la serie ya está a salvo y la siguiente lectura la arrastra.
- **Servidor manda, navegador cachea.** Una sola dirección, sin conflictos que
  resolver. Sincronización real entre dispositivos sigue siendo un paso aparte.
- **Sin caché de lectura**: pintar al instante con lo último visto exigiría que
  las pantallas supieran refrescarse después, y son justo las que no se tocan.

**Dos asperezas encontradas y arregladas:**

- `ProfileSchema.id` exige un **UUID**. El id derivado del usuario (que evita
  crear dos perfiles en una carrera) se genera ahora con SHA-256 y los bits de
  versión puestos: sale estable y sale válido.
- El índice único de «una sola sesión en curso» devolvía un **500 con el error
  de Postgres dentro**. Ahora devuelve `CONFLICT` con un mensaje, y el
  navegador distingue un rechazo (no se reintenta) de un fallo de red (sí).

### ✅ Paso 7 — (anulado) Traer el historial local

**Ya no hace falta y se ha quitado.** Nunca hubo datos de verdad en ningún
navegador: todo eran pruebas. El puente se construyó, funcionó, y se retiró en
la limpieza de abajo junto con el resto de `localStorage`.

### ✅ Limpieza: fuera `localStorage` y las copias en JSON

Decisión tuya y con motivo: exportar a JSON, importar y guardar en el navegador
se pensaron **cuando no había base de datos**. Con Postgres detrás sobran los
tres.

**Qué se ha ido** (unas 700 líneas): `createLocalRepository`, el formato de
copia (`backup.ts`), la lectura de documentos con cuarentena (`document.ts`), el
puerto de almacenamiento (`kv.ts`), el espejo de la sesión en curso, los botones
de exportar e importar, el panel de mudanza, y las acciones `state.snapshot` y
`state.restore` —esta última era la más destructiva del proyecto—.
**El navegador ya no guarda absolutamente nada tuyo**, y hay una comprobación
en `pruebas/pantallas.mjs` que lo vigila.

**Qué se ha salvado, mudándose:** la cadena de `MIGRATIONS` vive ahora en
`src/core/migrations.ts`, con sus tests al lado. Sigue haciendo falta: una fila
escrita con un esquema viejo sube por ella antes de que Zod la valide.

**Lo que esto obligó a tocar:** sin espejo en el navegador, un fallo de red al
marcar una serie ya no se puede tapar. `WorkoutSession.vue` ahora lo **captura y
lo dice en pantalla** en vez de reventar. Se pierde esa serie y hay que volver a
marcarla; a cambio, nunca se finge que se guardó algo que no llegó.

### ✅ Reparto de carpetas

`src/browser/` mezclaba tres cosas bajo un nombre que solo decía _dónde_ se
ejecutan. Ahora cada carpeta dice qué hay dentro:

| Antes                                             | Ahora                                                         |
| ------------------------------------------------- | ------------------------------------------------------------- |
| `browser/` (todo mezclado)                        | `browser/` solo APIs del aparato: audio, vibración, wake lock |
| `browser/*-page.ts`                               | `screens/` los controladores de pantalla                      |
| `browser/repository.ts` + `storage/repository.ts` | `repository/` contrato, implementación remota y composición   |
| `browser/auth-client.ts`                          | `auth-client.ts`, junto a `auth.ts` y `auth-contract.ts`      |
| `storage/`                                        | **desaparece**                                                |

### ✅ Seguridad a nivel de fila (RLS)

**Dos cerrojos, y hacen falta los dos.** Uno: cada consulta filtra por
`user_id`, visible en el código y es lo que usa los índices. Dos: Postgres
filtra por su cuenta con las políticas de `drizzle/0001_rls.sql`. El segundo es
el que sigue funcionando el día que a alguien se le olvide el primero.

El puente es **`withUser`** en `src/actions/context.ts`: abre una transacción y
declara ante Postgres en nombre de quién se actúa. Todo lo que toca la base va
dentro; fuera de ahí las políticas no devuelven nada. El `set_config` va con
`is_local = true` para que la declaración **muera con la transacción**: sin eso
quedaría pegada a la conexión, y como las conexiones se reparten entre
peticiones, la siguiente heredaría tu identidad.

**Falla cerrado.** Si nadie declara nada, `current_setting` devuelve NULL y no
se ve una fila. Olvidarse deja la pantalla vacía —fallo evidente— en vez de
enseñar los datos de todos —fallo invisible—.

**Las tablas de Better Auth se quedan fuera, a propósito.** Tiene que buscarte
por correo _antes_ de que exista sesión, o sea antes de que haya nadie que
declarar. Con RLS ahí no se podría ni entrar.

#### Lo que se descubrió por probarlo, y que cambió la decisión

Se eligió la opción sencilla —`FORCE ROW LEVEL SECURITY`, una línea, sin tocar
el despliegue—. **No funcionaba.** Al probarla contra la base, un usuario seguía
viendo y borrando las filas de otro.

El motivo: Postgres exime de RLS al dueño de la tabla (a eso responde `FORCE`) y
**a cualquier superusuario** (a eso no responde nada). El usuario que crea la
base —`mfw` en local, el del recurso en Dokploy— es superusuario. Las políticas
quedaban escritas y desactivadas: la falsa sensación de estar protegido.

Arreglo: **la aplicación se conecta con un rol propio sin privilegios**.

| Variable             | Quién la usa       | Con qué rol            |
| -------------------- | ------------------ | ---------------------- |
| `DATABASE_URL`       | la aplicación      | `mfw_app`, sin poderes |
| `DATABASE_OWNER_URL` | solo `drizzle-kit` | el dueño               |

El rol se crea con `pnpm db:app-role` (ver `scripts/rol-de-app.sql`), y hay que
crearlo también **en Dokploy** antes de desplegar: queda anotado en el paso 8.
`src/db/index.ts` avisa por consola al arrancar si `DATABASE_URL` apunta a un
rol con privilegios, porque es un fallo que no se nota mirando la app.

### Comprobado

Tres scripts en `pruebas/` (ver `pruebas/LEEME.md`), todos en verde desde una
base limpia:

- `acciones.mjs` — 18 comprobaciones por HTTP. **La que importa es el
  aislamiento**: B no ve, no lee y no borra nada de A.
- `pantallas.mjs` — las seis pantallas en un Chrome real, cazando errores de
  consola, y que el navegador no guarde ni una clave nuestra. Con `--ver` abre
  ventana.
- `rls.mjs` — **la más importante**. El filtro de las acciones tapa el
  resultado: aunque RLS estuviera apagado, `acciones.mjs` seguiría en verde. Por
  eso esta habla con Postgres a pelo, con la cadena de la app, y lo único que
  puede hacerla pasar es que las políticas funcionen.

### ✅ Roles de administración

Plugin `admin` de Better Auth. **Ojo con la palabra «rol»**, que aquí significa
dos cosas sin relación: el rol de Postgres (`mfw_app`, con qué credenciales se
conecta la app) y el rol de la aplicación (admin o usuario, propiedad de cada
cuenta).

**Quién es admin lo dice la columna `role`, y solo ella.** `isAdminUser` no
mira nada más, y es deliberado: Better Auth hace sus propias comprobaciones
antes de banear o cambiar un rol, y con dos fuentes distintas nuestra pantalla
habría dejado pasar a alguien a quien la librería luego le dice que no.

**El primer admin se nombra con `ADMIN_EMAILS`**, que no es una segunda fuente
sino lo que **escribe** esa columna, en dos momentos:

- al **crear** la cuenta, si el correo está en la lista → nace administrador;
- al **entrar**, si la lista se puso después de haberse registrado → se repara
  sola. Sin esto, el remedio sería borrar la cuenta y volver a crearla.

Se compara en minúsculas: la lista la escribe una persona a mano.

| Dónde          | Cómo                                                     | ¿Redespliegue? |
| -------------- | -------------------------------------------------------- | -------------- |
| **Producción** | `ADMIN_EMAILS` puesta antes de desplegar, y te registras | no             |
| **Local**      | `pnpm db:make-admin tu@correo.com`                       | no             |

Se descartó nombrarlo por id de usuario: obligaba a buscar el id en la consola
de Postgres del servidor y a redesplegar. Lo que se pierde es que ahora quien
tuviera escritura en la base podría ascenderse solo; a esas alturas ya tendría
todos los datos igualmente.

**Lo que puede hacer:** listar cuentas, crearlas (sin código de invitación),
cambiar rol, cambiar la contraseña de otro, suspender, mandar a la papelera,
restaurar y borrar definitivamente. Todo pasa por `src/actions/admin.ts`, que
comprueba quién llama antes de delegar en Better Auth. **Las pantallas no
llaman a `/api/auth/admin/*` directamente.**

**A quien no es admin se le responde `404`, no `403`**, tanto en las páginas
como en las acciones: un «prohibido» confirma que ahí hay algo.

**Lo que NO puede hacer: leer el entreno de otro.** Las políticas de la base no
tienen excepción para administradores. El único camino es **suplantar**
(`/admin/suplantar`, `POST`), que emite una sesión a nombre de la otra persona,
dura media hora y **deja firma** en `session.impersonatedBy`. Se decidió
conservarla como escotilla explícita.

**La papelera.** Borrar de verdad arrastra en cascada el perfil, los ajustes y
el historial entero, y no hay copia en ningún sitio de donde sacarlo. Por eso
`deletedAt` deja la cuenta sin poder entrar pero **sin perder nada**, y el
borrado físico es un segundo acto desde `/admin/papelera`, con un aviso que
dice exactamente qué se pierde. Una acción se niega a borrar lo que no haya
pasado antes por la papelera, y nadie puede mandarse a sí mismo.

**Comprobado** con `pruebas/admin.mjs` (un usuario normal recibe 404 en las
nueve acciones y en las dos páginas; la papelera conserva perfil y sesión, y el
borrado definitivo se los lleva sin dejar huérfanos) y
`pruebas/admin-pantalla.mjs` (la pantalla en Chrome, incluida la suplantación).

### ⬜ Paso 8 — Docker y despliegue

`Dockerfile` multietapa, migraciones al arrancar, healthcheck. En Dokploy:
crear Postgres como **recurso** (él configura volumen y credenciales) y apuntar
las copias a S3.

**No olvidar el rol de aplicación.** Antes del primer despliegue hay que
ejecutar `scripts/rol-de-app.sql` contra el Postgres de Dokploy, con la
contraseña que vaya en `DATABASE_URL`. Sin eso la app se conectaría como
superusuario y **las políticas de seguridad no se aplicarían**, sin que nada lo
delate. Son dos variables: `DATABASE_URL` (rol de app) y `DATABASE_OWNER_URL`
(dueño, solo para las migraciones).

**Y `ADMIN_EMAILS` con tu correo, puesta ANTES de desplegar**: así te registras
y ya entras siendo administrador. Si se olvida, no pasa nada grave —se añade
después y se arregla la próxima vez que entres—, pero mientras tanto `/admin`
devuelve 404 a todo el mundo. **Y un `SIGNUP_INVITE_CODE` distinto del de
local.**

**Comprobación que no se salta:** desplegar, escribir un dato, redesplegar y
verificar que sigue ahí.

### ⬜ Paso 9 — Copias de seguridad

Copias de volumen de Dokploy. **Probar una restauración de verdad**, no solo el
guardado.

### ⬜ Paso 10 — Limpieza

Actualizar `PRODUCT.md`, `CLAUDE.md`, `DESIGN.md`. Borrar `TRASPASO.md`.

---

## 4. Estado actual, comprobable

```bash
pnpm db:up        # Postgres local en Docker
pnpm db:migrate   # aplica drizzle/0000_inicial.sql
pnpm db:studio    # ver las 7 tablas
pnpm check && pnpm test && pnpm build
```

Ahora mismo: **tipos 0/0/0, 153 tests, 35 páginas estáticas + 15 bajo demanda, Prettier limpio.**
La base local está creada y **vacía** (la cuenta de prueba se borró).

Siete tablas: `user`, `session`, `account`, `verification` (Better Auth) +
`profiles`, `settings`, `workout_sessions` (nuestras).

---

## 5. Trampas ya pisadas — no repetirlas

**Del entorno (Windows + Git Bash):**

- **`MSYS_NO_PATHCONV=1`** delante de cualquier comando con rutas tipo `/algo`
  o rutas absolutas de Windows. Sin eso, Git Bash convierte `/entreno` en
  `C:/Program Files/Git/entreno`.
- **Nunca metas backticks dentro de `node -e "..."` a través de bash.** El shell
  los interpreta y destroza el código. **Escribe el script a un archivo** en el
  scratchpad y ejecútalo. Pasó cuatro veces.
- Algunos `.md` tienen **CRLF** en disco; las sustituciones exactas fallan si no
  lo tienes en cuenta. Prettier los normaliza a LF.
- El **servidor de desarrollo se queda rancio**. Si algo se comporta de forma
  imposible en dev y el build está bien: `astro dev stop` y `--background`.
- **Astro no vuelca el `.env` en `process.env`.** Lo expone en
  `import.meta.env`, y `src/db/` y `src/auth.ts` leen de `process.env` porque en
  producción las variables las inyecta el contenedor. Hasta el middleware daba
  igual —ninguna página evaluaba `src/db/`—; con él, `pnpm dev` arrancaba y
  reventaba con «Falta DATABASE_URL». Arreglado con `import 'dotenv/config'` al
  principio de `astro.config.mjs`, la misma línea que ya tenía
  `drizzle.config.ts`. **Ojo en el paso 8:** `dotenv` es una devDependency, así
  que la etapa que ejecute `pnpm build` en el Dockerfile la necesita instalada.
- **El servidor construido tampoco lee `.env`.** `node dist/server/entry.mjs` no
  pasa por `astro.config.mjs`: arranca y luego revienta en cada petición
  dinámica. En local, `node --env-file=.env`. En producción las variables las
  inyecta Dokploy, así que ahí sobra.
- **El servidor de desarrollo rancio miente con la cara muy seria.** Al probar
  el middleware, un `astro dev` de una hora antes respondía 200 en las rutas
  privadas. No era un fallo del código: era que no existía cuando aquel proceso
  arrancó. Antes de creerte una prueba en 4321, `astro dev status`.

- **`pnpm format` corre Prettier sobre TODO el repositorio.** `.prettierignore`
  excluía `.agents/` pero no su gemelo `.claude/`, así que una pasada realineó
  las tablas de las skills instaladas **y reescribió los bloques de código
  TypeScript de su documentación** con nuestro estilo: 260 archivos de terceros
  modificados. Arreglado añadiendo `.claude/` a `.prettierignore`. Si algún día
  aparecen cientos de archivos tocados sin haberlos abierto, mira ahí primero.

**De Docker:**

- **«Expuesto» no es «publicado».** Si `docker ps` muestra `5432/tcp` en vez de
  `0.0.0.0:5432->5432/tcp`, el host no llega y `db:migrate` se cuelga sin decir
  nada. Arreglo: `docker compose -f compose.dev.yml up -d --force-recreate`.
  Está anotado en `compose.dev.yml`.
- `drizzle-kit` **se traga los errores**. Si falla sin mensaje, mira la conexión.

- **Las acciones responden en `application/json+devalue`, no en JSON.** Solo un
  `undefined` devuelve 204 vacío; un `null` viaja como dato (`[null]`) y por eso
  el repositorio remoto puede validarlo con `z.null()`. Probarlas con `curl` a
  pelo engaña: hay que deserializar con devalue.
- **`writeDocument` guarda el estado tal cual, sin sobre.** El número de versión
  viaja dentro, en `schemaVersion`. Envolverlo en `{version, data}` hace que
  `readDocument` no lo valide y lo mande a cuarentena, que es justo lo que debe
  hacer, pero cuesta un rato entenderlo.

**De Better Auth:**

- **No pongas `generateId: false`** salvo que las tablas tengan valor por
  defecto para `id`. Falla con `null value in column "id"` (código `23502`).
- **El CLI público va desparejado con la librería.** Generó el esquema sin el
  campo `issuer` de `account`. La fuente autorizada es la propia librería:
  ```bash
  node -e "console.log(require('better-auth/db').getAuthTables({}).account.fields)"
  ```
- El CLI **no resuelve el alias `@/`** ni puede leer `auth.ts` si este importa
  el esquema que aún no existe. Para generar: config temporal con
  `drizzleAdapter({} as never, { provider: 'pg' })` y sin alias.

**De diseño:**

- Nuestra tabla se llama **`workout_sessions`**, no `sessions`, porque Better
  Auth ya tiene `session`. Dos nombres con una «s» de diferencia son una trampa.

---

## 6. Reglas del proyecto que no se negocian

Están en `CLAUDE.md`, pero las que más se rompen:

- **`src/core/` no se toca.** 3.312 líneas puras con tests. La base mapea a sus
  tipos, no al revés.
- **Nada entra sin validar con Zod**, venga de `localStorage` o de Postgres.
- **`src/db/` solo lo importan las acciones.** Ni `core/`, ni `components/`, ni
  `pages/`.
- Los patrones de clases repetidos se extraen a **componentes o constantes**,
  nunca a `@apply`.
- **El acento cian está reservado** a la acción primaria y a lo que toca ahora.
- **Sin eyebrows** (etiqueta en versalitas encima de un titular).
