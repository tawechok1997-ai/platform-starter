import { IsOptional, IsString } from 'class-validator';

export class ReviewTopUpRequestDto {
  @IsOptional()
  @IsString()
  adminNote?: string;
}
