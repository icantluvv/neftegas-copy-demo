import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';

import { AppModule } from '../src/app.module';
import {
  Correction,
  CorrectionStatus,
} from '../src/corrections/entities/correction.entity';
import { Notification } from '../src/notifications/entities/notification.entity';
import { CorrectionType } from '../src/org/entities/correction-type.entity';
import { Filial } from '../src/org/entities/filial.entity';
import { Role, User } from '../src/users/entities/user.entity';

const SESSION_COOKIE_PREFIX = 'session_id=';

function extractSessionCookie(res: request.Response): string {
  const setCookie = res.get('Set-Cookie') ?? [];
  const cookie = setCookie.find((c) => c.startsWith(SESSION_COOKIE_PREFIX));
  if (!cookie) throw new Error('session_id cookie not set');
  return cookie.split(';')[0];
}

describe('Notifications (e2e)', () => {
  let app: INestApplication<App>;
  let users: Repository<User>;
  let notifications: Repository<Notification>;
  let corrections: Repository<Correction>;
  const password = 'correct-password';
  const email = 'notifications-e2e-user@example.com';
  let userId: number;
  let correctionId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    users = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    notifications = moduleFixture.get<Repository<Notification>>(
      getRepositoryToken(Notification),
    );
    corrections = moduleFixture.get<Repository<Correction>>(
      getRepositoryToken(Correction),
    );
    const filials = moduleFixture.get<Repository<Filial>>(
      getRepositoryToken(Filial),
    );
    const correctionTypes = moduleFixture.get<Repository<CorrectionType>>(
      getRepositoryToken(CorrectionType),
    );

    const savedUser = await users.save(
      users.create({
        username: email,
        passwordHash: await bcrypt.hash(password, 10),
        role: Role.FILIAL,
        isActive: true,
        isLocked: false,
      }),
    );
    userId = savedUser.id;

    const filial = await filials.findOneOrFail({ where: {} });
    const correctionType = await correctionTypes.findOneOrFail({ where: {} });
    const savedCorrection = await corrections.save(
      corrections.create({
        humanId: 'COR-NOTIF-E2E',
        filialId: filial.id,
        correctionTypeId: correctionType.id,
        authorId: userId,
        status: CorrectionStatus.DRAFT,
      }),
    );
    correctionId = savedCorrection.id;
  });

  afterAll(async () => {
    await notifications.delete({ userId });
    await corrections.delete({ id: correctionId });
    await users.delete({ username: email });
    await app.close();
  });

  beforeEach(async () => {
    await notifications.delete({ userId });
  });

  async function loginCookie(): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    return extractSessionCookie(res);
  }

  describe('POST /notifications/read-all', () => {
    it('без cookie отвечает 401', () => {
      return request(app.getHttpServer())
        .post('/api/notifications/read-all')
        .expect(401);
    });

    it('помечает все уведомления пользователя прочитанными и возвращает updatedCount', async () => {
      const cookie = await loginCookie();
      await notifications.save([
        notifications.create({
          userId,
          correctionId,
          text: 'Первое',
          isRead: false,
        }),
        notifications.create({
          userId,
          correctionId,
          text: 'Второе',
          isRead: false,
        }),
      ]);

      const res = await request(app.getHttpServer())
        .post('/api/notifications/read-all')
        .set('Cookie', cookie)
        .expect(200);

      expect((res.body as { updatedCount: number }).updatedCount).toBe(2);

      const listRes = await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Cookie', cookie)
        .expect(200);
      const list = listRes.body as { isRead: boolean }[];
      expect(list.length).toBe(2);
      expect(list.every((n) => n.isRead)).toBe(true);
    });

    it('идемпотентен: повторный вызов без непрочитанных возвращает updatedCount 0', async () => {
      const cookie = await loginCookie();
      await notifications.save(
        notifications.create({
          userId,
          correctionId,
          text: 'Уже прочитано',
          isRead: true,
        }),
      );

      const res = await request(app.getHttpServer())
        .post('/api/notifications/read-all')
        .set('Cookie', cookie)
        .expect(200);

      expect((res.body as { updatedCount: number }).updatedCount).toBe(0);
    });
  });
});
