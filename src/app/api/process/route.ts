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
      { header: 'Fornavn', key: 'firstName', width: 15 },
      { header: 'Efternavn', key: 'lastName', width: 15 },
      { header: 'Arbejds Timer', key: 'totalHours', width: 15 },
      { header: 'Sygdom Timer', key: 'sickHours', width: 15 },
      { header: 'Ferie Timer', key: 'vacationHours', width: 15 },
      { header: 'Feriefridage Timer', key: 'vacationDaysHours', width: 15 },
      { header: 'Tilføjede timer (Pause)', key: 'adjustedAdditionalHours', width: 15 },
      { header: 'Total Justerede Timer', key: 'finalAdjustedTotalHours', width: 15 }
    ];

    // Add data
    processedData.forEach(row => {
      const newRow = newWorksheet.addRow({
        firstName: row['Fornavn'],
        lastName: row['Efternavn'],
        totalHours: row['Arbejds Timer'],
        sickHours: row['Sygdom Timer'],
        vacationHours: row['Ferie Timer'],
        vacationDaysHours: row['Feriefridage Timer'],
        adjustedAdditionalHours: row['Tilføjede timer (Pause)'],
        finalAdjustedTotalHours: row['Total Justerede Timer']
      });

      // Apply green fill to Final Adjusted Total Hours column
      const finalAdjustedTotalHoursCell = newRow.getCell(8); // Column index (1-based)
      finalAdjustedTotalHoursCell.fill = {
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
    'FerieTime': typeof row['FerieTime'] === 'string' ? parseFloat(row['FerieTime']) : row['FerieTime'],
    'FeriefridageTime': typeof row['FeriefridageTime'] === 'string' ? parseFloat(row['FeriefridageTime']) : row['FeriefridageTime'],
    'SygdomTime': typeof row['SygdomTime'] === 'string' ? parseFloat(row['SygdomTime']) : row['SygdomTime']
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

  // sum worker sick hours
  const employeeSickHours: { [key: string]: number } = {};
  data.forEach(row => {
    const key = `${row['First Name']}-${row['Last Name']}`;
    if (row['SygdomTime'] && row['SygdomTime'] > 1) {
      employeeSickHours[key] = (employeeSickHours[key] || 0) + row['SygdomTime'];
    }
  });

  // sum worker vacation hours
  const employeeVacationHours: { [key: string]: number } = {};
  data.forEach(row => {
    const key = `${row['First Name']}-${row['Last Name']}`;
    if (row['FerieTime'] && row['FerieTime'] > 1) {
      employeeVacationHours[key] = (employeeVacationHours[key] || 0) + row['FerieTime'];
    }
  });

  // sum worker vacation days hours
  const employeeVacationDaysHours: { [key: string]: number } = {};
  data.forEach(row => {
    const key = `${row['First Name']}-${row['Last Name']}`;
    if (row['FeriefridageTime'] && row['FeriefridageTime'] > 1) {
      employeeVacationDaysHours[key] = (employeeVacationDaysHours[key] || 0) + row['FeriefridageTime'];
    }
  });

  // Create final summary
  const processedData = data
    .filter(row => (row['Total Hours'] !== undefined && !isNaN(row['Total Hours'])) || row['SygdomTime'] > 0 || row['FerieTime'] > 0 || row['FeriefridageTime'] > 0)
    .map(row => {
      const key = `${row['First Name']}-${row['Last Name']}`;
      const additionalHours = employeeAdditionalHours[key] || 0;
      const sickHours = employeeSickHours[key] || 0;
      const vacationHours = employeeVacationHours[key] || 0;
      const vacationDaysHours = employeeVacationDaysHours[key] || 0;
      const totalHours = parseFloat(row['Total Hours'].toString());
      return {
        // 'First Name': row['First Name'],
        // 'Last Name': row['Last Name'],
        // 'Total Hours': totalHours,
        // 'Adjusted Additional Hours': additionalHours,
        // 'Final Adjusted Total Hours': totalHours + additionalHours
        'Fornavn': row['First Name'],
        'Efternavn': row['Last Name'],
        'Arbejds Timer': totalHours,
        'Sygdom Timer': sickHours,
        'Ferie Timer': vacationHours,
        'Feriefridage Timer': vacationDaysHours,
        'Tilføjede timer (Pause)': additionalHours,
        'Total Justerede Timer': totalHours + additionalHours
      };
    });

  return processedData;
}
