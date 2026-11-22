import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

export type ThrottleRequest = {
  ip?: string;
  socket?: { remoteAddress?: string };
};

export function resolveThrottleTracker(req: ThrottleRequest): string {
  // Express resolves req.ip using the configured trust-proxy boundary. Never parse a
  // forwarding header here: doing so would let callers choose their own throttle key.
  return String(req.ip || req.socket?.remoteAddress || '127.0.0.1');
}

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: ThrottleRequest): Promise<string> {
    return resolveThrottleTracker(req);
  }
}
