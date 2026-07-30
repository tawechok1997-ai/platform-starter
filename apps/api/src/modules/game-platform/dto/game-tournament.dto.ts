import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsISO8601, IsInt, IsOptional, IsString, IsUUID, Length, Matches, Max, Min } from 'class-validator';
import { GAME_TOURNAMENT_STATUSES, type GameTournamentStatus, type TournamentWriteInput } from '../game-tournament.types';

export class CreateGameTournamentDto {
  @IsString() @Length(3, 120) name!: string;
  @IsString() @Length(1, 100) @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug!: string;
  @IsOptional() @IsString() @Length(0, 1_000) description?: string;
  @IsOptional() @IsEnum(GAME_TOURNAMENT_STATUSES) status?: GameTournamentStatus;
  @IsISO8601() startsAt!: string;
  @IsISO8601() endsAt!: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500) @IsUUID('4', { each: true }) gameIds!: string[];
  @IsOptional() @IsInt() @Min(5) @Max(200) leaderboardSize?: number;
  @IsOptional() @IsBoolean() radarEnabled?: boolean;
  @IsOptional() @IsInt() @Min(1) @Max(1_440) radarIntervalMinutes?: number;
}

export class UpdateGameTournamentDto {
  @IsOptional() @IsString() @Length(3, 120) name?: string;
  @IsOptional() @IsString() @Length(1, 100) @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug?: string;
  @IsOptional() @IsString() @Length(0, 1_000) description?: string;
  @IsOptional() @IsEnum(GAME_TOURNAMENT_STATUSES) status?: GameTournamentStatus;
  @IsOptional() @IsISO8601() startsAt?: string;
  @IsOptional() @IsISO8601() endsAt?: string;
  @IsOptional() @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500) @IsUUID('4', { each: true }) gameIds?: string[];
  @IsOptional() @IsInt() @Min(5) @Max(200) leaderboardSize?: number;
  @IsOptional() @IsBoolean() radarEnabled?: boolean;
  @IsOptional() @IsInt() @Min(1) @Max(1_440) radarIntervalMinutes?: number;
}

export function normalizeCreateGameTournamentDto(body: CreateGameTournamentDto): TournamentWriteInput {
  return { ...body, gameIds: [...body.gameIds] };
}

export function normalizeUpdateGameTournamentDto(body: UpdateGameTournamentDto): TournamentWriteInput {
  return { ...body, gameIds: body.gameIds ? [...body.gameIds] : undefined };
}
