import { NextRequest, NextResponse } from 'next/server';
import { processTimesheet } from '@/lib/excel';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process the timesheet
    const processedBuffer = await processTimesheet(buffer);

    // Return the processed file
    return new NextResponse(processedBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="processed_${file.name}"`,
      },
    });
  } catch (error) {
    console.error('Error processing timesheet:', error);
    return NextResponse.json(
      { error: 'Error processing timesheet' },
      { status: 500 }
    );
  }
}
