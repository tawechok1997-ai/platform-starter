import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { AdminRequestContext, AuthenticatedAdminActor, MemberActor } from '../../common/actors';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { DepositAdminNoteDto } from './dto/deposit-workflow.dto';
import { DepositEvidenceInput, DepositWorkflowService } from './deposit-workflow.service';

@Controller()
export class DepositWorkflowController {
  constructor(private readonly workflow: DepositWorkflowService) {}

  @UseGuards(MemberAuthGuard)
  @Post('member/topups/:id/slip-evidence')
  submitEvidence(@CurrentUser() user: MemberActor, @Param('id') id: string, @Body() body: DepositEvidenceInput) {
    return this.workflow.submitEvidence(id, user.id, body);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('finance.topups.view')
  @Get('admin/topups/:id/slip')
  getSlip(@Param('id') id: string) {
    return this.workflow.getSlip(id);
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('finance.topups.review')
  @Post('admin/topups/:id/approve-slip')
  approveSlip(
    @CurrentUser() user: AuthenticatedAdminActor,
    @Param('id') id: string,
    @Body() body: DepositAdminNoteDto,
    @Req() req: AdminRequestContext,
  ) {
    return this.workflow.approveSlip(id, user.id, body.adminNote, this.meta(req));
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('finance.topups.review')
  @Post('admin/topups/:id/reject')
  rejectDeposit(
    @CurrentUser() user: AuthenticatedAdminActor,
    @Param('id') id: string,
    @Body() body: DepositAdminNoteDto,
    @Req() req: AdminRequestContext,
  ) {
    return this.workflow.rejectDeposit(id, user.id, body.adminNote, this.meta(req));
  }

  @UseGuards(AdminAuthGuard, PermissionsGuard)
  @RequirePermission('finance.topups.review')
  @Post('admin/topups/:id/confirm-credit')
  confirmCredit(
    @CurrentUser() user: AuthenticatedAdminActor,
    @Param('id') id: string,
    @Body() body: DepositAdminNoteDto,
    @Req() req: AdminRequestContext,
  ) {
    return this.workflow.confirmCredit(id, user.id, body.adminNote, this.meta(req));
  }

  private meta(req: AdminRequestContext) {
    const header = req.headers?.['user-agent'];
    return {
      ipAddress: req.ip,
      userAgent: Array.isArray(header) ? header[0] : header,
    };
  }
}
