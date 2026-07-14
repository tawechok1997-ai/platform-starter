export type RiskWatchlistRow = Record<string, unknown>;

export function mapRiskWatchlistItem(item: RiskWatchlistRow) {
  return {
    id: item.id,
    subjectType: item.subject_type,
    displayMasked: item.display_masked,
    listType: item.list_type,
    reasonCode: item.reason_code,
    severity: item.severity,
    status: item.status,
    memberId: item.member_id,
    note: item.note,
    evidence: item.evidence,
    expiresAt: item.expires_at,
    releasedAt: item.released_at,
    releaseReason: item.release_reason,
    version: Number(item.version ?? 1),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

export function mapRiskWatchlistMatch(items: RiskWatchlistRow[]) {
  const mapped = items.map(mapRiskWatchlistItem);
  return {
    matched: mapped.length > 0,
    blocked: items.some((item) => item.list_type === 'BLACKLIST'),
    items: mapped,
  };
}
