import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AdminInvitationService } from './admin-invitation.service';

@Controller('admin/invitations')
export class AdminInvitationController {
  constructor(private readonly service: AdminInvitationService) {}

  @Get('inspect')
  inspect(@Query('token') token?: string) {
    return this.service.inspect(String(token ?? ''));
  }

  @Post('accept')
  accept(@Body() body: { token?: string; username?: string; secret?: string }) {
    return this.service.accept(
      String(body.token ?? ''),
      String(body.username ?? ''),
      String(body.secret ?? ''),
    );
  }
}
