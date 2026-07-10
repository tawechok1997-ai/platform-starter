import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}
