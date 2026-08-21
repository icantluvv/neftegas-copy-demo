import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, User } from '../users/entities/user.entity';
import { CorrectionsService } from './corrections.service';
import { CfoSelectionDto } from './dto/cfo-selection.dto';
import { CreateCorrectionDto } from './dto/create-correction.dto';
import { FindCorrectionsQueryDto } from './dto/find-corrections-query.dto';
import { RemarkCreateDto } from './dto/remark-create.dto';
import { RemarkReopenDto } from './dto/remark-reopen.dto';
import { UploadFileDto } from './dto/upload-file.dto';

@ApiTags('Corrections')
@Controller('corrections')
export class CorrectionsController {
  constructor(private service: CorrectionsService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() query: FindCorrectionsQueryDto) {
    return this.service.findAll(user, query);
  }

  @Roles(Role.FILIAL)
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateCorrectionDto) {
    return this.service.create(user, dto);
  }

  @Get('stats')
  stats(@CurrentUser() user: User) {
    return this.service.getStats(user);
  }

  @Roles(Role.FILIAL)
  @Get('stats/filial')
  filialStats(@CurrentUser() user: User) {
    return this.service.getStats(user);
  }

  @Roles(Role.CFO)
  @Get('stats/cfo')
  cfoStats(@CurrentUser() user: User) {
    return this.service.getStats(user);
  }

  @Roles(Role.DTOE)
  @Get('stats/dtoe')
  dtoeStats(@CurrentUser() user: User) {
    return this.service.getStats(user);
  }

  @Get(':humanId')
  findOne(@CurrentUser() user: User, @Param('humanId') humanId: string) {
    return this.service.findOne(user, humanId);
  }

  @Roles(Role.FILIAL)
  @UseInterceptors(FileInterceptor('file'))
  @Post(':humanId/slots/:slotId/files')
  uploadFile(
    @CurrentUser() user: User,
    @Param('humanId') humanId: string,
    @Param('slotId', ParseIntPipe) slotId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    return this.service.uploadFileVersion(
      user,
      humanId,
      slotId,
      file,
      dto.note,
      dto.remarkId,
    );
  }

  @Roles(Role.FILIAL)
  @Post(':humanId/send')
  send(
    @CurrentUser() user: User,
    @Param('humanId') humanId: string,
    @Body() dto: CfoSelectionDto,
  ) {
    return this.service.send(user, humanId, dto);
  }

  @Roles(Role.FILIAL)
  @Post(':humanId/resubmit')
  resubmit(
    @CurrentUser() user: User,
    @Param('humanId') humanId: string,
    @Body() dto: CfoSelectionDto,
  ) {
    return this.service.resubmit(user, humanId, dto);
  }

  @Roles(Role.CFO)
  @Post(':humanId/send-to-dtoe')
  sendToDtoe(@CurrentUser() user: User, @Param('humanId') humanId: string) {
    return this.service.sendToDtoe(user, humanId);
  }

  @Roles(Role.FILIAL)
  @Post(':humanId/resubmit-to-dtoe')
  resubmitToDtoe(@CurrentUser() user: User, @Param('humanId') humanId: string) {
    return this.service.resubmitToDtoe(user, humanId);
  }

  @Roles(Role.CFO)
  @Post(':humanId/cfo-approve')
  cfoApprove(@CurrentUser() user: User, @Param('humanId') humanId: string) {
    return this.service.cfoApprove(user, humanId);
  }

  @Roles(Role.CFO, Role.DTOE)
  @Post(':humanId/remarks')
  leaveRemark(
    @CurrentUser() user: User,
    @Param('humanId') humanId: string,
    @Body() dto: RemarkCreateDto,
  ) {
    return this.service.leaveRemark(user, humanId, dto);
  }

  @Roles(Role.CFO)
  @Post(':humanId/cfo-return')
  cfoReturn(@CurrentUser() user: User, @Param('humanId') humanId: string) {
    return this.service.cfoReturn(user, humanId);
  }

  @Roles(Role.DTOE)
  @Post(':humanId/dtoe-approve')
  dtoeApprove(@CurrentUser() user: User, @Param('humanId') humanId: string) {
    return this.service.dtoeApprove(user, humanId);
  }

  @Roles(Role.DTOE)
  @Post(':humanId/dtoe-return')
  dtoeReturn(@CurrentUser() user: User, @Param('humanId') humanId: string) {
    return this.service.dtoeReturn(user, humanId);
  }

  @Roles(Role.FILIAL)
  @Post(':humanId/remarks/:remarkId/fix')
  markRemarkFixed(
    @CurrentUser() user: User,
    @Param('humanId') humanId: string,
    @Param('remarkId', ParseIntPipe) remarkId: number,
  ) {
    return this.service.markRemarkFixed(user, humanId, remarkId);
  }

  @Roles(Role.CFO)
  @Post(':humanId/remarks/:remarkId/reopen')
  reopenRemark(
    @CurrentUser() user: User,
    @Param('humanId') humanId: string,
    @Param('remarkId', ParseIntPipe) remarkId: number,
    @Body() dto: RemarkReopenDto,
  ) {
    return this.service.reopenRemark(user, humanId, remarkId, dto);
  }

  @Delete(':humanId/remarks/:remarkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRemark(
    @CurrentUser() user: User,
    @Param('humanId') humanId: string,
    @Param('remarkId', ParseIntPipe) remarkId: number,
  ) {
    return this.service.deleteRemark(user, humanId, remarkId);
  }
}
