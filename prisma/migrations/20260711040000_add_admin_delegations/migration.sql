DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'AdminDelegationStatus'
  ) THEN
    CREATE TYPE "AdminDelegationStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "admin_delegations" (
    "id" UUID NOT NULL,
    "grantor_admin_id" UUID NOT NULL,
    "delegate_admin_id" UUID NOT NULL,
    "permission_codes" TEXT[] NOT NULL,
    "status" "AdminDelegationStatus" NOT NULL DEFAULT 'ACTIVE',
    "reason" VARCHAR(500),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "revoked_by_admin_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "admin_delegations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_delegations_delegate_admin_id_status_expires_at_idx"
  ON "admin_delegations"("delegate_admin_id", "status", "expires_at");
CREATE INDEX IF NOT EXISTS "admin_delegations_grantor_admin_id_status_idx"
  ON "admin_delegations"("grantor_admin_id", "status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_delegations_grantor_admin_id_fkey'
  ) THEN
    ALTER TABLE "admin_delegations"
      ADD CONSTRAINT "admin_delegations_grantor_admin_id_fkey"
      FOREIGN KEY ("grantor_admin_id") REFERENCES "admin_users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_delegations_delegate_admin_id_fkey'
  ) THEN
    ALTER TABLE "admin_delegations"
      ADD CONSTRAINT "admin_delegations_delegate_admin_id_fkey"
      FOREIGN KEY ("delegate_admin_id") REFERENCES "admin_users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
