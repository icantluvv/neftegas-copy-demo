import { ArrayMinSize, IsInt } from 'class-validator';

export class CfoSelectionDto {
  @ArrayMinSize(1)
  @IsInt({ each: true })
  cfoIds: number[];
}
