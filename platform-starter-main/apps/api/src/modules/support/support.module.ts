import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
