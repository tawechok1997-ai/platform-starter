import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { AdminAccessController } from './admin-access.controller';
import { AdminAccessSessionService } from './admin-access-session.service';
import { AdminAccessService } from './admin-access.service';
import { AdminAccountLifecycleService } from './admin-account-lifecycle.service';
import { AdminInvitationAdminController } from './admin-invitation-admin.controller';
import { AdminInvitationAdminService } from './admin-invitation-admin.service';
import { AdminInvitationController } from './admin-invitation.controller';
import { AdminInvitationService } from './admin-invitation.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [AdminAccessController, AdminInvitationController, AdminInvitationAdminController],
  providers: [
    AdminAccessService,
    AdminAccessSessionService,
    AdminAccountLifecycleService,
    AdminInvitationService,
    AdminInvitationAdminService,
  ],
})
export class AdminAccessModule {}
