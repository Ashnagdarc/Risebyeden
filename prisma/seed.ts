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

  const properties = [
    {
      name: 'Obsidian Heights',
      slug: 'obsidian-heights',
      location: 'Victoria Island, Lagos',
      status: 'AVAILABLE' as const,
      basePrice: 4200000,
    },
    {
      name: 'Veridian Atrium',
      slug: 'veridian-atrium',
      location: 'Ikoyi, Lagos',
      status: 'AVAILABLE' as const,
      basePrice: 6100000,
    },
    {
      name: 'Gilded Loft',
      slug: 'gilded-loft',
      location: 'Banana Island, Lagos',
      status: 'RESERVED' as const,
      basePrice: 7800000,
    },
    {
      name: 'Beachfront Paradise',
      slug: 'beachfront-paradise',
      location: 'Lekki Phase 1, Lagos',
      status: 'AVAILABLE' as const,
      basePrice: 5200000,
    },
  ];

  for (const property of properties) {
    await prisma.property.upsert({
      where: { slug: property.slug },
      update: {
        name: property.name,
        location: property.location,
        status: property.status,
        basePrice: property.basePrice,
      },
      create: property,
    });
  }

  console.log(`Seeded ${properties.length} properties.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
