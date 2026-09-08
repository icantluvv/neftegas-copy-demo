import { IsEnum } from 'class-validator';

import { Direction } from '../fact-form-catalog';

export class CreateFactPackageDto {
  @IsEnum(Direction)
  direction: Direction;
}
