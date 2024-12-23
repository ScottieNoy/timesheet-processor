import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import TimesheetUpload from '@/components/TimesheetUpload';

export default async function TimesheetPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upload Timesheet
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Upload your Excel timesheet file for processing
          </p>
          <TimesheetUpload />
        </div>
      </div>
    </div>
  );
}
