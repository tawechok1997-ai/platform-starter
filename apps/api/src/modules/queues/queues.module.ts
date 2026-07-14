import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { QueuesController } from './queues.controller';
import { QueuesService } from './queues.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [QueuesController],
  providers: [QueuesService],
  exports: [QueuesService],
})
export class QueuesModule {}
