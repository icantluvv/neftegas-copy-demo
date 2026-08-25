import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.service.findForUser(user);
  }

  @Post(':id/open')
  open(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.service.open(user, id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  readAll(@CurrentUser() user: User) {
    return this.service.markAllRead(user);
  }

  @Post('by-correction/:correctionId/read')
  @HttpCode(HttpStatus.OK)
  readByCorrection(
    @CurrentUser() user: User,
    @Param('correctionId', ParseIntPipe) correctionId: number,
  ) {
    return this.service.markReadByCorrection(user, correctionId);
  }
}
