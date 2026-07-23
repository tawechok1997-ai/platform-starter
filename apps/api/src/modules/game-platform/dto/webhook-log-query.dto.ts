import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const WEBHOOK_LOG_STATUSES = ['RECEIVED', 'PROCESSED', 'FAILED', 'DUPLICATE', 'IGNORED', 'RESOLVED'] as const;

export class WebhookLogQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @IsIn(WEBHOOK_LOG_STATUSES)
  status?: (typeof WEBHOOK_LOG_STATUSES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}
