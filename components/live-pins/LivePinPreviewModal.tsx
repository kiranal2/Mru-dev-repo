"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Filter, Clock, X, Info, Lightbulb } from 'lucide-react';
import AgingSummaryCards from '../ui/aging-summary-cards';

interface AgingBucket {
  amount: number;
  delta: number | null;
  deltaPercent: number | null;
}

interface LivePinPreviewState {
  title: string;
  entity_name: string;
  as_of_date: string;
  status_filter: string;
  aging_filter_label: string;
  currency_code: string;
  pinned_on_date: Date;
  baseline_date: Date;
  last_updated: string;
  buckets: {
    '0_30': AgingBucket;
    '31_60': AgingBucket;
    '61_90': AgingBucket;
    '90_plus': AgingBucket;
  };
  total_due: AgingBucket;
  insights: string[];
  tags: string[];
}

interface LivePinPreviewModalProps {
  open: boolean;
  onClose: () => void;
  previewState: LivePinPreviewState;
  onSave: (state: LivePinPreviewState) => Promise<void>;
}

export function LivePinPreviewModal({
  open,
  onClose,
  previewState: initialState,
  onSave
}: LivePinPreviewModalProps) {
  const [state, setState] = useState<LivePinPreviewState>(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(state);
      onClose();
    } catch (err) {
      setError("Couldn't save pin. Try again.");
      setSaving(false);
    }
  };


  const updatePinnedDate = (date: Date | undefined) => {
    if (date) {
      setState(prev => ({ ...prev, pinned_on_date: date }));
    }
  };

  const updateBaselineDate = (date: Date | undefined) => {
    if (date) {
      setState(prev => ({ ...prev, baseline_date: date }));
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
                {state.aging_filter_label} aging details for {state.entity_name}
              </h2>
              <div className="text-blue-600 text-xs">
                Last updated: {state.last_updated}
              </div>
            </div>

           {/* Meta row with date pickers */}
           <div className="flex flex-wrap items-center gap-3 text-sm">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  Pinned: {format(state.pinned_on_date, 'MMM dd, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={state.pinned_on_date}
                  onSelect={updatePinnedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  Baseline: {format(state.baseline_date, 'MMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={state.baseline_date}
                  onSelect={updateBaselineDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="ml-auto flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Last updated: {state.last_updated}</span>
            </div>
          </div>
          </div>

          {/* Filter/Tag Section */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3 w-3 text-gray-500" />
            <Badge variant="outline" className="text-xs">
              Company: <span className="text-blue-600 ml-1">{state.entity_name}</span>
            </Badge>
            <Badge variant="outline" className="text-xs">
              Status: <span className="text-blue-600 ml-1">{state.status_filter}</span>
            </Badge>
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              Aging Bucket: <span className="text-blue-600 ml-1">{state.aging_filter_label}</span>
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
            {state.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                Tags: <span className="text-blue-600 ml-1">{tag}</span>
              </Badge>
            ))}
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
                AI Insights ({format(new Date(state.as_of_date), 'MMM d, yyyy')} vs Pinned {format(state.pinned_on_date, 'MMM d, yyyy')})
              </h3>
            </div>
            <div className="space-y-2 text-xs text-gray-700">
              {state.insights.map((insight, idx) => (
                <p key={idx} dangerouslySetInnerHTML={{ __html: insight }} />
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 pt-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-gray-700 text-xs px-3 py-1 h-8"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#0A3B77] hover:bg-[#0A3B77]/90 text-white text-xs px-3 py-1 h-8"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                'Done'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
