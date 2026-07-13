import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreatePromotionClaimDto {
  @IsString()
  @MaxLength(128)
  campaignId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsUUID()
  topupId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  depositAmount?: number;
}

export class PromotionStatusQueryDto {
  @IsOptional()
  @IsIn(['ALL', 'OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'])
  status?: string;
}

export class ReviewPromotionClaimDto {
  @IsOptional()
  @IsIn(['APPROVED', 'REJECTED'])
  status?: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNote?: string;
}

export class AddBonusTurnoverDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class UpdateBonusLifecycleDto {
  @IsIn(['RELEASE', 'EXPIRE', 'REVOKE'])
  action!: 'RELEASE' | 'EXPIRE' | 'REVOKE';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
