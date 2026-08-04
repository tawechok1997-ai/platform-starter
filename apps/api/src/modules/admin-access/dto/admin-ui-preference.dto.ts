import { IsObject } from 'class-validator';

export class UpdateAdminUiPreferenceDto {
  @IsObject()
  value!: Record<string, unknown>;
}
