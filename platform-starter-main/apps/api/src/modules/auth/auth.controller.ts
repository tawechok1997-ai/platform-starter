import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberAuthGuard } from '../../common/guards/member-auth.guard';
import { AuthService } from './auth.service';
import { RefreshSessionDto } from './dto/refresh-session.dto';
import { MemberSignInDto } from './dto/member-sign-in.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('member/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: any) {
    return this.authService.register(dto, this.meta(req, (dto as any).deviceId));
  }

  @Post('login')
  signIn(@Body() dto: MemberSignInDto, @Req() req: any) {
    return this.authService.signIn(dto, this.meta(req, dto.deviceId));
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshSessionDto, @Req() req: any) {
    return this.authService.refreshSession(dto, this.meta(req, dto.deviceId));
  }

  @UseGuards(MemberAuthGuard)
  @Post('logout')
  signOut(@CurrentUser() user: any) {
    return this.authService.signOut(user.sessionId);
  }

  private meta(req: any, deviceId?: string) {
    return {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      deviceId,
    };
  }
}
