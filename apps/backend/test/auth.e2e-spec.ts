import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AppModule } from '../src/app.module';
import { User } from '../src/users/entities/user.entity';

const SESSION_COOKIE_PREFIX = 'session_id=';

function extractSessionCookie(res: request.Response): string {
  const setCookie = res.get('Set-Cookie') ?? [];
  const cookie = setCookie.find((c) => c.startsWith(SESSION_COOKIE_PREFIX));
  if (!cookie) throw new Error('session_id cookie not set');
  return cookie.split(';')[0];
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let users: Repository<User>;
  const password = 'correct-password';
  const email = 'auth-e2e-user@example.com';
  const otherEmail = 'auth-e2e-other-user@example.com';

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
    await users.save(
      users.create({
        username: email,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'FILIAL' as User['role'],
        isActive: true,
        isLocked: false,
      }),
    );
    await users.save(
      users.create({
        username: otherEmail,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'FILIAL' as User['role'],
        isActive: true,
        isLocked: false,
      }),
    );
  });

  afterAll(async () => {
    await users.delete({ username: email });
    await users.delete({ username: otherEmail });
    await app.close();
  });

  it('отклоняет некорректный формат email с 400 и не пытается аутентифицировать', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password })
      .expect(400);
  });

  it('отвечает единым 401 при неверном пароле', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);
  });

  it('отвечает единым 401 при несуществующем email', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'no-such-user@example.com', password })
      .expect(401);
  });

  it('логинит по корректным email и паролю, устанавливает ровно одну httpOnly cookie session_id', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200)
      .expect((res) => {
        const body = res.body as { role: string };
        expect(body.role).toBe('FILIAL');

        const setCookie = res.get('Set-Cookie') ?? [];
        const sessionCookies = setCookie.filter((c) =>
          c.startsWith(SESSION_COOKIE_PREFIX),
        );
        expect(sessionCookies).toHaveLength(1);
        expect(sessionCookies[0]).toMatch(/HttpOnly/i);
      });
  });

  it('повторный вход создаёт независимую вторую сессию, первая остаётся активной', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    const second = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    const firstCookie = extractSessionCookie(first);
    const secondCookie = extractSessionCookie(second);
    expect(firstCookie).not.toEqual(secondCookie);

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', firstCookie)
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', secondCookie)
      .expect(200);
  });

  describe('доступ по сессии', () => {
    it('GET /auth/me без cookie отвечает 401', () => {
      return request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('GET /auth/me с cookie от успешного входа отвечает 200', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);
      const cookie = extractSessionCookie(login);

      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', cookie)
        .expect(200);
    });

    it('GET /auth/me с несуществующей сессией отвечает 401', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', 'session_id=does-not-exist')
        .expect(401);
    });
  });

  describe('logout', () => {
    it('завершает текущую сессию и не затрагивает другую сессию того же пользователя', async () => {
      const first = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);
      const second = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);
      const firstCookie = extractSessionCookie(first);
      const secondCookie = extractSessionCookie(second);

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', firstCookie)
        .expect(204);

      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', firstCookie)
        .expect(401);

      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', secondCookie)
        .expect(200);
    });
  });

  describe('logout-all', () => {
    it('требует аутентификации', () => {
      return request(app.getHttpServer())
        .post('/api/auth/logout-all')
        .expect(401);
    });

    it('завершает все сессии текущего пользователя, не затрагивая сессии другого пользователя', async () => {
      const first = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);
      const second = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);
      const otherUserLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: otherEmail, password })
        .expect(200);

      const firstCookie = extractSessionCookie(first);
      const secondCookie = extractSessionCookie(second);
      const otherUserCookie = extractSessionCookie(otherUserLogin);

      await request(app.getHttpServer())
        .post('/api/auth/logout-all')
        .set('Cookie', firstCookie)
        .expect(204);

      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', firstCookie)
        .expect(401);
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', secondCookie)
        .expect(401);
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', otherUserCookie)
        .expect(200);
    });
  });

  it('деактивация учётной записи с живой сессией блокирует следующий запрос 401-м', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: otherEmail, password })
      .expect(200);
    const cookie = extractSessionCookie(login);

    await users.update({ username: otherEmail }, { isActive: false });

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .expect(401);

    await users.update({ username: otherEmail }, { isActive: true });
  });

  it('POST /auth/refresh больше не существует', () => {
    return request(app.getHttpServer()).post('/api/auth/refresh').expect(404);
  });
});
