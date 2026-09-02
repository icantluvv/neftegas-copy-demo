import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { SessionAuthGuard } from './common/guards/session-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { CorrectionsModule } from './corrections/corrections.module';
import { FactPackagesModule } from './fact-packages/fact-packages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrgModule } from './org/org.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('POSTGRES_HOST', 'localhost'),
        port: config.get<number>('POSTGRES_PORT', 5432),
        username: config.get('POSTGRES_USER', 'gas_dashboard'),
        password: config.get('POSTGRES_PASSWORD', 'gas_dashboard'),
        database: config.get('POSTGRES_DB', 'gas_dashboard'),
        autoLoadEntities: true,
        // На старте dev-стека применяем схему напрямую по сущностям — как только
        // появится первая настоящая миграция, эту синхронизацию нужно выключить.
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    RedisModule,
    AuthModule,
    UsersModule,
    CorrectionsModule,
    FactPackagesModule,
    NotificationsModule,
    OrgModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: SessionAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
