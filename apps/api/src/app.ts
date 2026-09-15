import 'reflect-metadata';
import { DynamicModule, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ENVIRONMENT, type Environment } from './config';
import { Database } from './database';
import { Cache, HealthController } from './health';
import { AuthController, OrganizationController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { SafeExceptionFilter } from './http-errors';
import {
  OrganizerEventsController,
  AdminEventsController,
  PublicEventsController,
} from './events/events.controller';
import { EventsService } from './events/events.service';

export type { INestApplication } from '@nestjs/common';

@Module({})
export class ApplicationModule {
  static configure(environment: Environment): DynamicModule {
    return {
      module: ApplicationModule,
      controllers: [
        HealthController,
        AuthController,
        OrganizationController,
        OrganizerEventsController,
        AdminEventsController,
        PublicEventsController,
      ],
      providers: [
        { provide: ENVIRONMENT, useValue: environment },
        Database,
        Cache,
        AuthService,
        EventsService,
      ],
    };
  }
}

export async function createApplication(environment: Environment) {
  const app = await NestFactory.create(ApplicationModule.configure(environment), {
    logger: ['error', 'warn'],
  });
  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalFilters(new SafeExceptionFilter());
  app.enableCors({ origin: environment.WEB_ORIGIN, credentials: true });
  app.enableShutdownHooks();
  return app;
}
