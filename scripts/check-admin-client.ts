import prisma from '../lib/prisma'; // Correct path for ESM
import { QUERY_LIMITS } from '../lib/db/query-limits';

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: QUERY_LIMITS.scriptsUsers,
  });
  console.log('Users:', users);

  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const clientCount = users.filter(u => u.role === 'CLIENT').length;

  console.log(`Admin users: ${adminCount}`);
  console.log(`Client users: ${clientCount}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
