import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/security/jwt-auth.module';
import { DatabaseModule } from '../../database/database.module';
import { AdminActivityController } from './admin-activity.controller';
import { AdminActivityService } from './admin-activity.service';

@Module({
  imports: [DatabaseModule, JwtAuthModule],
  controllers: [AdminActivityController],
  providers: [AdminActivityService],
  exports: [AdminActivityService],
})
export class AdminActivityModule {}
