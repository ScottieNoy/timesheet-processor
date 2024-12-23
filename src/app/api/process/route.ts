import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new NextResponse('No file uploaded', { status: 400 });
    }

    // Read the file
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer);

    // Process the workbook
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Process the data (implement your specific logic here)
    const processedData = jsonData.map((row: any) => {
      // Add your processing logic here
      return row;
    });

    // Create a new workbook with processed data
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.json_to_sheet(processedData);
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Processed Data');

    // Write to buffer
    const processedBuffer = XLSX.write(newWorkbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    // Save the processed file information
    await prisma.processedFile.create({
      data: {
        originalName: file.name,
        processedName: `processed_${file.name}`,
        userId: session.user.id,
      },
    });

    // Return the processed file
    return new NextResponse(processedBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="processed_${file.name}"`,
      },
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return new NextResponse('Error processing file', { status: 500 });
  }
}
