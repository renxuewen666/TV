import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateDanmakuDto {
  @IsString()
  name: string;

  @IsString()
  apiUrl: string;

  @IsOptional() @IsString()
  method?: string;

  @IsOptional() @IsString()
  headers?: string;

  @IsOptional() @IsString()
  params?: string;

  @IsOptional() @IsString()
  urlKeywords?: string;

  @IsOptional() @IsString()
  keywordMode?: string;

  @IsOptional() @IsString()
  appIds?: string;

  @IsOptional() @IsInt()
  status?: number;

  @IsOptional() @IsInt()
  sort?: number;
}

export class UpdateDanmakuDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  apiUrl?: string;

  @IsOptional() @IsString()
  method?: string;

  @IsOptional() @IsString()
  headers?: string;

  @IsOptional() @IsString()
  params?: string;

  @IsOptional() @IsString()
  urlKeywords?: string;

  @IsOptional() @IsString()
  keywordMode?: string;

  @IsOptional() @IsString()
  appIds?: string;

  @IsOptional() @IsInt()
  status?: number;

  @IsOptional() @IsInt()
  sort?: number;
}
