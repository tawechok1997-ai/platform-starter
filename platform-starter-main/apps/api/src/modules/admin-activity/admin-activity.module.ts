import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { AdminActivityController } from './admin-activity.controller';
import { AdminActivityService } from './admin-activity.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [AdminActivityController],
  providers: [AdminActivityService],
})
export class AdminActivityModule {}
