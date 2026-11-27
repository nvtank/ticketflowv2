import { Inject, Injectable } from '@nestjs/common';
import { ENVIRONMENT } from '../config/configuration.module';
import type { Environment } from '../config/environment';
import type { OrderEmailMode } from '../generated/prisma/client';

export function orderEmailMode(env: Environment): OrderEmailMode | undefined {
  if (env.NODE_ENV !== 'production') return 'STUB';
  if (env.ORDER_EMAIL_PROVIDER === 'resend') return 'RESEND';
}

type OrderEmailMessage = { to: string; subject: string; text: string };

export function orderEmailMessage(
  origin: string,
  order: {
    id: string;
    totalVnd: number;
    user: { email: string };
    event: { title: string };
  },
  ticketIds: string[],
): OrderEmailMessage {
  const total = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    order.totalVnd,
  );
  return {
    to: order.user.email,
    subject: 'TixFlow · Xác nhận thanh toán và phát hành vé',
    text: [
      `Đã thanh toán ${total} cho sự kiện ${order.event.title}.`,
      `Mã đơn hàng: ${order.id}`,
      `Đã phát hành ${ticketIds.length} vé. Đăng nhập vào TixFlow để xem mã QR của từng vé:`,
      ...ticketIds.map((id) => new URL(`/my-tickets/${id}`, origin).href),
    ].join('\n'),
  };
}

type DeliveryResult =
  { status: 'STUBBED' | 'ACCEPTED' } | { status: 'FAILED'; code: string; retryable: boolean };

@Injectable()
export class OrderEmailTransport {
  constructor(@Inject(ENVIRONMENT) private readonly env: Environment) {}

  async send(orderId: string, message: OrderEmailMessage): Promise<DeliveryResult> {
    const mode = orderEmailMode(this.env);
    if (mode === 'STUB') return { status: 'STUBBED' };

    const { RESEND_API_KEY: apiKey, ORDER_EMAIL_FROM: from } = this.env;
    if (mode !== 'RESEND' || !apiKey || !from)
      return { status: 'FAILED', code: 'CONFIGURATION', retryable: false };

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(5000),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `order-confirmation/${orderId}`,
        },
        body: JSON.stringify({ ...message, from }),
      });
      // Provider errors may echo addresses. Only the numeric HTTP status is retained.
      void response.body?.cancel().catch(() => undefined);
      if (response.ok) return { status: 'ACCEPTED' };
      const httpStatus = response.status;
      return {
        status: 'FAILED',
        code: `HTTP_${httpStatus}`,
        retryable: [408, 409, 429].includes(httpStatus) || httpStatus >= 500,
      };
    } catch {
      return { status: 'FAILED', code: 'NETWORK', retryable: true };
    }
  }
}
