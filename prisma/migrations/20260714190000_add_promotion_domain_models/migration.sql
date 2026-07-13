CREATE TABLE "promotion_claims" (
  "id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "campaign_id" VARCHAR(160) NOT NULL,
  "top_up_request_id" UUID,
  "source_risk_alert_id" UUID,
  "deposit_amount" DECIMAL(18,2) NOT NULL,
  "bonus_amount" DECIMAL(18,2) NOT NULL,
  "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  "member_note" VARCHAR(2000),
  "admin_note" VARCHAR(2000),
  "reviewed_by_admin_id" UUID,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "promotion_claims_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "promotion_claims_status_check" CHECK ("status" IN ('PENDING','REVIEWING','APPROVED','REJECTED','CANCELLED')),
  CONSTRAINT "promotion_claims_amount_check" CHECK ("deposit_amount" >= 0 AND "bonus_amount" >= 0)
);

CREATE TABLE "bonus_ledgers" (
  "id" UUID NOT NULL,
  "promotion_claim_id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "source_risk_alert_id" UUID,
  "amount" DECIMAL(18,2) NOT NULL,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'THB',
  "turnover_required" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "turnover_progress" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "status" VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  "wallet_ledger_id" UUID,
  "settlement_idempotency_key" VARCHAR(180),
  "released_by_admin_id" UUID,
  "released_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bonus_ledgers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bonus_ledgers_status_check" CHECK ("status" IN ('ACTIVE','TURNOVER_COMPLETED','RELEASE_READY','SETTLED','EXPIRED','REVOKED')),
  CONSTRAINT "bonus_ledgers_amount_check" CHECK ("amount" >= 0 AND "turnover_required" >= 0 AND "turnover_progress" >= 0)
);

CREATE UNIQUE INDEX "promotion_claims_source_risk_alert_id_key" ON "promotion_claims"("source_risk_alert_id");
CREATE UNIQUE INDEX "promotion_claims_top_up_request_id_key" ON "promotion_claims"("top_up_request_id") WHERE "top_up_request_id" IS NOT NULL;
CREATE INDEX "promotion_claims_member_id_status_created_at_idx" ON "promotion_claims"("member_id", "status", "created_at");
CREATE INDEX "promotion_claims_campaign_id_status_idx" ON "promotion_claims"("campaign_id", "status");

CREATE UNIQUE INDEX "bonus_ledgers_promotion_claim_id_key" ON "bonus_ledgers"("promotion_claim_id");
CREATE UNIQUE INDEX "bonus_ledgers_source_risk_alert_id_key" ON "bonus_ledgers"("source_risk_alert_id");
CREATE UNIQUE INDEX "bonus_ledgers_settlement_idempotency_key_key" ON "bonus_ledgers"("settlement_idempotency_key") WHERE "settlement_idempotency_key" IS NOT NULL;
CREATE INDEX "bonus_ledgers_member_id_status_created_at_idx" ON "bonus_ledgers"("member_id", "status", "created_at");
CREATE INDEX "bonus_ledgers_status_expires_at_idx" ON "bonus_ledgers"("status", "expires_at");

ALTER TABLE "promotion_claims" ADD CONSTRAINT "promotion_claims_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "promotion_claims" ADD CONSTRAINT "promotion_claims_top_up_request_id_fkey" FOREIGN KEY ("top_up_request_id") REFERENCES "top_up_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "promotion_claims" ADD CONSTRAINT "promotion_claims_source_risk_alert_id_fkey" FOREIGN KEY ("source_risk_alert_id") REFERENCES "risk_alerts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "promotion_claims" ADD CONSTRAINT "promotion_claims_reviewed_by_admin_id_fkey" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bonus_ledgers" ADD CONSTRAINT "bonus_ledgers_promotion_claim_id_fkey" FOREIGN KEY ("promotion_claim_id") REFERENCES "promotion_claims"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bonus_ledgers" ADD CONSTRAINT "bonus_ledgers_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bonus_ledgers" ADD CONSTRAINT "bonus_ledgers_source_risk_alert_id_fkey" FOREIGN KEY ("source_risk_alert_id") REFERENCES "risk_alerts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bonus_ledgers" ADD CONSTRAINT "bonus_ledgers_wallet_ledger_id_fkey" FOREIGN KEY ("wallet_ledger_id") REFERENCES "wallet_ledgers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bonus_ledgers" ADD CONSTRAINT "bonus_ledgers_released_by_admin_id_fkey" FOREIGN KEY ("released_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
