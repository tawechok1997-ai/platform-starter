import { IsString, MinLength } from 'class-validator';

export class ChangeMemberPasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
