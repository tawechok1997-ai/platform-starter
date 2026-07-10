import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { AntiBotAdminController, AntiBotPublicController } from './anti-bot.controller';
import { AntiBotService } from './anti-bot.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [AntiBotAdminController, AntiBotPublicController],
  providers: [AntiBotService],
  exports: [AntiBotService],
})
export class AntiBotModule {}
