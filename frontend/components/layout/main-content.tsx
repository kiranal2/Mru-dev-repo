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
      "flex-1 flex flex-col h-[calc(100vh-65px)] overflow-y-auto",
      loadingState === 'loading'
        ? "transition-all duration-300 ease-out opacity-0 translate-y-8"
        : "transition-none opacity-100 translate-y-0",
      className
    )}
    style={{
      background: '#F8FAFC',
    }}
    >
      {/* Content Area */}
      <div className="flex-1 h-full">
        {children}
      </div>
    </main>
  );
}
