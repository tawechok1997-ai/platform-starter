CREATE TYPE "BankAccountStatus" AS ENUM ('ACTIVE', 'DISABLED', 'PENDING_REVIEW', 'REJECTED');

CREATE TABLE "receiving_bank_accounts" (
  "id" UUID NOT NULL,
  "bank_name" VARCHAR(120) NOT NULL,
  "account_name" VARCHAR(160) NOT NULL,
  "account_number" VARCHAR(160) NOT NULL,
  "prompt_pay" VARCHAR(160),
  "qr_image_url" TEXT,
  "min_amount" DECIMAL(18,2),
  "max_amount" DECIMAL(18,2),
  "status" "BankAccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "sort_order" INTEGER NOT NULL DEFAULT 100,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "receiving_bank_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "member_bank_accounts" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "bank_name" VARCHAR(120) NOT NULL,
  "account_name" VARCHAR(160) NOT NULL,
  "account_number" VARCHAR(160) NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "status" "BankAccountStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "admin_note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "member_bank_accounts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "receiving_bank_accounts_status_idx" ON "receiving_bank_accounts"("status");
CREATE INDEX "member_bank_accounts_user_id_idx" ON "member_bank_accounts"("user_id");
CREATE INDEX "member_bank_accounts_status_idx" ON "member_bank_accounts"("status");

ALTER TABLE "member_bank_accounts" ADD CONSTRAINT "member_bank_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
