CREATE TYPE "public"."notification_type" AS ENUM('info', 'success', 'warning', 'error');--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" "notification_type" DEFAULT 'info' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"action_url" text,
	"action_label" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_access" ALTER COLUMN "admin_role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "admin_access" ALTER COLUMN "admin_role" SET DEFAULT 'TEAM_MEMBER'::text;--> statement-breakpoint
ALTER TABLE "admin_invitation" ALTER COLUMN "admin_role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."admin_role";--> statement-breakpoint
CREATE TYPE "public"."admin_role" AS ENUM('SUPER_ADMIN', 'TEAM_MEMBER');--> statement-breakpoint
ALTER TABLE "admin_access" ALTER COLUMN "admin_role" SET DEFAULT 'TEAM_MEMBER'::"public"."admin_role";--> statement-breakpoint
ALTER TABLE "admin_access" ALTER COLUMN "admin_role" SET DATA TYPE "public"."admin_role" USING "admin_role"::"public"."admin_role";--> statement-breakpoint
ALTER TABLE "admin_invitation" ALTER COLUMN "admin_role" SET DATA TYPE "public"."admin_role" USING "admin_role"::"public"."admin_role";--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_user_id_idx" ON "notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_is_read_idx" ON "notification" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notification_created_at_idx" ON "notification" USING btree ("created_at");