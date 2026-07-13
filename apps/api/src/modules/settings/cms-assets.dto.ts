import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UploadCmsAssetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(180)
  name!: string;

  @IsString()
  @MinLength(32)
  dataUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  tag?: string;

  @IsOptional()
  @IsIn(['image', 'video'])
  type?: 'image' | 'video';
}

export class DeleteCmsAssetDto {
  @IsString()
  @MinLength(10)
  @MaxLength(160)
  storageKey!: string;
}
