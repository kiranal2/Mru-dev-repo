'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import ErrorBoundary from '@/components/error-boundary';

// Dynamically import components to avoid SSR issues
const AppShell = dynamic(() => import('@/components/layout/app-shell'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>
});

const PrivateRoute = dynamic(() => import('@/components/private-route'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>
});

// This layout wraps all routes under (main) route group
// All children routes automatically get this layout
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
        <PrivateRoute>
          <AppShell activeRoute={pathname || '/'}>
            {children}
          </AppShell>
        </PrivateRoute>
      </Suspense>
    </ErrorBoundary>
  );
}
