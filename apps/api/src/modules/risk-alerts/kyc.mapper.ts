export type KycRow = Record<string, unknown>;

export function mapKycCase(row: KycRow) {
  return {
    id: row.id,
    memberId: row.member_id,
    status: row.status,
    riskLevel: row.risk_level,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
    version: Number(row.version ?? 1),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapKycDocument(row: KycRow) {
  return {
    id: row.id,
    caseId: row.case_id,
    memberId: row.member_id,
    documentType: row.document_type,
    status: row.status,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes ?? 0),
    sha256: row.sha256,
    retentionUntil: row.retention_until,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
    version: Number(row.version ?? 1),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAdminKycCase(row: KycRow) {
  return {
    ...mapKycCase(row),
    member: {
      username: row.username,
      phone: row.phone,
      email: row.email,
    },
    documentCount: Number(row.document_count ?? 0),
  };
}
