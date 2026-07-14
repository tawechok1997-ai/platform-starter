import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProviderReconciliationAlertService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: {
    snapshotId: string;
    userId: string;
    providerId: string;
    sessionId: string;
    status: string;
    systemBalance: string;
    providerBalance: string;
    difference: string;
  }) {
    const amount = Math.abs(Number(input.difference));
    const severity = amount >= 10000 ? 'CRITICAL' : amount >= 1000 ? 'HIGH' : 'MEDIUM';
    return this.prisma.riskAlert.create({
      data: {
        type: 'WALLET_LEDGER_MISMATCH',
        severity,
        status: 'OPEN',
        memberId: input.userId,
        refType: 'PROVIDER_WALLET_SNAPSHOT',
        refId: input.snapshotId,
        title: 'ยอด provider ไม่ตรงกับระบบ',
        description: `Reconciliation ${input.status}: system ${input.systemBalance}, provider ${input.providerBalance}, diff ${input.difference}`,
        metadata: this.safeJson({ ...input, source: 'game.reconciliation' }),
      },
    });
  }

  private safeJson(value: unknown) {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
