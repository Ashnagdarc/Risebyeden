import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { sendConsultationEmail } from '@/lib/email';

type ConsultationPayload = {
  type?: 'portfolio' | 'acquisition' | 'market';
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
  advisorId?: string | null;
};

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }
  return session;
}

function mapType(rawType: string | undefined) {
  if (rawType === 'portfolio') {
    return 'PORTFOLIO' as const;
  }
  if (rawType === 'acquisition') {
    return 'ACQUISITION' as const;
  }
  if (rawType === 'market') {
    return 'MARKET' as const;
  }
  return null;
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

  const requests = await prisma.consultationRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      preferredDate: true,
      preferredTime: true,
      notes: true,
      status: true,
      advisor: {
        select: { id: true, name: true, title: true },
      },
      createdAt: true,
    },
  });

  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = (await request.json()) as ConsultationPayload;
  const type = mapType(body.type);
  if (!type || !body.preferredDate) {
    return NextResponse.json({ error: 'Missing consultation type or date' }, { status: 400 });
  }

  const preferredDate = new Date(body.preferredDate);
  if (Number.isNaN(preferredDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, userId: true, name: true, email: true },
    });

    const requestRecord = await prisma.consultationRequest.create({
      data: {
        userId,
        advisorId: body.advisorId || null,
        type,
        preferredDate,
        preferredTime: body.preferredTime || null,
        notes: body.notes?.trim() || null,
      },
      select: {
        id: true,
        type: true,
        preferredDate: true,
        preferredTime: true,
        notes: true,
        advisor: { select: { name: true, title: true } },
      },
    });

    const recipients = process.env.CONSULTATION_NOTIFY_TO
      ? process.env.CONSULTATION_NOTIFY_TO.split(',').map((entry) => entry.trim()).filter(Boolean)
      : [];

    if (recipients.length) {
      const subject = `New consultation request (${requestRecord.type})`;
      const html = `
        <div style="font-family: Arial, sans-serif; color: #111;">
          <h2>New Consultation Request</h2>
          <p><strong>Client:</strong> ${user?.name || 'Unnamed'} (${user?.userId || 'N/A'})</p>
          <p><strong>Email:</strong> ${user?.email || 'N/A'}</p>
          <p><strong>Type:</strong> ${requestRecord.type}</p>
          <p><strong>Preferred Date:</strong> ${requestRecord.preferredDate.toDateString()}</p>
          <p><strong>Preferred Time:</strong> ${requestRecord.preferredTime || 'Not specified'}</p>
          <p><strong>Preferred Advisor:</strong> ${requestRecord.advisor?.name || 'No preference'} ${requestRecord.advisor?.title ? `(${requestRecord.advisor.title})` : ''}</p>
          <p><strong>Notes:</strong> ${requestRecord.notes || '—'}</p>
        </div>
      `;

      await sendConsultationEmail({
        to: recipients,
        subject,
        html,
      });
    }

    return NextResponse.json({ request: requestRecord });
  } catch (error) {
    console.error('Failed to create consultation request', error);
    return NextResponse.json({ error: 'Unable to create consultation request' }, { status: 500 });
  }
}
