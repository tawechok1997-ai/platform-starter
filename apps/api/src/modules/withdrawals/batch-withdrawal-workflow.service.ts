import { Injectable } from '@nestjs/common';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import { AdminAuthService } from '../admin-auth/admin-auth.service';
import type { BatchWithdrawalAction } from './dto/batch-withdrawal-workflow.dto';
import { WithdrawalWorkflowService } from './withdrawal-workflow.service';
import { WithdrawalsService } from './withdrawals.service';

type Meta = { ipAddress?: string; userAgent?: string };
@Injectable()
export class BatchWithdrawalWorkflowService {
  constructor(private readonly auth: AdminAuthService, private readonly withdrawals: WithdrawalsService, private readonly workflow: WithdrawalWorkflowService, private readonly prisma: PrismaService) {}
  async execute(adminUserId: string, action: BatchWithdrawalAction, ids: string[], reason: string, stepUpCode: string, meta: Meta = {}) {
    const uniqueIds = [...new Set(ids)];
    await this.auth.assertStepUp(adminUserId, stepUpCode, meta);
    const results: Array<{ id: string; ok: boolean; status?: string; message?: string }> = [];
    for (const id of uniqueIds) {
      try {
        const result = action === 'APPROVE'
          ? await this.withdrawals.approveRequest(id, { id: adminUserId }, { adminNote: reason }, meta)
          : action === 'REJECT'
            ? await this.withdrawals.rejectRequest(id, { id: adminUserId }, { adminNote: reason }, meta)
            : await this.workflow.verifyAndComplete(id, adminUserId, reason, meta);
        results.push({ id, ok: true, status: result.status });
      } catch (error) { results.push({ id, ok: false, message: error instanceof Error ? error.message : 'Batch action failed' }); }
    }
    await this.prisma.adminAuditLog.create({ data: buildAdminAuditData({ adminUserId, action: 'BATCH_WITHDRAWAL_WORKFLOW', module: 'withdrawals', targetId: null, oldData: { ids: uniqueIds }, newData: { action, reason, stepUpVerified: true, results }, ipAddress: meta.ipAddress, userAgent: meta.userAgent }) });
    return { action, results, summary: { requested: uniqueIds.length, succeeded: results.filter((item) => item.ok).length, failed: results.filter((item) => !item.ok).length } };
  }
}
