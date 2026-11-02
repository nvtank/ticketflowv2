import 'reflect-metadata';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import { parseEnvironment } from './config';
import { hashPassword } from './auth/password';

async function seed() {
  const env = parseEnvironment(process.env);
  const url = new URL(env.DATABASE_URL);
  if (
    env.NODE_ENV === 'production' ||
    !['127.0.0.1', 'localhost'].includes(url.hostname) ||
    !['/tf2', '/tf2_test'].includes(url.pathname)
  ) {
    throw new Error('Seed restricted to local development/test databases');
  }
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 12 || password.length > 128)
    throw new Error('Set SEED_PASSWORD (12–128 characters)');
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });
  try {
    const passwordHash = await hashPassword(password);
    await db.$transaction(async (tx) => {
      const org = await tx.organization.upsert({
        where: { id: '00000000-0000-4000-8000-000000000001' },
        create: {
          id: '00000000-0000-4000-8000-000000000001',
          name: 'Synthetic local demo organization',
        },
        update: {},
      });
      for (const role of Object.values(Role)) {
        const email = `tf2-demo-${role.toLowerCase()}@example.invalid`;
        const user = await tx.user.upsert({
          where: { email },
          create: { email, name: `Synthetic ${role}`, passwordHash, role },
          update: {},
        });
        if (user.role !== role)
          throw new Error('Existing seed identity has a different role; refusing elevation');
        if (role === 'ORGANIZER' || role === 'STAFF')
          await tx.membership.upsert({
            where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
            create: { userId: user.id, organizationId: org.id, role },
            update: {},
          });
      }
    });
    console.info('Synthetic local seed ready; no existing passwords changed');
  } finally {
    await db.$disconnect();
  }
}

void seed().catch(() => {
  console.error('Seed failed; verify local environment and SEED_PASSWORD');
  process.exitCode = 1;
});
