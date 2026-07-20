import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProviderAdapterRegistry } from './adapters/provider-adapter.registry';

@Injectable()
export class GamePlatformMonitoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adapterRegistry: ProviderAdapterRegistry,
  ) {}

  async overview() {
    const [
      providers,
      activeSessions,
      pendingTransfers,
      failedTransfers,
      reversedTransfers,
      failedWebhooks,
      duplicateWebhooks,
      mismatchSnapshots,
      unknownSnapshots,
    ] = await Promise.all([
      this.prisma.gameProvider.findMany({
        orderBy: { code: 'asc' },
        select: { id: true, name: true, code: true, status: true, walletMode: true, updatedAt: true },
      }),
      this.prisma.gameSession.count({ where: { status: { in: ['LAUNCHED', 'ACTIVE'] } } }),
      this.prisma.gameTransfer.count({ where: { status: 'PENDING' } }),
      this.prisma.gameTransfer.count({ where: { status: 'FAILED' } }),
      this.prisma.gameTransfer.count({ where: { status: 'REVERSED' } }),
      this.prisma.webhookLog.count({ where: { status: 'FAILED' } }),
      this.prisma.webhookLog.count({ where: { status: 'DUPLICATE' } }),
      this.prisma.providerWalletSnapshot.count({ where: { status: 'MISMATCH' } }),
      this.prisma.providerWalletSnapshot.count({ where: { status: 'UNKNOWN' } }),
    ]);

    const providerItems = providers.map((provider) => ({
      ...provider,
      adapterRegistered: this.adapterRegistry.hasAdapter(provider.code),
    }));
    const missingAdapterCount = providerItems.filter((provider) => !provider.adapterRegistered).length;
    const degradedProviderCount = providerItems.filter((provider) => provider.status === 'DEGRADED').length;
    const unavailableProviderCount = providerItems.filter((provider) => provider.status === 'INACTIVE' || provider.status === 'MAINTENANCE').length;

    const criticalSignals = failedTransfers + failedWebhooks + mismatchSnapshots + unknownSnapshots + missingAdapterCount;
    const warningSignals = pendingTransfers + reversedTransfers + duplicateWebhooks + degradedProviderCount + unavailableProviderCount;
    const status = criticalSignals > 0 ? 'CRITICAL' : warningSignals > 0 ? 'DEGRADED' : 'HEALTHY';

    return {
      status,
      generatedAt: new Date().toISOString(),
      providers: {
        total: providerItems.length,
        active: providerItems.filter((provider) => provider.status === 'ACTIVE').length,
        degraded: degradedProviderCount,
        unavailable: unavailableProviderCount,
        missingAdapter: missingAdapterCount,
        items: providerItems,
      },
      adapters: {
        registeredCodes: this.adapterRegistry.listAdapterCodes(),
        registeredCount: this.adapterRegistry.listAdapterCodes().length,
      },
      sessions: { active: activeSessions },
      transfers: {
        pending: pendingTransfers,
        failed: failedTransfers,
        reversed: reversedTransfers,
      },
      webhooks: {
        failed: failedWebhooks,
        duplicate: duplicateWebhooks,
      },
      reconciliation: {
        mismatch: mismatchSnapshots,
        unknown: unknownSnapshots,
        unresolved: mismatchSnapshots + unknownSnapshots,
      },
      signals: {
        critical: criticalSignals,
        warning: warningSignals,
      },
    };
  }
}
