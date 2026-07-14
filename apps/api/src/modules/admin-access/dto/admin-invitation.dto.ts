import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class AcceptAdminInvitationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(64)
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(256)
  secret!: string;
}
