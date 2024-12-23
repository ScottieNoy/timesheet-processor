'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export function Navigation() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <Link href="/" className="hover:text-gray-300">
            Home
          </Link>
          <Link href="/timesheet" className="hover:text-gray-300">
            Timesheet
          </Link>
          {session.user.isAdmin && (
            <Link href="/admin" className="hover:text-gray-300">
              Admin
            </Link>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span>{session.user.username}</span>
          <Link href="/api/auth/signout" className="hover:text-gray-300">
            Sign Out
          </Link>
        </div>
      </div>
    </nav>
  );
}
