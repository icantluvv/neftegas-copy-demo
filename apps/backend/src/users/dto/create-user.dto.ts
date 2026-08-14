import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { Role } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(9)
  password: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsEnum(Role)
  role: Role;

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
}
