export type RepositoryId = string;
export type RepositoryTimestamp = Date;
type RepositoryMoney = { amount: string; currency: string };

export type DepositRecord = {
  id: RepositoryId;
  userId: RepositoryId;
  status: string;
  amount: RepositoryMoney;
  idempotencyKey?: string | null;
  updatedAt: RepositoryTimestamp;
};

export interface DepositRepositoryPort {
  findByIdForUpdate(id: RepositoryId): Promise<DepositRecord | null>;
  findByIdempotencyKey(key: string): Promise<DepositRecord | null>;
  save(record: DepositRecord): Promise<void>;
}

export type WithdrawalRecord = {
  id: RepositoryId;
  userId: RepositoryId;
  status: string;
  amount: RepositoryMoney;
  claimedBy?: RepositoryId | null;
  idempotencyKey?: string | null;
  updatedAt: RepositoryTimestamp;
};

export interface WithdrawalRepositoryPort {
  findByIdForUpdate(id: RepositoryId): Promise<WithdrawalRecord | null>;
  findByIdempotencyKey(key: string): Promise<WithdrawalRecord | null>;
  save(record: WithdrawalRecord): Promise<void>;
}

export type OwnershipRecord = {
  adminUserId: RepositoryId;
  isOwner: boolean;
  status: string;
};

export interface AdminOwnershipRepositoryPort {
  findAdminForUpdate(adminUserId: RepositoryId): Promise<OwnershipRecord | null>;
  countActiveOwnersForUpdate(): Promise<number>;
  transferOwnership(previousOwnerId: RepositoryId, nextOwnerId: RepositoryId): Promise<void>;
}

export type KycReviewRecord = {
  id: RepositoryId;
  memberId: RepositoryId;
  status: string;
  version: number;
  reviewNote?: string | null;
  reviewedBy?: RepositoryId | null;
  reviewedAt?: RepositoryTimestamp | null;
  deletedAt?: RepositoryTimestamp | null;
  updatedAt: RepositoryTimestamp;
  view: Record<string, unknown>;
};

export type WatchlistEntryRecord = {
  id: RepositoryId;
  memberId?: RepositoryId | null;
  status: string;
  version: number;
  listType: string;
  subjectType: string;
  releasedBy?: RepositoryId | null;
  releasedAt?: RepositoryTimestamp | null;
  releaseReason?: string | null;
  updatedAt: RepositoryTimestamp;
  view: Record<string, unknown>;
};

export interface KycWatchlistRepositoryPort {
  findKycDocumentForUpdate(id: RepositoryId): Promise<KycReviewRecord | null>;
  findKycCaseForUpdate(id: RepositoryId): Promise<KycReviewRecord | null>;
  saveKycDocumentReview(record: KycReviewRecord): Promise<KycReviewRecord | null>;
  saveKycCaseReview(record: KycReviewRecord): Promise<KycReviewRecord | null>;
  countUnacceptedKycDocuments(caseId: RepositoryId): Promise<number>;
  findWatchlistEntryForUpdate(id: RepositoryId): Promise<WatchlistEntryRecord | null>;
  saveWatchlistEntry(record: WatchlistEntryRecord): Promise<WatchlistEntryRecord | null>;
}

export type PromotionSettlementRecord = {
  id: RepositoryId;
  sourceRiskAlertId: RepositoryId;
  userId: RepositoryId;
  walletLedgerId?: RepositoryId | null;
  status: string;
  amount: RepositoryMoney;
  idempotencyKey?: string | null;
  releasedBy?: RepositoryId | null;
  releasedAt?: RepositoryTimestamp | null;
  updatedAt: RepositoryTimestamp;
};

export interface PromotionSettlementRepositoryPort {
  findBySourceRiskAlertIdForUpdate(id: RepositoryId): Promise<PromotionSettlementRecord | null>;
  findByIdempotencyKey(key: string): Promise<PromotionSettlementRecord | null>;
  save(record: PromotionSettlementRecord): Promise<void>;
}