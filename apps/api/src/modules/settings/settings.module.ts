import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { CmsAssetsController } from './cms-assets.controller';
import { CmsAssetsService } from './cms-assets.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({}), StorageModule],
  controllers: [SettingsController, CmsAssetsController],
  providers: [SettingsService, CmsAssetsService],
  exports: [SettingsService, CmsAssetsService],
})
export class SettingsModule {}
