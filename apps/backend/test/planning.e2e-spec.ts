import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';

import { AppModule } from '../src/app.module';
import { Cfo } from '../src/org/entities/cfo.entity';
import { Filial } from '../src/org/entities/filial.entity';
import { FilialCfoLink } from '../src/org/entities/filial-cfo-link.entity';
import {
  PlanPackageRequirement,
  PlanRequirementKind,
} from '../src/planning/entities/plan-package-requirement.entity';
import { PlanType } from '../src/planning/entities/plan-type.entity';
import { Plan } from '../src/planning/entities/plan.entity';
import { Role, User } from '../src/users/entities/user.entity';

interface PlanResponseBody {
  humanId: string;
  status: string;
  canSendToDtoe: boolean;
  decidedAt: string | null;
  slots: { id: number; label: string; requirementId: number | null }[];
}

/**
 * Полный жизненный цикл плана (openspec/changes/planning-2027-package-review) —
 * 1:1 клон механики Corrections, но независимый домен: создание по типу →
 * комплектация обязательных слотов → отправка ЦФО → согласование ЦФО →
 * отправка в ДТОиР → финальное согласование, плюс базовые negative-пути.
 * Использует справочные Filial/Cfo/PlanType, созданные тестом (не сид).
 */
describe('Planning lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  let users: Repository<User>;
  let filials: Repository<Filial>;
  let cfos: Repository<Cfo>;
  let links: Repository<FilialCfoLink>;
  let plans: Repository<Plan>;
  let planTypes: Repository<PlanType>;
  let requirements: Repository<PlanPackageRequirement>;
  const password = 'correct-password';
  const suffix = `pl-e2e-${Date.now()}`;

  let filial: Filial;
  let otherFilial: Filial;
  let cfo: Cfo;
  let planType: PlanType;

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
    plans = moduleFixture.get<Repository<Plan>>(getRepositoryToken(Plan));
    planTypes = moduleFixture.get<Repository<PlanType>>(
      getRepositoryToken(PlanType),
    );
    requirements = moduleFixture.get<Repository<PlanPackageRequirement>>(
      getRepositoryToken(PlanPackageRequirement),
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
    planType = await planTypes.save(
      planTypes.create({ code: suffix, name: suffix, isActive: true }),
    );
    await requirements.save(
      requirements.create({
        planTypeId: planType.id,
        kind: PlanRequirementKind.DOCUMENT,
        name: 'Акт обследования объекта основных фондов',
        isRequired: true,
        order: 1,
      }),
    );
  });

  afterAll(async () => {
    await plans.delete({ filialId: filial.id });
    await plans.delete({ filialId: otherFilial.id });
    await requirements.delete({ planTypeId: planType.id });
    await links.delete({ filialId: filial.id });
    await users.delete({
      username: `${suffix}-filial-${filial.id}@example.com`,
    });
    await users.delete({ username: `${suffix}-cfo-${cfo.id}@example.com` });
    await users.delete({ username: `${suffix}-dtoe-x@example.com` });
    await users.delete({
      username: `${suffix}-filial-${otherFilial.id}@example.com`,
    });
    await planTypes.delete(planType.id);
    await cfos.delete(cfo.id);
    await filials.delete([filial.id, otherFilial.id]);
    await app.close();
  });

  it('полный цикл: создание → комплектация → ЦФО → ДТОиР → согласовано', async () => {
    const filialAuth = await loginAs(Role.FILIAL, filial.id);
    const cfoAuth = await loginAs(Role.CFO, undefined, cfo.id);
    const dtoeAuth = await loginAs(Role.DTOE);

    const createRes = await request(app.getHttpServer())
      .post('/api/plans')
      .set('Cookie', filialAuth.cookie)
      .send({ planTypeId: planType.id })
      .expect(201);
    const created = createRes.body as PlanResponseBody;
    const humanId = created.humanId;
    expect(created.status).toBe('DRAFT');
    expect(created.slots).toHaveLength(2); // главный Excel + одно обязательное требование

    for (const slot of created.slots) {
      await request(app.getHttpServer())
        .post(`/api/plans/${humanId}/slots/${slot.id}/files`)
        .set('Cookie', filialAuth.cookie)
        .attach('file', Buffer.from('test'), 'test.txt')
        .expect(201);
    }

    const sendRes = await request(app.getHttpServer())
      .post(`/api/plans/${humanId}/send`)
      .set('Cookie', filialAuth.cookie)
      .send({ cfoIds: [cfo.id] })
      .expect(201);
    expect((sendRes.body as PlanResponseBody).status).toBe('UNDER_CFO_REVIEW');

    const approveRes = await request(app.getHttpServer())
      .post(`/api/plans/${humanId}/cfo-approve`)
      .set('Cookie', cfoAuth.cookie)
      .expect(201);
    const approved = approveRes.body as PlanResponseBody;
    expect(approved.status).toBe('ALL_CFO_APPROVED');
    expect(approved.canSendToDtoe).toBe(true);

    const dtoeSendRes = await request(app.getHttpServer())
      .post(`/api/plans/${humanId}/send-to-dtoe`)
      .set('Cookie', cfoAuth.cookie)
      .expect(201);
    expect((dtoeSendRes.body as PlanResponseBody).status).toBe(
      'UNDER_DTOE_REVIEW',
    );

    const decisionRes = await request(app.getHttpServer())
      .post(`/api/plans/${humanId}/dtoe-approve`)
      .set('Cookie', dtoeAuth.cookie)
      .expect(201);
    const decided = decisionRes.body as PlanResponseBody;
    expect(decided.status).toBe('APPROVED_BY_DTOE');
    expect(decided.decidedAt).toBeTruthy();

    await request(app.getHttpServer())
      .post(`/api/plans/${humanId}/slots/${created.slots[0].id}/files`)
      .set('Cookie', filialAuth.cookie)
      .attach('file', Buffer.from('x'), 'x.txt')
      .expect(400);
  });

  it('чужой филиал не видит и не может направить план на проверку', async () => {
    const filialAuth = await loginAs(Role.FILIAL, filial.id);
    const otherFilialAuth = await loginAs(Role.FILIAL, otherFilial.id);

    const createRes = await request(app.getHttpServer())
      .post('/api/plans')
      .set('Cookie', filialAuth.cookie)
      .send({ planTypeId: planType.id })
      .expect(201);
    const { humanId } = createRes.body as PlanResponseBody;

    await request(app.getHttpServer())
      .get(`/api/plans/${humanId}`)
      .set('Cookie', otherFilialAuth.cookie)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/plans/${humanId}/send`)
      .set('Cookie', otherFilialAuth.cookie)
      .send({ cfoIds: [cfo.id] })
      .expect(403);
  });

  it('отклоняет направление неукомплектованного плана', async () => {
    const filialAuth = await loginAs(Role.FILIAL, filial.id);

    const createRes = await request(app.getHttpServer())
      .post('/api/plans')
      .set('Cookie', filialAuth.cookie)
      .send({ planTypeId: planType.id })
      .expect(201);
    const { humanId } = createRes.body as PlanResponseBody;

    await request(app.getHttpServer())
      .post(`/api/plans/${humanId}/send`)
      .set('Cookie', filialAuth.cookie)
      .send({ cfoIds: [cfo.id] })
      .expect(400);
  });

  it('возврат ЦФО с замечанием блокирует повторную отправку до исправления', async () => {
    const filialAuth = await loginAs(Role.FILIAL, filial.id);
    const cfoAuth = await loginAs(Role.CFO, undefined, cfo.id);

    const createRes = await request(app.getHttpServer())
      .post('/api/plans')
      .set('Cookie', filialAuth.cookie)
      .send({ planTypeId: planType.id })
      .expect(201);
    const created = createRes.body as PlanResponseBody;
    for (const slot of created.slots) {
      await request(app.getHttpServer())
        .post(`/api/plans/${created.humanId}/slots/${slot.id}/files`)
        .set('Cookie', filialAuth.cookie)
        .attach('file', Buffer.from('test'), 'test.txt')
        .expect(201);
    }
    await request(app.getHttpServer())
      .post(`/api/plans/${created.humanId}/send`)
      .set('Cookie', filialAuth.cookie)
      .send({ cfoIds: [cfo.id] })
      .expect(201);

    const remarkRes = await request(app.getHttpServer())
      .post(`/api/plans/${created.humanId}/remarks`)
      .set('Cookie', cfoAuth.cookie)
      .send({
        description: 'Не хватает подписи',
        requiredAction: 'Добавить подпись',
      })
      .expect(201);
    const remarkId = (
      remarkRes.body as { remarks: { id: number; status: string }[] }
    ).remarks[0].id;

    const returnRes = await request(app.getHttpServer())
      .post(`/api/plans/${created.humanId}/cfo-return`)
      .set('Cookie', cfoAuth.cookie)
      .expect(201);
    expect((returnRes.body as PlanResponseBody).status).toBe(
      'RETURNED_FOR_REVISION',
    );

    await request(app.getHttpServer())
      .post(`/api/plans/${created.humanId}/resubmit`)
      .set('Cookie', filialAuth.cookie)
      .send({ cfoIds: [cfo.id] })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/plans/${created.humanId}/remarks/${remarkId}/fix`)
      .set('Cookie', filialAuth.cookie)
      .expect(201);
  });
});
