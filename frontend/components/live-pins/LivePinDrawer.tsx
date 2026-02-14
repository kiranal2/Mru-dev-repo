"use client";

import { useState } from 'react';
import { LivePin } from '@/lib/live-pins-types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Pin, RefreshCw, Download, ExternalLink, RotateCcw, TrendingUp, TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';

interface LivePinDrawerProps {
  pin: LivePin | null;
  open: boolean;
  onClose: () => void;
  onRefresh: (pinId: string) => void;
  onResetBaseline: (pinId: string) => void;
  onUnpin: (pinId: string) => void;
}

function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function LivePinDrawer({
  pin,
  open,
  onClose,
  onRefresh,
  onResetBaseline,
  onUnpin
}: LivePinDrawerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResettingBaseline, setIsResettingBaseline] = useState(false);

  if (!pin) return null;

  const buckets = pin.summary?.buckets || {};
  const total = pin.summary?.total || { amount: 0, delta: 0, deltaPct: 0 };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh(pin.id);
      toast.success('Live Pin refreshed.');
    } catch (error) {
      toast.error('Failed to refresh Live Pin.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResetBaseline = async () => {
    setIsResettingBaseline(true);
    try {
      await onResetBaseline(pin.id);
      toast.success('Baseline reset to today.');
    } catch (error) {
      toast.error('Failed to reset baseline.');
    } finally {
      setIsResettingBaseline(false);
    }
  };

  const handleUnpin = async () => {
    try {
      await onUnpin(pin.id);
      toast.success('Removed from Live Pins.');
      onClose();
    } catch (error) {
      toast.error('Failed to unpin.');
    }
  };

  const handleDownload = () => {
    toast.info('Download feature coming soon');
  };

  const handleOpenSource = () => {
    toast.info('Open source result feature coming soon');
  };

  const renderDelta = (delta: number, deltaPct: number) => {
    if (delta === 0) return null;

    const isPositive = delta > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-red-600' : 'text-green-600';

    return (
      <span className={`text-sm ${colorClass} flex items-center gap-1`}>
        <Icon className="h-4 w-4" />
        {isPositive ? '+' : ''}{formatCurrency(delta)} ({isPositive ? '+' : ''}{deltaPct.toFixed(1)}%)
      </span>
    );
  };

  const bucketLabels = {
    '0_30': '0–30 days',
    '31_60': '31–60 days',
    '61_90': '61–90 days',
    'gt_90': '>90 days'
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl mb-2">{pin.title}</SheetTitle>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Badge variant="outline" className="gap-1">
                  <Pin className="h-3 w-3" />
                  Pinned
                </Badge>
                <span>•</span>
                <span>Baseline: {formatDate(pin.baseline_date)}</span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <Button
              variant="link"
              className="text-blue-600 p-0 h-auto"
              onClick={handleResetBaseline}
              disabled={isResettingBaseline}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset baseline
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenSource}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open source
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <span className="font-semibold">Total Due</span>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">{formatCurrency(total.amount)}</span>
                  {renderDelta(total.delta, total.deltaPct)}
                </div>
              </div>

              {Object.entries(bucketLabels).map(([key, label]) => {
                const bucket = buckets[key as keyof typeof buckets] || { amount: 0, delta: 0, deltaPct: 0 };
                return (
                  <div key={key} className="flex items-center justify-between p-3 border rounded">
                    <span className="text-slate-700">{label}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatCurrency(bucket.amount)}</span>
                      {renderDelta(bucket.delta, bucket.deltaPct)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {pin.insights && pin.insights.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Insights</h3>
              <ul className="space-y-2">
                {pin.insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t flex gap-2">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleUnpin}
            >
              <Pin className="h-4 w-4 mr-2" />
              Unpin
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
