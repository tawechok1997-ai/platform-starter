import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReconciliationDetailService {
  constructor(private readonly prisma: PrismaService) {}

  async getInvestigation(id: string) {
    const snapshot = await this.prisma.providerWalletSnapshot.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, phone: true } },
        provider: { select: { id: true, name: true, code: true } },
      },
    });
    if (!snapshot) throw new NotFoundException('Provider wallet snapshot not found');

    const sessionId = this.sessionIdFromPayload(snapshot.rawPayload);
    const [session, transfers, riskAlerts, auditLogs] = await Promise.all([
      sessionId ? this.prisma.gameSession.findUnique({ where: { id: sessionId }, include: { game: { select: { id: true, name: true, providerGameCode: true } }, provider: { select: { id: true, name: true, code: true } }, user: { select: { id: true, username: true, phone: true } } } }) : null,
      this.prisma.gameTransfer.findMany({ where: sessionId ? { sessionId } : { userId: snapshot.userId, providerId: snapshot.providerId }, orderBy: { createdAt: 'desc' }, take: 25, include: { user: { select: { id: true, username: true, phone: true } }, provider: { select: { id: true, name: true, code: true } }, session: { select: { id: true, providerSessionId: true, game: { select: { id: true, name: true, providerGameCode: true } } } } } }),
      this.prisma.riskAlert.findMany({ where: { refType: 'PROVIDER_WALLET_SNAPSHOT', refId: snapshot.id }, orderBy: { createdAt: 'desc' }, take: 25 }),
      this.prisma.adminAuditLog.findMany({ where: { targetId: snapshot.id, module: { in: ['game_platform', 'game-platform', 'money_ops'] } }, orderBy: { createdAt: 'desc' }, take: 25, include: { adminUser: { select: { id: true, username: true, email: true } } } }),
    ]);

    return {
      ok: true,
      snapshot,
      related: { session, transfers, riskAlerts, auditLogs },
      timeline: this.timeline(snapshot, transfers, riskAlerts, auditLogs),
    };
  }

  private sessionIdFromPayload(payload: unknown) {
    const value = this.objectJson(payload);
    return typeof value.sessionId === 'string' ? value.sessionId : undefined;
  }

  private timeline(snapshot: { checkedAt: Date; status: string }, transfers: Array<{ id: string; status: string; type: string; createdAt: Date }>, riskAlerts: Array<{ id: string; status: string; severity: string; title: string; createdAt: Date }>, auditLogs: Array<{ id: string; action: string; createdAt: Date }>) {
    return [
      { type: 'snapshot', at: snapshot.checkedAt, label: `ตรวจยอด: ${snapshot.status}` },
      ...transfers.map((item) => ({ type: 'transfer', at: item.createdAt, label: `${item.type}: ${item.status}`, refId: item.id })),
      ...riskAlerts.map((item) => ({ type: 'risk_alert', at: item.createdAt, label: `${item.severity}: ${item.title} (${item.status})`, refId: item.id })),
      ...auditLogs.map((item) => ({ type: 'audit', at: item.createdAt, label: item.action, refId: item.id })),
    ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }

  private objectJson(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  }
}
