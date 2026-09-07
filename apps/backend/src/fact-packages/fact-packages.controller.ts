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
import { CfoSelectionDto } from './dto/cfo-selection.dto';
import { CreateFactPackageDto } from './dto/create-fact-package.dto';
import { FinalDecisionDto } from './dto/final-decision.dto';
import { FindFactPackagesQueryDto } from './dto/find-fact-packages-query.dto';
import { RemarkCreateDto } from './dto/remark-create.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { FactFormCode } from './fact-form-catalog';
import { FactPackagesService } from './fact-packages.service';

@ApiTags('FactPackages')
@Controller('fact-packages')
export class FactPackagesController {
  constructor(private service: FactPackagesService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() query: FindFactPackagesQueryDto) {
    return this.service.findAll(user, query);
  }

  @Roles(Role.FILIAL, Role.CFO)
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateFactPackageDto) {
    return this.service.create(user, dto.direction);
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

  @Roles(Role.FILIAL, Role.CFO)
  @UseInterceptors(FileInterceptor('file'))
  @Post(':humanId/forms/:formCode/versions')
  @HttpCode(HttpStatus.CREATED)
  uploadFormVersion(
    @CurrentUser() user: User,
    @Param('humanId') humanId: string,
    @Param('formCode') formCode: FactFormCode,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    return this.service.uploadFormVersion(
      user,
      humanId,
      formCode,
      file,
      dto.note,
      dto.remarkId,
    );
  }

  @Roles(Role.FILIAL, Role.CFO)
  @Post(':humanId/submit')
  @HttpCode(HttpStatus.OK)
  submit(
    @CurrentUser() user: User,
    @Param('humanId') humanId: string,
    @Body() dto: CfoSelectionDto,
  ) {
    return this.service.submit(user, humanId, dto);
  }

  @Roles(Role.CFO)
  @Post(':humanId/cfo/:cfoId/approve')
  @HttpCode(HttpStatus.OK)
  approveByCfo(
    @CurrentUser() user: User,
    @Param('humanId') humanId: string,
    @Param('cfoId', ParseIntPipe) cfoId: number,
  ) {
    return this.service.approveByCfo(user, humanId, cfoId);
  }

  @Roles(Role.CFO, Role.DTOE)
  @Post(':humanId/remarks')
  @HttpCode(HttpStatus.OK)
  leaveRemark(
    @CurrentUser() user: User,
    @Param('humanId') humanId: string,
    @Body() dto: RemarkCreateDto,
  ) {
    return this.service.leaveRemark(user, humanId, dto);
  }

  @Roles(Role.FILIAL, Role.CFO)
  @Post(':humanId/remarks/:remarkId/fix')
  @HttpCode(HttpStatus.OK)
  fixRemark(
    @CurrentUser() user: User,
    @Param('humanId') humanId: string,
    @Param('remarkId', ParseIntPipe) remarkId: number,
  ) {
    return this.service.fixRemark(user, humanId, remarkId);
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

  @Roles(Role.CFO)
  @Post(':humanId/send-to-dtoe')
  @HttpCode(HttpStatus.OK)
  sendToDtoe(@CurrentUser() user: User, @Param('humanId') humanId: string) {
    return this.service.sendToDtoe(user, humanId);
  }

  @Roles(Role.DTOE)
  @Post(':humanId/final-decision')
  @HttpCode(HttpStatus.OK)
  finalDecision(
    @CurrentUser() user: User,
    @Param('humanId') humanId: string,
    @Body() dto: FinalDecisionDto,
  ) {
    return this.service.finalDecision(user, humanId, dto);
  }
}
