'use client';

import { BarChart3 } from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';

export default function VarianceDriversWorkbenchPage() {
  return (
    <div className="flex flex-col bg-white" style={{ height: '100%', minHeight: 0 }}>
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="workbench/fpa/variance-drivers" className="mb-1.5" />
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="h-6 w-6 text-slate-700" />
          <h1 className="text-2xl font-bold text-[#000000] mt-2">Variance Drivers</h1>
        </div>
        <p className="text-sm text-[#606060]">Analyze variances and key drivers</p>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>
      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-[1363px] mx-auto px-6 py-6">

          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-slate-500">Variance & Drivers Workbench page coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
