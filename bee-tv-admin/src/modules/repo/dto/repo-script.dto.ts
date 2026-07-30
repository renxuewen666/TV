import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateRepoScriptDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  repoId?: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsInt()
  status?: number;
}

export class UpdateRepoScriptDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsInt()
  repoId?: number;

  @IsOptional() @IsString()
  type?: string;

  @IsOptional() @IsString()
  content?: string;

  @IsOptional() @IsInt()
  sort?: number;

  @IsOptional() @IsInt()
  status?: number;
}

export class QueryRepoScriptDto {
  @IsOptional() @IsInt()
  repoId?: number;

  @IsOptional() @IsString()
  type?: string;

  @IsOptional() @IsInt()
  status?: number;

  @IsOptional() @IsInt()
  page?: number;

  @IsOptional() @IsInt()
  size?: number;
}
