import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'CLIENT';
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as Partial<CreateUserPayload>;

  if (!body.name || !body.email || !body.password || !body.role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(body.password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        hashedPassword,
        role: body.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to create user' }, { status: 500 });
  }
}
