import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const PROVIDER_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DEGRADED'] as const;
const PROVIDER_HEALTH_FILTERS = ['ATTENTION', 'NORMAL'] as const;

export class GameProviderQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;

  @IsOptional()
  @IsIn(PROVIDER_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(PROVIDER_HEALTH_FILTERS)
  health?: string;

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
