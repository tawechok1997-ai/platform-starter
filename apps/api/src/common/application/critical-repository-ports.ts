export type RepositoryId = string;
export type RepositoryTimestamp = Date;
export type RepositoryMoney = { amount: string; currency: string };

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
  userId: RepositoryId;
  status: string;
  reviewedBy?: RepositoryId | null;
  updatedAt: RepositoryTimestamp;
};

export type WatchlistMatchRecord = {
  id: RepositoryId;
  subjectId: RepositoryId;
  status: string;
  overriddenBy?: RepositoryId | null;
};

export interface KycWatchlistRepositoryPort {
  findKycReviewForUpdate(id: RepositoryId): Promise<KycReviewRecord | null>;
  saveKycReview(record: KycReviewRecord): Promise<void>;
  findWatchlistMatchForUpdate(id: RepositoryId): Promise<WatchlistMatchRecord | null>;
  saveWatchlistMatch(record: WatchlistMatchRecord): Promise<void>;
}

export type PromotionSettlementRecord = {
  id: RepositoryId;
  userId: RepositoryId;
  status: string;
  amount: RepositoryMoney;
  idempotencyKey?: string | null;
  updatedAt: RepositoryTimestamp;
};

export interface PromotionSettlementRepositoryPort {
  findByIdForUpdate(id: RepositoryId): Promise<PromotionSettlementRecord | null>;
  findByIdempotencyKey(key: string): Promise<PromotionSettlementRecord | null>;
  save(record: PromotionSettlementRecord): Promise<void>;
}
