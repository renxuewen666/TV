import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

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

  @IsOptional()
  @IsInt()
  status?: number;
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

export class CreateMemberDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsOptional() @IsString()
  email?: string;

  @IsOptional() @IsString()
  nickname?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsInt()
  levelId?: number;

  @IsOptional() @IsInt()
  score?: number;

  @IsOptional() @IsNumber()
  balance?: number;

  @IsOptional() @IsInt()
  status?: number;

  @IsOptional() @IsString()
  remark?: string;
}

export class UpdateMemberDto {
  @IsOptional() @IsString()
  username?: string;

  @IsOptional() @IsString()
  password?: string;

  @IsOptional() @IsString()
  email?: string;

  @IsOptional() @IsString()
  nickname?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsInt()
  levelId?: number;

  @IsOptional() @IsInt()
  score?: number;

  @IsOptional() @IsNumber()
  balance?: number;

  @IsOptional() @IsInt()
  status?: number;

  @IsOptional() @IsString()
  remark?: string;
}

export class BatchMemberDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsInt({ each: true })
  ids: number[];

  @IsIn(['enable', 'disable', 'delete', 'setLevel'])
  action: 'enable' | 'disable' | 'delete' | 'setLevel';

  @IsOptional() @IsInt()
  levelId?: number;

  @IsOptional() @IsString()
  remark?: string;
}

export class CreateMemberRuleDto {
  @IsString()
  name: string;

  @IsOptional() @IsString()
  type?: string;

  @IsOptional() @IsString()
  value?: string;

  @IsOptional() @IsInt()
  levelId?: number;

  @IsOptional() @IsInt()
  status?: number;

  @IsOptional() @IsInt()
  sort?: number;
}

export class UpdateMemberRuleDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  type?: string;

  @IsOptional() @IsString()
  value?: string;

  @IsOptional() @IsInt()
  levelId?: number;

  @IsOptional() @IsInt()
  status?: number;

  @IsOptional() @IsInt()
  sort?: number;
}

export class CreateMemberGroupDto {
  @IsString()
  name: string;

  @IsOptional() @IsInt()
  levelId?: number;

  @IsNumber()
  price: number;

  @IsInt()
  duration: number;

  @IsOptional() @IsBoolean()
  isPermanent?: boolean;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsNumber()
  discount?: number;

  @IsOptional() @IsInt()
  dailyScore?: number;

  @IsOptional() @IsInt()
  status?: number;

  @IsOptional() @IsInt()
  sort?: number;

  @IsOptional() @IsInt()
  deviceLimit?: number;

  @IsOptional() @IsString()
  loginOverflowAction?: string;

  @IsOptional() @IsInt()
  level?: number;
}

export class UpdateMemberGroupDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsInt()
  levelId?: number;

  @IsOptional() @IsNumber()
  price?: number;

  @IsOptional() @IsInt()
  duration?: number;

  @IsOptional() @IsBoolean()
  isPermanent?: boolean;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsNumber()
  discount?: number;

  @IsOptional() @IsInt()
  dailyScore?: number;

  @IsOptional() @IsInt()
  status?: number;

  @IsOptional() @IsInt()
  sort?: number;

  @IsOptional() @IsInt()
  deviceLimit?: number;

  @IsOptional() @IsString()
  loginOverflowAction?: string;

  @IsOptional() @IsInt()
  level?: number;
}
