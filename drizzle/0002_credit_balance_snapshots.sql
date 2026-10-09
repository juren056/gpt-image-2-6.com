ALTER TABLE "credit" ADD COLUMN "balance_before" integer;--> statement-breakpoint
ALTER TABLE "credit" ADD COLUMN "balance_after" integer;--> statement-breakpoint
UPDATE "credit"
SET
  "balance_before" = "remaining_credits" - "credits",
  "balance_after" = "remaining_credits"
WHERE
  "transaction_type" = 'consume'
  AND "balance_before" IS NULL
  AND "balance_after" IS NULL;
