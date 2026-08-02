CREATE TABLE IF NOT EXISTS "activity_metric_events" (
  "id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "metric_code" VARCHAR(120) NOT NULL,
  "category" VARCHAR(80),
  "value" DECIMAL(20, 4) NOT NULL,
  "source_type" VARCHAR(80) NOT NULL,
  "source_id" VARCHAR(180),
  "idempotency_key" VARCHAR(220) NOT NULL,
  "occurred_at" TIMESTAMP(3) NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activity_metric_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "activity_metric_events_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "activity_metric_events_idempotency_key_key" ON "activity_metric_events"("idempotency_key");
CREATE INDEX IF NOT EXISTS "activity_metric_events_member_metric_occurred_idx" ON "activity_metric_events"("member_id", "metric_code", "occurred_at");
CREATE INDEX IF NOT EXISTS "activity_metric_events_source_idx" ON "activity_metric_events"("source_type", "source_id");

CREATE TABLE IF NOT EXISTS "member_activity_progress" (
  "id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "activity_code" VARCHAR(100) NOT NULL,
  "rule_code" VARCHAR(140) NOT NULL,
  "period_key" VARCHAR(140) NOT NULL,
  "progress" DECIMAL(20, 4) NOT NULL DEFAULT 0,
  "target" DECIMAL(20, 4) NOT NULL DEFAULT 0,
  "status" VARCHAR(40) NOT NULL DEFAULT 'IN_PROGRESS',
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "member_activity_progress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "member_activity_progress_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "member_activity_progress_identity_key" ON "member_activity_progress"("member_id", "activity_code", "rule_code", "period_key");
CREATE INDEX IF NOT EXISTS "member_activity_progress_member_activity_idx" ON "member_activity_progress"("member_id", "activity_code", "updated_at");
CREATE INDEX IF NOT EXISTS "member_activity_progress_status_idx" ON "member_activity_progress"("status", "updated_at");

CREATE TABLE IF NOT EXISTS "member_activity_reward_claims" (
  "id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "activity_code" VARCHAR(100) NOT NULL,
  "reward_code" VARCHAR(140) NOT NULL,
  "period_key" VARCHAR(140) NOT NULL,
  "reward_type" VARCHAR(32) NOT NULL,
  "amount" DECIMAL(20, 4) NOT NULL DEFAULT 0,
  "status" VARCHAR(40) NOT NULL DEFAULT 'CREDITED',
  "idempotency_key" VARCHAR(220) NOT NULL,
  "wallet_ledger_id" UUID,
  "metadata" JSONB,
  "claimed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "member_activity_reward_claims_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "member_activity_reward_claims_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "member_activity_reward_claims_wallet_ledger_id_fkey" FOREIGN KEY ("wallet_ledger_id") REFERENCES "wallet_ledgers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "member_activity_reward_type_check" CHECK ("reward_type" IN ('CREDIT', 'POINT', 'TICKET'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "member_activity_reward_claims_identity_key" ON "member_activity_reward_claims"("member_id", "activity_code", "reward_code", "period_key");
CREATE UNIQUE INDEX IF NOT EXISTS "member_activity_reward_claims_idempotency_key_key" ON "member_activity_reward_claims"("idempotency_key");
CREATE INDEX IF NOT EXISTS "member_activity_reward_claims_member_claimed_idx" ON "member_activity_reward_claims"("member_id", "claimed_at");
CREATE INDEX IF NOT EXISTS "member_activity_reward_claims_activity_idx" ON "member_activity_reward_claims"("activity_code", "status", "claimed_at");

CREATE TABLE IF NOT EXISTS "member_activity_lottery_entries" (
  "id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "round_code" VARCHAR(140) NOT NULL,
  "top_number" VARCHAR(16) NOT NULL,
  "bottom_number" VARCHAR(16) NOT NULL,
  "status" VARCHAR(40) NOT NULL DEFAULT 'SUBMITTED',
  "top_matched" BOOLEAN NOT NULL DEFAULT false,
  "bottom_matched" BOOLEAN NOT NULL DEFAULT false,
  "reward_amount" DECIMAL(20, 4) NOT NULL DEFAULT 0,
  "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "settled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "member_activity_lottery_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "member_activity_lottery_entries_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "member_activity_lottery_entries_member_round_key" ON "member_activity_lottery_entries"("member_id", "round_code");
CREATE INDEX IF NOT EXISTS "member_activity_lottery_entries_round_status_idx" ON "member_activity_lottery_entries"("round_code", "status", "submitted_at");

CREATE TABLE IF NOT EXISTS "activity_lottery_results" (
  "id" UUID NOT NULL,
  "round_code" VARCHAR(140) NOT NULL,
  "top_number" VARCHAR(16) NOT NULL,
  "bottom_number" VARCHAR(16) NOT NULL,
  "published_by_admin_id" UUID,
  "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activity_lottery_results_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "activity_lottery_results_published_by_admin_id_fkey" FOREIGN KEY ("published_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "activity_lottery_results_round_code_key" ON "activity_lottery_results"("round_code");
