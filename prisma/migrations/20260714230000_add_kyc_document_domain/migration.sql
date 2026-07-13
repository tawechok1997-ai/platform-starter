CREATE TABLE IF NOT EXISTS "kyc_cases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" varchar(32) NOT NULL DEFAULT 'DRAFT',
  "risk_level" varchar(16) NOT NULL DEFAULT 'NORMAL',
  "submitted_at" timestamptz,
  "reviewed_at" timestamptz,
  "reviewed_by_admin_id" uuid REFERENCES "admin_users"("id") ON DELETE SET NULL,
  "review_note" varchar(2000),
  "version" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kyc_cases_status_check" CHECK ("status" IN ('DRAFT','SUBMITTED','REVIEWING','APPROVED','REJECTED','EXPIRED')),
  CONSTRAINT "kyc_cases_risk_check" CHECK ("risk_level" IN ('NORMAL','ENHANCED','HIGH'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "kyc_cases_one_active_member_idx"
  ON "kyc_cases" ("member_id")
  WHERE "status" IN ('DRAFT','SUBMITTED','REVIEWING');
CREATE INDEX IF NOT EXISTS "kyc_cases_status_created_idx" ON "kyc_cases" ("status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "kyc_cases_member_created_idx" ON "kyc_cases" ("member_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "kyc_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "case_id" uuid NOT NULL REFERENCES "kyc_cases"("id") ON DELETE CASCADE,
  "member_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "document_type" varchar(40) NOT NULL,
  "status" varchar(24) NOT NULL DEFAULT 'UPLOADED',
  "storage_key" varchar(512) NOT NULL UNIQUE,
  "original_name" varchar(255) NOT NULL,
  "mime_type" varchar(100) NOT NULL,
  "size_bytes" integer NOT NULL,
  "sha256" varchar(64) NOT NULL,
  "retention_until" timestamptz NOT NULL,
  "reviewed_at" timestamptz,
  "reviewed_by_admin_id" uuid REFERENCES "admin_users"("id") ON DELETE SET NULL,
  "review_note" varchar(2000),
  "deleted_at" timestamptz,
  "version" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kyc_documents_type_check" CHECK ("document_type" IN ('NATIONAL_ID_FRONT','NATIONAL_ID_BACK','PASSPORT','SELFIE','ADDRESS_PROOF','BANK_PROOF','OTHER')),
  CONSTRAINT "kyc_documents_status_check" CHECK ("status" IN ('UPLOADED','ACCEPTED','REJECTED','DELETED','EXPIRED')),
  CONSTRAINT "kyc_documents_size_check" CHECK ("size_bytes" > 0 AND "size_bytes" <= 10485760)
);

CREATE UNIQUE INDEX IF NOT EXISTS "kyc_documents_active_type_idx"
  ON "kyc_documents" ("case_id", "document_type")
  WHERE "deleted_at" IS NULL AND "status" <> 'DELETED';
CREATE INDEX IF NOT EXISTS "kyc_documents_case_created_idx" ON "kyc_documents" ("case_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "kyc_documents_retention_idx" ON "kyc_documents" ("retention_until") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "kyc_documents_sha_idx" ON "kyc_documents" ("sha256");