import { IsString, IsOptional, IsNumber, IsInt } from 'class-validator';

export class CreateLevelDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsInt()
  duration: number;

  @IsOptional()
  @IsInt()
  sort?: number;
}

export class UpdateLevelDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsNumber()
  price?: number;

  @IsOptional() @IsInt()
  duration?: number;

  @IsOptional() @IsInt()
  sort?: number;

  @IsOptional() @IsInt()
  status?: number;
}
