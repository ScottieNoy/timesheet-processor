import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Read the Excel file
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    let timesheet = XLSX.utils.sheet_to_json(worksheet);

    // Process the data
    const processedData = processTimesheet(timesheet);

    // Create a new workbook with formatting
    const newWorkbook = new ExcelJS.Workbook();
    const newWorksheet = newWorkbook.addWorksheet('Processed Timesheet');

    // Add headers
    newWorksheet.columns = [
      { header: 'First Name', key: 'firstName', width: 15 },
      { header: 'Last Name', key: 'lastName', width: 15 },
      { header: 'Total Hours', key: 'totalHours', width: 15 },
      { header: 'Adjusted Additional Hours', key: 'adjustedAdditionalHours', width: 20 },
      { header: 'Final Adjusted Total Hours', key: 'finalAdjustedTotalHours', width: 20 }
    ];

    // Add data
    processedData.forEach(row => {
      const newRow = newWorksheet.addRow({
        firstName: row['First Name'],
        lastName: row['Last Name'],
        totalHours: row['Total Hours'],
        adjustedAdditionalHours: row['Adjusted Additional Hours'],
        finalAdjustedTotalHours: row['Final Adjusted Total Hours']
      });

      // Apply green fill to Final Adjusted Total Hours column
      const finalCell = newRow.getCell(5);
      finalCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00FF00' }
      };
    });

    // Generate buffer
    const newBuffer = await newWorkbook.xlsx.writeBuffer();

    return new NextResponse(newBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=processed_timesheet.xlsx'
      }
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Error processing file' },
      { status: 500 }
    );
  }
}

function processTimesheet(timesheet: any[]) {
  // Convert array of objects to DataFrame-like structure
  let data = timesheet.map(row => ({
    'First Name': row['First Name'],
    'Last Name': row['Last Name'],
    'Total Hours': typeof row['Total Hours'] === 'string' ? parseFloat(row['Total Hours']) : row['Total Hours'],
    'Base Hours': typeof row['Base Hours'] === 'string' ? parseFloat(row['Base Hours']) : row['Base Hours'],
    'Date': row['Date']
  }));

  // Forward fill employee names
  let currentFirstName = '';
  let currentLastName = '';
  data = data.map(row => {
    if (row['First Name']) currentFirstName = row['First Name'];
    if (row['Last Name']) currentLastName = row['Last Name'];
    return {
      ...row,
      'First Name': currentFirstName,
      'Last Name': currentLastName
    };
  });

  // Calculate additional hours
  const employeeAdditionalHours: { [key: string]: number } = {};
  data.forEach(row => {
    const key = `${row['First Name']}-${row['Last Name']}`;
    if (row['Base Hours'] && row['Base Hours'] > 1) {
      employeeAdditionalHours[key] = (employeeAdditionalHours[key] || 0) + 0.25;
    }
  });

  // Create final summary
  const processedData = data
    .filter(row => row['Total Hours'] !== undefined && !isNaN(row['Total Hours']))
    .map(row => {
      const key = `${row['First Name']}-${row['Last Name']}`;
      const additionalHours = employeeAdditionalHours[key] || 0;
      const totalHours = parseFloat(row['Total Hours'].toString());
      return {
        'First Name': row['First Name'],
        'Last Name': row['Last Name'],
        'Total Hours': totalHours,
        'Adjusted Additional Hours': additionalHours,
        'Final Adjusted Total Hours': totalHours + additionalHours
      };
    });

  return processedData;
}
