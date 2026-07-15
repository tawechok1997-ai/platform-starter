import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { AdminDashboardReadModel } from './admin-dashboard-read.model';
import { AdminReportReadModel } from './admin-report-read.model';
import { ReportsController } from './reports.controller';
import { ReportsQueryService } from './reports-query.service';
import { ReportsService } from './reports.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [ReportsController],
  providers: [AdminDashboardReadModel, AdminReportReadModel, ReportsQueryService, ReportsService],
})
export class ReportsModule {}
