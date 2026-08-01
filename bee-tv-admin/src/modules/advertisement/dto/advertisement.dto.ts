import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateAdvertisementDto {
  @IsString()
  title: string;

  @IsString()
  image: string;

  @IsOptional() @IsString()
  link?: string;

  @IsOptional() @IsString()
  position?: string;

  @IsOptional() @IsString()
  appIds?: string;

  @IsOptional() @IsInt()
  sort?: number;

  @IsOptional() @IsInt()
  status?: number;

  @IsOptional()
  startAt?: Date;

  @IsOptional()
  endAt?: Date;

  @IsOptional() @IsString()
  params?: string;
}

export class UpdateAdvertisementDto {
  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  image?: string;

  @IsOptional() @IsString()
  link?: string;

  @IsOptional() @IsString()
  position?: string;

  @IsOptional() @IsString()
  appIds?: string;

  @IsOptional() @IsInt()
  sort?: number;

  @IsOptional() @IsInt()
  status?: number;

  @IsOptional()
  startAt?: Date;

  @IsOptional()
  endAt?: Date;

  @IsOptional() @IsString()
  params?: string;
}
