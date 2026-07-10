import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { QueuesService } from './queues.service';

@UseGuards(AdminAuthGuard)
@Controller('admin/queues')
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @Get('summary')
  getSummary() {
    return this.queuesService.getSummary();
  }
}
