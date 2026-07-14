import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class UpdateAntiBotConfigDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsIn(['TURNSTILE', 'RECAPTCHA', 'HCAPTCHA']) provider?: 'TURNSTILE' | 'RECAPTCHA' | 'HCAPTCHA';
  @IsOptional() @Transform(trim) @IsString() @MaxLength(200) siteKey?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(500) secret?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100) scoreThreshold?: number;
  @IsOptional() @IsBoolean() emergencyMode?: boolean;
}

export class TestAntiBotProviderDto {
  @Transform(trim)
  @IsString()
  @MaxLength(4000)
  token!: string;
}
