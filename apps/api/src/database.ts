import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { ENVIRONMENT, type Environment } from './config';

@Injectable()
export class Database extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(ENVIRONMENT) env: Environment) {
    super({
      adapter: new PrismaPg({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 3000 }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
