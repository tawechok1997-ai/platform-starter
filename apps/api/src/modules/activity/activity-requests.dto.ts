import {
  Allow,
  IsDateString,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ActivityMetricRequest {
  @IsString()
  @MaxLength(128)
  memberId!: string;

  @IsString()
  @MaxLength(128)
  metricCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.00000001)
  @Max(1_000_000_000_000)
  value!: number;

  @IsString()
  @MaxLength(64)
  sourceType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  sourceId?: string;

  @IsString()
  @MaxLength(256)
  idempotencyKey!: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class LotteryNumberRequest {
  // Digit length is round-specific and remains enforced by MemberActivitiesService.
  @Allow()
  topNumber?: unknown;

  @Allow()
  bottomNumber?: unknown;
}
