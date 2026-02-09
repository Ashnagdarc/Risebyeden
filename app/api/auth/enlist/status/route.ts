import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

type StatusPayload = {
  userId?: string;
  accessKey?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as StatusPayload;

  if (!body.userId || !body.accessKey) {
    return NextResponse.json({ error: 'User ID and access key are required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { userId: body.userId.toUpperCase() },
    select: { id: true, status: true, hashedPassword: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const isKeyValid = await bcrypt.compare(body.accessKey, user.hashedPassword);
  if (!isKeyValid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  return NextResponse.json({ status: user.status });
}
