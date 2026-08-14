import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CorrectionType } from './entities/correction-type.entity';
import { OrgController } from './org.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CorrectionType])],
  controllers: [OrgController],
})
export class OrgModule {}
