import { IsOptional, IsString } from 'class-validator';

export class RefreshSessionDto {
  @IsString()
  refreshToken!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
