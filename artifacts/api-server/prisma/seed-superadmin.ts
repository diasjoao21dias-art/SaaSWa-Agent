/**
 * seed-superadmin.ts — CLI script to promote a user to platform superadmin.
 *
 * Usage:
 *   pnpm --filter @workspace/api-server exec tsx prisma/seed-superadmin.ts <email>
 *
 * Example:
 *   pnpm --filter @workspace/api-server exec tsx prisma/seed-superadmin.ts admin@yourcompany.com
 *
 * Safety:
 *   - Only promotes existing, active, non-deleted users.
 *   - Running the script again on an already-promoted user is a no-op.
 *   - Prints the result to stdout and exits with a non-zero code on failure.
 *   - Never called from application code — superadmin status can only be set
 *     through this script or a direct, audited DB operation.
 *
 * To demote a superadmin (remove the flag):
 *   UPDATE users SET is_super_admin = false WHERE email = '<email>';
 */

import { PrismaClient } from '@prisma/client';

async function main(): Promise<void> {
  const email = process.argv[2]?.trim();

  if (!email) {
    console.error(
      'Error: email argument is required.\n' +
      'Usage: tsx prisma/seed-superadmin.ts <email>',
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        isSuperAdmin: true,
        tenant: { select: { name: true, slug: true } },
      },
    });

    if (!user) {
      console.error(`Error: No active user found with email "${email}".`);
      process.exit(1);
    }

    if (user.isSuperAdmin) {
      console.log(
        `ℹ️  User "${user.name}" (${email}) is already a platform superadmin. No changes made.`,
      );
      return;
    }

    if (user.status !== 'ACTIVE') {
      console.error(
        `Error: User "${user.name}" has status "${user.status}". ` +
        'Only ACTIVE users can be promoted to superadmin.',
      );
      process.exit(1);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isSuperAdmin: true },
    });

    console.log(
      `✅ Success! "${user.name}" (${email}) is now a platform superadmin.\n` +
      `   Tenant: ${user.tenant.name} (${user.tenant.slug})\n` +
      `   User ID: ${user.id}\n\n` +
      '   They must log in again for the new JWT claim to take effect.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
