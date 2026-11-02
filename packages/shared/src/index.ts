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

export const eventInputSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(10).max(5000),
    venue: z.string().trim().min(3).max(300),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
  })
  .strict()
  .refine((event) => new Date(event.endsAt) > new Date(event.startsAt), {
    message: 'Event end must follow start',
  });

export const eventReviewSchema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('approve') }).strict(),
  z.object({ decision: z.literal('reject'), reason: z.string().trim().min(1).max(500) }).strict(),
]);
