import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@risebyeden.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'AdminSecure2026!';
  const adminName = process.env.ADMIN_NAME || 'Eden Admin';

  const hashedPassword = await bcrypt.hash(adminPass, 12);

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      hashedPassword,
      role: 'ADMIN',
    },
    create: {
      name: adminName,
      email: adminEmail,
      hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`Admin user ready: ${user.email} (${user.role})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
