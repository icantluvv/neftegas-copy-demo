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

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let users: Repository<User>;
  const password = 'correct-password';
  const email = 'auth-e2e-user@example.com';

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
  });

  afterAll(async () => {
    await users.delete({ username: email });
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

  it('логинит по корректным email и паролю', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200)
      .expect((res) => {
        const body = res.body as { role: string };
        expect(body.role).toBe('FILIAL');
      });
  });
});
