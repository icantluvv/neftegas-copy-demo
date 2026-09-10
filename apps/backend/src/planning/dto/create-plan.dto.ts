import { IsInt } from 'class-validator';

export class CreatePlanDto {
  @IsInt()
  planTypeId: number;
}
