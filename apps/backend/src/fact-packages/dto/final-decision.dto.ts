import { IsIn } from 'class-validator';

export enum FinalDecision {
  APPROVE = 'APPROVE',
  RETURN = 'RETURN',
}

export class FinalDecisionDto {
  @IsIn(Object.values(FinalDecision))
  decision: FinalDecision;
}
