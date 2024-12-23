import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { processTimesheet } from '@/lib/timesheet';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new NextResponse(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processTimesheet(buffer);

    // Save the processed file information
    await prisma.processedFile.create({
      data: {
        userId: session.user.id,
        filename: file.name,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'File processed successfully',
    });
  } catch (error) {
    console.error('Error processing timesheet:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error processing timesheet' }),
      { status: 500 }
    );
  }
}
