import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { AdminAccessController } from './admin-access.controller';
import { AdminAccessService } from './admin-access.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [AdminAccessController],
  providers: [AdminAccessService],
})
export class AdminAccessModule {}
