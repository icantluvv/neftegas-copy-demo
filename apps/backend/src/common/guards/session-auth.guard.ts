import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { SessionService } from '../../auth/session.service';
import { UsersService } from '../../users/users.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const SESSION_COOKIE = 'session_id';

/** Глобальный guard (см. APP_GUARD в app.module) — авторизация по умолчанию, кроме @Public(). */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private sessionService: SessionService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const cookies = request.cookies as
      Record<string, string | undefined> | undefined;
    const sessionId = cookies?.[SESSION_COOKIE];
    if (!sessionId) throw new UnauthorizedException();

    const session = await this.sessionService.validateAndTouch(sessionId);
    if (!session) throw new UnauthorizedException();

    const user = await this.usersService.findActiveById(session.userId);
    if (!user) throw new UnauthorizedException();

    request.user = user;
    return true;
  }
}
