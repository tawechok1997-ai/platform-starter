import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { assertProviderSimulatorAvailable } from './provider-simulator-config';
import { GAME_CATALOG } from './provider-simulator-catalog';
import { ProviderSimulatorTransactionService } from './provider-simulator-transaction.service';

type SlotLaunchInput = {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
};

type SlotSpinInput = {
  userId: string;
  sessionId: string;
  spinId: string;
  amount: number;
};

type SlotSymbol = {
  symbol: string;
  weight: number;
  tripleMultiplier: number;
};

const DEMO_PROVIDER_CODE = 'simulator-provider';
const DEMO_GAME_CODE = 'demo-slot-001';
const SLOT_SYMBOLS: readonly SlotSymbol[] = [
  { symbol: '🍒', weight: 30, tripleMultiplier: 2 },
  { symbol: '🍋', weight: 25, tripleMultiplier: 2 },
  { symbol: '🔔', weight: 18, tripleMultiplier: 4 },
  { symbol: '⭐', weight: 12, tripleMultiplier: 6 },
  { symbol: '7️⃣', weight: 8, tripleMultiplier: 10 },
  { symbol: '💎', weight: 7, tripleMultiplier: 20 },
] as const;

const ALLOWED_SESSION_STATUSES = new Set(['LAUNCHED', 'ACTIVE']);
const ALLOWED_PROVIDER_CODES = new Set([
  'demo-provider',
  'demo-provider-uat',
  DEMO_PROVIDER_CODE,
  'provider-simulator',
]);
const TOTAL_SYMBOL_WEIGHT = SLOT_SYMBOLS.reduce((total, item) => total + item.weight, 0);

@Injectable()
export class ProviderSimulatorSlotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: ProviderSimulatorTransactionService,
  ) {}

  async launch(input: SlotLaunchInput) {
    assertProviderSimulatorAvailable();

    const launched = await this.prisma.$transaction(async (tx) => {
      const provider = await tx.gameProvider.upsert({
        where: { code: DEMO_PROVIDER_CODE },
        update: {
          name: 'Simulator Provider',
          status: 'ACTIVE',
          currency: 'THB',
          timezone: 'Asia/Bangkok',
          metadata: {
            environment: 'DEMO',
            launchEnabled: true,
            seamlessWalletEnabled: true,
            realMoneyEnabled: false,
            externalProviderCallbackEnabled: false,
            source: 'member-slot-simulator',
          },
        },
        create: {
          name: 'Simulator Provider',
          code: DEMO_PROVIDER_CODE,
          status: 'ACTIVE',
          walletMode: 'SEAMLESS',
          currency: 'THB',
          timezone: 'Asia/Bangkok',
          sortOrder: 1,
          metadata: {
            environment: 'DEMO',
            launchEnabled: true,
            seamlessWalletEnabled: true,
            realMoneyEnabled: false,
            externalProviderCallbackEnabled: false,
            source: 'member-slot-simulator',
          },
        },
      });

      const game = await tx.game.upsert({
        where: {
          providerId_providerGameCode: {
            providerId: provider.id,
            providerGameCode: DEMO_GAME_CODE,
          },
        },
        update: {
          name: 'Demo Fortune Slot',
          category: 'slot',
          status: 'ACTIVE',
          isFeatured: true,
          isNew: true,
          isPopular: true,
          sortOrder: 1,
          metadata: {
            source: 'member-slot-simulator',
            launchReady: true,
            platform: 'both',
            realMoneyEnabled: false,
          },
        },
        create: {
          providerId: provider.id,
          providerGameCode: DEMO_GAME_CODE,
          name: 'Demo Fortune Slot',
          category: 'slot',
          status: 'ACTIVE',
          isFeatured: true,
          isNew: true,
          isPopular: true,
          sortOrder: 1,
          metadata: {
            source: 'member-slot-simulator',
            launchReady: true,
            platform: 'both',
            realMoneyEnabled: false,
          },
        },
      });

      const session = await tx.gameSession.create({
        data: {
          userId: input.userId,
          providerId: provider.id,
          gameId: game.id,
          status: 'LAUNCHED',
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          startedAt: new Date(),
        },
      });
      const launchUrl = `/games/demo-launch?game=${encodeURIComponent(DEMO_GAME_CODE)}&session=${encodeURIComponent(session.id)}&provider=${encodeURIComponent(DEMO_PROVIDER_CODE)}`;

      return tx.gameSession.update({
        where: { id: session.id },
        data: {
          launchUrl,
          providerSessionId: `sim_${session.id}`,
        },
        include: {
          game: { select: { id: true, name: true, providerGameCode: true, category: true } },
          provider: { select: { id: true, name: true, code: true, currency: true } },
        },
      });
    });

    return {
      ok: true,
      session: launched,
      launchUrl: launched.launchUrl,
      providerSessionId: launched.providerSessionId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  async spin(input: SlotSpinInput) {
    assertProviderSimulatorAvailable();

    const session = await this.prisma.gameSession.findFirst({
      where: { id: input.sessionId, userId: input.userId },
      include: {
        game: { select: { providerGameCode: true, name: true, category: true, status: true } },
        provider: { select: { code: true, name: true, currency: true, status: true } },
      },
    });

    if (!session) throw new NotFoundException('Game session was not found for this member');
    if (!ALLOWED_SESSION_STATUSES.has(session.status)) {
      throw new BadRequestException('Game session is not active');
    }
    if (session.game.status !== 'ACTIVE' || session.provider.status !== 'ACTIVE') {
      throw new BadRequestException('Demo slot or provider is not active');
    }
    if (session.game.category.trim().toLowerCase() !== 'slot') {
      throw new BadRequestException('This simulator session is not a slot game');
    }

    const providerCode = session.provider.code.trim().toLowerCase();
    const launchPath = this.launchPath(session.launchUrl);
    if (!ALLOWED_PROVIDER_CODES.has(providerCode) || launchPath !== '/games/demo-launch') {
      throw new BadRequestException('This game session is not owned by the slot simulator');
    }

    const gameCode = session.game.providerGameCode.trim();
    const simulatorGame = GAME_CATALOG.find(
      (game) => game.code === gameCode && game.category.trim().toLowerCase() === 'slot',
    );
    if (!simulatorGame) {
      throw new BadRequestException('The demo slot is missing from the provider simulator catalog');
    }

    const amount = Number(input.amount.toFixed(2));
    if (!Number.isFinite(amount) || amount < 1 || amount > 10_000) {
      throw new BadRequestException('Bet amount must be between 1 and 10,000 credits');
    }

    const amountText = amount.toFixed(2);
    const roundId = `slot_${input.spinId}`;
    const betTransactionId = `bet_${input.spinId}`;
    const winTransactionId = `win_${input.spinId}`;
    const symbols = this.reels(input);
    const multiplier = this.multiplier(symbols);
    const winAmount = Number((amount * multiplier).toFixed(2));

    const bet = await this.transactions.gameTransaction('BET', {
      userId: input.userId,
      transactionId: betTransactionId,
      roundId,
      gameCode,
      amount: amountText,
      currency: session.provider.currency,
      sessionId: session.id,
    });

    let win: Awaited<ReturnType<ProviderSimulatorTransactionService['gameTransaction']>> | null = null;
    if (winAmount > 0) {
      try {
        win = await this.transactions.gameTransaction('WIN', {
          userId: input.userId,
          transactionId: winTransactionId,
          roundId,
          gameCode,
          amount: winAmount.toFixed(2),
          currency: session.provider.currency,
          sessionId: session.id,
        });
      } catch (error) {
        try {
          await this.transactions.gameTransaction('REFUND', {
            userId: input.userId,
            transactionId: `refund_${input.spinId}`,
            originalTransactionId: betTransactionId,
            roundId,
            gameCode,
            amount: amountText,
            currency: session.provider.currency,
            sessionId: session.id,
          });
        } catch {
          throw new ServiceUnavailableException(
            'Slot settlement failed and the automatic bet refund also failed; review the wallet ledger',
          );
        }
        throw error;
      }
    }

    if (session.status === 'LAUNCHED') {
      await this.prisma.gameSession.updateMany({
        where: { id: session.id, userId: input.userId, status: 'LAUNCHED' },
        data: { status: 'ACTIVE' },
      });
    }

    const afterBalance = win?.afterBalance ?? bet.afterBalance;
    return {
      ok: true,
      spinId: input.spinId,
      roundId,
      sessionId: session.id,
      game: {
        code: gameCode,
        name: session.game.name,
        provider: session.provider.name,
      },
      result: winAmount > 0 ? 'WIN' : 'LOSS',
      symbols,
      multiplier,
      betAmount: amountText,
      winAmount: winAmount.toFixed(2),
      netAmount: (winAmount - amount).toFixed(2),
      currency: session.provider.currency,
      balance: afterBalance,
      transactions: {
        bet: bet.providerTransactionId,
        win: win?.providerTransactionId ?? null,
      },
      replayed: Boolean(bet.replayed || win?.replayed),
    };
  }

  private reels(input: SlotSpinInput) {
    const secret = process.env.PROVIDER_SIMULATOR_SLOT_SECRET?.trim()
      || process.env.PROVIDER_SIMULATOR_SECRET?.trim()
      || 'provider-simulator-slot-v1';
    const digest = createHmac('sha256', secret)
      .update(`${input.userId}:${input.sessionId}:${input.spinId}`)
      .digest();

    return [0, 1, 2].map((index) => this.symbolForTicket(digest.readUInt16BE(index * 2) % TOTAL_SYMBOL_WEIGHT));
  }

  private symbolForTicket(ticket: number) {
    let cursor = ticket;
    for (const item of SLOT_SYMBOLS) {
      if (cursor < item.weight) return item.symbol;
      cursor -= item.weight;
    }
    return SLOT_SYMBOLS[0].symbol;
  }

  private multiplier(symbols: string[]) {
    const counts = new Map<string, number>();
    symbols.forEach((symbol) => counts.set(symbol, (counts.get(symbol) ?? 0) + 1));
    const triple = SLOT_SYMBOLS.find((item) => counts.get(item.symbol) === 3);
    if (triple) return triple.tripleMultiplier;
    return Array.from(counts.values()).some((count) => count === 2) ? 1.5 : 0;
  }

  private launchPath(rawUrl: string | null) {
    if (!rawUrl) return '';
    try {
      return new URL(rawUrl, 'http://provider-simulator.local').pathname.replace(/\/$/, '');
    } catch {
      return '';
    }
  }
}
