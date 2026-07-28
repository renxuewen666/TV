import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateVersionDto {
  @IsString()
  versionName: string;

  @IsInt()
  versionCode: number;

  @IsString()
  downloadUrl: string;

  @IsOptional() @IsString()
  channel?: string;

  @IsOptional() @IsString()
  changelog?: string;

  @IsOptional() @IsInt()
  forceUpdate?: number;
}

export class CreateChannelDto {
  @IsString()
  name: string;

  @IsOptional() @IsString()
  packageId?: string;
}
