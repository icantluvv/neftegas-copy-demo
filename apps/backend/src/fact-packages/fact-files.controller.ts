import { Controller, Get, Param, ParseIntPipe, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { FactPackagesService } from './fact-packages.service';

@ApiTags('FactPackages')
@Controller('fact-files')
export class FactFilesController {
  constructor(private service: FactPackagesService) {}

  @Get(':id/download')
  async download(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { buffer, fileName, mimeType } =
      await this.service.downloadFormVersion(user, id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );
    res.send(buffer);
  }
}
