import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { processTimesheet } from '@/lib/timesheet';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new NextResponse(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
      });
    }

    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processTimesheet(buffer);

    // Save the processed file information
    await prisma.processedFile.create({
      data: {
        originalName: file.name,
        processedName: `processed_${file.name}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing timesheet:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error processing timesheet' }),
      { status: 500 }
    );
  }
}
