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
    // const processedData = processTimesheet(timesheet);

    // Create a new workbook with formatting
    const newWorkbook = new ExcelJS.Workbook();
    const newWorksheet = newWorkbook.addWorksheet('Processed Timesheet');

    // Add headers with Danish column names
    newWorksheet.columns = [
      { header: 'Fornavn', key: 'Fornavn', width: 15 },
      { header: 'Efternavn', key: 'Efternavn', width: 15 },
      { header: 'Arbejds Timer', key: 'Arbejds Timer', width: 15 },
      { header: 'Sygdom Timer', key: 'Sygdom Timer', width: 15 },
      { header: 'Ferie Timer', key: 'Ferie Timer', width: 15 },
      { header: 'Feriefridage Timer', key: 'Feriefridage Timer', width: 15 },
      { header: 'Tilføjede timer (Pause)', key: 'Tilføjede timer (Pause)', width: 15 },
      { header: 'Total Justerede Timer', key: 'Total Justerede Timer', width: 15 }
    ];

    // Add data using Danish keys
    // processedData.forEach(row => {
    //   newWorksheet.addRow(row);
    // });

    // Apply green fill to Final Adjusted Total Hours column
    newWorksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.getCell(8).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF00FF00' }
        };
      }
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

// function processTimesheet(timesheet: any[]) {
//   let data = timesheet.map(row => ({
//     'First Name': row['First Name'],
//     'Last Name': row['Last Name'],
//     'Total Hours': parseFloat(row['Total Hours']) || 0,
//     'Base Hours': parseFloat(row['Base Hours']) || 0,
//     'FerieTime': parseFloat(row['FerieTime']) || 0,
//     'FeriefridageTime': parseFloat(row['FeriefridageTime']) || 0,
//     'SygdomTime': parseFloat(row['SygdomTime']) || 0
//   }));

//   let currentFirstName = '';
//   let currentLastName = '';
//   data = data.map(row => {
//     if (row['First Name']) currentFirstName = row['First Name'];
//     if (row['Last Name']) currentLastName = row['Last Name'];
//     return {
//       ...row,
//       'First Name': currentFirstName,
//       'Last Name': currentLastName
//     };
//   });

//   const employeeData: { [key: string]: any } = {};

//   data.forEach(row => {
//     const key = `${row['First Name']}-${row['Last Name']}`;
//     if (!employeeData[key]) {
//       employeeData[key] = {
//         'Tilføjede timer (Pause)': 0,
//         'Sygdom Timer': 0,
//         'Ferie Timer': 0,
//         'Feriefridage Timer': 0,
//       };
//     }
//     if (row['Base Hours'] > 1) {
//       employeeData[key]['Tilføjede timer (Pause)'] += 0.25;
//     }
//     employeeData[key]['Sygdom Timer'] += row['SygdomTime'];
//     employeeData[key]['Ferie Timer'] += row['FerieTime'];
//     employeeData[key]['Feriefridage Timer'] += row['FeriefridageTime'];
//   });

//   return data.map(row => {
//     const key = `${row['First Name']}-${row['Last Name']}`;
//     return {
//       'Fornavn': row['First Name'],
//       'Efternavn': row['Last Name'],
//       'Arbejds Timer': row['Total Hours'],
//       ...employeeData[key],
//       'Total Justerede Timer': row['Total Hours'] + employeeData[key]['Tilføjede timer (Pause)']
//     };
//   });
// }
