import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const DEMO_GAME_CODE = 'demo-slot-001';
const DEMO_PROVIDER_CODES = ['simulator-provider', 'provider-simulator', 'demo-provider', 'demo-provider-uat'];

@Injectable()
export class ProviderSimulatorSlotRoundRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOwnedSession(userId: string, sessionId: string) {
    return this.prisma.gameSession.findFirst({
      where: {
        id: sessionId,
        userId,
        game: { is: { providerGameCode: DEMO_GAME_CODE } },
        provider: { is: { code: { in: DEMO_PROVIDER_CODES } } },
      },
      include: {
        game: { select: { providerGameCode: true, name: true, category: true, status: true } },
        provider: { select: { code: true, name: true, currency: true, status: true } },
      },
    });
  }

  async listOwnedSessionLedgers(userId: string, sessionId: string) {
    const ledgers = await this.prisma.walletLedger.findMany({
      where: { userId, referenceType: { startsWith: 'game_' } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    return ledgers.filter((ledger) => {
      const metadata = this.metadata(ledger.metadata);
      return metadata.sessionId === sessionId && metadata.gameCode === DEMO_GAME_CODE;
    });
  }

  metadata(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
  }
}
