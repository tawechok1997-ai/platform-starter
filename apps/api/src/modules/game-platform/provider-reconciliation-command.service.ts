import type { AdminActor } from '../../common/actors';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createDecipheriv, createHash } from 'crypto';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import { ProviderAdapterRegistry } from './adapters/provider-adapter.registry';
import { GameProviderEndpointType, GameProviderWalletMode } from './game-platform.types';
import { ProviderAdapterContext } from './provider-adapter.interface';
import { ProviderReconciliationAlertService } from './provider-reconciliation-alert.service';

type ProviderWithAdapterData = {
  code: string;
  walletMode: GameProviderWalletMode;
  currency: string;
  endpoints: Array<{ type: GameProviderEndpointType; url: string; timeoutMs: number; isEnabled?: boolean }>;
  credentials: Array<{ type: string; maskedValue: string; encryptedValue?: string; isEnabled?: boolean }>;
};

type SnapshotReviewStatus = 'REVIEWED' | 'RESOLVED' | 'DISMISSED';

@Injectable()
export class ProviderReconciliationCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adapters: ProviderAdapterRegistry,
    private readonly config: ConfigService,
    private readonly alerts: ProviderReconciliationAlertService,
  ) {}

  async reconcileSession(sessionId: string, actor?: AdminActor) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        user: { select: { id: true } },
        provider: {
          include: {
            endpoints: { where: { isEnabled: true }, orderBy: { type: 'asc' } },
            credentials: { where: { isEnabled: true }, orderBy: { type: 'asc' }, select: this.credentialSelect() },
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Game session not found');
    this.assertSafetyGate(session.provider);

    const systemBalance = await this.expectedBalance(session.id);
    const adapter = this.adapters.getAdapter(session.provider.code);
    await this.prisma.gameProviderCredential.updateMany({
      where: { providerId: session.providerId, isEnabled: true },
      data: { lastUsedAt: new Date() },
    });
    const result = await adapter.getBalance(this.buildContext(session.provider), {
      userId: session.userId,
      providerUserId: session.providerSessionId ?? undefined,
    });
    const providerBalance = result.ok && result.payload?.balance ? result.payload.balance : '0.00';
    const difference = (Number(systemBalance) - Number(providerBalance)).toFixed(2);
    const status = !result.ok ? 'UNKNOWN' : Number(difference) === 0 ? 'MATCHED' : 'MISMATCH';

    const snapshot = await this.prisma.providerWalletSnapshot.create({
      data: {
        userId: session.userId,
        providerId: session.providerId,
        systemBalance,
        providerBalance,
        difference,
        status,
        rawPayload: this.safeJson({ walletSync: true, sessionId, adapterResult: result }),
      },
      include: {
        user: { select: { id: true, username: true, phone: true } },
        provider: { select: { id: true, name: true, code: true } },
      },
    });
    const alert = status === 'MATCHED' ? null : await this.alerts.create({
      snapshotId: snapshot.id,
      userId: session.userId,
      providerId: session.providerId,
      sessionId,
      status,
      systemBalance,
      providerBalance,
      difference,
    });
    if (actor) {
      await this.prisma.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: actor.id,
          module: 'game_platform',
          action: 'game.reconciliation.run',
          targetId: sessionId,
          newData: { snapshotId: snapshot.id, status, difference, riskAlertId: alert?.id ?? null },
        }),
      });
    }
    return { ok: status === 'MATCHED', snapshot, walletSync: true, riskAlert: alert };
  }

  async reconcileActiveSessions(actor: AdminActor) {
    const sessions = await this.prisma.gameSession.findMany({
      where: { status: { in: ['LAUNCHED', 'ACTIVE'] } },
      orderBy: { updatedAt: 'asc' },
      take: 100,
      select: { id: true },
    });
    const results: Array<{ sessionId: string; ok: boolean; status?: string; snapshotId?: string; error?: string }> = [];
    for (const session of sessions) {
      try {
        const result = await this.reconcileSession(session.id, actor);
        results.push({ sessionId: session.id, ok: result.ok, status: result.snapshot.status, snapshotId: result.snapshot.id });
      } catch (error) {
        results.push({ sessionId: session.id, ok: false, error: error instanceof Error ? error.message : 'Reconciliation failed' });
      }
    }
    const summary = {
      scanned: results.length,
      matched: results.filter((item) => item.status === 'MATCHED').length,
      mismatch: results.filter((item) => item.status === 'MISMATCH').length,
      unknown: results.filter((item) => item.status === 'UNKNOWN').length,
      failed: results.filter((item) => item.error).length,
    };
    await this.prisma.adminAuditLog.create({
      data: buildAdminAuditData({
        adminUserId: actor.id,
        module: 'game_platform',
        action: 'game.reconciliation.batch_run',
        newData: summary,
      }),
    });
    return { ok: summary.mismatch === 0 && summary.unknown === 0 && summary.failed === 0, summary, results };
  }

  async reviewSnapshot(id: string, actor: AdminActor, input: { note: string; status: string }) {
    const reviewStatus = this.parseReviewStatus(input.status);
    const note = input.note.trim();
    if (!note) throw new BadRequestException('Review note is required');

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.providerWalletSnapshot.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Provider wallet snapshot not found');

      const reviewedAt = new Date();
      const currentPayload = this.objectJson(current.rawPayload);
      const rawPayload = this.safeJson({
        ...currentPayload,
        manualReview: {
          note,
          status: reviewStatus,
          reviewedBy: actor.id,
          reviewedAt: reviewedAt.toISOString(),
        },
      });
      const resolved = reviewStatus === 'RESOLVED' || reviewStatus === 'DISMISSED';
      const item = await tx.providerWalletSnapshot.update({
        where: { id },
        data: { rawPayload, status: resolved ? 'MATCHED' : current.status },
        include: {
          user: { select: { id: true, username: true, phone: true } },
          provider: { select: { id: true, name: true, code: true } },
        },
      });

      const alertStatus = reviewStatus === 'DISMISSED' ? 'DISMISSED' : reviewStatus === 'RESOLVED' ? 'RESOLVED' : 'REVIEWING';
      const linkedAlerts = await tx.riskAlert.updateMany({
        where: {
          type: 'WALLET_LEDGER_MISMATCH',
          refType: 'PROVIDER_WALLET_SNAPSHOT',
          refId: id,
          status: { in: ['OPEN', 'REVIEWING'] },
        },
        data: {
          status: alertStatus,
          resolvedAt: resolved ? reviewedAt : null,
          resolvedBy: resolved ? actor.id : null,
          resolutionNote: resolved ? note : null,
        },
      });

      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: actor.id,
          module: 'game_platform',
          action: reviewStatus === 'RESOLVED'
            ? 'game.reconciliation.resolve'
            : reviewStatus === 'DISMISSED'
              ? 'game.reconciliation.dismiss'
              : 'game.reconciliation.review',
          targetId: id,
          oldData: current,
          newData: {
            note,
            status: reviewStatus,
            snapshotStatus: item.status,
            linkedRiskAlertsUpdated: linkedAlerts.count,
          },
        }),
      });

      return {
        ok: true,
        item,
        reviewStatus,
        linkedRiskAlertsUpdated: linkedAlerts.count,
      };
    });
  }

  private parseReviewStatus(value: string): SnapshotReviewStatus {
    const status = value.trim().toUpperCase();
    if (status === 'REVIEWED' || status === 'RESOLVED' || status === 'DISMISSED') return status;
    throw new BadRequestException('status must be REVIEWED, RESOLVED or DISMISSED');
  }

  private assertSafetyGate(provider: ProviderWithAdapterData) {
    if (!this.adapters.hasAdapter(provider.code)) throw new ForbiddenException('Provider adapter is not registered');
    if (!provider.endpoints.some((item) => item.type === 'BALANCE')) throw new ForbiddenException('BALANCE endpoint is not enabled');
  }

  private async expectedBalance(sessionId: string) {
    const items = await this.prisma.gameTransfer.findMany({
      where: { sessionId, status: 'SUCCESS' },
      select: { type: true, amount: true },
    });
    const value = items.reduce((sum, item) => sum + (item.type === 'TRANSFER_IN' ? Number(item.amount) : item.type === 'TRANSFER_OUT' ? -Number(item.amount) : 0), 0);
    return Math.max(value, 0).toFixed(2);
  }

  private buildContext(provider: ProviderWithAdapterData): ProviderAdapterContext {
    const endpointMap = provider.endpoints.reduce<Partial<Record<GameProviderEndpointType, string>>>((result, endpoint) => {
      result[endpoint.type] = endpoint.url;
      return result;
    }, {});
    const credentialMap = provider.credentials.reduce<Record<string, string>>((result, credential) => {
      result[credential.type] = credential.encryptedValue ? this.decryptSecret(credential.encryptedValue) : credential.maskedValue;
      return result;
    }, {});
    return {
      providerCode: provider.code,
      baseUrl: endpointMap.HEALTH_CHECK ?? endpointMap.LAUNCH ?? '',
      walletMode: provider.walletMode,
      currency: provider.currency,
      timeoutMs: Math.max(...provider.endpoints.map((endpoint) => endpoint.timeoutMs), 10000),
      endpointMap,
      credentialMap,
    };
  }

  private credentialSelect() {
    return { id: true, providerId: true, type: true, maskedValue: true, encryptedValue: true, isEnabled: true, rotatedAt: true, createdAt: true, updatedAt: true } as const;
  }

  private decryptSecret(value: string) {
    const [, ivRaw, tagRaw, encryptedRaw] = value.split(':');
    if (!ivRaw || !tagRaw || !encryptedRaw) return value;
    const source = this.config.get<string>('GAME_CREDENTIAL_SECRET') ?? this.config.get<string>('JWT_ACCESS_KEY') ?? 'local_game_credential_key';
    const key = createHash('sha256').update(source).digest();
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivRaw, 'base64'));
    decipher.setAuthTag(Buffer.from(tagRaw, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, 'base64')), decipher.final()]).toString('utf8');
  }

  private safeJson(value: unknown) {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private objectJson(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  }
}
