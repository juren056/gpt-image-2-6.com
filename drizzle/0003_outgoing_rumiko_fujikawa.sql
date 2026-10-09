CREATE TABLE "referral" (
	"id" text PRIMARY KEY NOT NULL,
	"referrer_id" text NOT NULL,
	"referred_user_id" text NOT NULL,
	"source_hash" text DEFAULT '' NOT NULL,
	"reward_credits" integer DEFAULT 10 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"rewarded_at" timestamp,
	CONSTRAINT "referral_referred_user_id_unique" UNIQUE("referred_user_id")
);
--> statement-breakpoint
CREATE TABLE "referral_code" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_code_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "referral_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referrer_id_user_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referred_user_id_user_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_code" ADD CONSTRAINT "referral_code_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_referral_referrer" ON "referral" USING btree ("referrer_id");--> statement-breakpoint
CREATE INDEX "idx_referral_source" ON "referral" USING btree ("source_hash");--> statement-breakpoint
CREATE INDEX "idx_referral_code_code" ON "referral_code" USING btree ("code");