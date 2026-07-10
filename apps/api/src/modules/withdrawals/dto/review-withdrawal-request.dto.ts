import { IsOptional, IsString } from 'class-validator';

export class ReviewWithdrawalRequestDto {
  @IsOptional()
  @IsString()
  adminNote?: string;
}
