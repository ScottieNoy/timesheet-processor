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

    // Create a new workbook with styling
    const wb = XLSX.utils.book_new();
    
    // Convert data to array format
    const headers = ['First Name', 'Last Name', 'Total Hours', 'Adjusted Additional Hours', 'Final Adjusted Total Hours'];
    const data = processedData.map(row => [
      row['First Name'],
      row['Last Name'],
      row['Total Hours'],
      row['Adjusted Additional Hours'],
      { v: row['Final Adjusted Total Hours'], s: { fill: { fgColor: { rgb: "90EE90" }, patternType: "solid" } } }
    ]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Set column widths
    const colWidths = [15, 15, 12, 20, 22];
    ws['!cols'] = colWidths.map(width => ({ width }));

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
