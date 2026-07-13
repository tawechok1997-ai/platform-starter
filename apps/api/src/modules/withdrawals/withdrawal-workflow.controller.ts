import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import {
  ApproveWithdrawalForPaymentDto,
  UploadWithdrawalPaymentProofDto,
  VerifyWithdrawalPaymentDto,
} from './dto/withdrawal-workflow.dto';
import { WithdrawalRiskEnforcementService } from './withdrawal-risk-enforcement.service';
import { WithdrawalWorkflowService } from './withdrawal-workflow.service';

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
    @CurrentUser() user: any,
    @Body() body: ApproveWithdrawalForPaymentDto,
    @Req() req: any,
  ) {
    await this.withdrawalRisk.enforceBeforeApproval(id, user.id, body.riskOverrideReason);
    return this.workflow.approveForPayment(id, user.id, body.note, this.meta(req));
  }

  @RequirePermission('finance.withdrawals.review')
  @Post(':id/payment-proof')
  uploadPaymentProof(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: UploadWithdrawalPaymentProofDto,
    @Req() req: any,
  ) {
    return this.workflow.uploadPaymentProof(id, user.id, body, this.meta(req));
  }

  @RequirePermission('finance.withdrawals.review')
  @Post(':id/verify-payment')
  verifyPayment(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: VerifyWithdrawalPaymentDto,
    @Req() req: any,
  ) {
    return this.workflow.verifyAndComplete(id, user.id, body.note, this.meta(req));
  }

  private meta(req: any) {
    return { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] };
  }
}
