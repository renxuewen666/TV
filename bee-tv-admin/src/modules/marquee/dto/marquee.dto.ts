import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateMarqueeDto {
  @IsString()
  content: string;

  @IsOptional() @IsString()
  color?: string;

  @IsOptional() @IsString()
  bgColor?: string;

  @IsOptional() @IsInt()
  speed?: number;

  @IsOptional() @IsString()
  position?: string;

  @IsOptional() @IsString()
  appIds?: string;

  @IsOptional() @IsInt()
  sort?: number;

  @IsOptional() @IsInt()
  status?: number;
}

export class UpdateMarqueeDto {
  @IsOptional() @IsString()
  content?: string;

  @IsOptional() @IsString()
  color?: string;

  @IsOptional() @IsString()
  bgColor?: string;

  @IsOptional() @IsInt()
  speed?: number;

  @IsOptional() @IsString()
  position?: string;

  @IsOptional() @IsString()
  appIds?: string;

  @IsOptional() @IsInt()
  sort?: number;

  @IsOptional() @IsInt()
  status?: number;
}
