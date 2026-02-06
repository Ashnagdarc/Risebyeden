import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

async function main() {
  const adminUserId = process.env.ADMIN_USER_ID || 'RBE-ADMN';
  const adminPass = process.env.ADMIN_PASSWORD || 'AdminSecure2026!';
  const adminName = process.env.ADMIN_NAME || 'Eden Admin';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@risebyeden.com';

  const hashedPassword = await bcrypt.hash(adminPass, 12);

  const user = await prisma.user.upsert({
    where: { userId: adminUserId },
    update: {
      hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      userId: adminUserId,
      name: adminName,
      email: adminEmail,
      hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log(`Admin user ready: ${user.userId} (${user.role}) — Status: ${user.status}`);
  console.log(`Login with User ID: ${adminUserId} and your admin password.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
