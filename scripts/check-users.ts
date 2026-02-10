import prisma from '../lib/prisma';

async function main() {
  const users = await prisma.user.findMany({
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
