import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { SimulatorManualReviewInput } from './provider-simulator-manual-review.service';

export type SimulatorMemberSlotLaunchInput = {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
};

const DEMO_PROVIDER_CODE = 'simulator-provider';
const DEMO_GAME_CODE = 'demo-slot-001';
const DEMO_GAME_IMAGE_URL = '/assets/demo-slot/demo-fortune-slot.svg';
const DEMO_PROVIDER_LOGO_URL = '/assets/demo-slot/simulator-provider-logo.svg';
const DEMO_PROVIDER_CARD_URL = '/assets/demo-slot/simulator-provider-card.svg';

@Injectable()
export class ProviderSimulatorPersistenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async reserveNonce(merchantId: string, nonce: string, requestTimestamp: Date, expiresAt: Date) {
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`DELETE FROM "provider_simulator_nonces" WHERE "expires_at" < CURRENT_TIMESTAMP`;
      await tx.$executeRaw`
        INSERT INTO "provider_simulator_nonces" ("merchant_id", "nonce", "request_timestamp", "expires_at")
        VALUES (${merchantId}, ${nonce}, ${requestTimestamp}, ${expiresAt})
      `;
    });
  }

  async createManualReview(input: SimulatorManualReviewInput) {
    const metadata = JSON.stringify(input.metadata ?? {});
    const rows = await this.prisma.$queryRaw<Array<{ id: string; status: string; createdAt: Date }>>`
      INSERT INTO "game_round_manual_reviews" (
        "provider_code", "user_id", "external_round_id", "game_code", "operation",
        "provider_transaction_id", "original_provider_transaction_id", "amount",
        "currency", "reason", "metadata"
      ) VALUES (
        ${input.providerCode}, ${input.userId}::uuid, ${input.roundId}, ${input.gameCode}, ${input.operation},
        ${input.providerTransactionId}, ${input.originalProviderTransactionId ?? null}, ${input.amount}::decimal,
        ${input.currency}, ${input.reason}, ${metadata}::jsonb
      )
      ON CONFLICT ("provider_code", "provider_transaction_id")
      DO UPDATE SET "updated_at" = CURRENT_TIMESTAMP
      RETURNING "id", "status", "created_at" AS "createdAt"
    `;
    return rows[0] ?? null;
  }

  async launchMemberSlot(input: SimulatorMemberSlotLaunchInput) {
    return this.prisma.$transaction(async (tx) => {
      const providerMetadata = {
        environment: 'DEMO',
        launchEnabled: true,
        seamlessWalletEnabled: true,
        realMoneyEnabled: false,
        externalProviderCallbackEnabled: false,
        source: 'member-slot-simulator',
        logoUrl: DEMO_PROVIDER_LOGO_URL,
        mobileLogoUrl: DEMO_PROVIDER_LOGO_URL,
        pcLogoUrl: DEMO_PROVIDER_LOGO_URL,
        mobileCardUrl: DEMO_PROVIDER_CARD_URL,
        pcCardUrl: DEMO_PROVIDER_CARD_URL,
      };
      const provider = await tx.gameProvider.upsert({
        where: { code: DEMO_PROVIDER_CODE },
        update: {
          name: 'Simulator Provider',
          logoUrl: DEMO_PROVIDER_LOGO_URL,
          status: 'ACTIVE',
          walletMode: 'SEAMLESS',
          currency: 'THB',
          timezone: 'Asia/Bangkok',
          metadata: providerMetadata,
        },
        create: {
          name: 'Simulator Provider',
          code: DEMO_PROVIDER_CODE,
          logoUrl: DEMO_PROVIDER_LOGO_URL,
          status: 'ACTIVE',
          walletMode: 'SEAMLESS',
          currency: 'THB',
          timezone: 'Asia/Bangkok',
          sortOrder: 1,
          metadata: providerMetadata,
        },
      });

      const gameMetadata = {
        source: 'member-slot-simulator',
        launchReady: true,
        platform: 'both',
        realMoneyEnabled: false,
        imageUrl: DEMO_GAME_IMAGE_URL,
        mobileImageUrl: DEMO_GAME_IMAGE_URL,
        pcImageUrl: DEMO_GAME_IMAGE_URL,
      };
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
          metadata: gameMetadata,
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
          metadata: gameMetadata,
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
  }

  findMemberSlotSession(userId: string, sessionId: string) {
    return this.prisma.gameSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        game: { select: { providerGameCode: true, name: true, category: true, status: true } },
        provider: { select: { code: true, name: true, currency: true, status: true } },
      },
    });
  }

  markMemberSlotSessionActive(userId: string, sessionId: string) {
    return this.prisma.gameSession.updateMany({
      where: { id: sessionId, userId, status: 'LAUNCHED' },
      data: { status: 'ACTIVE' },
    });
  }
}
