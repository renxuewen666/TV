import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateApiDto {
  @IsString()
  name: string;

  @IsInt()
  type: number;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateApiDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  url?: string;

  @IsOptional() @IsString()
  remark?: string;

  @IsOptional() @IsInt()
  status?: number;
}
