'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/home/command-center');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-600">Redirecting...</div>
    </div>
  );
}