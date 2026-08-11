import { Controller, Get, Param, ParseIntPipe, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CorrectionsService } from './corrections.service';

@ApiTags('Corrections')
@Controller('files')
export class FilesController {
  constructor(private service: CorrectionsService) {}

  @Get(':id/download')
  async download(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { buffer, fileName, mimeType } = await this.service.downloadFileVersion(user, id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(buffer);
  }
}
