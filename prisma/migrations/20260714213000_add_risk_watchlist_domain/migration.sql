CREATE TABLE "risk_watchlist_entries" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "subject_type" VARCHAR(32) NOT NULL,
  "subject_value_hash" CHAR(64) NOT NULL,
  "display_masked" VARCHAR(255) NOT NULL,
  "list_type" VARCHAR(16) NOT NULL,
  "reason_code" VARCHAR(64) NOT NULL,
  "severity" VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
  "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  "member_id" UUID,
  "note" TEXT,
  "evidence" JSONB,
  "expires_at" TIMESTAMPTZ,
  "created_by_admin_id" UUID NOT NULL,
  "released_by_admin_id" UUID,
  "released_at" TIMESTAMPTZ,
  "release_reason" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "risk_watchlist_subject_type_check" CHECK ("subject_type" IN ('MEMBER','PHONE','EMAIL','BANK_ACCOUNT','DEVICE','IP')),
  CONSTRAINT "risk_watchlist_list_type_check" CHECK ("list_type" IN ('WATCHLIST','BLACKLIST')),
  CONSTRAINT "risk_watchlist_reason_check" CHECK ("reason_code" IN ('FRAUD_CONFIRMED','FRAUD_SUSPECTED','CHARGEBACK','IDENTITY_MISMATCH','DUPLICATE_IDENTITY','MONEY_LAUNDERING_RISK','ABUSE','SECURITY_COMPROMISE','REGULATORY_REQUEST','MANUAL_REVIEW','OTHER')),
  CONSTRAINT "risk_watchlist_severity_check" CHECK ("severity" IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  CONSTRAINT "risk_watchlist_status_check" CHECK ("status" IN ('ACTIVE','RELEASED','EXPIRED')),
  CONSTRAINT "risk_watchlist_member_fk" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "risk_watchlist_created_by_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT,
  CONSTRAINT "risk_watchlist_released_by_fk" FOREIGN KEY ("released_by_admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX "risk_watchlist_active_subject_unique"
  ON "risk_watchlist_entries" ("subject_type", "subject_value_hash", "list_type")
  WHERE "status" = 'ACTIVE';
CREATE INDEX "risk_watchlist_member_status_idx" ON "risk_watchlist_entries" ("member_id", "status");
CREATE INDEX "risk_watchlist_type_status_idx" ON "risk_watchlist_entries" ("list_type", "status", "created_at" DESC);
CREATE INDEX "risk_watchlist_reason_idx" ON "risk_watchlist_entries" ("reason_code", "severity");
CREATE INDEX "risk_watchlist_expiry_idx" ON "risk_watchlist_entries" ("expires_at") WHERE "status" = 'ACTIVE';
