'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [router]);

  return <>{children}</>;
}
