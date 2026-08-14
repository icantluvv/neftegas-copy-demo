import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class FindCorrectionTypesQueryDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
