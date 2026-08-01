import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateAttachmentDto {
  @IsString()
  name: string;

  @IsString()
  url: string;

  @IsOptional() @IsInt()
  size?: number;

  @IsOptional() @IsString()
  type?: string;

  @IsOptional() @IsString()
  module?: string;

  @IsOptional() @IsString()
  uploader?: string;

  @IsOptional() @IsInt()
  status?: number;
}

export class UpdateAttachmentDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  url?: string;

  @IsOptional() @IsInt()
  size?: number;

  @IsOptional() @IsString()
  type?: string;

  @IsOptional() @IsString()
  module?: string;

  @IsOptional() @IsString()
  uploader?: string;

  @IsOptional() @IsInt()
  status?: number;
}
