'use client';

import { useState } from 'react';
import { FileUploader } from '@/components/FileUploader';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Timesheet Processor</h1>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <FileUploader
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            setError={setError}
          />
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
