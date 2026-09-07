-- Seguridad a nivel de fila: que sea Postgres quien impida ver lo de otro.
--
-- Hasta ahora la condición «solo las filas de este usuario» la ponía cada
-- consulta. Trece sitios donde acertar, y un descuido en cualquiera de ellos
-- devolvía los datos de todos. Ahora la regla vive en la base y no se puede
-- olvidar: la aplicación declara en nombre de quién actúa al abrir cada
-- transacción, y Postgres filtra por su cuenta.
--
-- Los filtros de las consultas se quedan igualmente. Esto es la red, no su
-- sustituto.
--
-- ── LO QUE DRIZZLE-KIT NO GENERA, Y SIN LO CUAL ESTO NO SIRVE DE NADA ──────
-- Postgres exime de sus propias reglas al dueño de la tabla, dando por hecho
-- que es el administrador. Nuestra aplicación se conecta justamente con ese
-- usuario, así que con solo ENABLE las políticas quedarían escritas y
-- desactivadas: la falsa sensación de estar protegido, que es peor que nada.
-- FORCE es lo que le dice a Postgres que se las aplique también a él.
--
-- Estas tres líneas están escritas a mano. `drizzle-kit generate` no las
-- produce: si algún día se regenera esta migración, hay que volver a ponerlas.
--
-- ── LAS TABLAS DE BETTER AUTH SE QUEDAN FUERA, A PROPÓSITO ────────────────
-- `user`, `session`, `account` y `verification` no llevan RLS. Better Auth
-- tiene que buscarte por correo ANTES de que exista una sesión, o sea antes de
-- que haya un `app.user_id` que declarar. Con RLS ahí, no se podría ni entrar.
--
-- ── SI ALGÚN DÍA HAY QUE ARREGLAR DATOS A MANO ────────────────────────────
-- Una migración futura que toque filas también queda sujeta a estas reglas.
-- Para eso: ALTER TABLE x NO FORCE ROW LEVEL SECURITY, el arreglo, y FORCE otra
-- vez. Los cambios de estructura (ALTER, CREATE) no se ven afectados.

ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workout_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "profiles_propias" ON "profiles" AS PERMISSIVE FOR ALL TO public USING (user_id = current_setting('app.user_id', true)) WITH CHECK (user_id = current_setting('app.user_id', true));--> statement-breakpoint
CREATE POLICY "settings_propios" ON "settings" AS PERMISSIVE FOR ALL TO public USING (user_id = current_setting('app.user_id', true)) WITH CHECK (user_id = current_setting('app.user_id', true));--> statement-breakpoint
CREATE POLICY "workout_sessions_propias" ON "workout_sessions" AS PERMISSIVE FOR ALL TO public USING (user_id = current_setting('app.user_id', true)) WITH CHECK (user_id = current_setting('app.user_id', true));--> statement-breakpoint
ALTER TABLE "profiles" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "settings" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workout_sessions" FORCE ROW LEVEL SECURITY;
