"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface ExplainPanelProps {
  title: string;
  variance: number;
  thresholdAbs?: number;
  thresholdPct?: number;
  balanceA?: number;
  balanceB?: number;
  effectiveThreshold?: number;
  outcome?: string;
}

export function ExplainPanel({
  title,
  variance,
  thresholdAbs,
  thresholdPct,
  balanceA,
  balanceB,
  effectiveThreshold,
  outcome
}: ExplainPanelProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const calculateEffective = () => {
    if (effectiveThreshold) return effectiveThreshold;
    if (!thresholdAbs || !thresholdPct || !balanceA) return thresholdAbs || 0;

    const pctThreshold = Math.abs(balanceA) * (thresholdPct / 100);
    return Math.max(thresholdAbs, pctThreshold);
  };

  const effective = calculateEffective();
  const absVariance = Math.abs(variance);
  const isPassing = absVariance <= effective;

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
      <div className="flex items-start gap-2 mb-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-900">{title}</h3>
          <p className="text-sm text-blue-700 mt-1">
            How is this outcome calculated?
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white rounded-lg p-3 border border-blue-200">
          <div className="text-xs text-slate-500 mb-2">Step 1: Calculate Variance</div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-xs text-slate-500">Balance A</div>
              <div className="font-medium">{balanceA ? formatCurrency(balanceA) : '—'}</div>
            </div>
            <div className="flex items-center justify-center text-slate-400">
              {variance >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
            <div>
              <div className="text-xs text-slate-500">Balance B</div>
              <div className="font-medium">{balanceB ? formatCurrency(balanceB) : '—'}</div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-slate-500">Variance (A - B)</div>
            <div className={`text-lg font-bold ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(variance)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-blue-200">
          <div className="text-xs text-slate-500 mb-2">Step 2: Determine Threshold</div>
          <div className="space-y-2 text-sm">
            {thresholdAbs && (
              <div className="flex justify-between">
                <span className="text-slate-600">Absolute Threshold:</span>
                <span className="font-medium">{formatCurrency(thresholdAbs)}</span>
              </div>
            )}
            {thresholdPct && balanceA && (
              <div className="flex justify-between">
                <span className="text-slate-600">Percentage Threshold ({thresholdPct}%):</span>
                <span className="font-medium">{formatCurrency(Math.abs(balanceA) * (thresholdPct / 100))}</span>
              </div>
            )}
            <div className="pt-2 border-t flex justify-between">
              <span className="text-slate-600 font-medium">Effective Threshold:</span>
              <span className="font-bold text-blue-900">{formatCurrency(effective)}</span>
            </div>
            <div className="text-xs text-slate-500 italic">
              = MAX(Absolute, Percentage)
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-blue-200">
          <div className="text-xs text-slate-500 mb-2">Step 3: Compare & Determine Outcome</div>
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="text-slate-600">|Variance| vs Threshold</div>
              <div className="text-xs text-slate-500 mt-1">
                {formatCurrency(absVariance)} vs {formatCurrency(effective)}
              </div>
            </div>
            <Badge
              className={isPassing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
              variant="secondary"
            >
              {outcome || (isPassing ? 'PASS' : 'FAIL')}
            </Badge>
          </div>
          {!isPassing && (
            <div className="mt-2 flex items-start gap-2 text-xs text-red-700 bg-red-50 p-2 rounded">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                Variance exceeds threshold by {formatCurrency(absVariance - effective)}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
