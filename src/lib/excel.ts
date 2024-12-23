import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

interface EmployeeRow {
  'First Name': string;
  'Last Name': string;
  'Total Hours'?: string | number;
  'Base Hours'?: string | number;
  'Date'?: string;
}

interface ProcessedEmployee {
  'First Name': string;
  'Last Name': string;
  'Total Hours': number;
  'Adjusted Additional Hours': number;
  'Final Adjusted Total Hours': number;
}

// Helper function to convert string or number to number
function toNumber(value: string | number | undefined): number {
  if (typeof value === 'undefined') return 0;
  if (typeof value === 'number') return value;
  // Remove any non-numeric characters except decimal point
  const cleanValue = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
}

export async function processTimesheet(fileBuffer: Buffer): Promise<Buffer> {
  // Read the Excel file
  const workbook = XLSX.read(fileBuffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<EmployeeRow>(worksheet);

  // Debug log
  console.log('Raw data:', jsonData);

  // Propagate employee names downwards
  let currentFirstName = '';
  let currentLastName = '';
  const processedData = jsonData.map(row => {
    if (row['First Name']) currentFirstName = row['First Name'];
    if (row['Last Name']) currentLastName = row['Last Name'];
    return {
      ...row,
      'First Name': currentFirstName,
      'Last Name': currentLastName
    };
  });

  // Group data by employee
  const employeeGroups = new Map<string, EmployeeRow[]>();
  processedData.forEach(row => {
    const key = `${row['First Name']}_${row['Last Name']}`;
    if (!employeeGroups.has(key)) {
      employeeGroups.set(key, []);
    }
    employeeGroups.get(key)?.push(row);
  });

  // Process each employee's data
  const finalEmployeeTotals: ProcessedEmployee[] = [];
  employeeGroups.forEach((rows, key) => {
    // Find the employee's total hours row
    const totalHoursRow = rows.find(row => row['Total Hours'] !== undefined);
    if (!totalHoursRow) return;

    const totalHours = toNumber(totalHoursRow['Total Hours']);

    // Count days with Base Hours > 1
    const daysWithExtraHours = rows.filter(row => {
      const baseHours = toNumber(row['Base Hours']);
      return baseHours > 1;
    }).length;

    // Calculate additional hours (0.25 per qualifying day)
    const additionalHours = daysWithExtraHours * 0.25;

    // Debug log
    console.log('Processing employee:', {
      name: `${totalHoursRow['First Name']} ${totalHoursRow['Last Name']}`,
      totalHours,
      daysWithExtraHours,
      additionalHours,
      finalTotal: totalHours + additionalHours
    });

    finalEmployeeTotals.push({
      'First Name': totalHoursRow['First Name'],
      'Last Name': totalHoursRow['Last Name'],
      'Total Hours': totalHours,
      'Adjusted Additional Hours': additionalHours,
      'Final Adjusted Total Hours': totalHours + additionalHours
    });
  });

  // Sort by name
  finalEmployeeTotals.sort((a, b) => {
    const nameA = `${a['Last Name']}, ${a['First Name']}`;
    const nameB = `${b['Last Name']}, ${b['First Name']}`;
    return nameA.localeCompare(nameB);
  });

  // Create a new workbook with formatting
  const newWorkbook = new ExcelJS.Workbook();
  const newWorksheet = newWorkbook.addWorksheet('Adjusted Hours Summary');

  // Add headers with formatting
  newWorksheet.columns = [
    { header: 'First Name', key: 'firstName', width: 15 },
    { header: 'Last Name', key: 'lastName', width: 15 },
    { header: 'Total Hours', key: 'totalHours', width: 12, numFmt: '0.00' },
    { header: 'Adjusted Additional Hours', key: 'additionalHours', width: 20, numFmt: '0.00' },
    { header: 'Final Adjusted Total Hours', key: 'finalHours', width: 20, numFmt: '0.00' }
  ];

  // Style the header row
  const headerRow = newWorksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data and apply formatting
  finalEmployeeTotals.forEach((row, index) => {
    const excelRow = newWorksheet.addRow([
      row['First Name'],
      row['Last Name'],
      row['Total Hours'],
      row['Adjusted Additional Hours'],
      row['Final Adjusted Total Hours']
    ]);

    // Apply green fill to Final Adjusted Total Hours column
    const finalHoursCell = excelRow.getCell(5);
    finalHoursCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF90EE90' }
    };

    // Add borders
    excelRow.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Write to buffer
  const buffer = await newWorkbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
