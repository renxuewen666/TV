import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateConfigDto {
  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  group?: string;
}

export class ConfigItemDto {
  @IsString()
  key: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  group?: string;
}

export class BatchUpdateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigItemDto)
  items: ConfigItemDto[];
}

export class TestEmailDto {
  @IsString()
  to: string;
}

export class TestWeatherDto {
  @IsString()
  city: string;
}
