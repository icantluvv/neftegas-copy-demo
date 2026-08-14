import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { SessionService } from '../../auth/session.service';
import { Role, User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import { SessionAuthGuard } from './session-auth.guard';

describe('SessionAuthGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let sessionService: { validateAndTouch: jest.Mock };
  let users: { findActiveById: jest.Mock };
  let guard: SessionAuthGuard;

  const makeContext = (
    cookies: Record<string, string> = {},
  ): ExecutionContext => {
    const request: Record<string, unknown> = { cookies };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    sessionService = { validateAndTouch: jest.fn() };
    users = { findActiveById: jest.fn() };
    guard = new SessionAuthGuard(
      reflector as unknown as Reflector,
      sessionService as unknown as SessionService,
      users as unknown as UsersService,
    );
  });

  it('пропускает запрос без проверки, если ручка помечена @Public()', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = makeContext();

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(sessionService.validateAndTouch).not.toHaveBeenCalled();
  });

  it('отклоняет запрос без cookie session_id', async () => {
    const context = makeContext();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('отклоняет запрос с несуществующей/уничтоженной сессией', async () => {
    sessionService.validateAndTouch.mockResolvedValue(null);
    const context = makeContext({ session_id: 'bad-id' });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('отклоняет, если учётная запись деактивирована или заблокирована', async () => {
    sessionService.validateAndTouch.mockResolvedValue({
      userId: 1,
      role: Role.FILIAL,
    });
    users.findActiveById.mockResolvedValue(null);
    const context = makeContext({ session_id: 'ok-id' });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('устанавливает request.user и пропускает валидную сессию', async () => {
    const user = {
      id: 1,
      isActive: true,
      isLocked: false,
      role: Role.FILIAL,
    } as User;
    sessionService.validateAndTouch.mockResolvedValue({
      userId: 1,
      role: Role.FILIAL,
    });
    users.findActiveById.mockResolvedValue(user);
    const context = makeContext({ session_id: 'ok-id' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    const request = context.switchToHttp().getRequest<{ user?: User }>();
    expect(request.user).toBe(user);
  });
});
