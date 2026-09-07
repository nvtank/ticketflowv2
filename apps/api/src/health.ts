import {
  Controller,
  Get,
  Inject,
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import Redis from 'ioredis';
import { ENVIRONMENT, type Environment } from './config';
import { Database } from './database';

@Injectable()
export class Cache implements OnModuleDestroy {
  readonly client: Redis;
  constructor(@Inject(ENVIRONMENT) env: Environment) {
    this.client = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 0,
      connectTimeout: 1500,
      commandTimeout: 2000,
      retryStrategy: () => null,
    });
    this.client.on('error', () => undefined);
  }
  onModuleDestroy() {
    this.client.disconnect();
  }
}

@Controller('health')
export class HealthController {
  constructor(
    @Inject(Database) private readonly db: Database,
    @Inject(Cache) private readonly cache: Cache,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    try {
      await Promise.all([this.db.$queryRaw`SELECT 1`, this.cache.client.ping()]);
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Dependencies unavailable');
    }
  }
}
