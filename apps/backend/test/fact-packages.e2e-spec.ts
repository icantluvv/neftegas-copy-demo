import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';

import { AppModule } from '../src/app.module';
import { FactPackage } from '../src/fact-packages/entities/fact-package.entity';
import { Cfo } from '../src/org/entities/cfo.entity';
import { Filial } from '../src/org/entities/filial.entity';
import { FilialCfoLink } from '../src/org/entities/filial-cfo-link.entity';
import { Role, User } from '../src/users/entities/user.entity';

interface FactPackageResponseBody {
  humanId: string;
  status: string;
  canSendToDtoe: boolean;
  decidedAt: string | null;
  forms: { code: string }[];
}

/**
 * Полный жизненный цикл факт-пакета (openspec/changes/fact-package-review):
 * создание по направлению → комплектация всех форм → отправка ЦФО →
 * согласование ЦФО → отправка в ДТОиР → финальное согласование, плюс базовые
 * negative-пути. Использует справочные Filial/Cfo, созданные тестом (не сид),
 * чтобы не зависеть от состава демо-данных.
 */
describe('FactPackages lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  let users: Repository<User>;
  let filials: Repository<Filial>;
  let cfos: Repository<Cfo>;
  let links: Repository<FilialCfoLink>;
  let factPackages: Repository<FactPackage>;
  const password = 'correct-password';
  const suffix = `fp-e2e-${Date.now()}`;

  let filial: Filial;
  let otherFilial: Filial;
  let cfo: Cfo;

  async function loginAs(role: Role, filialId?: number, cfoId?: number) {
    const email = `${suffix}-${role.toLowerCase()}-${filialId ?? cfoId ?? 'x'}@example.com`;
    const passwordHash = await bcrypt.hash(password, 10);
    await users.save(
      users.create({
        username: email,
        passwordHash,
        role,
        filialId,
        cfoId,
        isActive: true,
        isLocked: false,
      }),
    );
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password });
    return { email, cookie: res.get('Set-Cookie') ?? [] };
  }

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
    filials = moduleFixture.get<Repository<Filial>>(getRepositoryToken(Filial));
    cfos = moduleFixture.get<Repository<Cfo>>(getRepositoryToken(Cfo));
    links = moduleFixture.get<Repository<FilialCfoLink>>(
      getRepositoryToken(FilialCfoLink),
    );
    factPackages = moduleFixture.get<Repository<FactPackage>>(
      getRepositoryToken(FactPackage),
    );

    filial = await filials.save(
      filials.create({ code: suffix, name: suffix, isActive: true }),
    );
    otherFilial = await filials.save(
      filials.create({
        code: `${suffix}-other`,
        name: `${suffix}-other`,
        isActive: true,
      }),
    );
    cfo = await cfos.save(
      cfos.create({ code: suffix, name: suffix, isActive: true }),
    );
    await links.save(
      links.create({ filialId: filial.id, cfoId: cfo.id, isActive: true }),
    );
  });

  afterAll(async () => {
    await factPackages.delete({ filialId: filial.id });
    await links.delete({ filialId: filial.id });
    await users.delete({
      username: `${suffix}-filial-${filial.id}@example.com`,
    });
    await users.delete({ username: `${suffix}-cfo-${cfo.id}@example.com` });
    await users.delete({ username: `${suffix}-dtoe-x@example.com` });
    await users.delete({
      username: `${suffix}-filial-${otherFilial.id}@example.com`,
    });
    await cfos.delete(cfo.id);
    await filials.delete([filial.id, otherFilial.id]);
    await app.close();
  });

  it('полный цикл: создание → комплектация → ЦФО → ДТОиР → согласовано', async () => {
    const filialAuth = await loginAs(Role.FILIAL, filial.id);
    const cfoAuth = await loginAs(Role.CFO, undefined, cfo.id);
    const dtoeAuth = await loginAs(Role.DTOE);

    const createRes = await request(app.getHttpServer())
      .post('/api/fact-packages')
      .set('Cookie', filialAuth.cookie)
      .send({ direction: 'KR_HS' })
      .expect(201);
    const created = createRes.body as FactPackageResponseBody;
    const humanId = created.humanId;
    expect(created.forms).toHaveLength(4);
    expect(created.status).toBe('DRAFT');

    for (const form of created.forms) {
      await request(app.getHttpServer())
        .post(`/api/fact-packages/${humanId}/forms/${form.code}/versions`)
        .set('Cookie', filialAuth.cookie)
        .attach('file', Buffer.from('test'), 'test.txt')
        .expect(201);
    }

    const submitRes = await request(app.getHttpServer())
      .post(`/api/fact-packages/${humanId}/submit`)
      .set('Cookie', filialAuth.cookie)
      .send({ cfoIds: [cfo.id] })
      .expect(200);
    expect((submitRes.body as FactPackageResponseBody).status).toBe(
      'UNDER_CFO_REVIEW',
    );

    const approveRes = await request(app.getHttpServer())
      .post(`/api/fact-packages/${humanId}/cfo/${cfo.id}/approve`)
      .set('Cookie', cfoAuth.cookie)
      .expect(200);
    const approved = approveRes.body as FactPackageResponseBody;
    expect(approved.status).toBe('ALL_CFO_APPROVED');
    expect(approved.canSendToDtoe).toBe(true);

    const sendRes = await request(app.getHttpServer())
      .post(`/api/fact-packages/${humanId}/send-to-dtoe`)
      .set('Cookie', cfoAuth.cookie)
      .expect(200);
    expect((sendRes.body as FactPackageResponseBody).status).toBe(
      'UNDER_DTOE_REVIEW',
    );

    const decisionRes = await request(app.getHttpServer())
      .post(`/api/fact-packages/${humanId}/final-decision`)
      .set('Cookie', dtoeAuth.cookie)
      .send({ decision: 'APPROVE' })
      .expect(200);
    const decided = decisionRes.body as FactPackageResponseBody;
    expect(decided.status).toBe('APPROVED');
    expect(decided.decidedAt).toBeTruthy();

    await request(app.getHttpServer())
      .post(
        `/api/fact-packages/${humanId}/forms/${created.forms[0].code}/versions`,
      )
      .set('Cookie', filialAuth.cookie)
      .attach('file', Buffer.from('x'), 'x.txt')
      .expect(400);
  });

  it('чужой филиал не видит и не может отправлять на проверку факт-пакет', async () => {
    const filialAuth = await loginAs(Role.FILIAL, filial.id);
    const otherFilialAuth = await loginAs(Role.FILIAL, otherFilial.id);

    const createRes = await request(app.getHttpServer())
      .post('/api/fact-packages')
      .set('Cookie', filialAuth.cookie)
      .send({ direction: 'DO' })
      .expect(201);
    const humanId = (createRes.body as FactPackageResponseBody).humanId;

    await request(app.getHttpServer())
      .get(`/api/fact-packages/${humanId}`)
      .set('Cookie', otherFilialAuth.cookie)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/fact-packages/${humanId}/submit`)
      .set('Cookie', otherFilialAuth.cookie)
      .send({ cfoIds: [cfo.id] })
      .expect(403);
  });

  it('разрешает отправку неукомплектованного пакета — полная комплектация форм не требуется', async () => {
    const filialAuth = await loginAs(Role.FILIAL, filial.id);

    const createRes = await request(app.getHttpServer())
      .post('/api/fact-packages')
      .set('Cookie', filialAuth.cookie)
      .send({ direction: 'TOIR' })
      .expect(201);

    const { humanId } = createRes.body as FactPackageResponseBody;

    const submitRes = await request(app.getHttpServer())
      .post(`/api/fact-packages/${humanId}/submit`)
      .set('Cookie', filialAuth.cookie)
      .send({ cfoIds: [cfo.id] })
      .expect(200);
    expect((submitRes.body as FactPackageResponseBody).status).toBe(
      'UNDER_CFO_REVIEW',
    );
  });
});
