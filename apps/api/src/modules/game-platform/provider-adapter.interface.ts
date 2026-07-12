import { GameProviderEndpointType, GameProviderWalletMode } from './game-platform.types';

export type ProviderAdapterContext = {
  providerCode: string;
  baseUrl: string;
  walletMode: GameProviderWalletMode;
  currency: string;
  timeoutMs: number;
  endpointMap: Partial<Record<GameProviderEndpointType, string>>;
  credentialMap: Record<string, string>;
};

export type ProviderAdapterResult<TPayload> = {
  ok: boolean;
  providerCode: string;
  requestId: string;
  payload?: TPayload;
  rawRequest?: unknown;
  rawResponse?: unknown;
  errorCode?: string;
  errorMessage?: string;
};

export type LaunchGameInput = {
  userId: string;
  gameCode: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  returnUrl?: string;
};

export type LaunchGameOutput = {
  launchUrl: string;
  providerSessionId?: string;
  expiresAt?: string;
};

export type BalanceInput = { userId: string; providerUserId?: string };
export type BalanceOutput = { balance: string; currency: string; providerUserId?: string };

export type TransferInput = {
  userId: string;
  providerUserId?: string;
  amount: string;
  currency: string;
  idempotencyKey: string;
  sessionId?: string;
};

export type TransferOutput = {
  providerTransactionId: string;
  beforeBalance?: string;
  afterBalance?: string;
};

export type ProviderGamePayload = {
  providerGameCode: string;
  name: string;
  category: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'REMOVED';
  imageUrl?: string;
  iconUrl?: string;
  bannerUrl?: string;
  rawPayload?: unknown;
};

export type BetHistoryInput = { from: string; to: string; cursor?: string };
export type BetHistoryOutput = {
  items: Array<{
    roundId: string;
    userId?: string;
    providerUserId?: string;
    gameCode?: string;
    betAmount: string;
    winAmount: string;
    currency: string;
    settledAt?: string;
    rawPayload?: unknown;
  }>;
  nextCursor?: string;
};

export type WebhookValidationResult = { valid: boolean; reason?: string; idempotencyKey?: string };
export type ParsedWebhookEvent = {
  eventType: string;
  providerTransactionId?: string;
  roundId?: string;
  idempotencyKey?: string;
  payload: unknown;
};

export interface GameProviderAdapter {
  healthCheck(context: ProviderAdapterContext): Promise<ProviderAdapterResult<{ status: 'ONLINE' | 'OFFLINE' | 'DEGRADED'; latencyMs?: number }>>;
  launchGame(context: ProviderAdapterContext, input: LaunchGameInput): Promise<ProviderAdapterResult<LaunchGameOutput>>;
  getBalance(context: ProviderAdapterContext, input: BalanceInput): Promise<ProviderAdapterResult<BalanceOutput>>;
  transferIn(context: ProviderAdapterContext, input: TransferInput): Promise<ProviderAdapterResult<TransferOutput>>;
  transferOut(context: ProviderAdapterContext, input: TransferInput): Promise<ProviderAdapterResult<TransferOutput>>;
  syncGames(context: ProviderAdapterContext): Promise<ProviderAdapterResult<ProviderGamePayload[]>>;
  getBetHistory(context: ProviderAdapterContext, input: BetHistoryInput): Promise<ProviderAdapterResult<BetHistoryOutput>>;
  validateWebhook(context: ProviderAdapterContext, headers: Record<string, string | string[] | undefined>, body: unknown, rawBody?: Buffer): Promise<WebhookValidationResult>;
  parseWebhook(context: ProviderAdapterContext, body: unknown): Promise<ParsedWebhookEvent[]>;
}
