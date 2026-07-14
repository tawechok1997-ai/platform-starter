import {
  BalanceInput,
  BalanceOutput,
  BetHistoryInput,
  BetHistoryOutput,
  GameProviderAdapter,
  LaunchGameInput,
  LaunchGameOutput,
  ParsedWebhookEvent,
  ProviderAdapterContext,
  ProviderAdapterResult,
  ProviderGamePayload,
  TransferInput,
  TransferOutput,
  WebhookValidationResult,
} from '../provider-adapter.interface';

function requestId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function ok<TPayload>(context: ProviderAdapterContext, prefix: string, payload: TPayload, rawRequest?: unknown): ProviderAdapterResult<TPayload> {
  return {
    ok: true,
    providerCode: context.providerCode,
    requestId: requestId(prefix),
    payload,
    rawRequest,
    rawResponse: { adapter: 'demo-provider', mode: 'safe-mock' },
  };
}

function fail<TPayload>(context: ProviderAdapterContext, prefix: string, errorCode: string, errorMessage: string, rawRequest?: unknown): ProviderAdapterResult<TPayload> {
  return {
    ok: false,
    providerCode: context.providerCode,
    requestId: requestId(prefix),
    errorCode,
    errorMessage,
    rawRequest,
    rawResponse: { adapter: 'demo-provider', mode: 'safe-mock', rejected: true },
  };
}

export class DemoProviderAdapter implements GameProviderAdapter {
  private readonly balances = new Map<string, number>();
  private readonly processedTransfers = new Map<string, ProviderAdapterResult<TransferOutput>>();

  private balanceKey(context: ProviderAdapterContext, userId: string) {
    return `${context.providerCode}:${userId}`;
  }

  private readBalance(context: ProviderAdapterContext, userId: string) {
    return this.balances.get(this.balanceKey(context, userId)) ?? 0;
  }

  private writeBalance(context: ProviderAdapterContext, userId: string, value: number) {
    const normalized = Math.max(0, Number(value.toFixed(2)));
    this.balances.set(this.balanceKey(context, userId), normalized);
    return normalized;
  }

  private transferKey(context: ProviderAdapterContext, direction: 'in' | 'out', input: TransferInput) {
    return `${context.providerCode}:${direction}:${input.idempotencyKey}`;
  }

  async healthCheck(context: ProviderAdapterContext): Promise<ProviderAdapterResult<{ status: 'ONLINE' | 'OFFLINE' | 'DEGRADED'; latencyMs?: number }>> {
    const start = Date.now();
    const hasLaunch = Boolean(context.endpointMap.LAUNCH);
    const hasBalance = Boolean(context.endpointMap.BALANCE);
    const hasApiKey = Boolean(context.credentialMap.API_KEY);
    const status = hasLaunch && hasBalance && hasApiKey ? 'ONLINE' : 'DEGRADED';
    return ok(context, 'demo_health', { status, latencyMs: Math.max(Date.now() - start, 1) }, { endpointCount: Object.keys(context.endpointMap).length, credentialKeys: Object.keys(context.credentialMap) });
  }

  async launchGame(context: ProviderAdapterContext, input: LaunchGameInput): Promise<ProviderAdapterResult<LaunchGameOutput>> {
    const launchUrl = `/games/demo-launch?game=${encodeURIComponent(input.gameCode)}&session=${encodeURIComponent(input.sessionId)}`;
    return ok(context, 'demo_launch', { launchUrl, providerSessionId: `demo_${input.sessionId}`, expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() }, input);
  }

  async getBalance(context: ProviderAdapterContext, input: BalanceInput): Promise<ProviderAdapterResult<BalanceOutput>> {
    const userId = input.providerUserId ?? input.userId;
    const balance = this.readBalance(context, userId);
    return ok(context, 'demo_balance', { balance: balance.toFixed(2), currency: context.currency, providerUserId: userId }, input);
  }

  async transferIn(context: ProviderAdapterContext, input: TransferInput): Promise<ProviderAdapterResult<TransferOutput>> {
    const key = this.transferKey(context, 'in', input);
    const existing = this.processedTransfers.get(key);
    if (existing) return existing;

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      const result = fail<TransferOutput>(context, 'demo_transfer_in', 'INVALID_AMOUNT', 'Transfer amount must be greater than zero', input);
      this.processedTransfers.set(key, result);
      return result;
    }

    const beforeBalance = this.readBalance(context, input.userId);
    const afterBalance = this.writeBalance(context, input.userId, beforeBalance + amount);
    const result = ok(context, 'demo_transfer_in', {
      providerTransactionId: `demo_in_${input.idempotencyKey}`,
      beforeBalance: beforeBalance.toFixed(2),
      afterBalance: afterBalance.toFixed(2),
    }, input);
    this.processedTransfers.set(key, result);
    return result;
  }

  async transferOut(context: ProviderAdapterContext, input: TransferInput): Promise<ProviderAdapterResult<TransferOutput>> {
    const key = this.transferKey(context, 'out', input);
    const existing = this.processedTransfers.get(key);
    if (existing) return existing;

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      const result = fail<TransferOutput>(context, 'demo_transfer_out', 'INVALID_AMOUNT', 'Transfer amount must be greater than zero', input);
      this.processedTransfers.set(key, result);
      return result;
    }

    const beforeBalance = this.readBalance(context, input.userId);
    if (amount > beforeBalance) {
      const result = fail<TransferOutput>(
        context,
        'demo_transfer_out',
        'INSUFFICIENT_PROVIDER_BALANCE',
        `ยอดในเกมไม่พอ ยอดที่ถอนได้ ${beforeBalance.toFixed(2)} ${context.currency}`,
        input,
      );
      this.processedTransfers.set(key, result);
      return result;
    }

    const afterBalance = this.writeBalance(context, input.userId, beforeBalance - amount);
    const result = ok(context, 'demo_transfer_out', {
      providerTransactionId: `demo_out_${input.idempotencyKey}`,
      beforeBalance: beforeBalance.toFixed(2),
      afterBalance: afterBalance.toFixed(2),
    }, input);
    this.processedTransfers.set(key, result);
    return result;
  }

  async syncGames(context: ProviderAdapterContext): Promise<ProviderAdapterResult<ProviderGamePayload[]>> {
    return ok(context, 'demo_sync_games', [
      { providerGameCode: 'demo-slot-001', name: 'Demo Fortune Slot', category: 'slot', status: 'ACTIVE', imageUrl: 'https://placehold.co/600x400?text=Demo+Slot', rawPayload: { demo: true } },
      { providerGameCode: 'demo-casino-001', name: 'Demo Live Table', category: 'casino', status: 'ACTIVE', imageUrl: 'https://placehold.co/600x400?text=Demo+Casino', rawPayload: { demo: true } },
    ]);
  }

  async getBetHistory(context: ProviderAdapterContext, input: BetHistoryInput): Promise<ProviderAdapterResult<BetHistoryOutput>> {
    return ok(context, 'demo_bet_history', { items: [], nextCursor: undefined }, input);
  }

  async validateWebhook(_context: ProviderAdapterContext, _headers: Record<string, string | string[] | undefined>, _body: unknown): Promise<WebhookValidationResult> {
    return { valid: true, reason: 'Demo adapter accepts webhook payloads in safe-mock mode', idempotencyKey: `demo_webhook_${Date.now()}` };
  }

  async parseWebhook(_context: ProviderAdapterContext, body: unknown): Promise<ParsedWebhookEvent[]> {
    return [{ eventType: 'demo.webhook.received', idempotencyKey: `demo_webhook_${Date.now()}`, payload: body }];
  }
}
