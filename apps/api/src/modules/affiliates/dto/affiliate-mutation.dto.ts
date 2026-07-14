import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const upper = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toUpperCase() : value;

export class UpsertAffiliateProfileDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @Transform(upper)
  @IsString()
  @Length(3, 32)
  referralCode?: string;
}

export class LinkAffiliateReferralDto {
  @Transform(upper)
  @IsString()
  @Length(3, 32)
  referralCode!: string;
}

export class ReviewAffiliateDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}

export class CommissionPreviewDto {
  @Transform(trim)
  @IsString()
  @MaxLength(64)
  agentProfileId!: string;

  @IsNumber()
  @Min(0.01)
  basisAmount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ratePercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  capAmount?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  basis?: string;
}

export class CreateCommissionLedgerDto extends CommissionPreviewDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string;
}
