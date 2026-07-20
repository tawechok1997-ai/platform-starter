import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class ProviderSimulatorHealthRequestDto {
  @IsOptional()
  @IsBoolean()
  ping?: boolean;
}

export class ProviderSimulatorLaunchRequestDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  gameCode!: string;

  @IsString()
  @IsNotEmpty()
  sessionId!: string;
}

export class ProviderSimulatorBalanceRequestDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  providerUserId?: string;
}

export class ProviderSimulatorTransferRequestDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  amount!: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class ProviderSimulatorGamesRequestDto {
  @IsOptional()
  @IsString()
  provider?: string;
}

export class ProviderSimulatorBetHistoryRequestDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

export class ProviderSimulatorResetRequestDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
