import { IsBoolean, IsNumber, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateMemberGroupDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsInt()
  duration: number;

  @IsOptional()
  @IsBoolean()
  isPermanent?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsInt()
  dailyScore?: number;

  @IsOptional()
  @IsInt()
  status?: number;

  @IsOptional()
  @IsInt()
  sort?: number;
}

export class UpdateMemberGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsInt()
  duration?: number;

  @IsOptional()
  @IsBoolean()
  isPermanent?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsInt()
  dailyScore?: number;

  @IsOptional()
  @IsInt()
  status?: number;

  @IsOptional()
  @IsInt()
  sort?: number;
}

export class QueryMemberGroupsDto {
  @IsOptional()
  @IsInt()
  levelId?: number;

  @IsOptional()
  @IsInt()
  status?: number;

  @IsOptional()
  @IsInt()
  page?: number;

  @IsOptional()
  @IsInt()
  size?: number;
}