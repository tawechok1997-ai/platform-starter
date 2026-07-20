CREATE TABLE IF NOT EXISTS "provider_simulator_nonces" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "merchant_id" VARCHAR(160) NOT NULL,
  "nonce" VARCHAR(160) NOT NULL,
  "request_timestamp" TIMESTAMP(3) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_simulator_nonces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "provider_simulator_nonces_merchant_id_nonce_key"
  ON "provider_simulator_nonces"("merchant_id", "nonce");

CREATE INDEX IF NOT EXISTS "provider_simulator_nonces_expires_at_idx"
  ON "provider_simulator_nonces"("expires_at");
