import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { JwtPayload } from './types';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const ACCESS_TOKEN_TTL = '30m';
const ACCESS_TOKEN_MAX_AGE_MS = 30 * 60 * 1000;
/** 10 часов — как SESSION_COOKIE_AGE в исходном Django-проекте. */
const REFRESH_TOKEN_TTL = '10h';
const REFRESH_TOKEN_MAX_AGE_MS = 10 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
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

  setAuthCookies(res: Response, user: User) {
    const secure = this.config.get('NODE_ENV') === 'production';
    const common = {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      path: '/',
    };
    res.cookie(ACCESS_TOKEN_COOKIE, this.signAccessToken(user), {
      ...common,
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });
    res.cookie(REFRESH_TOKEN_COOKIE, this.signRefreshToken(user), {
      ...common,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });
  }

  clearAuthCookies(res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  async refresh(
    refreshToken: string | undefined,
    res: Response,
  ): Promise<User> {
    if (!refreshToken) {
      throw new UnauthorizedException();
    }
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
      });
    } catch {
      throw new UnauthorizedException();
    }
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive || user.isLocked) {
      throw new UnauthorizedException();
    }
    this.setAuthCookies(res, user);
    return user;
  }

  private signAccessToken(user: User) {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    return this.jwt.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET', 'dev-access-secret'),
      expiresIn: ACCESS_TOKEN_TTL,
    });
  }

  private signRefreshToken(user: User) {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    return this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
      expiresIn: REFRESH_TOKEN_TTL,
    });
  }
}
