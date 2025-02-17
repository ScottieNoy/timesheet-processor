import * as XLSX from 'xlsx';

export interface Env {
  // Add your environment variables here
}

export const onRequestPost = async (context: { request: Request }) => {
  try {
    const formData = await context.request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert File to ArrayBuffer
    const buffer = await file.arrayBuffer();
    
    // Read the Excel file
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    let timesheet = XLSX.utils.sheet_to_json(worksheet);

    // Process the data
    const processedData = processTimesheet(timesheet);

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Prepare the data with styling
    const greenStyle = {
      fill: {
        patternType: 'solid',
        fgColor: { rgb: '92D050' }
      }
    };

    // Convert data to array format with styled cells
    const headers = ['Fornavn', 'Efternavn', 'Arbejds Timer', 'Sygdom Timer', 'Ferie Timer', 'Feriefridage Timer', 'Tilføjede timer (Pause)', 'Total Justerede Timer'];
    const data = processedData.map(row => [
      { v: row['Fornavn'] },
      { v: row['Efternavn'] },
      { v: row['Arbejds Timer'] },
      { v: row['Sygdom Timer'] },
      { v: row['Ferie Timer'] },
      { v: row['Feriefridage Timer'] },
      { v: row['Tilføjede timer (Pause)'] },
      { v: row['Total Justerede Timer'], s: greenStyle }
    ]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([
      headers.map((header, index) => 
        index === 4 ? { v: header, s: greenStyle } : header
      ),
      ...data
    ]);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Fornavn
      { wch: 15 }, // Efternavn
      { wch: 15 }, // Arbejds Timer
      { wch: 15 }, // Sygdom Timer
      { wch: 15 }, // Ferie Timer
      { wch: 15 }, // Feriefridage Timer
      { wch: 15 }, // Tilføjede timer (Pause)
      { wch: 15 }  // Total Justerede Timer
    ];

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Processed Timesheet');

    // Write to buffer with styles enabled
    const wbout = XLSX.write(wb, {
      bookType: 'xlsx' as const,
      type: 'array' as const,
      cellStyles: true
    });

    return new Response(wbout, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=processed_timesheet.xlsx'
      }
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return new Response(
      JSON.stringify({ error: 'Error processing file' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

function processTimesheet(timesheet: any[]) {
  let currentFirstName = '';
  let currentLastName = '';
  
  let data = timesheet.map(row => {
    if (row['First Name']) currentFirstName = row['First Name'];
    if (row['Last Name']) currentLastName = row['Last Name'];
    
    return {
      'First Name': currentFirstName,
      'Last Name': currentLastName,
      'Total Hours': typeof row['Total Hours'] === 'string' ? parseFloat(row['Total Hours']) : row['Total Hours'],
      'Base Hours': typeof row['Base Hours'] === 'string' ? parseFloat(row['Base Hours']) : row['Base Hours'],
      'FerieTime': typeof row['FerieTime'] === 'string' ? parseFloat(row['FerieTime']) : row['FerieTime'],
      'FeriefridageTime': typeof row['FeriefridageTime'] === 'string' ? parseFloat(row['FeriefridageTime']) : row['FeriefridageTime'],
      'SygdomTime': typeof row['SygdomTime'] === 'string' ? parseFloat(row['SygdomTime']) : row['SygdomTime']
    };
  });

  let employeeData: { [key: string]: any } = {};

  data.forEach(row => {
    const key = `${row['First Name']}-${row['Last Name']}`;
    if (!employeeData[key]) {
      employeeData[key] = {
        'Fornavn': row['First Name'],
        'Efternavn': row['Last Name'],
        'Arbejds Timer': 0,
        'Sygdom Timer': 0,
        'Ferie Timer': 0,
        'Feriefridage Timer': 0,
        'Tilføjede timer (Pause)': 0,
      };
    }
    employeeData[key]['Arbejds Timer'] += row['Total Hours'] || 0;
    employeeData[key]['Sygdom Timer'] += row['SygdomTime'] || 0;
    employeeData[key]['Ferie Timer'] += row['FerieTime'] || 0;
    employeeData[key]['Feriefridage Timer'] += row['FeriefridageTime'] || 0;
    if (row['Base Hours'] && row['Base Hours'] > 1) {
      employeeData[key]['Tilføjede timer (Pause)'] += 0.25;
    }
  });

  return Object.values(employeeData).map(emp => {
    emp['Total Justerede Timer'] = emp['Arbejds Timer'] + emp['Tilføjede timer (Pause)'];
    return emp;
  }).filter(emp => emp['Fornavn'] && emp['Efternavn']);
}

