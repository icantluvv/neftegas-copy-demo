import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';

import { AppModule } from '../src/app.module';
import { Role, User } from '../src/users/entities/user.entity';

describe('Corrections role-scoped stats (e2e)', () => {
  let app: INestApplication<App>;
  let users: Repository<User>;
  const password = 'correct-password';

  const roleByPath: Record<'filial' | 'cfo' | 'dtoe', Role> = {
    filial: Role.FILIAL,
    cfo: Role.CFO,
    dtoe: Role.DTOE,
  };
  const cookiesByRole: Partial<Record<Role, string[]>> = {};

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
    const passwordHash = await bcrypt.hash(password, 10);

    for (const role of [Role.FILIAL, Role.CFO, Role.DTOE]) {
      const email = `stats-e2e-${role.toLowerCase()}@example.com`;
      await users.save(
        users.create({
          username: email,
          passwordHash,
          role,
          isActive: true,
          isLocked: false,
        }),
      );
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password });
      cookiesByRole[role] = res.get('Set-Cookie');
    }
  });

  afterAll(async () => {
    await users.delete({ username: 'stats-e2e-filial@example.com' });
    await users.delete({ username: 'stats-e2e-cfo@example.com' });
    await users.delete({ username: 'stats-e2e-dtoe@example.com' });
    await app.close();
  });

  for (const [path, ownRole] of Object.entries(roleByPath) as [
    keyof typeof roleByPath,
    Role,
  ][]) {
    it(`GET /corrections/stats/${path}: своя роль (${ownRole}) получает 200`, () => {
      return request(app.getHttpServer())
        .get(`/api/corrections/stats/${path}`)
        .set('Cookie', cookiesByRole[ownRole] ?? [])
        .expect(200);
    });

    for (const otherRole of [Role.FILIAL, Role.CFO, Role.DTOE].filter(
      (r) => r !== ownRole,
    )) {
      it(`GET /corrections/stats/${path}: чужая роль (${otherRole}) получает 403`, () => {
        return request(app.getHttpServer())
          .get(`/api/corrections/stats/${path}`)
          .set('Cookie', cookiesByRole[otherRole] ?? [])
          .expect(403);
      });
    }
  }
});
