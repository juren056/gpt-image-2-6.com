CREATE TABLE "user_safety_state" (
	"user_id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"strike_points" integer DEFAULT 0 NOT NULL,
	"warning_count" integer DEFAULT 0 NOT NULL,
	"restricted_until" timestamp,
	"last_violation_at" timestamp,
	"last_category" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_task" ADD COLUMN "safety_status" text DEFAULT 'unchecked' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_task" ADD COLUMN "safety_category" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_task" ADD COLUMN "safety_severity" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_task" ADD COLUMN "safety_source" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_task" ADD COLUMN "safety_confidence" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_task" ADD COLUMN "safety_review_status" text DEFAULT 'not_required' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_task" ADD COLUMN "safety_action" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_safety_state" ADD CONSTRAINT "user_safety_state_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_safety_status" ON "user_safety_state" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ai_task_safety_status_created" ON "ai_task" USING btree ("safety_status","created_at");