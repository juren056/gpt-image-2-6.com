CREATE TABLE IF NOT EXISTS "payment_event" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"event_type" text NOT NULL,
	"status" text NOT NULL,
	"payload" text,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "charge_id" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_event_status" ON "payment_event" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_payment_intent" ON "order" USING btree ("payment_intent_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_order_transaction_provider" ON "order" USING btree ("transaction_id","payment_provider");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_subscription_provider_id" ON "subscription" USING btree ("subscription_id","payment_provider");
