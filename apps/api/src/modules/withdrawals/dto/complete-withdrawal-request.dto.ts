import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CompleteWithdrawalRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  paymentTransactionRef!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}
