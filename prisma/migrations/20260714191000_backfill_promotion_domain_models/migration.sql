INSERT INTO "promotion_claims" (
  "id",
  "member_id",
  "campaign_id",
  "top_up_request_id",
  "source_risk_alert_id",
  "deposit_amount",
  "bonus_amount",
  "status",
  "member_note",
  "admin_note",
  "reviewed_at",
  "created_at",
  "updated_at"
)
SELECT
  r."id",
  r."member_id",
  COALESCE(NULLIF(r."metadata"->>'campaignId', ''), r."ref_id", 'legacy-campaign'),
  CASE
    WHEN COALESCE(r."metadata"->>'topupId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN (r."metadata"->>'topupId')::uuid
    ELSE NULL
  END,
  r."id",
  CASE
    WHEN COALESCE(r."metadata"->>'depositAmount', '') ~ '^[0-9]+(\.[0-9]+)?$'
      THEN (r."metadata"->>'depositAmount')::numeric
    ELSE 0
  END,
  CASE
    WHEN COALESCE(r."metadata"#>>'{bonusPreview,estimatedBonus}', '') ~ '^[0-9]+(\.[0-9]+)?$'
      THEN (r."metadata"#>>'{bonusPreview,estimatedBonus}')::numeric
    ELSE 0
  END,
  CASE r."status"::text
    WHEN 'OPEN' THEN 'PENDING'
    WHEN 'REVIEWING' THEN 'REVIEWING'
    WHEN 'RESOLVED' THEN 'APPROVED'
    WHEN 'DISMISSED' THEN 'REJECTED'
    ELSE 'PENDING'
  END,
  NULLIF(r."metadata"->>'memberNote', ''),
  NULLIF(r."metadata"->>'adminNote', ''),
  r."resolved_at",
  r."created_at",
  r."updated_at"
FROM "risk_alerts" r
WHERE r."ref_type" = 'PROMOTION_CLAIM'
  AND r."member_id" IS NOT NULL
ON CONFLICT ("source_risk_alert_id") DO NOTHING;

INSERT INTO "bonus_ledgers" (
  "id",
  "promotion_claim_id",
  "member_id",
  "source_risk_alert_id",
  "amount",
  "currency",
  "turnover_required",
  "turnover_progress",
  "status",
  "created_at",
  "updated_at"
)
SELECT
  r."id",
  (r."metadata"->>'claimId')::uuid,
  r."member_id",
  r."id",
  CASE
    WHEN COALESCE(r."metadata"->>'amount', '') ~ '^[0-9]+(\.[0-9]+)?$'
      THEN (r."metadata"->>'amount')::numeric
    ELSE 0
  END,
  COALESCE(NULLIF(r."metadata"->>'currency', ''), 'THB'),
  CASE
    WHEN COALESCE(r."metadata"->>'turnoverRequired', '') ~ '^[0-9]+(\.[0-9]+)?$'
      THEN (r."metadata"->>'turnoverRequired')::numeric
    ELSE 0
  END,
  CASE
    WHEN COALESCE(r."metadata"->>'turnoverProgress', '') ~ '^[0-9]+(\.[0-9]+)?$'
      THEN (r."metadata"->>'turnoverProgress')::numeric
    ELSE 0
  END,
  CASE COALESCE(r."metadata"->>'lifecycleStatus', '')
    WHEN 'TURNOVER_COMPLETED' THEN 'TURNOVER_COMPLETED'
    WHEN 'RELEASE_READY' THEN 'RELEASE_READY'
    WHEN 'EXPIRED' THEN 'EXPIRED'
    WHEN 'REVOKED' THEN 'REVOKED'
    ELSE 'ACTIVE'
  END,
  r."created_at",
  r."updated_at"
FROM "risk_alerts" r
WHERE r."ref_type" = 'BONUS_LEDGER'
  AND r."member_id" IS NOT NULL
  AND COALESCE(r."metadata"->>'claimId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND EXISTS (
    SELECT 1
    FROM "promotion_claims" c
    WHERE c."id" = (r."metadata"->>'claimId')::uuid
  )
ON CONFLICT ("promotion_claim_id") DO NOTHING;
