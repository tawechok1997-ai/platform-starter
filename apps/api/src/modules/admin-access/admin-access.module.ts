import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { AdminAccessController } from './admin-access.controller';
import { AdminAccessService } from './admin-access.service';
import { AdminInvitationController } from './admin-invitation.controller';
import { AdminInvitationService } from './admin-invitation.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [AdminAccessController, AdminInvitationController],
  providers: [AdminAccessService, AdminInvitationService],
})
export class AdminAccessModule {}
