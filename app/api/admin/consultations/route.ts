import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role || '').toLowerCase() !== 'admin') {
    return null;
  }
  return session;
}

type ConsultationPatchPayload = {
  id?: string;
  status?: 'PENDING' | 'APPROVED' | 'SCHEDULED' | 'DECLINED' | 'COMPLETED';
  advisorId?: string | null;
};

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requests = await prisma.consultationRequest.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      preferredDate: true,
      preferredTime: true,
      notes: true,
      status: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
        },
      },
      advisor: {
        select: { id: true, name: true, title: true },
      },
    },
  });

  return NextResponse.json({ requests });
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as ConsultationPatchPayload;
  if (!body.id) {
    return NextResponse.json({ error: 'Consultation id is required' }, { status: 400 });
  }

  try {
    const consultation = await prisma.consultationRequest.update({
      where: { id: body.id },
      data: {
        status: body.status || undefined,
        advisorId: body.advisorId === undefined ? undefined : body.advisorId,
      },
      select: {
        id: true,
        status: true,
        advisor: { select: { id: true, name: true, title: true } },
      },
    });

    return NextResponse.json({ consultation });
  } catch {
    return NextResponse.json({ error: 'Unable to update consultation' }, { status: 500 });
  }
}
