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
      location: 'Victoria Island',
      city: 'Lagos',
      state: 'Lagos',
      propertyType: 'Mixed Use',
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 3500,
      yearBuilt: 2020,
      appreciation: 7.2,
      capRate: 4.8,
      occupancy: 98,
      acquiredAt: new Date('2023-03-15'),
      status: 'AVAILABLE' as const,
      basePrice: 4200000,
      description: 'A flagship mixed-use residence with premium finishes and skyline views.',
    },
    {
      name: 'Veridian Atrium',
      slug: 'veridian-atrium',
      location: 'Ikoyi',
      city: 'Lagos',
      state: 'Lagos',
      propertyType: 'Residential',
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 2800,
      yearBuilt: 2019,
      appreciation: 5.8,
      capRate: 4.4,
      occupancy: 100,
      acquiredAt: new Date('2022-06-10'),
      status: 'AVAILABLE' as const,
      basePrice: 6100000,
      description: 'Refined residential tower with curated amenities and private concierge.',
    },
    {
      name: 'Gilded Loft',
      slug: 'gilded-loft',
      location: 'Banana Island',
      city: 'Lagos',
      state: 'Lagos',
      propertyType: 'Commercial',
      bedrooms: 0,
      bathrooms: 0,
      squareFeet: 4200,
      yearBuilt: 2018,
      appreciation: 6.1,
      capRate: 6.0,
      occupancy: 94,
      acquiredAt: new Date('2023-09-01'),
      status: 'RESERVED' as const,
      basePrice: 7800000,
      description: 'Boutique commercial lofts designed for premium tenants and flexible layouts.',
    },
    {
      name: 'Beachfront Paradise',
      slug: 'beachfront-paradise',
      location: 'Lekki Phase 1',
      city: 'Lagos',
      state: 'Lagos',
      propertyType: 'Luxury Residential',
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 3800,
      yearBuilt: 2022,
      appreciation: 7.5,
      capRate: 4.9,
      occupancy: 100,
      acquiredAt: new Date('2023-11-20'),
      status: 'AVAILABLE' as const,
      basePrice: 5200000,
      description: 'Oceanfront estate with private terraces, curated interiors, and concierge services.',
    },
  ];

  for (const property of properties) {
    const record = await prisma.property.upsert({
      where: { slug: property.slug },
      update: {
        name: property.name,
        location: property.location,
        city: property.city,
        state: property.state,
        propertyType: property.propertyType,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        squareFeet: property.squareFeet,
        yearBuilt: property.yearBuilt,
        appreciation: property.appreciation,
        capRate: property.capRate,
        occupancy: property.occupancy,
        acquiredAt: property.acquiredAt,
        status: property.status,
        basePrice: property.basePrice,
        description: property.description,
      },
      create: property,
    });

    const priceUpdates = [
      {
        price: Number(property.basePrice) * 0.98,
        effectiveDate: new Date('2026-01-30'),
        source: 'Market Index',
      },
      {
        price: Number(property.basePrice),
        effectiveDate: new Date('2026-02-05'),
        source: 'Internal Review',
      },
    ];

    for (const update of priceUpdates) {
      await prisma.priceUpdate.upsert({
        where: {
          propertyId_effectiveDate: {
            propertyId: record.id,
            effectiveDate: update.effectiveDate,
          },
        },
        update: {
          price: update.price,
          source: update.source,
        },
        create: {
          propertyId: record.id,
          price: update.price,
          effectiveDate: update.effectiveDate,
          source: update.source,
        },
      });
    }
  }

  const announcements = [
    {
      type: 'FEATURE' as const,
      title: 'New Portfolio Analytics Dashboard',
      description: 'Advanced analytics with AI-driven insights, trend forecasts, and tailored reports.',
      isNew: true,
    },
    {
      type: 'MARKET' as const,
      title: 'Q4 2024 Market Report Available',
      description: 'Quarterly report on emerging markets, property valuations, and new opportunities.',
      isNew: true,
    },
    {
      type: 'POLICY' as const,
      title: 'Updated Investment Terms',
      description: 'Updated terms to improve transparency and investor protections across portfolios.',
      isNew: false,
    },
    {
      type: 'MAINTENANCE' as const,
      title: 'Scheduled Maintenance Complete',
      description: 'Platform maintenance completed successfully with security and performance upgrades.',
      isNew: false,
    },
  ];

  for (const announcement of announcements) {
    await prisma.announcement.upsert({
      where: { title: announcement.title },
      update: {
        description: announcement.description,
        type: announcement.type,
        isNew: announcement.isNew,
      },
      create: announcement,
    });
  }

  console.log(`Seeded ${properties.length} properties and ${announcements.length} announcements.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
