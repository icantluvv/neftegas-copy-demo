import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { SessionService } from './session.service';

const SESSION_COOKIE = 'session_id';
const DEFAULT_SESSION_TTL_SECONDS = 36000;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private sessionService: SessionService,
    private config: ConfigService,
  ) {}

  /**
   * `email` сравнивается с колонкой `username` — она хранит логин пользователя.
   * Полное согласование `User.username`/`User.email` с моделью из
   * apps/backend/AGENTS.md вынесено в отдельный change (см. design.md Open
   * Questions в change align-login-role-redirect).
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.username = :email', { email })
      .getOne();
    if (!user || !user.isActive || user.isLocked) {
      return null;
    }
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    return passwordMatches ? user : null;
  }

  async login(
    user: User,
    meta: { ip: string | null; userAgent: string | null },
    res: Response,
  ): Promise<void> {
    const sessionId = await this.sessionService.create(user, meta);
    res.cookie(SESSION_COOKIE, sessionId, this.cookieOptions());
  }

  async logout(sessionId: string | undefined, res: Response): Promise<void> {
    if (sessionId) {
      await this.sessionService.destroy(sessionId);
    }
    res.clearCookie(SESSION_COOKIE, { path: '/' });
  }

  async logoutAll(userId: number, res: Response): Promise<void> {
    await this.sessionService.destroyAll(userId);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
  }

  private cookieOptions() {
    const secure = this.config.get('NODE_ENV') === 'production';
    const ttlSeconds = this.config.get<number>(
      'SESSION_TTL_SECONDS',
      DEFAULT_SESSION_TTL_SECONDS,
    );
    return {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: ttlSeconds * 1000,
    };
  }
}
