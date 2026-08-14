import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { LocalAuthGuard } from '../common/guards/local-auth.guard';
import { User } from '../users/entities/user.entity';
import { toAuthUserDto } from './auth.mapper';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

const SESSION_COOKIE = 'session_id';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() _dto: LoginDto,
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.login(
      user,
      { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null },
      res,
    );
    return toAuthUserDto(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = req.cookies as
      Record<string, string | undefined> | undefined;
    await this.authService.logout(cookies?.[SESSION_COOKIE], res);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.id, res);
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    return toAuthUserDto(user);
  }
}
