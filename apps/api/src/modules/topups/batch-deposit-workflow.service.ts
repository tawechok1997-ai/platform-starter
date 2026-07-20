import { Injectable } from '@nestjs/common';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import { AdminAuthService } from '../admin-auth/admin-auth.service';
import { DepositWorkflowService } from './deposit-workflow.service';
import type { BatchDepositAction } from './dto/batch-deposit-workflow.dto';

type Meta = { ipAddress?: string; userAgent?: string };

@Injectable()
export class BatchDepositWorkflowService {
  constructor(
    private readonly auth: AdminAuthService,
    private readonly workflow: DepositWorkflowService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    adminUserId: string,
    action: BatchDepositAction,
    ids: string[],
    reason: string,
    stepUpCode: string,
    meta: Meta = {},
  ) {
    const uniqueIds = [...new Set(ids)];
    await this.auth.assertStepUp(adminUserId, stepUpCode, meta);
    const results = [] as Array<{ id: string; ok: boolean; status?: string; message?: string }>;
    for (const id of uniqueIds) {
      try {
        const result = await this.run(action, id, adminUserId, reason, meta);
        results.push({ id, ok: true, status: result.status });
      } catch (error) {
        results.push({ id, ok: false, message: error instanceof Error ? error.message : 'Batch action failed' });
      }
    }
    await this.prisma.adminAuditLog.create({
      data: buildAdminAuditData({
        adminUserId,
        action: 'BATCH_DEPOSIT_WORKFLOW',
        module: 'topups',
        targetId: null,
        oldData: { ids: uniqueIds },
        newData: { action, reason, stepUpVerified: true, results },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      }),
    });
    return {
      action,
      results,
      summary: {
        requested: uniqueIds.length,
        succeeded: results.filter((item) => item.ok).length,
        failed: results.filter((item) => !item.ok).length,
      },
    };
  }

  private run(action: BatchDepositAction, id: string, adminUserId: string, reason: string, meta: Meta) {
    if (action === 'APPROVE_SLIP') return this.workflow.approveSlip(id, adminUserId, reason, meta);
    if (action === 'REJECT') return this.workflow.rejectDeposit(id, adminUserId, reason, meta);
    return this.workflow.confirmCredit(id, adminUserId, reason, meta);
  }
}
