'use client';

import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import AuthCheck from '@/components/AuthCheck';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AuthCheck>
      <main className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-center mb-2">
              Timesheet Processor
            </h1>
            <p className="text-gray-600 text-center">
              Upload your timesheet Excel file to process
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <FileUploader
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            setError={setError}
          />

          {isProcessing && (
            <div className="text-center text-gray-600">
              Processing your file...
            </div>
          )}
        </div>
      </main>
    </AuthCheck>
  );
}
