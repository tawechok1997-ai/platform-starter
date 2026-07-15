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

function providerError<T>(context: ProviderAdapterContext, errorCode: string, errorMessage: string): ProviderAdapterResult<T> {
  return { ok: false, providerCode: context.providerCode, requestId: `${context.providerCode}_${Date.now()}`, errorCode, errorMessage };
}

function providerOk<T>(context: ProviderAdapterContext, payload: T, rawRequest?: unknown, rawResponse?: unknown): ProviderAdapterResult<T> {
  return { ok: true, providerCode: context.providerCode, requestId: `${context.providerCode}_${Date.now()}`, payload, rawRequest, rawResponse };
}

// Copy this template into a concrete adapter file, then register it in ProviderAdapterRegistry.
// Keep this file as documentation/template only. Do not register it directly.
class RealProviderAdapterTemplate implements GameProviderAdapter {
  async healthCheck(context: ProviderAdapterContext): Promise<ProviderAdapterResult<{ status: 'ONLINE' | 'OFFLINE' | 'DEGRADED'; latencyMs?: number }>> {
    try {
      // TODO: call provider health endpoint with timeout and safe error mapping.
      return providerOk(context, { status: 'DEGRADED', latencyMs: 0 });
    } catch (_error) {
      return providerError(context, 'HEALTH_CHECK_FAILED', 'Provider health check failed');
    }
  }

  async launchGame(context: ProviderAdapterContext, _input: LaunchGameInput): Promise<ProviderAdapterResult<LaunchGameOutput>> {
    try {
      // TODO: call provider launch endpoint.
      // Required output: launchUrl and providerSessionId.
      return providerError(context, 'NOT_IMPLEMENTED', 'Real provider launch is not implemented');
    } catch (_error) {
      return providerError(context, 'LAUNCH_FAILED', 'Provider launch failed');
    }
  }

  async getBalance(context: ProviderAdapterContext, _input: BalanceInput): Promise<ProviderAdapterResult<BalanceOutput>> {
    try {
      // TODO: call provider balance endpoint and normalize decimal string.
      return providerError(context, 'NOT_IMPLEMENTED', 'Real provider balance is not implemented');
    } catch (_error) {
      return providerError(context, 'BALANCE_FAILED', 'Provider balance failed');
    }
  }

  async transferIn(context: ProviderAdapterContext, _input: TransferInput): Promise<ProviderAdapterResult<TransferOutput>> {
    try {
      // TODO: call provider transfer-in endpoint. Must be idempotent.
      return providerError(context, 'NOT_IMPLEMENTED', 'Real provider transfer-in is not implemented');
    } catch (_error) {
      return providerError(context, 'TRANSFER_IN_FAILED', 'Provider transfer-in failed');
    }
  }

  async transferOut(context: ProviderAdapterContext, _input: TransferInput): Promise<ProviderAdapterResult<TransferOutput>> {
    try {
      // TODO: call provider transfer-out endpoint. Must be idempotent.
      return providerError(context, 'NOT_IMPLEMENTED', 'Real provider transfer-out is not implemented');
    } catch (_error) {
      return providerError(context, 'TRANSFER_OUT_FAILED', 'Provider transfer-out failed');
    }
  }

  async syncGames(context: ProviderAdapterContext): Promise<ProviderAdapterResult<ProviderGamePayload[]>> {
    try {
      // TODO: call provider game list endpoint and normalize games/media.
      return providerError(context, 'NOT_IMPLEMENTED', 'Real provider game sync is not implemented');
    } catch (_error) {
      return providerError(context, 'SYNC_GAMES_FAILED', 'Provider game sync failed');
    }
  }

  async getBetHistory(context: ProviderAdapterContext, _input: BetHistoryInput): Promise<ProviderAdapterResult<BetHistoryOutput>> {
    try {
      // TODO: call provider bet history endpoint for reconciliation/settlement support.
      return providerError(context, 'NOT_IMPLEMENTED', 'Real provider bet history is not implemented');
    } catch (_error) {
      return providerError(context, 'BET_HISTORY_FAILED', 'Provider bet history failed');
    }
  }

  async validateWebhook(_context: ProviderAdapterContext, _headers: Record<string, string | string[] | undefined>, _body: unknown): Promise<WebhookValidationResult> {
    // TODO: validate signature, timestamp tolerance, replay/idempotency headers.
    return { valid: false, reason: 'Real provider webhook validation is not implemented' };
  }

  async parseWebhook(_context: ProviderAdapterContext, _body: unknown): Promise<ParsedWebhookEvent[]> {
    // TODO: normalize provider event type, idempotency key, transaction id, and payload.
    return [];
  }
}
