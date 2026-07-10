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

export class DemoProviderAdapter implements GameProviderAdapter {
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
    return ok(context, 'demo_balance', { balance: '0.00', currency: context.currency, providerUserId: input.providerUserId ?? input.userId }, input);
  }

  async transferIn(context: ProviderAdapterContext, input: TransferInput): Promise<ProviderAdapterResult<TransferOutput>> {
    return ok(context, 'demo_transfer_in', { providerTransactionId: `demo_in_${input.idempotencyKey}`, beforeBalance: '0.00', afterBalance: input.amount }, input);
  }

  async transferOut(context: ProviderAdapterContext, input: TransferInput): Promise<ProviderAdapterResult<TransferOutput>> {
    return ok(context, 'demo_transfer_out', { providerTransactionId: `demo_out_${input.idempotencyKey}`, beforeBalance: input.amount, afterBalance: '0.00' }, input);
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

  async validateWebhook(context: ProviderAdapterContext, headers: Record<string, string | string[] | undefined>, body: unknown): Promise<WebhookValidationResult> {
    return { valid: true, reason: 'Demo adapter accepts webhook payloads in safe-mock mode', idempotencyKey: `demo_webhook_${Date.now()}` };
  }

  async parseWebhook(context: ProviderAdapterContext, body: unknown): Promise<ParsedWebhookEvent[]> {
    return [{ eventType: 'demo.webhook.received', idempotencyKey: `demo_webhook_${Date.now()}`, payload: body }];
  }
}
