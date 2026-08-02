import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class ActivityMetricInput {
  @IsString()
  memberId!: string;

  @IsString()
  metricCode!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  value!: number;

  @IsString()
  sourceType!: string;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsString()
  idempotencyKey!: string;

  @IsOptional()
  @IsString()
  occurredAt?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export type ActivityMetricsInput = ActivityMetricInput | ActivityMetricInput[];

export class LotteryNumbersInput {
  @IsOptional()
  @IsString()
  topNumber?: string;

  @IsOptional()
  @IsString()
  bottomNumber?: string;
}
