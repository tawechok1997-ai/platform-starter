import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
