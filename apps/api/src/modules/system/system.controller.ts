import { Controller, Get } from '@nestjs/common';
import { SystemService } from './system.service';

@Controller()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('healthz')
  healthz() {
    return this.systemService.health();
  }

  @Get('version')
  version() {
    return this.systemService.version();
  }
}
