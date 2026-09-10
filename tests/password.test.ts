import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../apps/api/src/auth/password';
import { registerSchema } from '../packages/shared/src';

describe('password and registration boundary', () => {
  it('salts hashes and never stores plaintext; verifies only correct password', async () => {
    const password = 'a-long-private-password';
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    expect(first).not.toEqual(second);
    expect(first).not.toContain(password);
    expect(await verifyPassword(password, first)).toBe(true);
    expect(await verifyPassword('wrong-password', first)).toBe(false);
    expect(await verifyPassword(password)).toBe(false);
    expect(await verifyPassword(password, 'broken')).toBe(false);
  });
  it('normalizes email and rejects overlong passwords/elevated role', () => {
    const input = { email: ' User@EXAMPLE.ORG ', name: ' Demo ', password: 'safe-long-password' };
    expect(registerSchema.parse(input)).toMatchObject({ email: 'user@example.org', name: 'Demo' });
    expect(registerSchema.safeParse({ ...input, password: 'x'.repeat(129) }).success).toBe(false);
    expect(registerSchema.safeParse({ ...input, role: 'ORGANIZER' }).success).toBe(false);
  });
});
