import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { WalletService } from '../wallet/wallet.service';
import { assetUrl, GAME_CATALOG, PROVIDER_DISPLAY_NAMES, type SimulatorGamePlatform } from './provider-simulator-catalog';
import { ProviderSimulatorRoundService } from './provider-simulator-round.service';

type TransferResult = {
  providerTransactionId: string;
  beforeBalance: string;
  afterBalance: string;
  status: 'SUCCESS';
  replayed?: boolean;
};

type GameTransactionKind = 'BET' | 'WIN' | 'REFUND' | 'ROLLBACK';
type RollbackTarget = 'BET' | 'WIN';
type GameOperation = 'BET' | 'WIN' | 'REFUND' | 'ROLLBACK_BET' | 'ROLLBACK_WIN';
type GameCatalogQuery = {
  provider?: string;
  platform?: SimulatorGamePlatform;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'name-asc' | 'name-desc' | 'code-asc' | 'code-desc';
};

@Injectable()
export class ProviderSimulatorService {
  constructor(
    private readonly walletService: WalletService,
    private readonly roundService: ProviderSimulatorRoundService,
  ) {}

  verifyRequest(headers: Record<string, string | string[] | undefined>, body: unknown) {
    const apiKey = this.header(headers, 'x-api-key');
    const merchantId = this.header(headers, 'x-merchant-id');
    const timestamp = this.header(headers, 'x-timestamp');
    const signature = this.header(headers, 'x-signature');

    const expectedApiKey = this.requiredCredential('PROVIDER_SIMULATOR_API_KEY', 'simulator-api-key');
    const expectedMerchantId = this.requiredCredential('PROVIDER_SIMULATOR_MERCHANT_ID', 'simulator-merchant');
    const secret = this.requiredCredential('PROVIDER_SIMULATOR_SECRET', 'simulator-secret');

    if (apiKey !== expectedApiKey || merchantId !== expectedMerchantId) {
      throw new UnauthorizedException('Invalid simulator provider credentials');
    }

    const timestampValue = Date.parse(timestamp);
    if (!timestamp || !Number.isFinite(timestampValue) || Math.abs(Date.now() - timestampValue) > 5 * 60_000) {
      throw new UnauthorizedException('Simulator request timestamp is expired or invalid');
    }

    const expected = createHmac('sha256', secret)
      .update(`${timestamp}.${JSON.stringify(body)}`)
      .digest('hex');
    const actualBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const valid = actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);

    if (!valid) throw new UnauthorizedException('Invalid simulator provider signature');
  }

  health() {
    const mobileAssetCount = GAME_CATALOG.filter((game) => game.platform === 'mobile' && game.assetPath).length;
    return {
      status: 'ONLINE',
      provider: 'platform-provider-simulator',
      version: 7,
      walletSource: 'platform-wallet',
      roundLock: 'postgres-advisory-xact-lock',
      catalogSource: 'repository-assets',
      transactionSemantics: 'source-validated-refund-and-rollback',
      mobileAssetCount,
    };
  }

  launch(input: Record<string, unknown>) {
    const userId = this.requiredString(input.userId, 'userId');
    const gameCode = this.requiredString(input.gameCode, 'gameCode');
    const sessionId = this.requiredString(input.sessionId, 'sessionId');
    const game = GAME_CATALOG.find((item) => item.code === gameCode);
    if (!game) throw new BadRequestException('Unknown simulator game code');

    const memberBaseUrl = (process.env.MEMBER_WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    return {
      success: true,
      game: { code: game.code, name: game.name, provider: game.provider, platform: game.platform },
      launchUrl: `${memberBaseUrl}/games/demo-launch?game=${encodeURIComponent(gameCode)}&session=${encodeURIComponent(sessionId)}&provider=${encodeURIComponent(game.provider)}`,
      providerSessionId: `sim_${userId}_${sessionId}`,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    };
  }

  async getBalance(input: Record<string, unknown>) {
    const userId = this.requiredString(input.providerUserId ?? input.userId, 'userId');
    const wallet = await this.walletService.getMemberWallet(userId);
    return { balance: wallet.balance, currency: wallet.currency, providerUserId: userId };
  }

  async transfer(direction: 'TRANSFER_IN' | 'TRANSFER_OUT', input: Record<string, unknown>): Promise<TransferResult> {
    const userId = this.requiredString(input.userId, 'userId');
    const idempotencyKey = this.requiredString(input.idempotencyKey, 'idempotencyKey');
    const amount = this.requiredAmount(input.amount);
    const providerTransactionId = `sim_${direction.toLowerCase()}_${idempotencyKey}`;
    const payloadHash = this.payloadHash({ direction, userId, idempotencyKey, amount, currency: String(input.currency ?? 'THB') });
    const result = await this.walletService.mutateGameBalance({
      userId,
      amount,
      direction: direction === 'TRANSFER_IN' ? 'DEBIT' : 'CREDIT',
      idempotencyKey: `transfer:${direction}:${idempotencyKey}`,
      referenceType: direction === 'TRANSFER_IN' ? 'game_transfer_in' : 'game_transfer_out',
      referenceId: providerTransactionId,
      currency: String(input.currency ?? 'THB'),
      metadata: { provider: 'provider-simulator', providerTransactionId, transferDirection: direction, payloadHash },
    });
    return this.toTransferResult(providerTransactionId, result.ledger, result.replayed);
  }

  async gameTransaction(kind: GameTransactionKind, input: Record<string, unknown>): Promise<TransferResult> {
    const userId = this.requiredString(input.userId, 'userId');
    const transactionId = this.requiredString(input.transactionId ?? input.idempotencyKey, 'transactionId');
    const roundId = this.requiredString(input.roundId, 'roundId');
    const gameCode = this.requiredString(input.gameCode, 'gameCode');
    const amount = this.requiredAmount(input.amount);
    const currency = String(input.currency ?? 'THB');
    const game = GAME_CATALOG.find((item) => item.code === gameCode);
    if (!game) throw new BadRequestException('Unknown simulator game code');

    const originalTransactionId = kind === 'REFUND' || kind === 'ROLLBACK'
      ? this.requiredString(input.originalTransactionId, 'originalTransactionId')
      : null;
    const rollbackTarget = kind === 'ROLLBACK'
      ? this.requiredRollbackTarget(input.rollbackTarget)
      : null;
    const operation = this.resolveGameOperation(kind, rollbackTarget);
    const direction = operation === 'BET' || operation === 'ROLLBACK_WIN' ? 'DEBIT' : 'CREDIT';
    const providerTransactionId = `sim_${operation.toLowerCase()}_${transactionId}`;
    const roundInput = { userId, roundId, gameCode, transactionId };
    const payloadHash = this.payloadHash({
      operation,
      userId,
      transactionId,
      originalTransactionId,
      rollbackTarget,
      roundId,
      gameCode,
      amount,
      currency,
      sessionId: typeof input.sessionId === 'string' ? input.sessionId : null,
    });

    const result = await this.walletService.mutateGameBalance({
      userId,
      amount,
      direction,
      idempotencyKey: `${operation.toLowerCase()}:${transactionId}`,
      referenceType: `game_${operation.toLowerCase()}`,
      referenceId: providerTransactionId,
      currency,
      isReversal: operation === 'REFUND' || operation.startsWith('ROLLBACK_'),
      concurrencyKey: `provider-simulator:${userId}:${gameCode}:${roundId}`,
      beforeMutation: async (tx) => {
        await this.validateOriginalTransaction(tx, {
          userId,
          roundId,
          gameCode,
          operation,
          originalTransactionId,
          amount,
        });
        await this.roundService.enforceInTransaction(tx, kind, roundInput);
      },
      metadata: {
        provider: game.provider,
        providerTransactionId,
        transactionId,
        originalTransactionId,
        rollbackTarget,
        roundId,
        gameCode,
        platform: game.platform,
        sessionId: typeof input.sessionId === 'string' ? input.sessionId : null,
        transactionKind: kind,
        gameOperation: operation,
        payloadHash,
      },
    });
    return this.toTransferResult(providerTransactionId, result.ledger, result.replayed);
  }

  games(publicBaseUrl: string, query: GameCatalogQuery = {}) {
    const baseUrl = publicBaseUrl.replace(/\/$/, '');
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 30)));
    const provider = query.provider?.trim().toLowerCase();
    const platform = query.platform?.trim().toLowerCase();
    const category = query.category?.trim().toLowerCase();
    const search = query.search?.trim().toLowerCase();

    let filtered = GAME_CATALOG.filter((game) => {
      if (provider && game.provider !== provider) return false;
      if (platform && game.platform !== platform) return false;
      if (category && game.category !== category) return false;
      if (search && !`${game.code} ${game.name} ${game.provider} ${game.category}`.toLowerCase().includes(search)) return false;
      return true;
    });

    const sort = query.sort ?? 'name-asc';
    filtered = [...filtered].sort((left, right) => {
      const leftValue = sort.startsWith('code') ? left.code : left.name;
      const rightValue = sort.startsWith('code') ? right.code : right.name;
      const comparison = leftValue.localeCompare(rightValue);
      return sort.endsWith('desc') ? -comparison : comparison;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit).map((game) => {
      const repositoryImage = assetUrl(game.assetPath, baseUrl);
      const repositoryProviderLogo = assetUrl(game.providerLogoPath, baseUrl);
      const fallbackIcon = `${baseUrl}/provider-simulator/icons/${game.code}.svg`;
      return {
        id: `${game.provider}:${game.code}:${game.platform}`,
        providerGameCode: game.code,
        code: game.code,
        name: game.name,
        providerId: game.provider,
        provider: game.provider,
        providerName: PROVIDER_DISPLAY_NAMES[game.provider] ?? game.provider,
        providerLogoUrl: repositoryProviderLogo,
        platform: game.platform,
        category: game.category,
        status: 'ACTIVE',
        enabled: true,
        imageUrl: repositoryImage ?? fallbackIcon,
        iconUrl: repositoryImage ?? fallbackIcon,
        fallbackIconUrl: fallbackIcon,
        rawPayload: { simulator: true, version: 7, assetSource: repositoryImage ? 'repository' : 'generated-svg' },
      };
    });

    return {
      success: true,
      items,
      data: items,
      filters: {
        providers: [...new Set(GAME_CATALOG.map((game) => game.provider))],
        platforms: [...new Set(GAME_CATALOG.map((game) => game.platform))],
        categories: [...new Set(GAME_CATALOG.map((game) => game.category))],
      },
      pagination: { page, limit, total, totalPages },
    };
  }

  async betHistory(input: Record<string, unknown>) {
    const userId = this.requiredString(input.userId, 'userId');
    const ledger = await this.walletService.getMemberLedger(userId, 100);
    const items = ledger.items.filter((item: any) => String(item.referenceType ?? '').startsWith('game_'));
    return { items, nextCursor: null };
  }

  icon(gameCode: string) {
    const normalized = gameCode.replace(/\.svg$/i, '');
    const game = GAME_CATALOG.find((item) => item.code === normalized);
    if (!game) throw new BadRequestException('Unknown simulator game icon');
    const name = this.escapeXml(game.name);
    const symbol = this.escapeXml(game.symbol);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="${name}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${game.accent}"/><stop offset="1" stop-color="#111827"/></linearGradient></defs><rect width="512" height="512" rx="96" fill="url(#g)"/><circle cx="256" cy="218" r="126" fill="rgba(255,255,255,.14)"/><text x="256" y="270" text-anchor="middle" font-family="Arial,sans-serif" font-size="132" font-weight="700" fill="white">${symbol}</text><text x="256" y="424" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="600" fill="white">${name}</text></svg>`;
  }

  reset() {
    return { reset: false, reason: 'Simulator now uses the persistent platform wallet; use an audited admin wallet adjustment to reset credit.' };
  }

  private async validateOriginalTransaction(
    tx: Prisma.TransactionClient,
    input: {
      userId: string;
      roundId: string;
      gameCode: string;
      operation: GameOperation;
      originalTransactionId: string | null;
      amount: string;
    },
  ) {
    if (!input.originalTransactionId || !['REFUND', 'ROLLBACK_BET', 'ROLLBACK_WIN'].includes(input.operation)) return;

    const sourceReferenceType = input.operation === 'ROLLBACK_WIN' ? 'game_win' : 'game_bet';
    const candidates = await tx.walletLedger.findMany({
      where: { userId: input.userId, referenceType: sourceReferenceType },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const source = candidates.find((ledger) => {
      const metadata = this.metadataRecord(ledger.metadata);
      return metadata.transactionId === input.originalTransactionId
        && metadata.roundId === input.roundId
        && metadata.gameCode === input.gameCode;
    });
    if (!source) {
      throw new BadRequestException(`Original ${sourceReferenceType === 'game_win' ? 'win' : 'bet'} transaction was not found for this user, game and round`);
    }

    if (Number(input.amount) > Number(source.amount.toString())) {
      throw new BadRequestException('Refund or rollback amount cannot exceed the original transaction amount');
    }

    if (input.operation === 'REFUND') {
      const refunds = await tx.walletLedger.findMany({
        where: { userId: input.userId, referenceType: 'game_refund' },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });
      const refundedAmount = refunds.reduce((total, ledger) => {
        const metadata = this.metadataRecord(ledger.metadata);
        return metadata.originalTransactionId === input.originalTransactionId
          ? total + Number(ledger.amount.toString())
          : total;
      }, 0);
      if (refundedAmount + Number(input.amount) > Number(source.amount.toString())) {
        throw new BadRequestException('Cumulative refund amount cannot exceed the original bet amount');
      }
    }
  }

  private resolveGameOperation(kind: GameTransactionKind, rollbackTarget: RollbackTarget | null): GameOperation {
    if (kind === 'ROLLBACK') return rollbackTarget === 'WIN' ? 'ROLLBACK_WIN' : 'ROLLBACK_BET';
    return kind;
  }

  private payloadHash(payload: Record<string, unknown>) {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  private metadataRecord(metadata: unknown): Record<string, unknown> {
    return metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? metadata as Record<string, unknown>
      : {};
  }

  private requiredRollbackTarget(value: unknown): RollbackTarget {
    const target = this.requiredString(value, 'rollbackTarget').toUpperCase();
    if (target !== 'BET' && target !== 'WIN') throw new BadRequestException('rollbackTarget must be BET or WIN');
    return target;
  }

  private requiredCredential(name: string, developmentFallback: string) {
    const configured = process.env[name]?.trim();
    if (configured) return configured;
    const environment = (process.env.NODE_ENV ?? 'development').trim().toLowerCase();
    if (environment === 'development' || environment === 'test') return developmentFallback;
    throw new UnauthorizedException(`${name} must be configured outside development and test environments`);
  }

  private toTransferResult(providerTransactionId: string, ledger: any, replayed: boolean): TransferResult {
    return { providerTransactionId, beforeBalance: ledger.balanceBefore, afterBalance: ledger.balanceAfter, status: 'SUCCESS', replayed };
  }

  private requiredAmount(value: unknown) {
    const amount = String(value ?? '').trim();
    if (!amount || !/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
      throw new BadRequestException('Amount must be greater than zero with at most two decimal places');
    }
    return amount;
  }

  private requiredString(value: unknown, field: string) {
    if (typeof value !== 'string' || value.trim().length === 0) throw new BadRequestException(`${field} is required`);
    return value.trim();
  }

  private header(headers: Record<string, string | string[] | undefined>, key: string) {
    const value = headers[key];
    return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
  }

  private escapeXml(value: string) {
    return value.replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char] ?? char);
  }
}
