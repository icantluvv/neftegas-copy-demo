import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiTags } from '@nestjs/swagger';
import { Repository } from 'typeorm';

import { toCorrectionTypeDto } from '../corrections/corrections.mapper';
import { FindCorrectionTypesQueryDto } from './dto/find-correction-types-query.dto';
import { CorrectionType } from './entities/correction-type.entity';

@ApiTags('Org')
@Controller('org')
export class OrgController {
  constructor(
    @InjectRepository(CorrectionType)
    private correctionTypes: Repository<CorrectionType>,
  ) {}

  @Get('correction-types')
  async findCorrectionTypes(@Query() query: FindCorrectionTypesQueryDto) {
    const types = await this.correctionTypes.find({
      where: query.isActive === undefined ? {} : { isActive: query.isActive },
      order: { id: 'ASC' },
    });
    return types.map(toCorrectionTypeDto);
  }
}
