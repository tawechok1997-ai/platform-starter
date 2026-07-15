import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageSignedAccessService } from './storage-signed-access.service';
import { StorageService } from './storage.service';

@Module({
  controllers: [StorageController],
  providers: [StorageService, StorageSignedAccessService],
  exports: [StorageService, StorageSignedAccessService],
})
export class StorageModule {}
