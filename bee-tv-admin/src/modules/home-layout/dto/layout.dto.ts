import { IsString, IsOptional } from 'class-validator';

export class CreateLayoutDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsOptional() @IsString()
  page?: string;

  @IsString()
  template: string;

  @IsString()
  config: string;
}

export class UpdateLayoutDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  page?: string;

  @IsOptional() @IsString()
  template?: string;

  @IsOptional() @IsString()
  config?: string;

  @IsOptional()
  status?: number;
}
