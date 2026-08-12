import { randomBytes } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';

import { REDIS_CLIENT } from '../redis/redis.constants';
import { User } from '../users/entities/user.entity';
import { SessionData } from './types';

const DEFAULT_SESSION_TTL_SECONDS = 36000;

@Injectable()
export class SessionService {
  private readonly ttlSeconds: number;

  constructor(
    @Inject(REDIS_CLIENT) private redis: Redis,
    private config: ConfigService,
  ) {
    this.ttlSeconds = this.config.get<number>(
      'SESSION_TTL_SECONDS',
      DEFAULT_SESSION_TTL_SECONDS,
    );
  }

  async create(
    user: User,
    meta: { ip: string | null; userAgent: string | null },
  ): Promise<string> {
    const sessionId = randomBytes(32).toString('base64url');
    const now = new Date().toISOString();
    const data: SessionData = {
      userId: user.id,
      role: user.role,
      createdAt: now,
      lastSeenAt: now,
      ip: meta.ip,
      userAgent: meta.userAgent,
    };
    await this.redis.set(
      this.sessionKey(sessionId),
      JSON.stringify(data),
      'EX',
      this.ttlSeconds,
    );
    await this.redis.sadd(this.userSessionsKey(user.id), sessionId);
    return sessionId;
  }

  async validateAndTouch(sessionId: string): Promise<SessionData | null> {
    const raw = await this.redis.get(this.sessionKey(sessionId));
    if (!raw) return null;
    await this.redis.expire(this.sessionKey(sessionId), this.ttlSeconds);
    return JSON.parse(raw) as SessionData;
  }

  async destroy(sessionId: string): Promise<void> {
    const raw = await this.redis.get(this.sessionKey(sessionId));
    await this.redis.del(this.sessionKey(sessionId));
    if (raw) {
      const data = JSON.parse(raw) as SessionData;
      await this.redis.srem(this.userSessionsKey(data.userId), sessionId);
    }
  }

  async destroyAll(userId: number): Promise<void> {
    const sessionIds = await this.redis.smembers(this.userSessionsKey(userId));
    if (sessionIds.length > 0) {
      await this.redis.del(...sessionIds.map((id) => this.sessionKey(id)));
    }
    await this.redis.del(this.userSessionsKey(userId));
  }

  private sessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  private userSessionsKey(userId: number): string {
    return `user-sessions:${userId}`;
  }
}
