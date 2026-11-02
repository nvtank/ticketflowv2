import 'reflect-metadata';
import { DynamicModule, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ENVIRONMENT, type Environment } from './config';
import { Database } from './database';
import { Cache, HealthController } from './health';

export type { INestApplication } from '@nestjs/common';

@Module({})
export class ApplicationModule {
  static configure(environment: Environment): DynamicModule {
    return {
      module: ApplicationModule,
      controllers: [HealthController],
      providers: [{ provide: ENVIRONMENT, useValue: environment }, Database, Cache],
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
  app.enableCors({ origin: environment.WEB_ORIGIN, credentials: true });
  app.enableShutdownHooks();
  return app;
}
