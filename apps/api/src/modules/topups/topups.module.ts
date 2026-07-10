import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { TopUpsController } from './topups.controller';
import { TopUpsService } from './topups.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({}), StorageModule],
  controllers: [TopUpsController],
  providers: [TopUpsService],
  exports: [TopUpsService],
})
export class TopUpsModule {}
