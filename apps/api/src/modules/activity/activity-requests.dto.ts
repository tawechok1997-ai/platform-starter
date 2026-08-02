import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
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
  validateSync,
} from 'class-validator';
import type {
  ActivityLotteryNumbersInput,
  ActivityMetricInput,
} from './activity-inputs';

const MAX_METRICS_PER_REQUEST = 500;

export class ActivityMetricRequest implements ActivityMetricInput {
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

export class LotteryNumberRequest implements ActivityLotteryNumbersInput {
  // Digit length is round-specific and remains enforced by MemberActivitiesService.
  @Allow()
  topNumber?: unknown;

  @Allow()
  bottomNumber?: unknown;
}

export function parseActivityMetricBatch(
  value: ActivityMetricRequest | ActivityMetricRequest[],
): ActivityMetricRequest[] {
  const rawItems: unknown[] = Array.isArray(value) ? value : [value];

  if (rawItems.length > MAX_METRICS_PER_REQUEST) {
    throw new BadRequestException({
      code: 'ACTIVITY_METRIC_BATCH_TOO_LARGE',
      message: `A maximum of ${MAX_METRICS_PER_REQUEST} activity metrics is allowed per request`,
    });
  }

  return rawItems.map((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw invalidMetricRequest(index, []);
    }

    const request = plainToInstance(ActivityMetricRequest, raw);
    const errors = validateSync(request, {
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
    });

    if (errors.length > 0) {
      throw invalidMetricRequest(
        index,
        errors.map((error) => error.property).filter(Boolean),
      );
    }

    return request;
  });
}

function invalidMetricRequest(index: number, fields: string[]) {
  return new BadRequestException({
    code: 'INVALID_ACTIVITY_METRIC',
    message: 'Activity metric payload is invalid',
    index,
    fields,
  });
}
