import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { AdminRequestContext, AuthenticatedAdminActor } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { WithdrawalRiskEnforcementService } from './withdrawal-risk-enforcement.service';
import { WithdrawalWorkflowService } from './withdrawal-workflow.service';
import {
  ApproveWithdrawalForPaymentDto,
  UploadWithdrawalPaymentProofDto,
  VerifyWithdrawalPaymentDto,
} from './dto/withdrawal-workflow.dto';

@Controller('admin/withdrawals')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class WithdrawalWorkflowController {
  constructor(
    private readonly workflow: WithdrawalWorkflowService,
    private readonly withdrawalRisk: WithdrawalRiskEnforcementService,
  ) {}

  @RequirePermission('finance.withdrawals.view')
  @Get(':id/payment-proof')
  getPaymentProof(@Param('id') id: string) {
    return this.workflow.getPaymentProof(id);
  }

  @RequirePermission('finance.withdrawals.review')
  @Post(':id/approve-for-payment')
  async approveForPayment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedAdminActor,
    @Body() body: ApproveWithdrawalForPaymentDto,
    @Req() req: AdminRequestContext,
  ) {
    await this.withdrawalRisk.enforceBeforeApproval(id, user.id, body.riskOverrideReason);
    return this.workflow.approveForPayment(id, user.id, body.note, this.meta(req));
  }

  @RequirePermission('finance.withdrawals.review')
  @Post(':id/payment-proof')
  uploadPaymentProof(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedAdminActor,
    @Body() body: UploadWithdrawalPaymentProofDto,
    @Req() req: AdminRequestContext,
  ) {
    return this.workflow.uploadPaymentProof(id, user.id, body, this.meta(req));
  }

  @RequirePermission('finance.withdrawals.review')
  @Post(':id/verify-payment')
  verifyPayment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedAdminActor,
    @Body() body: VerifyWithdrawalPaymentDto,
    @Req() req: AdminRequestContext,
  ) {
    return this.workflow.verifyAndComplete(id, user.id, body.note, this.meta(req));
  }

  private meta(req: AdminRequestContext) {
    const userAgent = req.headers?.['user-agent'];
    return { ipAddress: req.ip, userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent };
  }
}
