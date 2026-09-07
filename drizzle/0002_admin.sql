-- Roles de administración, y la papelera de cuentas.
--
-- Las cinco primeras columnas son del plugin `admin` de Better Auth: el rol de
-- cada cuenta, su estado de baneo, y la firma de quién suplanta a quién.
--
-- `deleted_at` es nuestra. Es la papelera: una cuenta con fecha ahí no puede
-- entrar, pero sigue entera —sus entrenos, sus ajustes y su perfil intactos—.
-- Existe porque borrar una cuenta de verdad arrastra en cascada todo su
-- historial y eso no se deshace. Con la papelera en medio, el borrado
-- irreversible es un segundo acto deliberado y no un clic de más.
--
-- Nada de esto lleva RLS: son las tablas de Better Auth, que tiene que
-- buscarte antes de que exista sesión. Quién puede leerlas lo deciden las
-- acciones de `src/actions/admin.ts`.

ALTER TABLE "session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "deleted_at" timestamp;