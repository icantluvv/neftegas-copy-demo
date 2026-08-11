import { IsString } from 'class-validator';

export class RemarkReopenDto {
  @IsString()
  description: string;

  @IsString()
  requiredAction: string;
}
