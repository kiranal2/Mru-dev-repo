import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pin, Filter, Info, Lightbulb, X, CalendarIcon, Clock } from 'lucide-react';
import AgingSummaryCards from './aging-summary-cards';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface LivePinModalProps {
  open: boolean;
  onClose: () => void;
  onAddToLivePins: () => void;
}

const LivePinModal: React.FC<LivePinModalProps> = ({ open, onClose, onAddToLivePins }) => {
  // State for date management
  const [pinnedOnDate, setPinnedOnDate] = useState<Date>(new Date());
  const [baselineDate, setBaselineDate] = useState<Date>(new Date());
  const [lastUpdated] = useState<string>('Today 2:45pm');

  const updatePinnedDate = (date: Date | undefined) => {
    if (date) {
      setPinnedOnDate(date);
    }
  };

  const updateBaselineDate = (date: Date | undefined) => {
    if (date) {
      setBaselineDate(date);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 [&>button]:hidden -mt-16">
        {/* Header */}
        <DialogHeader className="bg-[#0A3B77] text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Live Pins</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Top Information Section */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                60 days and above aging details for Amazon
              </h2>
              <div className="text-blue-600 text-xs">
                Last updated: Today 2:45pm
              </div>
            </div>

           {/* Meta row with date pickers */}
           <div className="flex flex-wrap items-center gap-3 text-sm">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  Pinned: {format(pinnedOnDate, 'MMM dd, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={pinnedOnDate}
                  onSelect={updatePinnedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  Baseline: {format(baselineDate, 'MMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={baselineDate}
                  onSelect={updateBaselineDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="ml-auto flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Last updated: {lastUpdated}</span>
            </div>
          </div>
          </div>

          {/* Filter/Tag Section */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3 w-3 text-gray-500" />
            <Badge variant="outline" className="text-xs">
              Company: <span className="text-blue-600 ml-1">Amazon</span>
            </Badge>
            <Badge variant="outline" className="text-xs">
              Status: <span className="text-blue-600 ml-1">Open</span>
            </Badge>
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              Aging Bucket: <span className="text-blue-600 ml-1">60+ days</span>
              <Info className="h-3 w-3 text-gray-400" />
            </Badge>
            <div className="h-3 w-3 text-gray-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <Badge variant="outline" className="text-xs">
              Tags: <span className="text-blue-600 ml-1">AR aging</span>
            </Badge>
          </div>

          {/* Aging Summary Cards */}
          <div>
            <AgingSummaryCards 
              onOpenLivePinModal={undefined}
              onOpenCreateWatchModal={undefined}
            />
          </div>

          {/* AI Insights Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <h3 className="font-semibold text-gray-900 text-sm">
                AI Insights (Jun-23-2025 vs Pinned Jun-20-2025)
              </h3>
            </div>
            <div className="space-y-2 text-xs text-gray-700">
              <p>Overall risk down: total due decreased by $135 (-2.5%)</p>
              <p>
                90+ bucket improved most ($300, -13%): large payment cleared invoice{' '}
                <a href="#" className="text-blue-600 hover:underline">INV-0950</a>
              </p>
              <p>
                31-60 bucket up $87 (+7%) - invoice{' '}
                <a href="#" className="text-blue-600 hover:underline">INV-1034</a>{' '}
                aged into this bucket
              </p>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 pt-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-gray-700 text-xs px-3 py-1 h-8"
            >
              Cancel
            </Button>
            <Button
              onClick={onAddToLivePins}
              className="bg-[#0A3B77] hover:bg-[#0A3B77]/90 text-white text-xs px-3 py-1 h-8"
            >
              Add to live pins
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { LivePinModal };
export default LivePinModal;
