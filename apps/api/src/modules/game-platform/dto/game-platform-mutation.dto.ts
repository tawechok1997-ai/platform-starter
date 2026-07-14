import { IsArray, IsIn, IsOptional, IsString, IsUrl, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AdapterTestRequestDto {
  [key: string]: unknown;
}

export class ProviderWebhookPayloadDto {
  [key: string]: unknown;
}

export class RecoveryActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class EndpointOverrideDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  type?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  url?: string;
}

export class ApplyProviderPresetDto {
  @IsString()
  @MaxLength(64)
  presetCode!: string;

  @IsString()
  @MaxLength(128)
  name!: string;

  @IsString()
  @MaxLength(64)
  code!: string;

  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  baseUrl!: string;

  @IsOptional() @IsString() @MaxLength(4096) apiKey?: string;
  @IsOptional() @IsString() @MaxLength(4096) secretKey?: string;
  @IsOptional() @IsString() @MaxLength(256) merchantId?: string;
  @IsOptional() @IsString() @MaxLength(256) agentId?: string;
  @IsOptional() @IsString() @MaxLength(4096) webhookSecret?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DEGRADED'])
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DEGRADED';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  enabledEndpoints?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EndpointOverrideDto)
  endpointOverrides?: EndpointOverrideDto[];
}
