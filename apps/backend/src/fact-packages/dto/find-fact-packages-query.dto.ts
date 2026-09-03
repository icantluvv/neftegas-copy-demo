import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

import { Direction } from '../fact-form-catalog';
import { FactPackageStatus } from '../entities/fact-package.entity';

export class FindFactPackagesQueryDto {
  @IsOptional()
  @IsIn(Object.values(Direction))
  direction?: Direction;

  @IsOptional()
  @IsIn(Object.values(FactPackageStatus))
  status?: FactPackageStatus;

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number = 20;
}
