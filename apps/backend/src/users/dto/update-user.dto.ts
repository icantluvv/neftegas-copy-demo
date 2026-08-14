import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { Role } from '../entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsInt()
  filialId?: number | null;

  @IsOptional()
  @IsInt()
  cfoId?: number | null;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(9)
  password?: string;
}
