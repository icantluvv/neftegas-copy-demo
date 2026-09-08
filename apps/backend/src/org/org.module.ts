import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PlanType } from '../planning/entities/plan-type.entity';
import { CorrectionType } from './entities/correction-type.entity';
import { OrgController } from './org.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CorrectionType, PlanType])],
  controllers: [OrgController],
})
export class OrgModule {}
