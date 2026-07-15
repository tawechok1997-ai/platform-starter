export type GameProviderStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DEGRADED';
export type GameProviderWalletMode = 'SEAMLESS' | 'TRANSFER' | 'HYBRID';
export type GameProviderEndpointType =
  'LAUNCH' | 'BALANCE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'GAME_LIST' | 'BET_HISTORY' | 'WEBHOOK' | 'HEALTH_CHECK';
export type GameProviderCredentialType =
  'API_KEY' | 'SECRET_KEY' | 'MERCHANT_ID' | 'AGENT_ID' | 'WEBHOOK_SECRET' | 'TOKEN';
export type GameStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'REMOVED';
export type GameMediaType = 'COVER' | 'ICON' | 'THUMBNAIL' | 'BANNER' | 'LOGO' | 'FALLBACK';
export type GameMediaStatus = 'PENDING' | 'READY' | 'BROKEN' | 'FALLBACK';
export type GameSessionStatus = 'CREATED' | 'LAUNCHED' | 'ACTIVE' | 'ENDED' | 'FAILED' | 'EXPIRED';
export type GameTransferType = 'TRANSFER_IN' | 'TRANSFER_OUT' | 'SYNC' | 'ROLLBACK' | 'ADJUSTMENT';
export type GameTransferStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED' | 'CANCELLED';
export type WebhookLogStatus = 'RECEIVED' | 'PROCESSED' | 'FAILED' | 'DUPLICATE' | 'IGNORED' | 'RESOLVED';

export type GameProviderModel = {
  id: string;
  name: string;
  code: string;
  logoUrl?: string | null;
  status: GameProviderStatus;
  walletMode: GameProviderWalletMode;
  currency: string;
  timezone: string;
  sortOrder: number;
  metadata?: Record<string, unknown> | null;
};
export type GameProviderEndpointModel = {
  id: string;
  providerId: string;
  type: GameProviderEndpointType;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  timeoutMs: number;
  retryCount: number;
  isEnabled: boolean;
};
export type GameProviderCredentialModel = {
  id: string;
  providerId: string;
  type: GameProviderCredentialType;
  maskedValue: string;
  isEnabled: boolean;
  rotatedAt?: string | null;
};
export type GameModel = {
  id: string;
  providerId: string;
  providerGameCode: string;
  name: string;
  category: string;
  status: GameStatus;
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
  sortOrder: number;
  metadata?: Record<string, unknown> | null;
};
export type GameMediaModel = {
  id: string;
  gameId?: string | null;
  providerId?: string | null;
  type: GameMediaType;
  sourceUrl?: string | null;
  cachedUrl?: string | null;
  status: GameMediaStatus;
  isOverride: boolean;
};
export type GameSessionModel = {
  id: string;
  userId: string;
  providerId: string;
  gameId: string;
  status: GameSessionStatus;
  launchUrl?: string | null;
  providerSessionId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};
export type GameTransferModel = {
  id: string;
  userId: string;
  providerId: string;
  sessionId?: string | null;
  type: GameTransferType;
  status: GameTransferStatus;
  amount: string;
  currency: string;
  idempotencyKey: string;
  providerTransactionId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
};
export type ProviderWalletSnapshotModel = {
  id: string;
  userId: string;
  providerId: string;
  systemBalance: string;
  providerBalance: string;
  difference: string;
  status: 'MATCHED' | 'MISMATCH' | 'UNKNOWN';
  checkedAt: string;
};
export type WebhookLogModel = {
  id: string;
  providerId: string;
  eventType: string;
  status: WebhookLogStatus;
  signatureValid: boolean;
  idempotencyKey?: string | null;
  providerTransactionId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
};
