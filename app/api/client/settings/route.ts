import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

type SettingsPayload = {
  name?: string | null;
  email?: string | null;
  settings?: {
    twoFactorEnabled?: boolean;
    deviceApproval?: boolean;
    weeklySecurityReports?: boolean;
    portfolioAlerts?: boolean;
    acquisitionOpportunities?: boolean;
    marketReports?: boolean;
    portfolioStrategy?: string | null;
    defaultRegion?: string | null;
    dataSharing?: string | null;
  };
};

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }
  return session;
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
        settings: {
          select: {
            twoFactorEnabled: true,
            deviceApproval: true,
            weeklySecurityReports: true,
            portfolioAlerts: true,
            acquisitionOpportunities: true,
            marketReports: true,
            portfolioStrategy: true,
            defaultRegion: true,
            dataSharing: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      settings: user.settings || {
        twoFactorEnabled: true,
        deviceApproval: true,
        weeklySecurityReports: false,
        portfolioAlerts: true,
        acquisitionOpportunities: true,
        marketReports: false,
        portfolioStrategy: 'Balanced',
        defaultRegion: 'West Africa',
        dataSharing: 'Limited',
      },
    });
  } catch (error) {
    console.error('Failed to load settings', error);
    return NextResponse.json({ error: 'Unable to load settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = (await request.json()) as SettingsPayload;
  const nextName = body.name === undefined ? undefined : body.name?.trim() || null;
  const nextEmail = body.email === undefined ? undefined : body.email?.trim().toLowerCase() || null;

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

    if (body.settings) {
      await prisma.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          twoFactorEnabled: body.settings.twoFactorEnabled ?? true,
          deviceApproval: body.settings.deviceApproval ?? true,
          weeklySecurityReports: body.settings.weeklySecurityReports ?? false,
          portfolioAlerts: body.settings.portfolioAlerts ?? true,
          acquisitionOpportunities: body.settings.acquisitionOpportunities ?? true,
          marketReports: body.settings.marketReports ?? false,
          portfolioStrategy: body.settings.portfolioStrategy ?? null,
          defaultRegion: body.settings.defaultRegion ?? null,
          dataSharing: body.settings.dataSharing ?? null,
        },
        update: {
          twoFactorEnabled: body.settings.twoFactorEnabled ?? undefined,
          deviceApproval: body.settings.deviceApproval ?? undefined,
          weeklySecurityReports: body.settings.weeklySecurityReports ?? undefined,
          portfolioAlerts: body.settings.portfolioAlerts ?? undefined,
          acquisitionOpportunities: body.settings.acquisitionOpportunities ?? undefined,
          marketReports: body.settings.marketReports ?? undefined,
          portfolioStrategy: body.settings.portfolioStrategy ?? undefined,
          defaultRegion: body.settings.defaultRegion ?? undefined,
          dataSharing: body.settings.dataSharing ?? undefined,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unable to update settings' }, { status: 500 });
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

  const body = (await request.json()) as SettingsPayload;
  const nextName = body.name === undefined ? undefined : body.name?.trim() || null;
  const nextEmail = body.email === undefined ? undefined : body.email?.trim().toLowerCase() || null;
  const hasUserUpdate = nextName !== undefined || nextEmail !== undefined;
  const hasSettingsUpdate = Boolean(body.settings && Object.keys(body.settings).length > 0);

  if (!hasUserUpdate && !hasSettingsUpdate) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
  }

  try {
    if (hasUserUpdate) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: nextName,
          email: nextEmail,
        },
      });
    }

    if (hasSettingsUpdate && body.settings) {
      await prisma.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          twoFactorEnabled: body.settings.twoFactorEnabled ?? true,
          deviceApproval: body.settings.deviceApproval ?? true,
          weeklySecurityReports: body.settings.weeklySecurityReports ?? false,
          portfolioAlerts: body.settings.portfolioAlerts ?? true,
          acquisitionOpportunities: body.settings.acquisitionOpportunities ?? true,
          marketReports: body.settings.marketReports ?? false,
          portfolioStrategy: body.settings.portfolioStrategy ?? null,
          defaultRegion: body.settings.defaultRegion ?? null,
          dataSharing: body.settings.dataSharing ?? null,
        },
        update: {
          twoFactorEnabled: body.settings.twoFactorEnabled ?? undefined,
          deviceApproval: body.settings.deviceApproval ?? undefined,
          weeklySecurityReports: body.settings.weeklySecurityReports ?? undefined,
          portfolioAlerts: body.settings.portfolioAlerts ?? undefined,
          acquisitionOpportunities: body.settings.acquisitionOpportunities ?? undefined,
          marketReports: body.settings.marketReports ?? undefined,
          portfolioStrategy: body.settings.portfolioStrategy ?? undefined,
          defaultRegion: body.settings.defaultRegion ?? undefined,
          dataSharing: body.settings.dataSharing ?? undefined,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unable to update settings' }, { status: 500 });
  }
}
