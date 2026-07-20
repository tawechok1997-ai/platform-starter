CREATE TABLE "game_rounds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_id" UUID NOT NULL,
    "provider_round_id" VARCHAR(180) NOT NULL,
    "state" VARCHAR(32) NOT NULL DEFAULT 'CREATED',
    "bet_transaction_id" VARCHAR(180),
    "settle_transaction_id" VARCHAR(180),
    "rollback_transaction_id" VARCHAR(180),
    "last_event_type" VARCHAR(120),
    "last_event_payload" JSONB,
    "settled_at" TIMESTAMP(3),
    "rolled_back_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "game_rounds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "game_rounds_state_check" CHECK ("state" IN ('CREATED', 'BET', 'SETTLED', 'ROLLED_BACK', 'CLOSED')),
    CONSTRAINT "game_rounds_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "game_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "game_rounds_provider_id_provider_round_id_key"
    ON "game_rounds"("provider_id", "provider_round_id");

CREATE UNIQUE INDEX "game_rounds_provider_id_bet_transaction_id_key"
    ON "game_rounds"("provider_id", "bet_transaction_id")
    WHERE "bet_transaction_id" IS NOT NULL;

CREATE UNIQUE INDEX "game_rounds_provider_id_settle_transaction_id_key"
    ON "game_rounds"("provider_id", "settle_transaction_id")
    WHERE "settle_transaction_id" IS NOT NULL;

CREATE UNIQUE INDEX "game_rounds_provider_id_rollback_transaction_id_key"
    ON "game_rounds"("provider_id", "rollback_transaction_id")
    WHERE "rollback_transaction_id" IS NOT NULL;

CREATE INDEX "game_rounds_provider_id_state_updated_at_idx"
    ON "game_rounds"("provider_id", "state", "updated_at");

CREATE INDEX "game_rounds_closed_at_idx"
    ON "game_rounds"("closed_at");
