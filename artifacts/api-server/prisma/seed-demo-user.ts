/**
 * seed-demo-user.ts — Creates a demo tenant + user for local development.
 *
 * Run after prisma:seed:
 *   pnpm --filter @workspace/api-server exec tsx prisma/seed-demo-user.ts
 *
 * Demo credentials:
 *   Email:    admin@demo.com
 *   Password: password123
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: { status: 'ACTIVE' },
    create: {
      name: 'Demo Company',
      slug: 'demo',
      email: 'admin@demo.com',
      status: 'ACTIVE',
    },
  });

  const existing = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: 'admin@demo.com' },
  });

  if (existing) {
    console.log('ℹ️  Demo user already exists — skipping.');
    return;
  }

  const passwordHash = await bcrypt.hash('password123', 12);

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      name: 'Admin User',
      passwordHash,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Demo user created: admin@demo.com / password123');
}

main()
  .catch((err: unknown) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
