"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LivePinTileV2 } from '@/components/live-pins/live-pin-tile-v2';
import { LivePinPreviewModal } from '@/components/live-pins/live-pin-preview-modal';
import { Pin as PinIcon, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import Breadcrumb from '@/components/layout/breadcrumb';
import { usePins } from '@/hooks/data';
import type { Pin } from '@/lib/data/types';

interface BucketSummary {
  value: number;
  deltaAbs: number | null;
  deltaPct: number | null;
}

interface LivePinData {
  id: string;
  title: string;
  entity: { id: string; name: string };
  pinnedOn: string;
  baselineDate: string;
  asOfDate: string;
  lastRefreshedAt: string;
  params: {
    company: string;
    status: string;
    agingBucket: string;
    tags: string[];
  };
  summary: {
    totalDue: BucketSummary;
    buckets: {
      '1_30': BucketSummary;
      '31_60': BucketSummary;
      '61_90': BucketSummary;
      '90_plus': BucketSummary;
    };
  };
  insights: string[];
}

function LivePinsPageContent() {
  const { data: rawPins, loading, error: hookError, refetch, removePin } = usePins();
  const [selectedPin, setSelectedPin] = useState<LivePinData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [localPinOverrides, setLocalPinOverrides] = useState<Record<string, Partial<LivePinData>>>({});
  const router = useRouter();

  /** Transform a data-layer Pin into the LivePinData shape used by UI components */
  const transformPin = (pin: Pin): LivePinData => {
    const value = typeof pin.value === 'number' ? pin.value : parseFloat(String(pin.value)) || 0;
    return {
      id: pin.id,
      title: pin.label,
      entity: {
        id: pin.source,
        name: pin.module,
      },
      pinnedOn: pin.createdAt,
      baselineDate: pin.createdAt,
      asOfDate: pin.lastRefreshed,
      lastRefreshedAt: pin.lastRefreshed,
      params: {
        company: pin.module,
        status: 'Open',
        agingBucket: 'All',
        tags: [pin.source],
      },
      summary: {
        totalDue: { value, deltaAbs: null, deltaPct: null },
        buckets: {
          '1_30': { value: 0, deltaAbs: null, deltaPct: null },
          '31_60': { value: 0, deltaAbs: null, deltaPct: null },
          '61_90': { value: 0, deltaAbs: null, deltaPct: null },
          '90_plus': { value: 0, deltaAbs: null, deltaPct: null },
        },
      },
      insights: pin.trendValue ? [`Trend: ${pin.trendValue}`] : [],
    };
  };

  const pins = useMemo(() => {
    return rawPins.map(p => {
      const base = transformPin(p);
      const overrides = localPinOverrides[p.id];
      return overrides ? { ...base, ...overrides } : base;
    });
  }, [rawPins, localPinOverrides]);

  const handleExpand = (pin: LivePinData) => {
    setSelectedPin(pin);
    setModalOpen(true);
  };

  const handleRefresh = async (pinId: string) => {
    try {
      const response = await fetch(`/api/live-pins/${pinId}/refresh`, {
        method: 'POST'
      });
      if (response.ok) {
        await refetch();
        toast.success('Pin refreshed successfully');
      }
    } catch (error) {
      toast.error('Failed to refresh pin');
    }
  };

  const handleDuplicate = async (pin: LivePinData) => {
    try {
      const payload = {
        type: 'live_pin',
        title: `${pin.title} (Copy)`,
        entity: pin.entity,
        params: pin.params,
        baseline: pin.baselineDate,
        pinned_on: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        currency: 'USD',
        summary: pin.summary,
        insights: pin.insights,
        source_context: { view: 'aging_detail', query_id: '' }
      };

      const response = await fetch('/api/live-pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await refetch();
        toast.success('Pin duplicated successfully');
      }
    } catch (error) {
      toast.error('Failed to duplicate pin');
    }
  };

  const handleUnpin = async (pinId: string) => {
    try {
      await removePin(pinId);
      toast.success('Pin removed');
    } catch (error) {
      toast.error('Failed to remove pin');
    }
  };

  const handleUpdatePinnedDate = async (pinId: string, date: Date) => {
    try {
      const dateString = date.toISOString();
      setLocalPinOverrides(prev => ({
        ...prev,
        [pinId]: { ...(prev[pinId] || {}), pinnedOn: dateString },
      }));

      if (selectedPin && selectedPin.id === pinId) {
        setSelectedPin(prev =>
          prev ? { ...prev, pinnedOn: dateString } : null
        );
      }

      toast.success('Pinned date updated');
    } catch (error) {
      toast.error('Failed to update pinned date');
    }
  };

  const handleUpdateBaselineDate = async (pinId: string, date: Date) => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      setLocalPinOverrides(prev => ({
        ...prev,
        [pinId]: { ...(prev[pinId] || {}), baselineDate: dateString },
      }));

      if (selectedPin && selectedPin.id === pinId) {
        setSelectedPin(prev =>
          prev ? { ...prev, baselineDate: dateString } : null
        );
      }

      toast.success('Baseline date updated - deltas will be recomputed');
    } catch (error) {
      toast.error('Failed to update baseline date');
    }
  };

  const handleSaveFromModal = async (state: any) => {
    setModalOpen(false);
    toast.success('Changes saved');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (hookError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {hookError}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white" style={{ height: '100%', minHeight: 0 }}>
      {/* Header with Breadcrumb and Title */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="home/workspace/live-pins" className="mb-1.5" />
        <div className="flex items-center gap-3 mb-1">
          <PinIcon className="h-6 w-6 text-slate-700" />
          <h1 className="text-2xl font-bold text-[#000000] mt-2">Live Pins</h1>
        </div>
        <p className="text-sm text-[#606060]">Track your key metrics. Click to expand and view more details</p>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>
      <div className="flex-1 overflow-auto">
        <div className="w-full px-6 py-6">

          {pins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <PinIcon className="h-16 w-16 text-slate-300 mb-4" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                No Live Pins yet
              </h2>
              <p className="text-slate-600 max-w-md">
                Run a query and click "Add to Live Pins" to start tracking your key metrics.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pins.map(pin => (
                <LivePinTileV2
                  key={pin.id}
                  pin={pin}
                  onExpand={handleExpand}
                  onRefresh={handleRefresh}
                  onDuplicate={handleDuplicate}
                  onUnpin={handleUnpin}
                  onUpdatePinnedDate={handleUpdatePinnedDate}
                  onUpdateBaselineDate={handleUpdateBaselineDate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedPin && (
        <LivePinPreviewModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          previewState={{
            title: selectedPin.title,
            entity_name: selectedPin.entity.name,
            as_of_date: selectedPin.asOfDate,
            status_filter: selectedPin.params.status,
            aging_filter_label: selectedPin.params.agingBucket,
            currency_code: 'USD',
            pinned_on_date: new Date(selectedPin.pinnedOn),
            baseline_date: new Date(selectedPin.baselineDate),
            last_updated: new Date(selectedPin.lastRefreshedAt).toLocaleString(),
            buckets: {
              '0_30': {
                amount: selectedPin.summary.buckets['1_30'].value,
                delta: selectedPin.summary.buckets['1_30'].deltaAbs,
                deltaPercent: selectedPin.summary.buckets['1_30'].deltaPct
              },
              '31_60': {
                amount: selectedPin.summary.buckets['31_60'].value,
                delta: selectedPin.summary.buckets['31_60'].deltaAbs,
                deltaPercent: selectedPin.summary.buckets['31_60'].deltaPct
              },
              '61_90': {
                amount: selectedPin.summary.buckets['61_90'].value,
                delta: selectedPin.summary.buckets['61_90'].deltaAbs,
                deltaPercent: selectedPin.summary.buckets['61_90'].deltaPct
              },
              '90_plus': {
                amount: selectedPin.summary.buckets['90_plus'].value,
                delta: selectedPin.summary.buckets['90_plus'].deltaAbs,
                deltaPercent: selectedPin.summary.buckets['90_plus'].deltaPct
              }
            },
            total_due: {
              amount: selectedPin.summary.totalDue.value,
              delta: selectedPin.summary.totalDue.deltaAbs,
              deltaPercent: selectedPin.summary.totalDue.deltaPct
            },
            insights: selectedPin.insights,
            tags: selectedPin.params.tags
          }}
          onSave={handleSaveFromModal}
        />
      )}
    </div>
  );
}

export default function Page() {
  return <LivePinsPageContent />;
}
