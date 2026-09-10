import { IsInt } from 'class-validator';

export class UpdatePlanTypeDto {
  @IsInt()
  planTypeId: number;
}
