import { ConfigService } from '@nestjs/config';

import { Role, User } from '../users/entities/user.entity';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let redis: {
    set: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
    sadd: jest.Mock;
    srem: jest.Mock;
    smembers: jest.Mock;
    expire: jest.Mock;
  };
  let config: ConfigService;
  let service: SessionService;

  const user = { id: 42, role: Role.FILIAL } as User;
  const meta = { ip: '127.0.0.1', userAgent: 'jest' };

  beforeEach(() => {
    redis = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      sadd: jest.fn(),
      srem: jest.fn(),
      smembers: jest.fn(),
      expire: jest.fn(),
    };
    config = {
      get: jest.fn().mockReturnValue(36000),
    } as unknown as ConfigService;
    service = new SessionService(redis as never, config);
  });

  describe('create', () => {
    it('пишет сессию в Redis с TTL и добавляет id в индекс пользователя', async () => {
      const sessionId = await service.create(user, meta);

      expect(sessionId).toEqual(expect.any(String));
      expect(sessionId.length).toBeGreaterThan(20);

      expect(redis.set).toHaveBeenCalledWith(
        `session:${sessionId}`,
        expect.stringContaining('"userId":42'),
        'EX',
        36000,
      );
      expect(redis.sadd).toHaveBeenCalledWith('user-sessions:42', sessionId);
    });
  });

  describe('validateAndTouch', () => {
    it('возвращает данные и продлевает TTL для существующей сессии', async () => {
      const data = {
        userId: 42,
        role: Role.FILIAL,
        createdAt: '2026-01-01T00:00:00.000Z',
        lastSeenAt: '2026-01-01T00:00:00.000Z',
        ip: null,
        userAgent: null,
      };
      redis.get.mockResolvedValue(JSON.stringify(data));

      const result = await service.validateAndTouch('abc');

      expect(result).toEqual(data);
      expect(redis.expire).toHaveBeenCalledWith('session:abc', 36000);
    });

    it('возвращает null для несуществующей сессии и не продлевает TTL', async () => {
      redis.get.mockResolvedValue(null);

      const result = await service.validateAndTouch('missing');

      expect(result).toBeNull();
      expect(redis.expire).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('удаляет сессию и её id из индекса пользователя', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ userId: 42 }));

      await service.destroy('abc');

      expect(redis.del).toHaveBeenCalledWith('session:abc');
      expect(redis.srem).toHaveBeenCalledWith('user-sessions:42', 'abc');
    });

    it('не падает, если сессии уже не существует', async () => {
      redis.get.mockResolvedValue(null);

      await expect(service.destroy('missing')).resolves.toBeUndefined();
      expect(redis.del).toHaveBeenCalledWith('session:missing');
      expect(redis.srem).not.toHaveBeenCalled();
    });
  });

  describe('destroyAll', () => {
    it('удаляет все сессии пользователя и сам индекс', async () => {
      redis.smembers.mockResolvedValue(['s1', 's2']);

      await service.destroyAll(42);

      expect(redis.del).toHaveBeenCalledWith('session:s1', 'session:s2');
      expect(redis.del).toHaveBeenCalledWith('user-sessions:42');
    });

    it('не падает при пустом индексе (нет активных сессий)', async () => {
      redis.smembers.mockResolvedValue([]);

      await service.destroyAll(42);

      expect(redis.del).toHaveBeenCalledTimes(1);
      expect(redis.del).toHaveBeenCalledWith('user-sessions:42');
    });
  });
});
