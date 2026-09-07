import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    DATABASE_URL: z.url().refine((url) => /^postgres(?:ql)?:/.test(url)),
    REDIS_URL: z.url().refine((url) => /^rediss?:/.test(url)),
    WEB_ORIGIN: z.url().refine((value) => {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
    }),
    JWT_SECRET: z.string().min(32),
    PAYMENT_PROVIDER: z.enum(['disabled', 'mock']).default('disabled'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production') {
      if (!env.WEB_ORIGIN.startsWith('https://')) {
        ctx.addIssue({ code: 'custom', path: ['WEB_ORIGIN'], message: 'HTTPS required' });
      }
      if (env.PAYMENT_PROVIDER === 'mock') {
        ctx.addIssue({ code: 'custom', path: ['PAYMENT_PROVIDER'], message: 'Mock forbidden' });
      }
      if (env.JWT_SECRET.toLowerCase().includes('development')) {
        ctx.addIssue({
          code: 'custom',
          path: ['JWT_SECRET'],
          message: 'Development secret forbidden',
        });
      }
    }
  });

export type Environment = z.infer<typeof envSchema>;
export const ENVIRONMENT = Symbol('ENVIRONMENT');

export function parseEnvironment(source: NodeJS.ProcessEnv): Environment {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    // Only field names; never echo secret values or connection URLs.
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
    throw new Error(`Invalid environment fields: ${fields.join(', ')}`);
  }
  return result.data;
}
