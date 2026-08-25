import { IsInt } from 'class-validator';

export class UpdateCorrectionTypeDto {
  @IsInt()
  correctionTypeId: number;
}
