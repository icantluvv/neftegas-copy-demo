import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiTags } from '@nestjs/swagger';
import { Repository } from 'typeorm';

import { toCorrectionTypeDto } from '../corrections/corrections.mapper';
import { toPlanTypeDto } from '../planning/planning.mapper';
import { PlanType } from '../planning/entities/plan-type.entity';
import { FindCorrectionTypesQueryDto } from './dto/find-correction-types-query.dto';
import { FindPlanTypesQueryDto } from './dto/find-plan-types-query.dto';
import { CorrectionType } from './entities/correction-type.entity';

@ApiTags('Org')
@Controller('org')
export class OrgController {
  constructor(
    @InjectRepository(CorrectionType)
    private correctionTypes: Repository<CorrectionType>,
    @InjectRepository(PlanType)
    private planTypes: Repository<PlanType>,
  ) {}

  @Get('correction-types')
  async findCorrectionTypes(@Query() query: FindCorrectionTypesQueryDto) {
    const types = await this.correctionTypes.find({
      where: query.isActive === undefined ? {} : { isActive: query.isActive },
      order: { id: 'ASC' },
    });
    return types.map(toCorrectionTypeDto);
  }

  @Get('plan-types')
  async findPlanTypes(@Query() query: FindPlanTypesQueryDto) {
    const types = await this.planTypes.find({
      where: query.isActive === undefined ? {} : { isActive: query.isActive },
      order: { id: 'ASC' },
    });
    return types.map(toPlanTypeDto);
  }
}
