import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcrypt';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session?.user?.isAdmin) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        username: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error fetching user' }),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session?.user?.isAdmin) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  try {
    const body = await request.json();
    const { username, password, isAdmin } = body;

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        NOT: {
          id: params.id,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Username is already taken' },
        { status: 400 }
      );
    }

    const updateData: any = {
      username,
      isAdmin,
    };

    // Only update password if it's provided
    if (password) {
      updateData.password = await hash(password, 10);
    }

    const user = await prisma.user.update({
      where: {
        id: params.id,
      },
      data: updateData,
      select: {
        id: true,
        username: true,
        isAdmin: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error updating user' }),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session?.user?.isAdmin) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  try {
    const user = await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error deleting user:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error deleting user' }),
      { status: 500 }
    );
  }
}
