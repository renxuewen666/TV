import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateApiDto {
  @IsString()
  name: string;

  @IsInt()
  type: number;

  @IsString()
  url: string;

  @IsOptional() @IsString()
  remark?: string;

  @IsOptional() @IsInt() @Min(0)
  minMemberLevel?: number;

  @IsOptional() @IsInt()
  priority?: number;

  @IsOptional() @IsBoolean()
  isDefault?: boolean;

  @IsOptional() @IsInt()
  status?: number;

  @IsOptional() @IsString()
  appIds?: string;

  @IsOptional() @IsString()
  ext?: string;
}

export class UpdateApiDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsInt()
  type?: number;

  @IsOptional() @IsString()
  url?: string;

  @IsOptional() @IsString()
  remark?: string;

  @IsOptional() @IsInt() @Min(0)
  minMemberLevel?: number;

  @IsOptional() @IsInt()
  priority?: number;

  @IsOptional() @IsBoolean()
  isDefault?: boolean;

  @IsOptional() @IsInt()
  status?: number;

  @IsOptional() @IsString()
  appIds?: string;

  @IsOptional() @IsString()
  ext?: string;
}
