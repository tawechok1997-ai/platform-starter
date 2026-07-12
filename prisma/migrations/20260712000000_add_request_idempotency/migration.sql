ALTER TABLE "top_up_requests" ADD COLUMN "idempotency_key" VARCHAR(160);
ALTER TABLE "withdrawal_requests" ADD COLUMN "idempotency_key" VARCHAR(160);

CREATE UNIQUE INDEX "top_up_requests_idempotency_key_key" ON "top_up_requests" ("idempotency_key");
CREATE UNIQUE INDEX "withdrawal_requests_idempotency_key_key" ON "withdrawal_requests" ("idempotency_key");
