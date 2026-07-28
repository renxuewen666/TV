import { IsString, IsOptional } from 'class-validator';

export class UpdatePaymentConfigDto {
  @IsString()
  config: string;

  @IsOptional()
  @IsString()
  channel?: string;
}
