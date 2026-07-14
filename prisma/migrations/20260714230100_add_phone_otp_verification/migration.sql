CREATE TABLE IF NOT EXISTS "phone_otp_challenges" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "phone_hash" VARCHAR(64) NOT NULL,
  "phone_masked" VARCHAR(32) NOT NULL,
  "otp_hash" VARCHAR(64) NOT NULL,
  "purpose" VARCHAR(32) NOT NULL DEFAULT 'PHONE_VERIFY',
  "status" VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 5,
  "ip_hash" VARCHAR(64),
  "device_hash" VARCHAR(64),
  "provider" VARCHAR(40) NOT NULL,
  "provider_message_id" VARCHAR(160),
  "expires_at" TIMESTAMPTZ NOT NULL,
  "used_at" TIMESTAMPTZ,
  "revoked_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "phone_otp_status_check" CHECK ("status" IN ('ACTIVE','VERIFIED','REVOKED','EXPIRED','LOCKED')),
  CONSTRAINT "phone_otp_attempts_check" CHECK ("attempt_count" >= 0 AND "max_attempts" BETWEEN 1 AND 10)
);

CREATE INDEX IF NOT EXISTS "phone_otp_user_created_idx"
  ON "phone_otp_challenges" ("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "phone_otp_phone_created_idx"
  ON "phone_otp_challenges" ("phone_hash", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "phone_otp_ip_created_idx"
  ON "phone_otp_challenges" ("ip_hash", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "phone_otp_device_created_idx"
  ON "phone_otp_challenges" ("device_hash", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "phone_otp_expiry_idx"
  ON "phone_otp_challenges" ("status", "expires_at");
CREATE UNIQUE INDEX IF NOT EXISTS "phone_otp_one_active_per_user"
  ON "phone_otp_challenges" ("user_id", "purpose")
  WHERE "status" = 'ACTIVE';
