import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

import { Role } from '../entities/user.entity';

export class FindUsersQueryDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  filialId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cfoId?: number;

  @IsOptional()
  @IsString()
  q?: string;
}
