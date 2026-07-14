import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DepositAdminNoteDto {
  @IsOptional()
  @Transform(({ value }) => value == null ? undefined : String(value).trim())
  @IsString()
  @MaxLength(1000)
  adminNote?: string;
}
