import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class ApproveWithdrawalForPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsString()
  @Length(10, 1000)
  riskOverrideReason?: string;
}

export class UploadWithdrawalPaymentProofDto {
  @IsString()
  @MaxLength(2_100_000)
  slipImageData!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slipImageName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  transactionRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class VerifyWithdrawalPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
