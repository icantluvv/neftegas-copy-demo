import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';

import { Notification } from '../notifications/entities/notification.entity';
import { Cfo } from '../org/entities/cfo.entity';
import { Filial } from '../org/entities/filial.entity';
import { FilialCfoLink } from '../org/entities/filial-cfo-link.entity';
import { User } from '../users/entities/user.entity';
import { PlanCfoStatus } from './entities/plan-cfo-status.entity';
import { PlanDocumentSlot } from './entities/plan-document-slot.entity';
import { PlanFileVersion } from './entities/plan-file-version.entity';
import { PlanHistoryEntry } from './entities/plan-history-entry.entity';
import { PlanPackageRequirement } from './entities/plan-package-requirement.entity';
import { PlanRemark } from './entities/plan-remark.entity';
import { PlanType } from './entities/plan-type.entity';
import { Plan } from './entities/plan.entity';
import { PlanFilesController } from './files.controller';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plan,
      PlanDocumentSlot,
      PlanFileVersion,
      PlanCfoStatus,
      PlanRemark,
      PlanHistoryEntry,
      PlanType,
      PlanPackageRequirement,
      Filial,
      FilialCfoLink,
      Cfo,
      User,
      Notification,
    ]),
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [PlanningController, PlanFilesController],
  providers: [PlanningService],
})
export class PlanningModule {}
