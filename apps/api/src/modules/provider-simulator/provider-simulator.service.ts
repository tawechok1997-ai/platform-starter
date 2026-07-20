import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { WalletService } from '../wallet/wallet.service';

type TransferResult = {
  providerTransactionId: string;
  beforeBalance: string;
  afterBalance: string;
  status: 'SUCCESS';
  replayed?: boolean;
};

type GameTransactionKind = 'BET' | 'WIN' | 'REFUND' | 'ROLLBACK';

const GAME_CATALOG = [
  { code: 'fortune-tiger', name: 'Fortune Tiger', category: 'slot', accent: '#f59e0b', symbol: '虎' },
  { code: 'dragon-reels', name: 'Dragon Reels', category: 'slot', accent: '#ef4444', symbol: '龍' },
  { code: 'royal-baccarat', name: 'Royal Baccarat', category: 'casino', accent: '#8b5cf6', symbol: 'B' },
  { code: 'speed-roulette', name: 'Speed Roulette', category: 'casino', accent: '#10b981', symbol: 'R' },
  { code: 'golden-mines', name: 'Golden Mines', category: 'slot', accent: '#eab308', symbol: '⛏' },
  { code: 'ocean-treasure', name: 'Ocean Treasure', category: 'arcade', accent: '#0ea5e9', symbol: '⚓' },
  { code: 'neon-racer', name: 'Neon Racer', category: 'arcade', accent: '#ec4899', symbol: 'N' },
  { code: 'classic-blackjack', name: 'Classic Blackjack', category: 'casino', accent: '#334155', symbol: '21' },
] as const;

@Injectable()
export class ProviderSimulatorService {
  constructor(private readonly walletService: WalletService) {}

  verifyRequest(headers: Record<string, string | string[] | undefined>, body: unknown) {
    const apiKey = this.header(headers, 'x-api-key');
    const merchantId = this.header(headers, 'x-merchant-id');
    const timestamp = this.header(headers, 'x-timestamp');
    const signature = this.header(headers, 'x-signature');

    const expectedApiKey = process.env.PROVIDER_SIMULATOR_API_KEY ?? 'simulator-api-key';
    const expectedMerchantId = process.env.PROVIDER_SIMULATOR_MERCHANT_ID ?? 'simulator-merchant';
    const secret = process.env.PROVIDER_SIMULATOR_SECRET ?? 'simulator-secret';

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
    return { status: 'ONLINE', provider: 'platform-provider-simulator', version: 2, walletSource: 'platform-wallet' };
  }

  launch(input: Record<string, unknown>) {
    const userId = this.requiredString(input.userId, 'userId');
    const gameCode = this.requiredString(input.gameCode, 'gameCode');
    const sessionId = this.requiredString(input.sessionId, 'sessionId');
    if (!GAME_CATALOG.some((game) => game.code === gameCode)) {
      throw new BadRequestException('Unknown simulator game code');
    }

    const memberBaseUrl = (process.env.MEMBER_WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    return {
      launchUrl: `${memberBaseUrl}/games/demo-launch?game=${encodeURIComponent(gameCode)}&session=${encodeURIComponent(sessionId)}&provider=provider-simulator`,
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
    const result = await this.walletService.mutateGameBalance({
      userId,
      amount,
      direction: direction === 'TRANSFER_IN' ? 'DEBIT' : 'CREDIT',
      idempotencyKey: `transfer:${direction}:${idempotencyKey}`,
      referenceType: direction === 'TRANSFER_IN' ? 'game_transfer_in' : 'game_transfer_out',
      referenceId: providerTransactionId,
      currency: String(input.currency ?? 'THB'),
      metadata: {
        provider: 'provider-simulator',
        providerTransactionId,
        transferDirection: direction,
      },
    });
    return this.toTransferResult(providerTransactionId, result.ledger, result.replayed);
  }

  async gameTransaction(kind: GameTransactionKind, input: Record<string, unknown>): Promise<TransferResult> {
    const userId = this.requiredString(input.userId, 'userId');
    const transactionId = this.requiredString(input.transactionId ?? input.idempotencyKey, 'transactionId');
    const roundId = this.requiredString(input.roundId, 'roundId');
    const gameCode = this.requiredString(input.gameCode, 'gameCode');
    const amount = this.requiredAmount(input.amount);
    if (!GAME_CATALOG.some((game) => game.code === gameCode)) throw new BadRequestException('Unknown simulator game code');

    const providerTransactionId = `sim_${kind.toLowerCase()}_${transactionId}`;
    const credit = kind === 'WIN' || kind === 'REFUND' || kind === 'ROLLBACK';
    const result = await this.walletService.mutateGameBalance({
      userId,
      amount,
      direction: credit ? 'CREDIT' : 'DEBIT',
      idempotencyKey: `${kind.toLowerCase()}:${transactionId}`,
      referenceType: `game_${kind.toLowerCase()}`,
      referenceId: providerTransactionId,
      currency: String(input.currency ?? 'THB'),
      isReversal: kind === 'REFUND' || kind === 'ROLLBACK',
      metadata: {
        provider: 'provider-simulator',
        providerTransactionId,
        roundId,
        gameCode,
        sessionId: typeof input.sessionId === 'string' ? input.sessionId : null,
        transactionKind: kind,
      },
    });
    return this.toTransferResult(providerTransactionId, result.ledger, result.replayed);
  }

  games(publicBaseUrl: string) {
    const baseUrl = publicBaseUrl.replace(/\/$/, '');
    return {
      items: GAME_CATALOG.map((game) => ({
        providerGameCode: game.code,
        code: game.code,
        name: game.name,
        category: game.category,
        status: 'ACTIVE',
        imageUrl: `${baseUrl}/provider-simulator/icons/${game.code}.svg`,
        iconUrl: `${baseUrl}/provider-simulator/icons/${game.code}.svg`,
        rawPayload: { simulator: true, version: 2 },
      })),
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

  private toTransferResult(providerTransactionId: string, ledger: any, replayed: boolean): TransferResult {
    return {
      providerTransactionId,
      beforeBalance: ledger.balanceBefore,
      afterBalance: ledger.balanceAfter,
      status: 'SUCCESS',
      replayed,
    };
  }

  private requiredAmount(value: unknown) {
    const amount = String(value ?? '').trim();
    if (!amount || !/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
      throw new BadRequestException('Amount must be greater than zero with at most two decimal places');
    }
    return amount;
  }

  private requiredString(value: unknown, field: string) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`${field} is required`);
    }
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
