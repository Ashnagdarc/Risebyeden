import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { parseJsonBody } from '@/lib/api/validation';
import { QUERY_LIMITS } from '@/lib/db/query-limits';

const profilePatchSchema = z.object({
  name: z.string().trim().min(1).max(120).nullable().optional(),
  email: z.string().trim().email().nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  location: z.string().trim().max(200).nullable().optional(),
  bio: z.string().trim().max(2000).nullable().optional(),
  visibility: z.enum(['private', 'partners', 'public']).nullable().optional(),
  riskProfile: z.string().trim().max(120).nullable().optional(),
}).strict();

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }
  return session;
}

function resolveTierLabel(propertyCount: number) {
  if (propertyCount >= 15) {
    return 'Oga Boss';
  }
  if (propertyCount >= 10) {
    return 'Prime';
  }
  return 'Core';
}

function parseLocation(rawLocation: string | null | undefined) {
  if (!rawLocation) {
    return { city: undefined, region: undefined, country: undefined };
  }

  const parts = rawLocation
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return { city: null, region: null, country: null };
  }

  if (parts.length === 1) {
    return { city: parts[0], region: undefined, country: undefined };
  }

  if (parts.length === 2) {
    return { city: parts[0], region: undefined, country: parts[1] };
  }

  return { city: parts[0], region: parts[1], country: parts.slice(2).join(', ') };
}

function mapVisibilityToDataSharing(visibility?: string | null) {
  if (visibility === 'private') {
    return 'Limited';
  }
  if (visibility === 'partners') {
    return 'Standard';
  }
  if (visibility === 'public') {
    return 'Full';
  }
  return undefined;
}

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organization: true,
        status: true,
        createdAt: true,
        clientProfile: {
          select: {
            phone: true,
            city: true,
            region: true,
            country: true,
            bio: true,
            riskProfile: true,
            tierOverride: true,
            tierOverrideEnabled: true,
          },
        },
        settings: {
          select: {
            portfolioStrategy: true,
            dataSharing: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const clientProperties = await prisma.clientProperty.findMany({
      where: { userId },
      orderBy: { purchasedAt: 'desc' },
      take: QUERY_LIMITS.clientProperties,
      select: {
        quantity: true,
        property: {
          select: {
            basePrice: true,
          },
        },
      },
    });

    const totalValue = clientProperties.reduce((sum, entry) => {
      const price = entry.property.basePrice ? Number(entry.property.basePrice) : 0;
      return sum + price * (entry.quantity || 1);
    }, 0);

    const propertyCount = clientProperties.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
    const activeHoldings = propertyCount;
    const overrideEnabled = Boolean(user.clientProfile?.tierOverrideEnabled);
    const overrideLabel = user.clientProfile?.tierOverride || null;
    const computedTier = resolveTierLabel(propertyCount);
    const tier = overrideEnabled && overrideLabel ? overrideLabel : computedTier;

    const interestRequests = await prisma.interestRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        createdAt: true,
        property: { select: { name: true } },
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        status: user.status,
        createdAt: user.createdAt,
      },
      profile: user.clientProfile,
      settings: user.settings,
      stats: {
        totalValue,
        activeHoldings,
        tier,
      },
      activities: interestRequests.map((entry) => ({
        id: entry.id,
        title: `Requested access to ${entry.property.name}`,
        createdAt: entry.createdAt,
        category: 'Acquisition',
      })),
    });
  } catch (error) {
    console.error('Failed to load profile', error);
    return NextResponse.json({ error: 'Unable to load profile' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const parsedBody = await parseJsonBody(request, profilePatchSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;
  const nextName = body.name === undefined ? undefined : body.name?.trim() || null;
  const nextEmail = body.email === undefined ? undefined : body.email?.trim().toLowerCase() || null;
  const nextPhone = body.phone === undefined ? undefined : body.phone?.trim() || null;
  const nextBio = body.bio === undefined ? undefined : body.bio?.trim() || null;
  const locationParts = body.location === undefined ? null : parseLocation(body.location);
  const nextVisibility = mapVisibilityToDataSharing(body.visibility);
  const nextRiskProfile = body.riskProfile === undefined ? undefined : body.riskProfile?.trim() || null;

  try {
    if (nextName !== undefined || nextEmail !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: nextName,
          email: nextEmail,
        },
      });
    }

    const hasProfileUpdate =
      nextPhone !== undefined ||
      nextBio !== undefined ||
      nextRiskProfile !== undefined ||
      locationParts !== null;

    if (hasProfileUpdate) {
      const data = {
        phone: nextPhone,
        bio: nextBio,
        riskProfile: nextRiskProfile,
        city: locationParts?.city ?? undefined,
        region: locationParts?.region ?? undefined,
        country: locationParts?.country ?? undefined,
      };

      await prisma.clientProfile.upsert({
        where: { userId },
        create: {
          userId,
          phone: data.phone ?? null,
          bio: data.bio ?? null,
          riskProfile: data.riskProfile ?? null,
          city: data.city ?? null,
          region: data.region ?? null,
          country: data.country ?? null,
        },
        update: data,
      });
    }

    if (nextVisibility !== undefined) {
      await prisma.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          dataSharing: nextVisibility,
        },
        update: {
          dataSharing: nextVisibility,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to update profile', error);
    return NextResponse.json({ error: 'Unable to update profile' }, { status: 500 });
  }
}
