import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
