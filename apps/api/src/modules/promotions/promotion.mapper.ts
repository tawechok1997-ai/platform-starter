type Row = Record<string, any>;

export function promotionClaimMetadata(value: unknown) {
  const data = value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};
  return {
    campaign: data.campaign ?? null,
    campaignId: String(data.campaignId ?? ''),
    topupId: data.topupId ?? null,
    linkedTopup: data.linkedTopup ?? null,
    depositAmount: Number(data.depositAmount ?? 0),
    memberNote: data.memberNote ?? '',
    adminNote: data.adminNote ?? '',
    reviewResult: data.reviewResult ?? null,
    settlement: data.settlement ?? { enabled: false },
    events: Array.isArray(data.events) ? data.events : [],
  };
}

export function promotionBonusMetadata(value: unknown) {
  const data = value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};
  return {
    claimId: String(data.claimId ?? ''), campaignId: String(data.campaignId ?? ''), topupId: data.topupId ?? null,
    linkedTopup: data.linkedTopup ?? null, depositAmount: Number(data.depositAmount ?? 0), campaign: data.campaign ?? null,
    amount: Number(data.amount ?? 0), currency: String(data.currency ?? 'THB'), turnoverRequired: Number(data.turnoverRequired ?? 0),
    turnoverProgress: Number(data.turnoverProgress ?? 0), turnoverCompleted: data.turnoverCompleted === true,
    lifecycleStatus: String(data.lifecycleStatus ?? (data.turnoverCompleted ? 'TURNOVER_COMPLETED' : 'ACTIVE')),
    lifecycleNote: String(data.lifecycleNote ?? ''), walletCreditEnabled: data.walletCreditEnabled === true,
    walletCreditStatus: String(data.walletCreditStatus ?? 'BLOCKED'), events: Array.isArray(data.events) ? data.events : [],
  };
}

export function mapPromotionClaim(item: Row) {
  const metadata = promotionClaimMetadata(item.metadata);
  const statusMap: Record<string, string> = { OPEN: 'PENDING', REVIEWING: 'REVIEWING', RESOLVED: 'APPROVED', DISMISSED: 'REJECTED' };
  return { id: item.id, campaignId: metadata.campaignId || item.refId, campaign: metadata.campaign, topupId: metadata.topupId,
    linkedTopup: metadata.linkedTopup, depositAmount: metadata.depositAmount, status: statusMap[item.status] ?? item.status,
    rawStatus: item.status, memberNote: metadata.memberNote, adminNote: metadata.adminNote, settlement: metadata.settlement,
    events: metadata.events, member: item.member ?? undefined, createdAt: item.createdAt, updatedAt: item.updatedAt, resolvedAt: item.resolvedAt };
}

export function mapPromotionBonusLedger(item: Row) {
  const metadata = promotionBonusMetadata(item.metadata);
  const fallback: Record<string, string> = { OPEN: 'ACTIVE', REVIEWING: 'REVIEWING', RESOLVED: 'COMPLETED', DISMISSED: 'EXPIRED' };
  const status = metadata.lifecycleStatus === 'SETTLED' ? 'SETTLED' : metadata.lifecycleStatus === 'RELEASE_READY' ? 'RELEASE_READY' :
    metadata.lifecycleStatus === 'REVOKED' ? 'REVOKED' : metadata.lifecycleStatus === 'EXPIRED' ? 'EXPIRED' :
    metadata.turnoverCompleted ? 'TURNOVER_COMPLETED' : fallback[item.status] ?? item.status;
  return { id: item.id, claimId: metadata.claimId || item.refId, campaignId: metadata.campaignId, topupId: metadata.topupId,
    linkedTopup: metadata.linkedTopup, depositAmount: metadata.depositAmount, campaign: metadata.campaign, amount: metadata.amount,
    currency: metadata.currency, turnoverRequired: metadata.turnoverRequired, turnoverProgress: metadata.turnoverProgress,
    turnoverCompleted: metadata.turnoverCompleted, lifecycleStatus: metadata.lifecycleStatus, lifecycleNote: metadata.lifecycleNote,
    walletCreditEnabled: metadata.walletCreditEnabled, walletCreditStatus: metadata.walletCreditStatus, status, rawStatus: item.status,
    events: metadata.events, member: item.member ?? undefined, createdAt: item.createdAt, updatedAt: item.updatedAt, resolvedAt: item.resolvedAt };
}
