import { IsInt, IsOptional, IsString } from 'class-validator';

export class PlanRemarkCreateDto {
  @IsString()
  description: string;

  @IsString()
  requiredAction: string;

  @IsOptional()
  @IsString()
  sheetName?: string;

  @IsOptional()
  @IsString()
  rowRef?: string;

  @IsOptional()
  @IsString()
  cellRef?: string;

  @IsOptional()
  @IsInt()
  relatedSlotId?: number;

  @IsOptional()
  @IsInt()
  fileVersionId?: number;
}
