import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { sendConsultationEmail } from '@/lib/email';
import { parseJsonBody } from '@/lib/api/validation';
import { QUERY_LIMITS } from '@/lib/db/query-limits';
import { requireSessionPolicy } from '@/lib/security/policy';

const consultationPayloadSchema = z.object({
  type: z.enum(['portfolio', 'acquisition', 'market']),
  preferredDate: z.string().trim().min(1),
  preferredTime: z.string().trim().min(1).max(50).optional(),
  notes: z.string().trim().max(2000).optional(),
  advisorId: z.string().min(1).nullable().optional(),
}).strict();

function mapType(rawType: 'portfolio' | 'acquisition' | 'market') {
  switch (rawType) {
    case 'portfolio':
      return 'PORTFOLIO' as const;
    case 'acquisition':
      return 'ACQUISITION' as const;
    case 'market':
      return 'MARKET' as const;
  }
}

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function GET() {
  const auth = await requireSessionPolicy({ requireUserId: true });
  if (!auth.ok) {
    return auth.response;
  }

  const userId = auth.userId;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const requests = await prisma.consultationRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: QUERY_LIMITS.clientConsultations,
    select: {
      id: true,
      type: true,
      preferredDate: true,
      preferredTime: true,
      notes: true,
      status: true,
      advisor: {
        select: { id: true, userId: true, name: true, email: true, advisorTitle: true, advisorStatus: true },
      },
      createdAt: true,
    },
  });

  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const auth = await requireSessionPolicy({ requireUserId: true });
  if (!auth.ok) {
    return auth.response;
  }

  const userId = auth.userId;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const parsedBody = await parseJsonBody(request, consultationPayloadSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;
  const type = mapType(body.type);

  const preferredDate = new Date(body.preferredDate);
  if (Number.isNaN(preferredDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }

  try {
    if (body.advisorId) {
      const advisor = await prisma.user.findFirst({
        where: {
          id: body.advisorId,
          role: 'AGENT',
          status: 'ACTIVE',
        },
        select: { id: true, advisorStatus: true },
      });

      if (!advisor) {
        return NextResponse.json({ error: 'Advisor not found' }, { status: 404 });
      }
      if (advisor.advisorStatus === 'INACTIVE') {
        return NextResponse.json({ error: 'Advisor is inactive' }, { status: 409 });
      }
    }

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
        advisor: { select: { id: true, userId: true, name: true, advisorTitle: true } },
      },
    });

    const recipients = process.env.CONSULTATION_NOTIFY_TO
      ? process.env.CONSULTATION_NOTIFY_TO.split(',').map((entry) => entry.trim()).filter(Boolean)
      : [];

    if (recipients.length) {
      const subject = `New consultation request (${requestRecord.type})`;
      const clientName = escapeHtml(user?.name || 'Unnamed');
      const clientUserId = escapeHtml(user?.userId || 'N/A');
      const clientEmail = escapeHtml(user?.email || 'N/A');
      const consultationType = escapeHtml(requestRecord.type);
      const preferredDateLabel = escapeHtml(requestRecord.preferredDate.toDateString());
      const preferredTimeLabel = escapeHtml(requestRecord.preferredTime || 'Not specified');
      const advisorName = escapeHtml(requestRecord.advisor?.name || requestRecord.advisor?.userId || 'No preference');
      const advisorTitle = requestRecord.advisor?.advisorTitle ? ` (${escapeHtml(requestRecord.advisor.advisorTitle)})` : '';
      const notes = escapeHtml(requestRecord.notes || '—');
      const html = `
        <div style="font-family: Arial, sans-serif; color: #111;">
          <h2>New Consultation Request</h2>
          <p><strong>Client:</strong> ${clientName} (${clientUserId})</p>
          <p><strong>Email:</strong> ${clientEmail}</p>
          <p><strong>Type:</strong> ${consultationType}</p>
          <p><strong>Preferred Date:</strong> ${preferredDateLabel}</p>
          <p><strong>Preferred Time:</strong> ${preferredTimeLabel}</p>
          <p><strong>Preferred Advisor:</strong> ${advisorName}${advisorTitle}</p>
          <p><strong>Notes:</strong> ${notes}</p>
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
