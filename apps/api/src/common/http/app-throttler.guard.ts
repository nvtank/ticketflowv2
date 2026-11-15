import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, any>): Promise<string> {
    // 1. Check if the immediate socket connection is from a trusted proxy (loopback or RFC 1918 private subnets)
    const remoteAddress = String(req.socket?.remoteAddress ?? '');
    const cleanAddress = remoteAddress.replace(/^::ffff:/, '');
    const isLoopback =
      cleanAddress === '127.0.0.1' || cleanAddress === '::1' || cleanAddress === 'localhost';
    const isPrivateSubnet =
      cleanAddress.startsWith('10.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanAddress) ||
      cleanAddress.startsWith('192.168.');
    const isTrustedHop = isLoopback || isPrivateSubnet;

    // 2. If the request arrived through a trusted proxy and carries Cloudflare's verified client IP, use it
    if (isTrustedHop && typeof req.headers?.['cf-connecting-ip'] === 'string') {
      const cfIp = req.headers['cf-connecting-ip'].trim();
      if (cfIp) return cfIp;
    }

    // 3. Otherwise rely on Express req.ip, which walks the X-Forwarded-For chain backwards
    // using the 'trust proxy' configuration ('loopback', 'linklocal', 'uniquelocal')
    // and stops at the first untrusted IP, ignoring any client-forged headers from untrusted connections.
    const resolvedIp = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    return String(resolvedIp);
  }
}
