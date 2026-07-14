import { Injectable } from '@nestjs/common';
import { AdminActivityQuery, AdminActivityQueryService } from './admin-activity-query.service';

@Injectable()
export class ActivityService {
  constructor(private readonly adminActivityQuery: AdminActivityQueryService) {}

  getAdminActivity(query: AdminActivityQuery = {}) {
    return this.adminActivityQuery.execute(query);
  }
}
