import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
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
  @IsIn(['ACTIVE', 'SUSPENDED', 'LOCKED'])
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

export class CreateAdminTeamDto {
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9_-]{1,79}$/)
  code!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  parentTeamId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  managerAdminId?: string;
}

export class UpdateAdminTeamDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9_-]{1,79}$/)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  parentTeamId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  managerAdminId?: string;
}

export class SetAdminTeamMemberDto {
  @IsString()
  @MaxLength(128)
  adminUserId!: string;

  @IsOptional()
  @IsBoolean()
  isLead?: boolean;
}

export class SetAdminReportingLineDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  managerAdminId?: string | null;
}

export class SetAdminPermissionOverrideDto {
  @IsString()
  @MaxLength(120)
  permissionCode!: string;

  @IsString()
  @IsIn(['ALLOW', 'DENY'])
  effect!: 'ALLOW' | 'DENY';

  @IsString()
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateAdminAccessProfileDto {
  @IsObject()
  scope!: Record<string, unknown>;

  @IsObject()
  approvalLimits!: Record<string, unknown>;

  @IsString()
  @MaxLength(500)
  reason!: string;
}
