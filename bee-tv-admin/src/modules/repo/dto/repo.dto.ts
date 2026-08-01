import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRepoDto {
  @IsString()
  name: string;

  @IsString()
  url: string;

  @IsInt()
  type: number;

  @IsOptional() @IsInt()
  priority?: number;

  @IsOptional() @IsInt() @Min(0)
  minMemberLevel?: number;

  @IsOptional() @IsBoolean()
  isDefault?: boolean;

  @IsOptional() @IsInt()
  status?: number;
}

export class UpdateRepoDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  url?: string;

  @IsOptional() @IsInt()
  priority?: number;

  @IsOptional() @IsInt() @Min(0)
  minMemberLevel?: number;

  @IsOptional() @IsBoolean()
  isDefault?: boolean;

  @IsOptional() @IsInt()
  status?: number;
}
