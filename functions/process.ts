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
  let data = timesheet.map(row => ({
    'First Name': row['First Name'] || '',
    'Last Name': row['Last Name'] || '',
    'Total Hours': parseFloat(row['Total Hours']) || 0,
    'Base Hours': parseFloat(row['Base Hours']) || 0,
    'FerieTime': parseFloat(row['FerieTime']) || 0,
    'FeriefridageTime': parseFloat(row['FeriefridageTime']) || 0,
    'SygdomTime': parseFloat(row['SygdomTime']) || 0
  }));

  let currentFirstName = '', currentLastName = '';
  data = data.map(row => {
    if (row['First Name']) currentFirstName = row['First Name'];
    if (row['Last Name']) currentLastName = row['Last Name'];
    return { ...row, 'First Name': currentFirstName, 'Last Name': currentLastName };
  });

  const employeeData: { [key: string]: any } = {};
  data.forEach(row => {
    const key = `${row['First Name']}-${row['Last Name']}`;
    if (!employeeData[key]) {
      employeeData[key] = {
        'Tilføjede timer (Pause)': 0,
        'Sygdom Timer': 0,
        'Ferie Timer': 0,
        'Feriefridage Timer': 0
      };
    }
    if (row['Base Hours'] > 1) employeeData[key]['Tilføjede timer (Pause)'] += 0.25;
    employeeData[key]['Sygdom Timer'] += row['SygdomTime'];
    employeeData[key]['Ferie Timer'] += row['FerieTime'];
    employeeData[key]['Feriefridage Timer'] += row['FeriefridageTime'];
  });

  return data.map(row => {
    const key = `${row['First Name']}-${row['Last Name']}`;
    return {
      'Fornavn': row['First Name'],
      'Efternavn': row['Last Name'],
      'Arbejds Timer': row['Total Hours'],
      ...employeeData[key],
      'Total Justerede Timer': row['Total Hours'] + employeeData[key]['Tilføjede timer (Pause)']
    };
  });
}
