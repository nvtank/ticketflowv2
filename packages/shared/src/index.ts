import { z } from 'zod';

export const roleSchema = z.enum(['CUSTOMER', 'ORGANIZER', 'STAFF', 'ADMIN']);
export type Role = z.infer<typeof roleSchema>;

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .max(254)
      .pipe(z.email())
      .transform((value) => value.trim().toLowerCase()),
    name: z.string().trim().min(1).max(120),
    password: z.string().min(12).max(128),
  })
  .strict();
export const loginSchema = registerSchema.pick({ email: true, password: true });

export const healthSchema = z.object({
  status: z.enum(['ok', 'unavailable']),
});
export type Health = z.infer<typeof healthSchema>;
