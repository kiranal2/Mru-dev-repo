"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, AlertCircle, X } from 'lucide-react';
import { InvoiceRow } from '@/lib/watch-utils';
import { toast } from 'sonner';

interface CreateWatchModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (watchId: string) => void;
  entityId: string;
  entityName: string;
  params: Record<string, any>;
  invoiceData: InvoiceRow[];
}

type WatchTemplate = 'open_ar_total' | 'ar_over_days';
type AlertMode = 'amount_exceeds' | 'days_exceeds';

const OPERATORS = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'crosses_above', label: 'crosses above' },
  { value: 'crosses_below', label: 'crosses below' }
];

export function CreateWatchModal({
  open,
  onClose,
  onSuccess,
  entityId,
  entityName,
  params,
  invoiceData
}: CreateWatchModalProps) {
  const [watchTemplate, setWatchTemplate] = useState<WatchTemplate>('open_ar_total');
  const [daysParam, setDaysParam] = useState<string>('90');
  const [alertMode, setAlertMode] = useState<AlertMode>('amount_exceeds');
  const [operator, setOperator] = useState<string>('crosses_above');
  const [thresholdValue, setThresholdValue] = useState<string>('');
  const [currentValue, setCurrentValue] = useState<number>(2400000);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const status = params.status || 'Open';

  useEffect(() => {
    if (open && invoiceData.length > 0) {
      calculateCurrentValue();
      setLastUpdated(new Date().toISOString());
    }
  }, [open, watchTemplate, daysParam, invoiceData]);

  useEffect(() => {
    if (watchTemplate === 'open_ar_total') {
      setAlertMode('amount_exceeds');
    }
  }, [watchTemplate]);

  const calculateCurrentValue = () => {
    let value = 0;

    if (watchTemplate === 'open_ar_total') {
      value = invoiceData
        .filter(inv => inv.status === 'Open')
        .reduce((sum, inv) => sum + inv.amount, 0);
    } else {
      const daysThreshold = parseInt(daysParam) || 90;
      const today = new Date();

      value = invoiceData
        .filter(inv => {
          if (inv.status !== 'Open') return false;
          const dueDate = new Date(inv.due_date);
          const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff > daysThreshold;
        })
        .reduce((sum, inv) => sum + inv.amount, 0);
    }

    setCurrentValue(value);

    if (!thresholdValue && watchTemplate === 'open_ar_total') {
      const suggested = Math.round(value * 0.9 / 1000) * 1000;
      setThresholdValue(String(suggested));
    } else if (!thresholdValue && watchTemplate === 'ar_over_days' && alertMode === 'amount_exceeds') {
      const suggested = Math.round(value * 0.9 / 1000) * 1000;
      setThresholdValue(String(suggested));
    } else if (!thresholdValue && alertMode === 'days_exceeds') {
      setThresholdValue(String(parseInt(daysParam) + 30));
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const formatNumber = (value: string): string => {
    const num = parseFloat(value.replace(/,/g, ''));
    if (isNaN(num)) return value;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleDaysChange = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '');
    setDaysParam(cleaned);
    setErrors({ ...errors, days: '' });
  };

  const handleThresholdChange = (value: string) => {
    if (alertMode === 'days_exceeds') {
      const cleaned = value.replace(/[^\d]/g, '');
      setThresholdValue(cleaned);
    } else {
      const cleaned = value.replace(/[^\d.]/g, '');
      setThresholdValue(cleaned);
    }
    setErrors({ ...errors, threshold: '' });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (watchTemplate === 'ar_over_days') {
      const days = parseInt(daysParam);
      if (!daysParam || isNaN(days) || days < 1) {
        newErrors.days = 'Days must be at least 1';
      }
    }

    if (!thresholdValue) {
      newErrors.threshold = 'Threshold is required';
    } else if (alertMode === 'days_exceeds') {
      const days = parseInt(thresholdValue);
      if (isNaN(days) || days < 1) {
        newErrors.threshold = 'Days must be at least 1';
      }
    } else {
      const amount = parseFloat(thresholdValue);
      if (isNaN(amount) || amount <= 0) {
        newErrors.threshold = 'Amount must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    toast.success('Watch created successfully');
    onClose();
  };

  const formatTimeAgo = (isoString: string) => {
    const now = new Date();
    const then = new Date(isoString);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return 'recently';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Eye className="h-4 w-4" />
            Track this
          </DialogTitle>

          {/* Context Chips */}
          <div className="flex items-center gap-2 text-sm pt-2">
            <Badge variant="outline">Company: {entityName}</Badge>
            <span className="text-muted-foreground">•</span>
            <Badge variant="outline">Status: {status}</Badge>
            <span className="text-muted-foreground">•</span>
            <Badge variant="outline">Scope: AR</Badge>
          </div>
        </DialogHeader>
 {/* Current Value */}
 <div className="space-y-2">
            <Label>Current Value</Label>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-3xl font-semibold text-slate-900">
                {formatCurrency(currentValue)}
              </div>
              {/* <div className="text-xs text-slate-500 mt-2">
                Computed from loaded data • Last updated {lastUpdated ? formatTimeAgo(lastUpdated) : 'now'}
              </div> */}
            </div>

          </div>
        <div className="space-y-6 py-4">
          {/* Watch Template */}
          <div className="space-y-3">
            <Label htmlFor="watch-template">Watch Template</Label>
            <RadioGroup
              id="watch-template"
              value={watchTemplate}
              onValueChange={(v) => setWatchTemplate(v as WatchTemplate)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="open_ar_total" id="open_ar" />
                <Label htmlFor="open_ar" className="font-normal cursor-pointer">
                Total Outstanding Amount 
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ar_over_days" id="ar_over_days" />
                <Label htmlFor="ar_over_days" className="font-normal cursor-pointer flex items-center gap-2">
                Total Outstanding  &gt;
                  <Input
                    type="text"
                    value={daysParam}
                    onChange={(e) => handleDaysChange(e.target.value)}
                    className={`w-16 h-7 text-center ${errors.days ? 'border-red-500' : ''}`}
                    disabled={watchTemplate !== 'ar_over_days'}
                    aria-label="Days threshold"
                  />
                  days
                </Label>
              </div>
            </RadioGroup>
            {errors.days && (
              <p className="text-sm text-red-600">{errors.days}</p>
            )}
          </div>

         

          {/* Alert Type (only for ar_over_days) */}
          {watchTemplate === 'ar_over_days' && (
            <div className="space-y-3">
              <Label htmlFor="alert-type">Alert Type</Label>
              <RadioGroup
                id="alert-type"
                value={alertMode}
                onValueChange={(v) => {
                  setAlertMode(v as AlertMode);
                  setThresholdValue('');
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="amount_exceeds" id="amount_exceeds" />
                  <Label htmlFor="amount_exceeds" className="font-normal cursor-pointer">
                  Outstanding Amount exceeds 
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="days_exceeds" id="days_exceeds" />
                  <Label htmlFor="days_exceeds" className="font-normal cursor-pointer">
                  Outstanding Days exceeds 
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Condition */}
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2">
                <Select value={operator} onValueChange={setOperator}>
                  <SelectTrigger id="condition" aria-label="Operator">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map(op => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder={alertMode === 'days_exceeds' ? 'Days' : 'Amount'}
                    value={thresholdValue}
                    onChange={(e) => handleThresholdChange(e.target.value)}
                    className={errors.threshold ? 'border-red-500' : ''}
                    aria-label="Threshold value"
                  />
                  {alertMode !== 'days_exceeds' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      USD
                    </span>
                  )}
                  {alertMode === 'days_exceeds' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      days
                    </span>
                  )}
                </div>
              </div>
            </div>
            {errors.threshold && (
              <p className="text-sm text-red-600">{errors.threshold}</p>
            )}
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              You'll receive in-app notifications when the value crosses your threshold.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !thresholdValue}
          >
            Add to Watchlist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}