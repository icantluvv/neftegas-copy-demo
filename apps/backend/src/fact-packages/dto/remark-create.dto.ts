import { IsInt, IsString } from 'class-validator';

export class RemarkCreateDto {
  @IsInt()
  relatedFormId: number;

  @IsString()
  description: string;

  @IsString()
  requiredAction: string;
}
