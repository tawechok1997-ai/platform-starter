import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

type ProviderBalance = { balance: number; currency: string };
type TransferResult = {
  providerTransactionId: string;
  beforeBalance: string;
  afterBalance: string;
  status: 'SUCCESS';
};
type TransferRecord = TransferResult & {
  direction: 'TRANSFER_IN' | 'TRANSFER_OUT';
  userId: string;
  amount: string;
  idempotencyKey: string;
  createdAt: string;
};

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
  private readonly balances = new Map<string, ProviderBalance>();
  private readonly transfers = new Map<string, TransferRecord>();

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
    const valid =
      actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);

    if (!valid) throw new UnauthorizedException('Invalid simulator provider signature');
  }

  health() {
    return { status: 'ONLINE', provider: 'platform-provider-simulator', version: 1 };
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

  getBalance(input: Record<string, unknown>) {
    const userId = this.requiredString(input.providerUserId ?? input.userId, 'userId');
    const wallet = this.readWallet(userId, String(input.currency ?? 'THB'));
    return { balance: wallet.balance.toFixed(2), currency: wallet.currency, providerUserId: userId };
  }

  transfer(direction: 'TRANSFER_IN' | 'TRANSFER_OUT', input: Record<string, unknown>): TransferResult {
    const userId = this.requiredString(input.userId, 'userId');
    const idempotencyKey = this.requiredString(input.idempotencyKey, 'idempotencyKey');
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Amount must be greater than zero');

    const transferKey = `${direction}:${idempotencyKey}`;
    const existing = this.transfers.get(transferKey);
    if (existing) {
      if (existing.userId !== userId || Number(existing.amount) !== amount) {
        throw new BadRequestException('Idempotency key was already used with different transfer data');
      }
      return this.toTransferResult(existing);
    }

    const wallet = this.readWallet(userId, String(input.currency ?? 'THB'));
    const beforeBalance = wallet.balance;
    if (direction === 'TRANSFER_OUT' && amount > beforeBalance) {
      throw new BadRequestException(`Insufficient provider balance; available ${beforeBalance.toFixed(2)}`);
    }

    wallet.balance = Number((direction === 'TRANSFER_IN' ? beforeBalance + amount : beforeBalance - amount).toFixed(2));
    const record: TransferRecord = {
      providerTransactionId: `sim_${direction.toLowerCase()}_${idempotencyKey}`,
      beforeBalance: beforeBalance.toFixed(2),
      afterBalance: wallet.balance.toFixed(2),
      status: 'SUCCESS',
      direction,
      userId,
      amount: amount.toFixed(2),
      idempotencyKey,
      createdAt: new Date().toISOString(),
    };
    this.transfers.set(transferKey, record);
    return this.toTransferResult(record);
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
        rawPayload: { simulator: true, version: 1 },
      })),
    };
  }

  betHistory(input: Record<string, unknown>) {
    const userId = this.requiredString(input.userId, 'userId');
    const items = Array.from(this.transfers.values())
      .filter((record) => record.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
    this.balances.clear();
    this.transfers.clear();
    return { reset: true };
  }

  private readWallet(userId: string, currency: string) {
    const existing = this.balances.get(userId);
    if (existing) return existing;
    const wallet = { balance: 0, currency };
    this.balances.set(userId, wallet);
    return wallet;
  }

  private toTransferResult(record: TransferRecord): TransferResult {
    return {
      providerTransactionId: record.providerTransactionId,
      beforeBalance: record.beforeBalance,
      afterBalance: record.afterBalance,
      status: record.status,
    };
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
    return value.replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char] ?? char);
  }
}
