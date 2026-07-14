import type { AdminActor, MemberActor } from '../../common/actors';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import { ProviderAdapterRegistry } from './adapters/provider-adapter.registry';
import { GameProviderEndpointType, GameProviderWalletMode } from './game-platform.types';
import { ProviderAdapterContext } from './provider-adapter.interface';
import { WalletMutationService } from './wallet-mutation.service';

type RequestMeta = { ipAddress?: string; userAgent?: string };
type TransferKind = 'TRANSFER_IN' | 'TRANSFER_OUT';
type ProviderWithAdapterData = {
  code: string;
  walletMode: GameProviderWalletMode;
  currency: string;
  metadata?: unknown;
  endpoints: Array<{ type: GameProviderEndpointType; url: string; timeoutMs: number; isEnabled?: boolean }>;
  credentials: Array<{ type: string; maskedValue: string; encryptedValue?: string; isEnabled?: boolean }>;
};

@Injectable()
export class ProviderTransferCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adapters: ProviderAdapterRegistry,
    private readonly config: ConfigService,
    private readonly wallets: WalletMutationService,
  ) {}

  async transfer(sessionId: string, actor: MemberActor, type: TransferKind, amount: string, meta: RequestMeta = {}) {
    const session = await this.prisma.gameSession.findFirst({
      where: { id: sessionId, userId: actor.id, status: { in: ['LAUNCHED', 'ACTIVE'] } },
      include: {
        provider: {
          include: {
            endpoints: { where: { isEnabled: true }, orderBy: { type: 'asc' } },
            credentials: { where: { isEnabled: true }, orderBy: { type: 'asc' }, select: this.credentialSelect() },
          },
        },
        game: { select: { id: true, name: true, providerGameCode: true } },
      },
    });
    if (!session) throw new NotFoundException('Game session is not available for transfer');
    this.assertSafetyGate(session.provider, type);
    return this.execute({
      userId: actor.id,
      providerId: session.providerId,
      sessionId: session.id,
      type,
      amount,
      currency: session.provider.currency,
      provider: session.provider,
      requestPayload: {
        walletSync: true,
        type,
        sessionId: session.id,
        gameId: session.gameId,
        gameCode: session.game.providerGameCode,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
  }

  async retry(id: string, actor: AdminActor, note: string) {
    const original = await this.prisma.gameTransfer.findUnique({
      where: { id },
      include: {
        session: {
          include: {
            game: { select: { providerGameCode: true } },
            provider: {
              include: {
                endpoints: { where: { isEnabled: true }, orderBy: { type: 'asc' } },
                credentials: { where: { isEnabled: true }, orderBy: { type: 'asc' }, select: this.credentialSelect() },
              },
            },
          },
        },
      },
    });
    if (!original) throw new NotFoundException('Game transfer not found');
    if (original.status !== 'FAILED') throw new BadRequestException('Only FAILED transfers can be retried');
    if (!original.session) throw new BadRequestException('Original transfer has no session');

    const type = original.type as TransferKind;
    this.assertSafetyGate(original.session.provider, type);
    const result = await this.execute({
      userId: original.userId,
      providerId: original.providerId,
      sessionId: original.sessionId ?? undefined,
      type,
      amount: original.amount.toString(),
      currency: original.currency,
      provider: original.session.provider,
      requestPayload: {
        walletSync: true,
        retry: true,
        originalTransferId: original.id,
        retryBy: actor.id,
        retryNote: note,
        gameCode: original.session.game.providerGameCode,
      },
    });
    await this.prisma.adminAuditLog.create({
      data: buildAdminAuditData({
        adminUserId: actor.id,
        module: 'game_platform',
        action: 'game.transfer.retry_wallet_sync',
        targetId: original.id,
        newData: { note, retryTransferId: result.transfer.id, walletSync: result.walletSync },
      }),
    });
    return result;
  }

  private async execute(input: {
    userId: string;
    providerId: string;
    sessionId?: string;
    type: TransferKind;
    amount: string;
    currency: string;
    provider: ProviderWithAdapterData;
    requestPayload: Record<string, unknown>;
  }) {
    const amount = this.parseAmount(input.amount);
    const idempotencyKey = `${input.type.toLowerCase()}_${input.sessionId ?? input.providerId}_${Date.now()}_${randomBytes(4).toString('hex')}`;
    const transfer = await this.prisma.gameTransfer.create({
      data: {
        userId: input.userId,
        providerId: input.providerId,
        sessionId: input.sessionId,
        type: input.type,
        status: 'PENDING',
        amount: amount.toFixed(2),
        currency: input.currency,
        idempotencyKey,
        requestPayload: this.safeJson({ ...input.requestPayload, idempotencyKey }),
      },
    });
    const adapter = this.adapters.getAdapter(input.provider.code);
    await this.prisma.gameProviderCredential.updateMany({
      where: { providerId: input.providerId, isEnabled: true },
      data: { lastUsedAt: new Date() },
    });
    const adapterInput = { userId: input.userId, amount: amount.toFixed(2), currency: input.currency, idempotencyKey, sessionId: input.sessionId };

    if (input.type === 'TRANSFER_IN') {
      const debit = await this.wallets.apply({
        userId: input.userId,
        type: 'TRANSFER',
        direction: 'DEBIT',
        amount,
        referenceType: 'GAME_TRANSFER',
        referenceId: transfer.id,
        idempotencyKey: `${idempotencyKey}_wallet_debit`,
        metadata: { transferId: transfer.id, providerId: input.providerId, sessionId: input.sessionId, direction: 'wallet_to_provider' },
      });
      const result = await adapter.transferIn(this.buildContext(input.provider), adapterInput);
      if (result.ok && result.payload) {
        const updated = await this.prisma.gameTransfer.update({
          where: { id: transfer.id },
          data: {
            status: 'SUCCESS',
            providerTransactionId: result.payload.providerTransactionId,
            responsePayload: this.safeJson({ ...result, walletLedgerId: debit.ledger.id, walletBalanceAfter: debit.wallet.balance }),
            resolvedAt: new Date(),
          },
          include: this.transferInclude(),
        });
        return { ok: true, transfer: updated, walletSync: { direction: 'DEBIT', ledgerId: debit.ledger.id, balanceAfter: debit.wallet.balance }, realMutation: true, safetyGate: 'wallet-synced-transfer' };
      }

      const rollback = await this.wallets.apply({
        userId: input.userId,
        type: 'REVERSAL',
        direction: 'CREDIT',
        amount,
        referenceType: 'GAME_TRANSFER_ROLLBACK',
        referenceId: transfer.id,
        idempotencyKey: `${idempotencyKey}_wallet_rollback`,
        metadata: { transferId: transfer.id, providerId: input.providerId, sessionId: input.sessionId, reason: result.errorCode ?? 'PROVIDER_TRANSFER_IN_FAILED' },
      });
      const updated = await this.prisma.gameTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'FAILED',
          responsePayload: this.safeJson({ ...result, walletDebitLedgerId: debit.ledger.id, walletRollbackLedgerId: rollback.ledger.id, walletBalanceAfterRollback: rollback.wallet.balance }),
          errorCode: result.errorCode ?? 'TRANSFER_FAILED',
          errorMessage: result.errorMessage ?? 'Provider transfer-in failed; wallet debit was rolled back',
          resolvedAt: new Date(),
        },
        include: this.transferInclude(),
      });
      return { ok: false, transfer: updated, walletSync: { debitLedgerId: debit.ledger.id, rollbackLedgerId: rollback.ledger.id, balanceAfter: rollback.wallet.balance }, realMutation: true, rolledBack: true, safetyGate: 'wallet-synced-transfer' };
    }

    const result = await adapter.transferOut(this.buildContext(input.provider), adapterInput);
    if (result.ok && result.payload) {
      const credit = await this.wallets.apply({
        userId: input.userId,
        type: 'TRANSFER',
        direction: 'CREDIT',
        amount,
        referenceType: 'GAME_TRANSFER',
        referenceId: transfer.id,
        idempotencyKey: `${idempotencyKey}_wallet_credit`,
        metadata: { transferId: transfer.id, providerId: input.providerId, sessionId: input.sessionId, providerTransactionId: result.payload.providerTransactionId, direction: 'provider_to_wallet' },
      });
      const updated = await this.prisma.gameTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'SUCCESS',
          providerTransactionId: result.payload.providerTransactionId,
          responsePayload: this.safeJson({ ...result, walletLedgerId: credit.ledger.id, walletBalanceAfter: credit.wallet.balance }),
          resolvedAt: new Date(),
        },
        include: this.transferInclude(),
      });
      return { ok: true, transfer: updated, walletSync: { direction: 'CREDIT', ledgerId: credit.ledger.id, balanceAfter: credit.wallet.balance }, realMutation: true, safetyGate: 'wallet-synced-transfer' };
    }

    const updated = await this.prisma.gameTransfer.update({
      where: { id: transfer.id },
      data: {
        status: 'FAILED',
        responsePayload: this.safeJson(result),
        errorCode: result.errorCode ?? 'TRANSFER_FAILED',
        errorMessage: result.errorMessage ?? 'Provider transfer-out failed; wallet was not changed',
        resolvedAt: new Date(),
      },
      include: this.transferInclude(),
    });
    return { ok: false, transfer: updated, walletSync: { changed: false }, realMutation: false, safetyGate: 'wallet-synced-transfer' };
  }

  private assertSafetyGate(provider: ProviderWithAdapterData, type: TransferKind) {
    if (!this.adapters.hasAdapter(provider.code)) throw new ForbiddenException('Provider adapter is not registered');
    if (provider.walletMode === 'SEAMLESS') throw new ForbiddenException('Transfer endpoints are for TRANSFER/HYBRID wallet mode only');
    const metadata = this.objectJson(provider.metadata);
    if (metadata.transferEnabled !== true) throw new ForbiddenException('transferEnabled gate is not enabled');
    if (metadata.walletSyncEnabled === false) throw new ForbiddenException('walletSyncEnabled gate is not enabled');
    const endpoints = new Set(provider.endpoints.map((item) => item.type));
    const credentials = new Set(provider.credentials.map((item) => item.type));
    const required = type === 'TRANSFER_IN' ? 'TRANSFER_IN' : 'TRANSFER_OUT';
    if (!endpoints.has(required)) throw new ForbiddenException(`${required} endpoint is not enabled`);
    if (!credentials.has('API_KEY')) throw new ForbiddenException('API_KEY credential is not enabled');
  }

  private buildContext(provider: ProviderWithAdapterData): ProviderAdapterContext {
    const endpointMap = provider.endpoints.reduce<Partial<Record<GameProviderEndpointType, string>>>((result, endpoint) => {
      result[endpoint.type] = endpoint.url;
      return result;
    }, {});
    const credentialMap = provider.credentials.reduce<Record<string, string>>((result, credential) => {
      result[credential.type] = credential.encryptedValue ? this.decrypt(credential.encryptedValue) : credential.maskedValue;
      return result;
    }, {});
    return {
      providerCode: provider.code,
      baseUrl: endpointMap.HEALTH_CHECK ?? endpointMap.LAUNCH ?? '',
      walletMode: provider.walletMode,
      currency: provider.currency,
      timeoutMs: Math.max(...provider.endpoints.map((item) => item.timeoutMs), 10000),
      endpointMap,
      credentialMap,
    };
  }

  private decrypt(value: string) {
    const [, ivRaw, tagRaw, encryptedRaw] = value.split(':');
    if (!ivRaw || !tagRaw || !encryptedRaw) return value;
    const source = this.config.get<string>('GAME_CREDENTIAL_SECRET') ?? this.config.get<string>('JWT_ACCESS_KEY') ?? 'local_game_credential_key';
    const key = createHash('sha256').update(source).digest();
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivRaw, 'base64'));
    decipher.setAuthTag(Buffer.from(tagRaw, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, 'base64')), decipher.final()]).toString('utf8');
  }

  private credentialSelect() {
    return { id: true, providerId: true, type: true, maskedValue: true, encryptedValue: true, isEnabled: true, rotatedAt: true, createdAt: true, updatedAt: true } as const;
  }

  private transferInclude() {
    return {
      user: { select: { id: true, username: true, phone: true } },
      provider: { select: { id: true, name: true, code: true } },
      session: { select: { id: true, providerSessionId: true, game: { select: { id: true, name: true, providerGameCode: true } } } },
    } as const;
  }

  private parseAmount(value: string) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('amount must be positive');
    return amount;
  }

  private safeJson(value: unknown) {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private objectJson(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  }
}
