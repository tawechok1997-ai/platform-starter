-- Additive game-round hardening migration.
-- This migration intentionally keeps the existing game_rounds table and its
-- current state column representation intact to avoid rewriting live rows.

ALTER TABLE "game_rounds"
  ADD COLUMN IF NOT EXISTS "total_bet_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total_win_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total_refund_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total_rollback_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "manual_review_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "manual_review_at" TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS "game_round_transactions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "round_id" UUID NOT NULL,
  "provider_id" UUID NOT NULL,
  "provider_transaction_id" VARCHAR(180) NOT NULL,
  "original_provider_transaction_id" VARCHAR(180),
  "operation" VARCHAR(40) NOT NULL,
  "direction" "WalletLedgerDirection" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'THB',
  "idempotency_key" VARCHAR(220) NOT NULL,
  "payload_hash" VARCHAR(64),
  "raw_payload" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "game_round_transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "game_round_transactions_round_id_fkey"
    FOREIGN KEY ("round_id") REFERENCES "game_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "game_round_transactions_provider_id_fkey"
    FOREIGN KEY ("provider_id") REFERENCES "game_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "game_round_transactions_amount_positive" CHECK ("amount" > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "game_round_transactions_provider_tx_key"
  ON "game_round_transactions"("provider_id", "provider_transaction_id");

CREATE UNIQUE INDEX IF NOT EXISTS "game_round_transactions_idempotency_key_key"
  ON "game_round_transactions"("idempotency_key");

CREATE INDEX IF NOT EXISTS "game_round_transactions_round_created_idx"
  ON "game_round_transactions"("round_id", "created_at");

CREATE INDEX IF NOT EXISTS "game_round_transactions_provider_created_idx"
  ON "game_round_transactions"("provider_id", "created_at");

CREATE INDEX IF NOT EXISTS "game_round_transactions_operation_idx"
  ON "game_round_transactions"("operation");

CREATE INDEX IF NOT EXISTS "game_round_transactions_original_tx_idx"
  ON "game_round_transactions"("provider_id", "original_provider_transaction_id");
