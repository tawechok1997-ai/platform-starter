import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  health() {
    return this.healthService.health();
  }

  @Get('version')
  version() {
    return this.healthService.version();
  }

  @Get('metrics')
  metrics() {
    return this.healthService.metrics();
  }
}
