import { ArrayMinSize, IsInt } from 'class-validator';

export class PlanCfoSelectionDto {
  @ArrayMinSize(1)
  @IsInt({ each: true })
  cfoIds: number[];
}
