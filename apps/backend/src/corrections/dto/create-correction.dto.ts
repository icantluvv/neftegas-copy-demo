import { IsInt } from 'class-validator';

export class CreateCorrectionDto {
  @IsInt()
  correctionTypeId: number;
}
