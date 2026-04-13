'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MainContentProps {
  children: React.ReactNode;
  loadingState: 'loading' | 'loaded';
  activeRoute: string;
  className?: string;
}

export default function MainContent({ 
  children, 
  loadingState, 
  activeRoute, 
  className 
}: MainContentProps) {
  return (
    <main className={cn(
      "flex-1 flex flex-col overflow-y-auto overflow-x-hidden w-full min-w-0",
      // Mobile: header 44px + bottom bar 52px = 96px
      // Tablet: header 48px
      // Desktop: header 56px
      "h-[calc(100vh-96px)] md:h-[calc(100vh-48px)] xl:h-[calc(100vh-56px)]",
      loadingState === 'loading'
        ? "transition-all duration-300 ease-out opacity-0 translate-y-8"
        : "transition-none opacity-100 translate-y-0",
      className
    )}
    style={{
      background: 'var(--theme-bg)',
    }}
    >
      {/* Content Area */}
      <div className="flex-1 h-full">
        {children}
      </div>
    </main>
  );
}
