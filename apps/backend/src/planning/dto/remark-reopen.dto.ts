import { IsString } from 'class-validator';

export class PlanRemarkReopenDto {
  @IsString()
  description: string;

  @IsString()
  requiredAction: string;
}
