import { Inject, Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ENVIRONMENT } from '../config/configuration.module';
import type { Environment } from '../config/environment';
import { DatabaseService } from '../database/database.service';
import { OrderEmailTransport, orderEmailMessage, orderEmailMode } from './order-email.transport';

const retryDelaysMs = [60_000, 600_000, 3_600_000, 21_600_000];
const maxAttempts = retryDelaysMs.length + 1;
const maxAgeMs = 12 * 60 * 60 * 1000;
const leaseMs = 60_000;

@Injectable()
export class OrderEmailWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderEmailWorker.name);
  private timer?: ReturnType<typeof setInterval>;
  private running?: Promise<void>;

  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(ENVIRONMENT) private readonly env: Environment,
    @Inject(OrderEmailTransport) private readonly transport: OrderEmailTransport,
  ) {}

  onModuleInit() {
    // Integration tests drive the worker explicitly. The Playwright API uses the same test mode.
    if (this.env.NODE_ENV === 'test' || !orderEmailMode(this.env)) return;
    this.timer = setInterval(() => {
      this.running ??= this.processNext()
        .catch(() => this.logger.warn('Order email worker failed. The next scan will retry.'))
        .finally(() => (this.running = undefined));
    }, 5000);
    this.timer.unref();
  }

  async onModuleDestroy() {
    clearInterval(this.timer);
    await this.running;
  }

  async processNext() {
    const mode = orderEmailMode(this.env);
    if (!mode) return;
    const now = new Date();
    const cutoff = new Date(now.getTime() - maxAgeMs);
    const leaseUntil = new Date(now.getTime() + leaseMs);
    const expired = await this.db.orderEmailDelivery.updateMany({
      where: {
        mode,
        status: 'PENDING',
        availableAt: { lte: now },
        OR: [{ attempts: { gte: maxAttempts } }, { createdAt: { lte: cutoff } }],
      },
      data: { status: 'DEAD_LETTER', finishedAt: now, lastFailure: 'RETRY_WINDOW_EXHAUSTED' },
    });
    if (expired.count) this.logger.warn(`Order emails expired: ${expired.count}.`);

    // Claim atomically across API instances, then release all DB locks before calling Resend.
    const [job] = await this.db.$queryRaw<{ orderId: string; attempts: number }[]>`
      WITH candidate AS (
        SELECT "orderId" FROM "OrderEmailDelivery"
        WHERE "mode" = ${mode}::"OrderEmailMode" AND "status" = 'PENDING'
          AND "availableAt" <= ${now} AND "createdAt" > ${cutoff}
          AND "attempts" < ${maxAttempts}
        ORDER BY "availableAt", "orderId"
        LIMIT 1 FOR UPDATE SKIP LOCKED
      )
      UPDATE "OrderEmailDelivery" AS delivery
      SET "attempts" = delivery."attempts" + 1,
          "availableAt" = ${leaseUntil}
      FROM candidate
      WHERE delivery."orderId" = candidate."orderId"
      RETURNING delivery."orderId", delivery."attempts"`;
    if (!job) return;

    const order = await this.db.order.findUniqueOrThrow({
      where: { id: job.orderId },
      select: {
        id: true,
        status: true,
        totalVnd: true,
        user: { select: { email: true } },
        event: { select: { title: true } },
        items: { select: { ticket: { select: { id: true } } } },
      },
    });
    if (Date.now() >= leaseUntil.getTime()) return;
    const ticketIds = order.items.flatMap(({ ticket }) => (ticket ? [ticket.id] : [])).sort();
    const outcome =
      order.status === 'PAID' && ticketIds.length > 0 && ticketIds.length === order.items.length
        ? await this.transport.send(
            job.orderId,
            orderEmailMessage(this.env.PAYMENT_RETURN_ORIGIN, order, ticketIds),
          )
        : { status: 'FAILED' as const, code: 'ORDER_UNAVAILABLE', retryable: false };

    // A worker whose lease expired cannot overwrite a later attempt.
    const where = { orderId: job.orderId, attempts: job.attempts, status: 'PENDING' as const };
    const finishedAt = new Date();
    if (outcome.status !== 'FAILED') {
      await this.db.orderEmailDelivery.updateMany({
        where,
        data: { status: outcome.status, finishedAt, lastFailure: null },
      });
      return;
    }

    const delay = retryDelaysMs[job.attempts - 1];
    const retry = outcome.retryable && delay !== undefined;
    const updated = await this.db.orderEmailDelivery.updateMany({
      where,
      data: {
        lastFailure: outcome.code,
        ...(retry
          ? { availableAt: new Date(finishedAt.getTime() + delay) }
          : { status: 'DEAD_LETTER', finishedAt }),
      },
    });
    if (updated.count)
      this.logger.warn(
        `Order email ${job.orderId} attempt ${job.attempts} failed (${outcome.code}). ${retry ? 'Retry scheduled.' : 'Dead letter.'}`,
      );
  }
}
