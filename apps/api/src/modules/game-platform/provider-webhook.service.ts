import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createDecipheriv, createHash } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { ProviderAdapterRegistry } from './adapters/provider-adapter.registry';
import { GameProviderEndpointType, GameProviderWalletMode } from './game-platform.types';
import { GameRoundPersistenceService } from './game-round-persistence.service';
import type { ProviderAdapterContext } from './provider-adapter.interface';

type ProviderWithAdapterData = {
  id: string;
  code: string;
  walletMode: GameProviderWalletMode;
  currency: string;
  metadata?: unknown;
  endpoints: Array<{ type: GameProviderEndpointType; url: string; timeoutMs: number }>;
  credentials: Array<{ type: string; maskedValue: string; encryptedValue?: string | null }>;
};

@Injectable()
export class ProviderWebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adapters: ProviderAdapterRegistry,
    private readonly config: ConfigService,
    private readonly rounds: GameRoundPersistenceService,
  ) {}

  async receive(
    providerCode: string,
    headers: Record<string, string | string[] | undefined>,
    body: unknown,
    rawBody?: Buffer,
  ) {
    const payload = this.objectJson(body);
    const eventType = this.requireText(payload.eventType, 'eventType');
    const requestIdempotencyKey = this.requireText(payload.idempotencyKey, 'idempotencyKey');
    const provider = await this.loadProvider(providerCode);
    const adapter = this.adapters.getAdapter(provider.code);

    await this.prisma.gameProviderCredential.updateMany({
      where: { providerId: provider.id, isEnabled: true },
      data: { lastUsedAt: new Date() },
    });

    const context = this.buildContext(provider);
    const validation = await adapter.validateWebhook(context, headers, body, rawBody);
    if (!validation.valid) {
      const log = await this.prisma.webhookLog.create({
        data: {
          providerId: provider.id,
          eventType,
          status: 'FAILED',
          signatureValid: false,
          idempotencyKey: requestIdempotencyKey,
          providerTransactionId: this.optionalText(payload.providerTransactionId),
          rawPayload: this.safeJson(payload),
          responseStatus: 400,
          errorCode: 'INVALID_SIGNATURE',
          errorMessage: validation.reason ?? 'Invalid webhook signature',
          processedAt: new Date(),
        },
      });
      return { ok: false, logId: log.id, errorCode: 'INVALID_SIGNATURE' };
    }

    const events = await adapter.parseWebhook(context, body);
    const idempotencyKey = validation.idempotencyKey ?? requestIdempotencyKey;
    const settlementEnabled = this.webhookSettlementEnabled(provider.metadata);
    const lockKey = `${provider.id}:${idempotencyKey}`;

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
      const duplicate = await tx.webhookLog.findFirst({
        where: { providerId: provider.id, idempotencyKey, status: { in: ['PROCESSED', 'DUPLICATE'] } },
      });
      if (duplicate) {
        const log = await tx.webhookLog.create({
          data: {
            providerId: provider.id,
            eventType,
            status: 'DUPLICATE',
            signatureValid: true,
            idempotencyKey,
            providerTransactionId: this.optionalText(payload.providerTransactionId),
            rawPayload: this.safeJson(payload),
            responseStatus: 208,
            processedAt: new Date(),
          },
        });
        return { ok: true, duplicate: true, logId: log.id, statusCode: 208 };
      }

      const roundTransitions = await this.rounds.applyWebhookEvents(tx, provider.id, events);
      const log = await tx.webhookLog.create({
        data: {
          providerId: provider.id,
          eventType,
          status: 'PROCESSED',
          signatureValid: true,
          idempotencyKey,
          providerTransactionId: this.optionalText(payload.providerTransactionId) ?? events[0]?.providerTransactionId,
          rawPayload: this.safeJson(payload),
          normalizedPayload: this.safeJson({ events, roundTransitions, walletSettlementEnabled: settlementEnabled }),
          responseStatus: 200,
          processedAt: new Date(),
        },
      });
      return { ok: true, logId: log.id, events, roundTransitions, walletSettlementEnabled: settlementEnabled };
    });
  }

  private async loadProvider(code: string): Promise<ProviderWithAdapterData> {
    const provider = await this.prisma.gameProvider.findUnique({
      where: { code },
      include: {
        endpoints: { where: { isEnabled: true }, orderBy: { type: 'asc' } },
        credentials: {
          where: { isEnabled: true },
          orderBy: { type: 'asc' },
          select: { type: true, maskedValue: true, encryptedValue: true },
        },
      },
    });
    if (!provider) throw new NotFoundException('Provider not found');
    return provider;
  }

  private buildContext(provider: ProviderWithAdapterData): ProviderAdapterContext {
    const endpointMap = provider.endpoints.reduce<Partial<Record<GameProviderEndpointType, string>>>((result, endpoint) => {
      result[endpoint.type] = endpoint.url;
      return result;
    }, {});
    const credentialMap = provider.credentials.reduce<Record<string, string>>((result, credential) => {
      result[credential.type] = credential.encryptedValue
        ? this.decryptSecret(credential.encryptedValue)
        : credential.maskedValue;
      return result;
    }, {});
    return {
      providerCode: provider.code,
      baseUrl: endpointMap.HEALTH_CHECK ?? endpointMap.LAUNCH ?? '',
      walletMode: provider.walletMode,
      currency: provider.currency,
      timeoutMs: Math.max(...provider.endpoints.map((endpoint) => endpoint.timeoutMs), 10_000),
      endpointMap,
      credentialMap,
    };
  }

  private decryptSecret(value: string) {
    const [, ivRaw, tagRaw, encryptedRaw] = value.split(':');
    if (!ivRaw || !tagRaw || !encryptedRaw) return value;
    const keySource = this.config.get<string>('GAME_CREDENTIAL_SECRET')
      ?? this.config.get<string>('JWT_ACCESS_KEY')
      ?? 'local_game_credential_key';
    const key = createHash('sha256').update(keySource).digest();
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivRaw, 'base64'));
    decipher.setAuthTag(Buffer.from(tagRaw, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedRaw, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  private webhookSettlementEnabled(metadata: unknown) {
    return this.objectJson(metadata).webhookSettlementEnabled === true;
  }

  private requireText(value: unknown, label: string) {
    if (typeof value !== 'string' || !value.trim()) throw new BadRequestException(`${label} is required`);
    return value.trim();
  }

  private optionalText(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private safeJson(value: unknown) {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private objectJson(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
  }
}
