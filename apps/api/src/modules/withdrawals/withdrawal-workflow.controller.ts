import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PaymentProofInput, WithdrawalWorkflowService } from './withdrawal-workflow.service';

@Controller('admin/withdrawals')
@UseGuards(AdminAuthGuard)
export class WithdrawalWorkflowController {
  constructor(private readonly workflow: WithdrawalWorkflowService) {}

  @Post(':id/approve-for-payment')
  approveForPayment(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { note?: string }, @Req() req: any) {
    return this.workflow.approveForPayment(id, user.id, body.note, this.meta(req));
  }

  @Post(':id/payment-proof')
  uploadPaymentProof(@Param('id') id: string, @CurrentUser() user: any, @Body() body: PaymentProofInput, @Req() req: any) {
    return this.workflow.uploadPaymentProof(id, user.id, body, this.meta(req));
  }

  @Get(':id/payment-proof')
  getPaymentProof(@Param('id') id: string) {
    return this.workflow.getPaymentProof(id);
  }

  @Post(':id/verify-payment')
  verifyPayment(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { note?: string }, @Req() req: any) {
    return this.workflow.verifyAndComplete(id, user.id, body.note, this.meta(req));
  }

  @Post(':id/reject-staged')
  reject(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { note?: string }, @Req() req: any) {
    return this.workflow.reject(id, user.id, body.note, this.meta(req));
  }

  private meta(req: any) { return { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] }; }
}
