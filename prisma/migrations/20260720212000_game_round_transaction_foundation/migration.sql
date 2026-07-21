-- Additive game-round hardening migration.
-- CI may bootstrap from the Prisma schema, where this raw-SQL-owned table is not
-- represented. Create the base table defensively before applying hardening.

CREATE TABLE IF NOT EXISTS "game_rounds" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider_id" UUID NOT NULL,
  "provider_round_id" VARCHAR(180) NOT NULL,
  "state" VARCHAR(40) NOT NULL DEFAULT 'CREATED',
  "bet_transaction_id" VARCHAR(180),
  "settle_transaction_id" VARCHAR(180),
  "rollback_transaction_id" VARCHAR(180),
  "last_event_type" VARCHAR(120),
  "last_event_payload" JSONB,
  "settled_at" TIMESTAMPTZ,
  "rolled_back_at" TIMESTAMPTZ,
  "closed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "game_rounds_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "game_rounds_provider_id_fkey"
    FOREIGN KEY ("provider_id") REFERENCES "game_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Some disposable CI baselines previously created the raw-SQL-owned table with
-- OPEN as its initial state. The round transition policy uses CREATED, so repair
-- that bootstrap-only legacy value before concurrency tests execute.
ALTER TABLE "game_rounds"
  ALTER COLUMN "state" SET DEFAULT 'CREATED';
UPDATE "game_rounds" SET "state" = 'CREATED' WHERE "state" = 'OPEN';

CREATE UNIQUE INDEX IF NOT EXISTS "game_rounds_provider_round_key"
  ON "game_rounds"("provider_id", "provider_round_id");
CREATE INDEX IF NOT EXISTS "game_rounds_provider_state_idx"
  ON "game_rounds"("provider_id", "state");
CREATE INDEX IF NOT EXISTS "game_rounds_updated_at_idx"
  ON "game_rounds"("updated_at");

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