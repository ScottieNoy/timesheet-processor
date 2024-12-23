import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session?.user?.isAdmin) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error fetching users' }),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session?.user?.isAdmin) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  try {
    const body = await request.json();
    const { username, password, isAdmin } = body;

    if (!username || !password) {
      return new NextResponse(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return new NextResponse(
        JSON.stringify({ error: 'Username already exists' }),
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        isAdmin: isAdmin || false,
      },
      select: {
        id: true,
        username: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error creating user' }),
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession();

  if (!session?.user?.isAdmin) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  try {
    const body = await request.json();
    const { id, username, password, isAdmin } = body;

    if (!id || !username) {
      return new NextResponse(
        JSON.stringify({ error: 'User ID and username are required' }),
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return new NextResponse(
        JSON.stringify({ error: 'User not found' }),
        { status: 404 }
      );
    }

    const userWithSameUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (userWithSameUsername && userWithSameUsername.id !== id) {
      return new NextResponse(
        JSON.stringify({ error: 'Username already exists' }),
        { status: 400 }
      );
    }

    const updateData: any = {
      username,
      isAdmin: isAdmin || false,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error updating user' }),
      { status: 500 }
    );
  }
}
