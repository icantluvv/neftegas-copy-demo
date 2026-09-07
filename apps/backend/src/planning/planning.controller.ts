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
import { PlanCfoSelectionDto } from './dto/cfo-selection.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { FindPlansQueryDto } from './dto/find-plans-query.dto';
import { PlanRemarkCreateDto } from './dto/remark-create.dto';
import { PlanRemarkReopenDto } from './dto/remark-reopen.dto';
import { UpdatePlanTypeDto } from './dto/update-plan-type.dto';
import { PlanUploadFileDto } from './dto/upload-file.dto';
import { PlanningService } from './planning.service';

@ApiTags('Plans')
@Controller('plans')
export class PlanningController {
  constructor(private service: PlanningService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() query: FindPlansQueryDto) {
    return this.service.findAll(user, query);
  }

  @Roles(Role.FILIAL)
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreatePlanDto) {
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
  @Delete(':humanId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePlan(@CurrentUser() user: User, @Param('humanId') humanId: string) {
    return this.service.deletePlan(user, humanId);
  }

  @Roles(Role.FILIAL)
  @Post(':humanId/change-type')
  changeType(
    @CurrentUser() user: User,
    @Param('humanId') humanId: string,
    @Body() dto: UpdatePlanTypeDto,
  ) {
    return this.service.updatePlanType(user, humanId, dto);
  }

  @Roles(Role.FILIAL)
  @UseInterceptors(FileInterceptor('file'))
  @Post(':humanId/slots/:slotId/files')
  uploadFile(
    @CurrentUser() user: User,
    @Param('humanId') humanId: string,
    @Param('slotId', ParseIntPipe) slotId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: PlanUploadFileDto,
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
    @Body() dto: PlanCfoSelectionDto,
  ) {
    return this.service.send(user, humanId, dto);
  }

  @Roles(Role.FILIAL)
  @Post(':humanId/resubmit')
  resubmit(
    @CurrentUser() user: User,
    @Param('humanId') humanId: string,
    @Body() dto: PlanCfoSelectionDto,
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
    @Body() dto: PlanRemarkCreateDto,
  ) {
    return this.service.leaveRemark(user, humanId, dto);
  }

  @Roles(Role.CFO)
  @Post(':humanId/cfo-return')
  cfoReturn(@CurrentUser() user: User, @Param('humanId') humanId: string) {
    return this.service.cfoReturn(user, humanId);
  }

  @Roles(Role.CFO)
  @Post(':humanId/cfo-cancel')
  cfoCancel(@CurrentUser() user: User, @Param('humanId') humanId: string) {
    return this.service.cancelCfoDecision(user, humanId);
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
    @Body() dto: PlanRemarkReopenDto,
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
