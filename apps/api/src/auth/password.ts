import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const value = await derive(password, salt);
  return `scrypt:${salt}:${value.toString('hex')}`;
}

export async function verifyPassword(password: string, stored?: string): Promise<boolean> {
  const [, salt, hash] = (stored ?? '').split(':');
  const actual = await derive(password, salt ?? 'invalid-user-timing-salt');
  const expected =
    hash && /^[a-f0-9]{128}$/.test(hash) ? Buffer.from(hash, 'hex') : Buffer.alloc(64);
  return timingSafeEqual(actual, expected) && Boolean(stored?.startsWith('scrypt:'));
}
