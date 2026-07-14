import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { DatabaseModule } from '../../database/database.module';
import { AdminAccessController } from './admin-access.controller';
import { AdminAccessSessionService } from './admin-access-session.service';
import { AdminAccessService } from './admin-access.service';
import { AdminAccountLifecycleService } from './admin-account-lifecycle.service';
import { AdminInvitationAdminController } from './admin-invitation-admin.controller';
import { AdminInvitationAdminService } from './admin-invitation-admin.service';
import { AdminInvitationController } from './admin-invitation.controller';
import { AdminInvitationService } from './admin-invitation.service';
import { AdminOwnershipCommandService } from './admin-ownership-command.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({}), AdminAuthModule],
  controllers: [AdminAccessController, AdminInvitationController, AdminInvitationAdminController],
  providers: [
    AdminAccessService,
    AdminAccessSessionService,
    AdminAccountLifecycleService,
    AdminOwnershipCommandService,
    AdminInvitationService,
    AdminInvitationAdminService,
  ],
})
export class AdminAccessModule {}
