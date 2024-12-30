 ⚠ Port 3000 is in use, trying 3001 instead.
 ⚠ Invalid next.config.js options detected: 
 ⚠     Unrecognized key(s) in object: 'api'
 ⚠ See more info here: https://nextjs.org/docs/messages/invalid-next-config
npm notice
npm notice New major version of npm available! 10.9.0 -> 11.0.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.0.0
npm notice To update run: npm install -g npm@11.0.0
npm notice
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
