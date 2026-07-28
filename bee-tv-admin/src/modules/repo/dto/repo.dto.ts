import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateRepoDto {
  @IsString()
  name: string;

  @IsString()
  url: string;

  @IsInt()
  type: number;

  @IsOptional()
  @IsInt()
  priority?: number;
}

export class UpdateRepoDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  url?: string;

  @IsOptional() @IsInt()
  priority?: number;

  @IsOptional() @IsInt()
  status?: number;
}
