import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtAuthModule } from '../../common/security/jwt-auth.module';
import { AdminMembersController } from './admin-members.controller';
import { AdminMembersService } from './admin-members.service';
import { AdminMembersQueryService } from './admin-members-query.service';
import { AdminMembersCommandService } from './admin-members-command.service';

@Module({
  imports: [DatabaseModule, JwtAuthModule],
  controllers: [AdminMembersController],
  providers: [AdminMembersService, AdminMembersQueryService, AdminMembersCommandService],
  exports: [AdminMembersService, AdminMembersQueryService, AdminMembersCommandService],
})
export class AdminMembersModule {}
