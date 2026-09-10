import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PlanUploadFileDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  remarkId?: number;
}
