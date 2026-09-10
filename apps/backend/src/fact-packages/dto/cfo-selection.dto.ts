import { ArrayMinSize, IsInt, IsOptional } from 'class-validator';

export class CfoSelectionDto {
  @IsOptional()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  cfoIds?: number[];
}
