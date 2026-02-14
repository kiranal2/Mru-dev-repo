"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Pin, RefreshCw, Maximize2, Share2, MoreVertical,
  Calendar
} from 'lucide-react';
import { LivePin } from '@/lib/live-pins-types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface LivePinTileProps {
  pin: LivePin;
  onExpand: (pin: LivePin) => void;
  onRefresh: (pinId: string) => void;
  onUnpin: (pinId: string) => void;
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

export function LivePinTile({ pin, onExpand, onRefresh, onUnpin }: LivePinTileProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalAmount = pin.summary?.total?.amount || 0;
  const buckets = pin.summary?.buckets || {};

  const totalBucketAmount =
    (buckets['0_30']?.amount || 0) +
    (buckets['31_60']?.amount || 0) +
    (buckets['61_90']?.amount || 0) +
    (buckets['gt_90']?.amount || 0);

  const bucketPercentages = totalBucketAmount > 0 ? {
    '0_30': ((buckets['0_30']?.amount || 0) / totalBucketAmount) * 100,
    '31_60': ((buckets['31_60']?.amount || 0) / totalBucketAmount) * 100,
    '61_90': ((buckets['61_90']?.amount || 0) / totalBucketAmount) * 100,
    'gt_90': ((buckets['gt_90']?.amount || 0) / totalBucketAmount) * 100
  } : { '0_30': 25, '31_60': 25, '61_90': 25, 'gt_90': 25 };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleUnpin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onUnpin(pin.id);
      toast.success('Removed from Live Pins.');
    } catch (error) {
      toast.error('Failed to unpin.');
    }
  };

  return (
    <Card
      className="p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onExpand(pin)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4 text-slate-600" />
          <h3 className="font-semibold text-slate-900">{pin.title}</h3>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExpand(pin)}>
                <Maximize2 className="h-4 w-4 mr-2" />
                Expand
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.info('Schedule feature coming soon'); }}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.info('Share feature coming soon'); }}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleUnpin} className="text-red-600">
                <Pin className="h-4 w-4 mr-2" />
                Unpin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="text-xs text-slate-500 mb-4">
        As of {pin.summary?.as_of || pin.baseline_date} • Refreshed {formatTimeAgo(pin.last_refreshed_at)}
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold text-slate-900 mb-1">
          {formatCurrency(totalAmount)}
        </div>
        <div className="text-xs text-slate-600">Total Due</div>
      </div>

      <div className="space-y-2">
        <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
          <div
            className="bg-green-500"
            style={{ width: `${bucketPercentages['0_30']}%` }}
          />
          <div
            className="bg-yellow-500"
            style={{ width: `${bucketPercentages['31_60']}%` }}
          />
          <div
            className="bg-orange-500"
            style={{ width: `${bucketPercentages['61_90']}%` }}
          />
          <div
            className="bg-red-500"
            style={{ width: `${bucketPercentages['gt_90']}%` }}
          />
        </div>

        <div className="grid grid-cols-4 gap-1 text-xs text-slate-600">
          <div>0–30</div>
          <div>31–60</div>
          <div>61–90</div>
          <div>&gt;90</div>
        </div>
      </div>
    </Card>
  );
}
