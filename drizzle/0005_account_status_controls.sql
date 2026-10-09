CREATE TABLE "user_account_state" (
	"user_id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"reason_code" text DEFAULT '' NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"suspended_until" timestamp,
	"changed_by" text,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_status_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"actor_user_id" text NOT NULL,
	"scope" text NOT NULL,
	"previous_status" text NOT NULL,
	"next_status" text NOT NULL,
	"reason_code" text NOT NULL,
	"reason" text NOT NULL,
	"effective_until" timestamp,
	"request_id" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_account_state" ADD CONSTRAINT "user_account_state_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_status_audit" ADD CONSTRAINT "user_status_audit_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_user_account_status" ON "user_account_state" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "idx_user_status_audit_user_created" ON "user_status_audit" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX "idx_user_status_audit_actor_created" ON "user_status_audit" USING btree ("actor_user_id","created_at");
