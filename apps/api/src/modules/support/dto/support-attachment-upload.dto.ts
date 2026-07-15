import { IsIn, IsOptional, IsString, Length, Matches, ValidateIf } from 'class-validator';

const SUPPORT_UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
] as const;

export class UploadSupportAttachmentDto {
  @IsString()
  @Length(1, 255)
  originalName!: string;

  @IsIn(SUPPORT_UPLOAD_MIME_TYPES)
  mimeType!: (typeof SUPPORT_UPLOAD_MIME_TYPES)[number];

  @ValidateIf((value) => !value.dataUrl)
  @IsString()
  @Matches(/^[a-z0-9+/=\r\n]+$/i)
  contentBase64?: string;

  @IsOptional()
  @IsString()
  @Matches(/^data:[a-z0-9.+-]+\/[a-z0-9.+-]+;base64,[a-z0-9+/=\r\n]+$/i)
  dataUrl?: string;
}
