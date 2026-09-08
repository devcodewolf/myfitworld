-- Ajustes de la aplicación entera, para poder cambiar el código de invitación
-- desde el panel en vez de tener que redesplegar.
--
-- Es un clave/valor porque hoy guarda una sola cosa y mañana puede guardar dos,
-- y así la segunda no cuesta otra migración.
--
-- ── SIN RLS, A PROPÓSITO ──────────────────────────────────────────────────
-- Las políticas filtran por `user_id` y aquí no hay usuario: esto no es de
-- nadie en particular. Quién lo lee y lo escribe lo deciden las acciones de
-- administración, que comprueban el rol antes de tocarlo.
--
-- El valor se guarda en claro: el panel tiene que poder enseñar el código para
-- que se pueda compartir, y lo que se enseña no puede ir cifrado.

CREATE TABLE "app_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
