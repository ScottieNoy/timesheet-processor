import * as XLSX from 'xlsx';

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

    // Convert File to ArrayBuffer and read the Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const timesheet = XLSX.utils.sheet_to_json(worksheet);

    // Process the data
    const processedData = processTimesheet(timesheet);

    // Create and configure the new workbook
    const wb = XLSX.utils.book_new();
    const headers = ['Fornavn', 'Efternavn', 'Arbejds Timer', 'Sygdom Timer', 'Ferie Timer', 'Feriefridage Timer', 'Tilføjede timer (Pause)', 'Total Justerede Timer'];
    const greenStyle = { fill: { patternType: 'solid', fgColor: { rgb: '92D050' } } };

    // Convert data to array format with styled cells
    const data = processedData.map(row => headers.map(header => ({ v: row[header], s: header === 'Total Justerede Timer' ? greenStyle : undefined })));

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws['!cols'] = Array(headers.length).fill({ wch: 15 });
    XLSX.utils.book_append_sheet(wb, ws, 'Processed Timesheet');

    // Write to buffer and return response
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
    return new Response(wbout, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=processed_timesheet.xlsx'
      }
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return new Response(JSON.stringify({ error: 'Error processing file' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

function processTimesheet(timesheet: any[]) {
  const employeeData: { [key: string]: any } = {};

  timesheet.forEach(row => {
    const key = `${row['First Name'] || ''}-${row['Last Name'] || ''}`;
    if (!employeeData[key]) {
      employeeData[key] = {
        'Fornavn': row['First Name'] || '',
        'Efternavn': row['Last Name'] || '',
        'Arbejds Timer': 0,
        'Sygdom Timer': 0,
        'Ferie Timer': 0,
        'Feriefridage Timer': 0,
        'Tilføjede timer (Pause)': 0,
        'Total Justerede Timer': 0
      };
    }
    employeeData[key]['Arbejds Timer'] += parseFloat(row['Total Hours']) || 0;
    employeeData[key]['Sygdom Timer'] += parseFloat(row['SygdomTime']) || 0;
    employeeData[key]['Ferie Timer'] += parseFloat(row['FerieTime']) || 0;
    employeeData[key]['Feriefridage Timer'] += parseFloat(row['FeriefridageTime']) || 0;
    if (parseFloat(row['Base Hours']) > 1) {
      employeeData[key]['Tilføjede timer (Pause)'] += 0.25;
    }
    employeeData[key]['Total Justerede Timer'] = employeeData[key]['Arbejds Timer'] + employeeData[key]['Tilføjede timer (Pause)'];
  });

  return Object.values(employeeData);
}
