import { IsString, IsOptional } from 'class-validator';

export class UpdateConfigDto {
  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
