CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"mesocycle_id" text NOT NULL,
	"week_order" integer NOT NULL,
	"day_order" integer NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"payload" jsonb NOT NULL,
	"schema_version" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"profile_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"schema_version" integer NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profiles_user_idx" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_started_idx" ON "sessions" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "sessions_user_week_day_idx" ON "sessions" USING btree ("user_id","week_order","day_order");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_one_active_idx" ON "sessions" USING btree ("user_id") WHERE status = 'in_progress';--> statement-breakpoint
CREATE INDEX "settings_user_idx" ON "settings" USING btree ("user_id");