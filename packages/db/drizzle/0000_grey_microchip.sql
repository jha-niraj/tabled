CREATE TYPE "public"."admin_invite_status" AS ENUM('PENDING', 'USED', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."admin_role" AS ENUM('SUPER_ADMIN', 'CONTENT_ADMIN', 'FINANCE_ADMIN', 'COMMUNITY_ADMIN', 'MODULE_MANAGER', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."admin_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."announcement_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."broadcast_status" AS ENUM('DRAFT', 'SENT', 'SCHEDULED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_access" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"admin_role" "admin_role" DEFAULT 'MODULE_MANAGER' NOT NULL,
	"status" "admin_status" DEFAULT 'ACTIVE' NOT NULL,
	"permissions" json DEFAULT '{}'::json NOT NULL,
	"last_login_at" timestamp,
	"login_count" integer DEFAULT 0 NOT NULL,
	"invited_by" text,
	"invite_code" text,
	"hashed_password" text,
	"access_code" text,
	"access_code_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_access_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"action" text NOT NULL,
	"module" text NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"description" text,
	"changes" json,
	"metadata" json,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_dashboard_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"stat_type" text NOT NULL,
	"data" json NOT NULL,
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_dashboard_stats_stat_type_unique" UNIQUE("stat_type")
);
--> statement-breakpoint
CREATE TABLE "admin_invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"admin_role" "admin_role" NOT NULL,
	"permissions" json DEFAULT '{}'::json NOT NULL,
	"status" "admin_invite_status" DEFAULT 'PENDING' NOT NULL,
	"used_by" text,
	"used_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_invitation_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "admin_notification" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"action_url" text,
	"action_label" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_system_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" json NOT NULL,
	"description" text,
	"last_modified_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "announcement" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"status" "announcement_status" DEFAULT 'DRAFT' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"author_id" text NOT NULL,
	"published_at" timestamp,
	"expires_at" timestamp,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcast" (
	"id" text PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"status" "broadcast_status" DEFAULT 'DRAFT' NOT NULL,
	"recipient_type" text DEFAULT 'all' NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"author_id" text NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "role" DEFAULT 'USER' NOT NULL,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"bio" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_access" ADD CONSTRAINT "admin_access_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_id_admin_access_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_access"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_invitation" ADD CONSTRAINT "admin_invitation_created_by_id_admin_access_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."admin_access"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_author_id_admin_access_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."admin_access"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast" ADD CONSTRAINT "broadcast_author_id_admin_access_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."admin_access"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_access_role_idx" ON "admin_access" USING btree ("admin_role");--> statement-breakpoint
CREATE INDEX "admin_access_status_idx" ON "admin_access" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admin_access_user_id_idx" ON "admin_access" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_audit_log_admin_id_idx" ON "admin_audit_log" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_audit_log_module_idx" ON "admin_audit_log" USING btree ("module");--> statement-breakpoint
CREATE INDEX "admin_audit_log_action_idx" ON "admin_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "admin_audit_log_created_at_idx" ON "admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_audit_log_resource_idx" ON "admin_audit_log" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "admin_dashboard_stats_stat_type_idx" ON "admin_dashboard_stats" USING btree ("stat_type");--> statement-breakpoint
CREATE INDEX "admin_dashboard_stats_last_updated_at_idx" ON "admin_dashboard_stats" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "admin_invitation_code_idx" ON "admin_invitation" USING btree ("code");--> statement-breakpoint
CREATE INDEX "admin_invitation_email_idx" ON "admin_invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "admin_invitation_status_idx" ON "admin_invitation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admin_invitation_expires_at_idx" ON "admin_invitation" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "admin_invitation_created_by_id_idx" ON "admin_invitation" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "admin_notification_admin_id_idx" ON "admin_notification" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_notification_is_read_idx" ON "admin_notification" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "admin_notification_created_at_idx" ON "admin_notification" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_system_settings_key_idx" ON "admin_system_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "announcement_status_idx" ON "announcement" USING btree ("status");--> statement-breakpoint
CREATE INDEX "announcement_author_id_idx" ON "announcement" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "announcement_created_at_idx" ON "announcement" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "broadcast_status_idx" ON "broadcast" USING btree ("status");--> statement-breakpoint
CREATE INDEX "broadcast_author_id_idx" ON "broadcast" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "broadcast_created_at_idx" ON "broadcast" USING btree ("created_at");