ALTER TABLE "risk_alerts"
  ADD COLUMN "assigned_to_admin_id" UUID,
  ADD COLUMN "assigned_at" TIMESTAMP(3);

CREATE TABLE "risk_alert_notes" (
  "id" UUID NOT NULL,
  "risk_alert_id" UUID NOT NULL,
  "admin_user_id" UUID NOT NULL,
  "note" VARCHAR(2000) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "risk_alert_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "risk_alerts_assigned_to_admin_id_status_idx" ON "risk_alerts"("assigned_to_admin_id", "status");
CREATE INDEX "risk_alert_notes_risk_alert_id_created_at_idx" ON "risk_alert_notes"("risk_alert_id", "created_at");
CREATE INDEX "risk_alert_notes_admin_user_id_created_at_idx" ON "risk_alert_notes"("admin_user_id", "created_at");

ALTER TABLE "risk_alerts"
  ADD CONSTRAINT "risk_alerts_assigned_to_admin_id_fkey"
  FOREIGN KEY ("assigned_to_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "risk_alert_notes"
  ADD CONSTRAINT "risk_alert_notes_risk_alert_id_fkey"
  FOREIGN KEY ("risk_alert_id") REFERENCES "risk_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "risk_alert_notes_admin_user_id_fkey"
  FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
