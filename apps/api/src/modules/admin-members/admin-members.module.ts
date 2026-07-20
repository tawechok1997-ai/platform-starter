import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtAuthModule } from '../../common/security/jwt-auth.module';
import { AdminMembersController } from './admin-members.controller';
import { AdminMembersService } from './admin-members.service';
import { AdminMembersQueryService } from './admin-members-query.service';
import { AdminMembersCommandService } from './admin-members-command.service';
import { MEMBER_QUERY } from './member-query.contract';

@Module({
  imports: [DatabaseModule, JwtAuthModule],
  controllers: [AdminMembersController],
  providers: [
    AdminMembersService,
    AdminMembersQueryService,
    AdminMembersCommandService,
    { provide: MEMBER_QUERY, useExisting: AdminMembersQueryService },
  ],
  exports: [
    MEMBER_QUERY,
    AdminMembersService,
    AdminMembersQueryService,
    AdminMembersCommandService,
  ],
})
export class AdminMembersModule {}
