ALTER TABLE "game_rounds"
  ADD COLUMN IF NOT EXISTS "refund_transaction_id" VARCHAR(180),
  ADD COLUMN IF NOT EXISTS "cancel_transaction_id" VARCHAR(180);

CREATE INDEX IF NOT EXISTS "game_rounds_refund_transaction_id_idx"
  ON "game_rounds" ("refund_transaction_id");

CREATE INDEX IF NOT EXISTS "game_rounds_cancel_transaction_id_idx"
  ON "game_rounds" ("cancel_transaction_id");

CREATE INDEX IF NOT EXISTS "game_round_transactions_round_operation_created_idx"
  ON "game_round_transactions" ("round_id", "operation", "created_at");
