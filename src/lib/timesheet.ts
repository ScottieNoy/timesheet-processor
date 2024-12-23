import * as XLSX from 'xlsx';

interface TimesheetData {
  date: string;
  hours: number;
  project: string;
  description: string;
}

export async function processTimesheet(buffer: Buffer): Promise<TimesheetData[]> {
  try {
    // Read the workbook
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Convert worksheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Process and validate the data
    const processedData: TimesheetData[] = jsonData.map((row: any) => {
      // You can add more validation and data transformation here
      return {
        date: row.Date || '',
        hours: parseFloat(row.Hours) || 0,
        project: row.Project || '',
        description: row.Description || '',
      };
    });

    return processedData;
  } catch (error) {
    console.error('Error processing timesheet:', error);
    throw new Error('Failed to process timesheet');
  }
}
