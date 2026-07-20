CREATE TABLE IF NOT EXISTS "game_round_manual_reviews" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider_code" VARCHAR(80) NOT NULL,
  "user_id" UUID NOT NULL,
  "external_round_id" VARCHAR(180) NOT NULL,
  "game_code" VARCHAR(120) NOT NULL,
  "operation" VARCHAR(40) NOT NULL,
  "provider_transaction_id" VARCHAR(180) NOT NULL,
  "original_provider_transaction_id" VARCHAR(180),
  "amount" DECIMAL(18, 2) NOT NULL,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'THB',
  "reason" VARCHAR(255) NOT NULL,
  "status" VARCHAR(32) NOT NULL DEFAULT 'OPEN',
  "metadata" JSONB,
  "resolved_at" TIMESTAMPTZ,
  "resolved_by" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "game_round_manual_reviews_provider_tx_key"
  ON "game_round_manual_reviews" ("provider_code", "provider_transaction_id");
CREATE INDEX IF NOT EXISTS "game_round_manual_reviews_status_created_idx"
  ON "game_round_manual_reviews" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "game_round_manual_reviews_user_round_idx"
  ON "game_round_manual_reviews" ("user_id", "external_round_id");

CREATE INDEX IF NOT EXISTS "game_rounds_stale_scan_idx"
  ON "game_rounds" ("state", "updated_at")
  WHERE "state" NOT IN ('CLOSED', 'ROLLED_BACK');
