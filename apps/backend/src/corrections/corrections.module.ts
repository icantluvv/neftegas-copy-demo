import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';

import { Notification } from '../notifications/entities/notification.entity';
import { Cfo } from '../org/entities/cfo.entity';
import { CorrectionType } from '../org/entities/correction-type.entity';
import { Filial } from '../org/entities/filial.entity';
import { FilialCfoLink } from '../org/entities/filial-cfo-link.entity';
import { PackageRequirement } from '../org/entities/package-requirement.entity';
import { User } from '../users/entities/user.entity';
import { CorrectionsController } from './corrections.controller';
import { CorrectionsService } from './corrections.service';
import { CorrectionCfoStatus } from './entities/correction-cfo-status.entity';
import { CorrectionFilialStatus } from './entities/correction-filial-status.entity';
import { CorrectionHistoryEntry } from './entities/correction-history-entry.entity';
import { Correction } from './entities/correction.entity';
import { DocumentSlot } from './entities/document-slot.entity';
import { FileVersion } from './entities/file-version.entity';
import { Remark } from './entities/remark.entity';
import { FilesController } from './files.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Correction,
      DocumentSlot,
      FileVersion,
      CorrectionCfoStatus,
      CorrectionFilialStatus,
      Remark,
      CorrectionHistoryEntry,
      CorrectionType,
      Filial,
      FilialCfoLink,
      PackageRequirement,
      Cfo,
      User,
      Notification,
    ]),
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [CorrectionsController, FilesController],
  providers: [CorrectionsService],
})
export class CorrectionsModule {}
