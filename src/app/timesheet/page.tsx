import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import TimesheetUpload from '@/components/TimesheetUpload';

export default async function TimesheetPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Timesheet Processor</h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload your timesheet Excel file to process worked hours
          </p>
        </div>
        <TimesheetUpload />
      </div>
    </div>
  );
}
