-- Deposit slip duplicate detection and auditable payout workflow.
-- Additive migration only: existing statuses and rows remain valid.

ALTER TYPE "TopUpRequestStatus" ADD VALUE IF NOT EXISTS 'PENDING_SLIP_REVIEW';
ALTER TYPE "TopUpRequestStatus" ADD VALUE IF NOT EXISTS 'SLIP_APPROVED';
ALTER TYPE "TopUpRequestStatus" ADD VALUE IF NOT EXISTS 'PENDING_CREDIT';
ALTER TYPE "TopUpRequestStatus" ADD VALUE IF NOT EXISTS 'CREDIT_CONFIRMED';
ALTER TYPE "TopUpRequestStatus" ADD VALUE IF NOT EXISTS 'DUPLICATE';
ALTER TYPE "TopUpRequestStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';

ALTER TYPE "WithdrawalRequestStatus" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';
ALTER TYPE "WithdrawalRequestStatus" ADD VALUE IF NOT EXISTS 'APPROVED_FOR_PAYMENT';
ALTER TYPE "WithdrawalRequestStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_PROOF_UPLOADED';
ALTER TYPE "WithdrawalRequestStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_VERIFIED';

ALTER TYPE "RiskAlertType" ADD VALUE IF NOT EXISTS 'DUPLICATE_DEPOSIT_SLIP';
ALTER TYPE "RiskAlertType" ADD VALUE IF NOT EXISTS 'REPEATED_DUPLICATE_DEPOSIT_SLIP';

ALTER TABLE "top_up_requests"
  ADD COLUMN IF NOT EXISTS "slip_url" TEXT,
  ADD COLUMN IF NOT EXISTS "slip_file_hash" VARCHAR(128),
  ADD COLUMN IF NOT EXISTS "slip_perceptual_hash" VARCHAR(128),
  ADD COLUMN IF NOT EXISTS "slip_transaction_ref" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "slip_detected_amount" DECIMAL(18,2),
  ADD COLUMN IF NOT EXISTS "slip_transferred_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "duplicate_of_id" UUID,
  ADD COLUMN IF NOT EXISTS "duplicate_reason" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "duplicate_match_score" DECIMAL(8,5),
  ADD COLUMN IF NOT EXISTS "slip_reviewed_by" UUID,
  ADD COLUMN IF NOT EXISTS "slip_reviewed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "credit_confirmed_by" UUID,
  ADD COLUMN IF NOT EXISTS "credit_confirmed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "credited_ledger_id" UUID;

ALTER TABLE "withdrawal_requests"
  ADD COLUMN IF NOT EXISTS "payment_slip_url" TEXT,
  ADD COLUMN IF NOT EXISTS "payment_slip_file_hash" VARCHAR(128),
  ADD COLUMN IF NOT EXISTS "payment_transaction_ref" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "approved_for_payment_by" UUID,
  ADD COLUMN IF NOT EXISTS "approved_for_payment_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "payment_uploaded_by" UUID,
  ADD COLUMN IF NOT EXISTS "payment_uploaded_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "payment_verified_by" UUID,
  ADD COLUMN IF NOT EXISTS "payment_verified_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "completed_ledger_id" UUID;

DO $$ BEGIN
  ALTER TABLE "top_up_requests"
    ADD CONSTRAINT "top_up_requests_duplicate_of_id_fkey"
    FOREIGN KEY ("duplicate_of_id") REFERENCES "top_up_requests"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "top_up_requests"
    ADD CONSTRAINT "top_up_requests_slip_reviewed_by_fkey"
    FOREIGN KEY ("slip_reviewed_by") REFERENCES "admin_users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "top_up_requests"
    ADD CONSTRAINT "top_up_requests_credit_confirmed_by_fkey"
    FOREIGN KEY ("credit_confirmed_by") REFERENCES "admin_users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "top_up_requests"
    ADD CONSTRAINT "top_up_requests_credited_ledger_id_fkey"
    FOREIGN KEY ("credited_ledger_id") REFERENCES "wallet_ledgers"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_approved_for_payment_by_fkey"
    FOREIGN KEY ("approved_for_payment_by") REFERENCES "admin_users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_payment_uploaded_by_fkey"
    FOREIGN KEY ("payment_uploaded_by") REFERENCES "admin_users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_payment_verified_by_fkey"
    FOREIGN KEY ("payment_verified_by") REFERENCES "admin_users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_completed_ledger_id_fkey"
    FOREIGN KEY ("completed_ledger_id") REFERENCES "wallet_ledgers"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Duplicate submissions must remain insertable so the system can preserve evidence,
-- show the member why the request was rejected, and count repeated abuse. Concurrency
-- is serialized in the application with PostgreSQL advisory transaction locks.
CREATE INDEX IF NOT EXISTS "top_up_requests_slip_transaction_ref_idx"
  ON "top_up_requests"("slip_transaction_ref")
  WHERE "slip_transaction_ref" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "top_up_requests_slip_file_hash_idx"
  ON "top_up_requests"("slip_file_hash")
  WHERE "slip_file_hash" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "top_up_requests_slip_perceptual_hash_idx"
  ON "top_up_requests"("slip_perceptual_hash")
  WHERE "slip_perceptual_hash" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "top_up_requests_duplicate_of_id_idx"
  ON "top_up_requests"("duplicate_of_id");

CREATE INDEX IF NOT EXISTS "top_up_requests_user_status_created_idx"
  ON "top_up_requests"("user_id", "status", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "withdrawal_requests_payment_transaction_ref_idx"
  ON "withdrawal_requests"("payment_transaction_ref")
  WHERE "payment_transaction_ref" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "withdrawal_requests_payment_slip_file_hash_idx"
  ON "withdrawal_requests"("payment_slip_file_hash")
  WHERE "payment_slip_file_hash" IS NOT NULL;
