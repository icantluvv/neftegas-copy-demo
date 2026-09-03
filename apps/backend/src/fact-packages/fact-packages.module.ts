import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';

import { Notification } from '../notifications/entities/notification.entity';
import { Cfo } from '../org/entities/cfo.entity';
import { Filial } from '../org/entities/filial.entity';
import { FilialCfoLink } from '../org/entities/filial-cfo-link.entity';
import { User } from '../users/entities/user.entity';
import { FactFilesController } from './fact-files.controller';
import { FactPackagesController } from './fact-packages.controller';
import { FactPackagesService } from './fact-packages.service';
import { FactFormVersion } from './entities/fact-form-version.entity';
import { FactForm } from './entities/fact-form.entity';
import { FactPackageCfoStatus } from './entities/fact-package-cfo-status.entity';
import { FactPackageHistoryEntry } from './entities/fact-package-history-entry.entity';
import { FactPackage } from './entities/fact-package.entity';
import { FactPackageRemark } from './entities/fact-package-remark.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FactPackage,
      FactForm,
      FactFormVersion,
      FactPackageCfoStatus,
      FactPackageRemark,
      FactPackageHistoryEntry,
      Filial,
      FilialCfoLink,
      Cfo,
      User,
      Notification,
    ]),
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [FactPackagesController, FactFilesController],
  providers: [FactPackagesService],
})
export class FactPackagesModule {}
