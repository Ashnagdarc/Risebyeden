import prisma from '../lib/prisma'; // Correct path for ESM

async function main() {
  const users = await prisma.user.findMany({});
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
