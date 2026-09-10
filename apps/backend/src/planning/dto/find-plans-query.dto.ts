import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

import { PlanStatus } from '../entities/plan.entity';

export class FindPlansQueryDto {
  @IsOptional()
  @IsIn(Object.values(PlanStatus))
  status?: PlanStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  filialId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cfoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  planTypeId?: number;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  onlyWithRemarks?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number = 20;
}
