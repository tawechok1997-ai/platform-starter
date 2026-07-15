import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, IsUrl, Matches, Max, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateMemberBankAccountDto {
  @Transform(trim) @IsString() @MaxLength(100) bankName!: string;
  @Transform(trim) @IsString() @MaxLength(150) accountName!: string;
  @Transform(trim) @IsString() @Matches(/^\d{6,20}$/) @MaxLength(32) accountNumber!: string;
}

export class ReceivingBankAccountDto extends CreateMemberBankAccountDto {
  @IsOptional() @Transform(trim) @IsString() @MaxLength(32) promptPay?: string;
  @IsOptional() @Transform(trim) @IsUrl({ require_protocol: true }) @MaxLength(500) qrImageUrl?: string;
  @IsOptional() @IsNumber() @Min(0) minAmount?: number | null;
  @IsOptional() @IsNumber() @Min(0) maxAmount?: number | null;
  @IsOptional() @IsIn(['ACTIVE', 'DISABLED', 'PENDING_REVIEW', 'REJECTED']) status?:
    'ACTIVE' | 'DISABLED' | 'PENDING_REVIEW' | 'REJECTED';
  @IsOptional() @IsInt() @Min(0) @Max(10000) sortOrder?: number;
}

export class UpdateReceivingBankAccountDto {
  @IsOptional() @Transform(trim) @IsString() @MaxLength(100) bankName?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(150) accountName?: string;
  @IsOptional() @Transform(trim) @IsString() @Matches(/^\d{6,20}$/) @MaxLength(32) accountNumber?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(32) promptPay?: string;
  @IsOptional() @Transform(trim) @IsUrl({ require_protocol: true }) @MaxLength(500) qrImageUrl?: string;
  @IsOptional() @IsNumber() @Min(0) minAmount?: number | null;
  @IsOptional() @IsNumber() @Min(0) maxAmount?: number | null;
  @IsOptional() @IsIn(['ACTIVE', 'DISABLED', 'PENDING_REVIEW', 'REJECTED']) status?:
    'ACTIVE' | 'DISABLED' | 'PENDING_REVIEW' | 'REJECTED';
  @IsOptional() @IsInt() @Min(0) @Max(10000) sortOrder?: number;
}

export class ReviewMemberBankAccountDto {
  @IsIn(['ACTIVE', 'REJECTED', 'PENDING_REVIEW', 'DISABLED']) status!:
    'ACTIVE' | 'REJECTED' | 'PENDING_REVIEW' | 'DISABLED';
  @IsOptional() @Transform(trim) @IsString() @MaxLength(500) adminNote?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(500) riskOverrideReason?: string;
}
