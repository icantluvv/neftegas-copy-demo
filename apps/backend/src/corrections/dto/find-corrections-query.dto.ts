import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

import { CorrectionStatus } from '../entities/correction.entity';

export class FindCorrectionsQueryDto {
  @IsOptional()
  @IsIn(Object.values(CorrectionStatus))
  status?: CorrectionStatus;

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
  correctionTypeId?: number;

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
