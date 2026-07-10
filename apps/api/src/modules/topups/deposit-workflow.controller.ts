import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { DepositEvidenceInput, DepositWorkflowService } from './deposit-workflow.service';

@Controller()
export class DepositWorkflowController {
  constructor(private readonly workflow: DepositWorkflowService) {}

  @UseGuards(MemberAuthGuard)
  @Post('member/topups/:id/slip-evidence')
  submitEvidence(@CurrentUser() user: any, @Param('id') id: string, @Body() body: DepositEvidenceInput) {
    return this.workflow.submitEvidence(id, user.id, body);
  }

  @UseGuards(AdminAuthGuard)
  @Get('admin/topups/:id/slip')
  getSlip(@Param('id') id: string) {
    return this.workflow.getSlip(id);
  }

  @UseGuards(AdminAuthGuard)
  @Post('admin/topups/:id/approve-slip')
  approveSlip(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { adminNote?: string }, @Req() req: any) {
    return this.workflow.approveSlip(id, user.id, body.adminNote, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Post('admin/topups/:id/reject')
  rejectDeposit(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { adminNote?: string }, @Req() req: any) {
    return this.workflow.rejectDeposit(id, user.id, body.adminNote, this.meta(req));
  }

  @UseGuards(AdminAuthGuard)
  @Post('admin/topups/:id/confirm-credit')
  confirmCredit(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { adminNote?: string }, @Req() req: any) {
    return this.workflow.confirmCredit(id, user.id, body.adminNote, this.meta(req));
  }

  private meta(req: any) {
    return { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] };
  }
}
