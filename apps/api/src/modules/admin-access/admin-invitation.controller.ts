import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AcceptAdminInvitationDto } from './dto/admin-invitation.dto';
import { AdminInvitationService } from './admin-invitation.service';

@Controller('admin/invitations')
export class AdminInvitationController {
  constructor(private readonly service: AdminInvitationService) {}

  @Get('inspect')
  inspect(@Query('token') token?: string) {
    return this.service.inspect(String(token ?? ''));
  }

  @Post('accept')
  accept(@Body() body: AcceptAdminInvitationDto) {
    return this.service.accept(body.token.trim(), body.username.trim(), body.secret);
  }
}
