-- Crea el usuario de base de datos con el que se conecta la aplicación.
--
-- ── POR QUÉ HACE FALTA ────────────────────────────────────────────────────
-- Las políticas de `drizzle/0001_rls.sql` son las que impiden que un usuario
-- vea el entreno de otro. Pero Postgres se las salta con dos tipos de
-- conexión: el dueño de las tablas (a eso responde `FORCE`) y **cualquier
-- superusuario** (a eso no responde nada).
--
-- El usuario que crea la base —`mfw` en local, el del recurso en Dokploy— es
-- superusuario. Conectando con él, las políticas están escritas y no se
-- aplican: la falsa sensación de estar protegido, que es peor que no tenerlas.
-- Se comprobó, y en efecto no bloqueaban nada.
--
-- Este rol es el arreglo: puede leer y escribir, y nada más. No es dueño de
-- ninguna tabla, no es superusuario, y no puede saltarse RLS.
--
-- ── CÓMO SE EJECUTA ───────────────────────────────────────────────────────
-- Con el usuario dueño, una sola vez por base de datos:
--
--   pnpm db:app-role                 (en local, contra el Postgres de Docker)
--
-- En producción, contra el Postgres de Dokploy, con la contraseña que vaya a
-- ir en DATABASE_URL. Volver a ejecutarlo es seguro: si el rol ya existe, solo
-- le cambia la contraseña.
--
-- ── QUÉ NO HACE ───────────────────────────────────────────────────────────
-- No toca las migraciones. Esas siguen corriendo con el usuario dueño, que es
-- el único que puede cambiar la forma de las tablas. Por eso hay dos cadenas
-- de conexión: DATABASE_URL (la app, con este rol) y DATABASE_OWNER_URL (las
-- migraciones, con el dueño).

\set ON_ERROR_STOP on

-- Crear el rol si no existe. Se hace con `format` y `\gexec` porque CREATE ROLE
-- no admite variables directamente y la contraseña llega desde fuera.
SELECT format(
  'CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT',
  :'rol', :'clave'
)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'rol')
\gexec

-- Y dejarle siempre los atributos y la contraseña en su sitio, exista o no de
-- antes. NOBYPASSRLS es la línea que importa de todo este archivo.
SELECT format(
  'ALTER ROLE %I WITH LOGIN PASSWORD %L NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE',
  :'rol', :'clave'
)
\gexec

-- Permisos: leer y escribir filas. Nada de crear, alterar ni borrar tablas.
SELECT format('GRANT USAGE ON SCHEMA public TO %I', :'rol') \gexec
SELECT format(
  'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I', :'rol'
) \gexec
SELECT format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I', :'rol') \gexec

-- Y lo mismo para las tablas que creen las migraciones futuras, para no tener
-- que acordarse de volver aquí cada vez que aparezca una tabla nueva.
SELECT format(
  'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
  :'rol'
) \gexec
SELECT format(
  'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO %I', :'rol'
) \gexec

\echo ''
\echo 'Rol listo. Comprobación:'
SELECT rolname AS rol,
       rolsuper AS es_superusuario,
       rolbypassrls AS se_salta_rls
FROM pg_roles
WHERE rolname = :'rol';
