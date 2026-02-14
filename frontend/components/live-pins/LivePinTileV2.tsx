"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Pin,
  RefreshCw,
  MoreVertical,
  Info,
  Maximize2,
  Calendar as CalendarIcon,
  Building2,
  Filter,
  Tag,
  TrendingUp,
  TrendingDown,
  Copy,
  Edit,
  Trash2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

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

interface LivePinTileV2Props {
  pin: LivePinData;
  onRefresh: (pinId: string) => Promise<void>;
  onExpand: (pin: LivePinData) => void;
  onDuplicate: (pin: LivePinData) => void;
  onUnpin: (pinId: string) => void;
  onUpdatePinnedDate: (pinId: string, date: Date) => Promise<void>;
  onUpdateBaselineDate: (pinId: string, date: Date) => Promise<void>;
}

export function LivePinTileV2({
  pin,
  onRefresh,
  onExpand,
  onDuplicate,
  onUnpin,
  onUpdatePinnedDate,
  onUpdateBaselineDate
}: LivePinTileV2Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [pinnedDateOpen, setPinnedDateOpen] = useState(false);
  const [baselineDateOpen, setBaselineDateOpen] = useState(false);

  // Helper function to parse date string (YYYY-MM-DD) as local date
  const parseLocalDate = (dateString: string): Date => {
    // If dateString is already a full ISO string, use it directly
    if (dateString.includes('T')) {
      return new Date(dateString);
    }
    // Parse YYYY-MM-DD as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh(pin.id);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const renderDeltaBadge = (bucket: BucketSummary, isTotal: boolean = false) => {
    if (bucket.deltaPct === null || bucket.deltaAbs === null) {
      return <span className="text-xs text-muted-foreground">vs baseline</span>;
    }

    const isImprovement = bucket.deltaPct < 0;
    const Icon = bucket.deltaPct < 0 ? TrendingDown : TrendingUp;
    const colorClass = isImprovement ? 'text-green-600' : 'text-red-600';

    return (
      <div className={cn("flex items-center gap-1 text-xs", colorClass)}>
        <Icon className="h-3 w-3" />
        <span>{Math.abs(bucket.deltaPct).toFixed(1)}%</span>
        {isImprovement && <span className="ml-1 text-muted-foreground">Improvement</span>}
        {!isImprovement && <span className="ml-1 text-muted-foreground">vs baseline</span>}
      </div>
    );
  };

  // Red or green color based on pin ID
  const getCardColor = (pinId: string) => {
    const hash = pinId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash) % 2 === 0 ? '#ff0000' : '#006400'; // Red or Dark Green
  };

  return (
    <div 
      className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
      style={{
        borderColor: getCardColor(pin.id),
        borderStyle: 'solid',
        borderWidth: '1px'
      }}
    >
      <Card className="border-0">
      {/* Title Row */}
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">
            Aging — {pin.entity.name}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExpand(pin)}>
                <Maximize2 className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(pin)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate pin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUnpin(pin.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Unpin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => onExpand(pin)}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Expand</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Date Row - Matching Image Design */}
      <div className="px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-3">
          {/* Pinned Date - Light Blue Tag Style */}
          <Popover open={pinnedDateOpen} onOpenChange={setPinnedDateOpen}>
            <PopoverTrigger asChild>
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{
                  backgroundColor: '#E0F0FF',
                  borderColor: '#B3D9FF',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: '#3366CC'
                }}
              >
                <Pin className="h-3 w-3" />
                <span>Pinned : {format(new Date(pin.pinnedOn), 'MMM dd, yyyy')}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={new Date(pin.pinnedOn)}
                onSelect={async (date) => {
                  if (date) {
                    await onUpdatePinnedDate(pin.id, date);
                    setPinnedDateOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Baseline Date - Text with Edit Icon */}
          <Popover open={baselineDateOpen} onOpenChange={setBaselineDateOpen}>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center gap-1.5 text-sm text-gray-900 hover:text-gray-700 transition-colors">
                <span>Baseline: {format(parseLocalDate(pin.baselineDate), 'MMM d, yyyy')}</span>
                <Edit className="h-3 w-3 text-gray-600" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseLocalDate(pin.baselineDate)}
                onSelect={async (date) => {
                  if (date) {
                    await onUpdateBaselineDate(pin.id, date);
                    setBaselineDateOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Filter/Status Bar - Matching Image Design */}
      <div className="px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg border border-gray-200 px-3 py-2">
          {/* Filter Icon */}
          <Filter className="h-4 w-4 text-gray-600 flex-shrink-0" />
          
          {/* Vertical Separator */}
          <div className="h-4 w-px bg-gray-300"></div>
          
          {/* Filter Information */}
          <div className="flex items-center gap-4 text-sm flex-1">
            <span className="text-gray-600">Company: <span className="text-[#3366CC] font-medium">{pin.params.company}</span></span>
            <span className="text-gray-600">Status: <span className="text-[#3366CC] font-medium">{pin.params.status}</span></span>
            <span className="text-gray-600">Aging Bucket: <span className="text-[#3366CC] font-medium">{pin.params.agingBucket}</span></span>
          </div>
          
          {/* Info Icon */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex-shrink-0">
                  <Info className="h-4 w-4 text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <p><strong>Pinned:</strong> When you saved this snapshot</p>
                  <p><strong>Baseline:</strong> Reference date for delta comparisons</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="p-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Total Amount Due */}
          <div
            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onExpand(pin)}
          >
            <div className="text-xs text-muted-foreground mb-1">Total Amount Due</div>
            <div className="text-xl font-bold mb-1">{formatCurrency(pin.summary.totalDue.value)}</div>
            {renderDeltaBadge(pin.summary.totalDue, true)}
          </div>

          {/* 1-30 days */}
          <div
            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onExpand(pin)}
          >
            <div className="text-xs text-muted-foreground mb-1">1–30 days</div>
            <div className="text-xl font-bold mb-1">{formatCurrency(pin.summary.buckets['1_30'].value)}</div>
            {renderDeltaBadge(pin.summary.buckets['1_30'])}
          </div>

          {/* 31-60 days */}
          <div
            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onExpand(pin)}
          >
            <div className="text-xs text-muted-foreground mb-1">31–60 days</div>
            <div className="text-xl font-bold mb-1">{formatCurrency(pin.summary.buckets['31_60'].value)}</div>
            {renderDeltaBadge(pin.summary.buckets['31_60'])}
          </div>

          {/* 61-90 days */}
          <div
            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onExpand(pin)}
          >
            <div className="text-xs text-muted-foreground mb-1">61–90 days</div>
            <div className="text-xl font-bold mb-1">{formatCurrency(pin.summary.buckets['61_90'].value)}</div>
            {renderDeltaBadge(pin.summary.buckets['61_90'])}
          </div>

          {/* 90+ days */}
          <div
            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onExpand(pin)}
          >
            <div className="text-xs text-muted-foreground mb-1">90+ days</div>
            <div className="text-xl font-bold mb-1">{formatCurrency(pin.summary.buckets['90_plus'].value)}</div>
            {renderDeltaBadge(pin.summary.buckets['90_plus'])}
          </div>
        </div>
      </div>
      </Card>
    </div>
  );
}
