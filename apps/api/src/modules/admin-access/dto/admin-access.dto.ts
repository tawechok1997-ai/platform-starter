import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class TransferOwnershipDto {
  @IsString()
  @MaxLength(128)
  targetAdminId!: string;

  @IsString()
  @MaxLength(32)
  twoFactorCode!: string;

  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class CreateDelegationDto {
  @IsString()
  @MaxLength(128)
  delegateAdminId!: string;

  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(128, { each: true })
  permissionCodes!: string[];

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24 * 30)
  expiresInHours!: number;

  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class ReasonDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class CreateAdminInvitationDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  roleId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(128, { each: true })
  roleIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(128)
  primaryRoleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24 * 30)
  expiresInHours!: number;
}

export class PreviewAdminRoleSelectionDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(128, { each: true })
  roleIds!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(128)
  primaryRoleId?: string;
}

export class SyncAdminRolesDto extends PreviewAdminRoleSelectionDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class ChangeAdminStatusDto {
  @IsString()
  @IsIn(['ACTIVE', 'SUSPENDED', 'DISABLED'])
  status!: string;

  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class AssignAdminRoleDto {
  @IsString()
  @MaxLength(128)
  roleId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
