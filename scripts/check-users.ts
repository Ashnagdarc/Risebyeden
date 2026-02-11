import prisma from '../lib/prisma';
import { QUERY_LIMITS } from '../lib/db/query-limits';

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: QUERY_LIMITS.scriptsUsers,
    select: {
      id: true,
      userId: true,
      status: true,
      hashedPassword: true,
      email: true,
      role: true,
    },
  });
  console.table(users);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
