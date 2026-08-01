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

  @IsOptional() @IsString()
  appId?: string;
}

export class UpdateVersionDto {
  @IsOptional() @IsString()
  versionName?: string;

  @IsOptional() @IsInt()
  versionCode?: number;

  @IsOptional() @IsString()
  downloadUrl?: string;

  @IsOptional() @IsString()
  channel?: string;

  @IsOptional() @IsString()
  appId?: string;

  @IsOptional() @IsString()
  changelog?: string;

  @IsOptional() @IsInt()
  forceUpdate?: number;

  @IsOptional() @IsInt()
  status?: number;
}

export class CreateChannelDto {
  @IsString()
  name: string;

  @IsOptional() @IsString()
  packageId?: string;
}
