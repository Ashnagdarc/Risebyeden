import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

type EnlistPayload = {
  userId: string;
  accessKey: string;
  accessToken: string;
  organization: string;
};

// POST — Client uses userId + accessKey + accessToken to request access
export async function POST(request: Request) {
  const body = (await request.json()) as Partial<EnlistPayload>;

  if (!body.userId || !body.accessKey || !body.accessToken || !body.organization) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { userId: body.userId.toUpperCase() },
  });

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Verify access key
  const isKeyValid = await bcrypt.compare(body.accessKey, user.hashedPassword);
  if (!isKeyValid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Verify access token
  if (user.accessToken !== body.accessToken.toUpperCase()) {
    return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
  }

  if (user.tokenUsed) {
    return NextResponse.json({ error: 'Access token has already been used' }, { status: 400 });
  }

  if (user.status === 'ACTIVE') {
    return NextResponse.json({ error: 'Account is already active' }, { status: 400 });
  }

  // Mark token as used, save organization, keep status PENDING for admin approval
  await prisma.user.update({
    where: { id: user.id },
    data: {
      organization: body.organization,
      tokenUsed: true,
    },
  });

  return NextResponse.json({
    message: 'Access request submitted. Awaiting admin authorization.',
  });
}
