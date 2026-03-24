'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Download, TrendingUp, TrendingDown, Search,
  AlertTriangle, CheckCircle2, Clock, Sparkles, X, Eye, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useFluxAnalysis } from '@/hooks/data';
import type { FluxVariance } from '@/lib/data/types';


interface GroupedData {
  key: string;
  current: number;
  prior: number;
  varDollar: number;
  varPct: number;
  // Enriched fields from flux data
  status?: string;
  aiExplanation?: string;
  isSignificant?: boolean;
  threshold?: number;
  accountNumber?: string;
  reviewedBy?: string | null;
  currentPeriodLabel?: string;
  priorPeriodLabel?: string;
}


function transformFluxToGrouped(variances: FluxVariance[]): GroupedData[] {
  return variances.map((v) => ({
    key: v.accountName,
    current: v.currentValue,
    prior: v.priorValue,
    varDollar: v.varianceAmount,
    varPct: v.priorValue === 0 ? 0 : v.varianceAmount / v.priorValue,
    status: v.status,
    aiExplanation: v.aiExplanation,
    isSignificant: v.isSignificant,
    threshold: v.threshold,
    accountNumber: v.accountNumber,
    reviewedBy: v.reviewedBy,
    currentPeriodLabel: v.currentPeriod,
    priorPeriodLabel: v.priorPeriod,
  }));
}

// Status badge component
function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const map: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
    Reviewed: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: CheckCircle2 },
    InReview: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: Clock },
    AutoClosed: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-500', icon: Sparkles },
  };
  const s = map[status] || map.AutoClosed;
  const Icon = s.icon;
  const label = status === 'InReview' ? 'In Review' : status === 'AutoClosed' ? 'Auto-Closed' : status;
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border', s.bg, s.text)}>
      <Icon className="w-2.5 h-2.5" />{label}
    </span>
  );
}

// Variance bar — inline horizontal bar showing magnitude relative to max
function VarianceBar({ value, maxAbs }: { value: number; maxAbs: number }) {
  const pct = maxAbs > 0 ? Math.min(Math.abs(value) / maxAbs * 100, 100) : 0;
  const isPositive = value >= 0;
  return (
    <div className="flex items-center gap-1.5 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full', isPositive ? 'bg-green-400' : 'bg-red-400')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// SVG Waterfall chart
function WaterfallChart({ groups }: { groups: GroupedData[] }) {
  const sorted = [...groups].sort((a, b) => Math.abs(b.varDollar) - Math.abs(a.varDollar)).slice(0, 8);
  if (sorted.length === 0) return null;

  const maxVal = Math.max(...sorted.map(g => Math.abs(g.varDollar)));
  const chartW = 720;
  const chartH = 120;
  const barW = Math.min(70, (chartW - 40) / sorted.length - 8);
  const totalW = sorted.length * (barW + 8);
  const startX = (chartW - totalW) / 2;

  return (
    <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-700">Variance Waterfall — Top {sorted.length} by magnitude</span>
        <span className="text-[10px] text-slate-400">Sorted by |$ Variance|</span>
      </div>
      <svg width={chartW} height={chartH} className="w-full" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="xMidYMid meet">
        {/* Zero line */}
        <line x1={0} y1={chartH / 2} x2={chartW} y2={chartH / 2} stroke="#e2e8f0" strokeWidth={1} />
        {sorted.map((g, i) => {
          const x = startX + i * (barW + 8);
          const height = maxVal > 0 ? (Math.abs(g.varDollar) / maxVal) * (chartH / 2 - 14) : 0;
          const isUp = g.varDollar >= 0;
          const y = isUp ? chartH / 2 - height : chartH / 2;
          const color = isUp ? '#22c55e' : '#ef4444';
          const labelShort = g.key.length > 9 ? g.key.slice(0, 8) + '…' : g.key;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={Math.max(height, 2)} rx={3} fill={color} opacity={0.75} />
              <text x={x + barW / 2} y={isUp ? y - 3 : y + height + 9} textAnchor="middle" className="fill-slate-600" fontSize={8} fontWeight={600}>
                {isUp ? '+' : '-'}${Math.abs(g.varDollar) >= 1e6 ? `${(Math.abs(g.varDollar) / 1e6).toFixed(0)}M` : `${(Math.abs(g.varDollar) / 1e3).toFixed(0)}K`}
              </text>
              <text x={x + barW / 2} y={chartH - 1} textAnchor="middle" className="fill-slate-400" fontSize={7}>
                {labelShort}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function OneClickVariancePage() {
  const { data: fluxVariances, loading: dataLoading, error: dataError } = useFluxAnalysis();

  const fluxGrouped = useMemo(() => {
    if (fluxVariances.length > 0) return transformFluxToGrouped(fluxVariances);
    return null;
  }, [fluxVariances]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sigFilter, setSigFilter] = useState<'all' | 'material' | 'below'>('all');
  const [selectedRow, setSelectedRow] = useState<GroupedData | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const handleDownloadCSV = () => {
    const rows = effectiveGroups;
    if (rows.length === 0) { toast.error('No data to export'); return; }
    const header = ['Account', 'Current', 'Prior', '$ Variance', '% Variance', 'Status', 'Significant'];
    const csvRows = [header.join(',')];
    rows.forEach(r => {
      csvRows.push([r.key, r.current, r.prior, r.varDollar, (r.varPct * 100).toFixed(1) + '%', r.status || '', r.isSignificant ? 'Yes' : 'No'].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = 'variance-analysis.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const fmtCompact = (n: number) => {
    const abs = Math.abs(n);
    if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
    return fmt(n);
  };
  const fmtPct = (n: number) => { if (!isFinite(n)) return '-'; return `${(n * 100).toFixed(1)}%`; };

  const effectiveGroups = fluxGrouped || [];

  const filteredGroups = useMemo(() => {
    let result = effectiveGroups;
    if (searchTerm) result = result.filter(g => g.key.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sigFilter === 'material') result = result.filter(g => g.isSignificant);
    if (sigFilter === 'below') result = result.filter(g => !g.isSignificant);
    return result;
  }, [effectiveGroups, searchTerm, sigFilter]);

  const topMovers = filteredGroups.filter(g => g.varDollar > 0).sort((a, b) => b.varDollar - a.varDollar).slice(0, 10);
  const bottomMovers = filteredGroups.filter(g => g.varDollar < 0).sort((a, b) => a.varDollar - b.varDollar).slice(0, 10);

  const totals = fluxGrouped ? {
    current: fluxGrouped.reduce((s, g) => s + g.current, 0),
    prior: fluxGrouped.reduce((s, g) => s + g.prior, 0),
  } : { current: 0, prior: 0 };
  const totalVarDollar = totals.current - totals.prior;
  const totalVarPct = totals.prior === 0 ? 0 : totalVarDollar / totals.prior;
  const reviewedCount = effectiveGroups.filter(g => g.status === 'Reviewed').length;
  const maxAbsVar = Math.max(...filteredGroups.map(g => Math.abs(g.varDollar)), 1);
  const handleRowClick = (g: GroupedData) => { setSelectedRow(g); setShowDrawer(true); };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* ─── Title ─── */}
      <div className="px-5 pt-3 pb-1 bg-slate-50">
        <h1 className="text-sm font-semibold text-slate-900">One-Click Variance</h1>
        <p className="text-[11px] text-slate-500">AI auto-identifies material variances and generates narrative explanations</p>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="px-5 py-2">
          {/* Toolbar: Search + Filter tabs + KPI chips + Download */}
          <div className="flex items-center gap-2 mb-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <Input placeholder="Search accounts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-44 h-7 text-xs bg-white" />
            </div>

            {/* Significance filter tabs */}
            <div className="flex items-center gap-1">
              {([
                { id: 'all' as const, label: 'All', count: effectiveGroups.length },
                { id: 'material' as const, label: 'Material', count: effectiveGroups.filter(g => g.isSignificant).length },
                { id: 'below' as const, label: 'Below Threshold', count: effectiveGroups.filter(g => !g.isSignificant).length },
              ]).map((tab) => (
                <button key={tab.id} onClick={() => setSigFilter(tab.id)}
                  className={cn("px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors",
                    sigFilter === tab.id
                      ? "bg-white text-primary shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                  )}
                >
                  {tab.label}
                  <span className="ml-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 rounded-full">{tab.count}</span>
                </button>
              ))}
            </div>

            {/* KPI stat chips */}
            <div className="flex items-center gap-2 text-[11px] ml-auto">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                <span className="text-slate-500">Current</span>
                <span className="font-semibold text-slate-900">${fmtCompact(totals.current)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                <span className="text-slate-500">Prior</span>
                <span className="font-semibold text-slate-900">${fmtCompact(totals.prior)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                <span className="text-slate-500">$ Var</span>
                <span className={cn("font-semibold", totalVarDollar >= 0 ? "text-green-700" : "text-red-600")}>
                  {totalVarDollar >= 0 ? '+' : '-'}${fmtCompact(Math.abs(totalVarDollar))}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                <span className="text-slate-500">Reviewed</span>
                <span className="font-semibold text-green-700">{reviewedCount}/{effectiveGroups.length}</span>
              </div>
            </div>

            {/* Download */}
            <button onClick={handleDownloadCSV} className="flex items-center justify-center h-7 w-7 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors">
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {dataLoading && <div className="text-xs text-slate-500 mb-2">Loading variance data...</div>}
          {dataError && <div className="text-xs text-red-500 mb-2">Error: {dataError}</div>}

          {/* Waterfall chart */}
          <WaterfallChart groups={filteredGroups} />

          {/* Top / Bottom tables */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Top movers */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-700">Top Increases</span>
                <span className="text-[10px] text-slate-400">{topMovers.length} of {filteredGroups.length}</span>
              </div>
              <div className="overflow-auto" style={{ maxHeight: '280px' }}>
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="border-b border-slate-100">
                      <th className="text-left font-medium text-slate-500 px-3 py-1.5">Account</th>
                      <th className="text-right font-medium text-slate-500 px-3 py-1.5">Current</th>
                      <th className="text-right font-medium text-slate-500 px-3 py-1.5">Prior</th>
                      <th className="text-right font-medium text-slate-500 px-3 py-1.5">$ Var</th>
                      <th className="text-right font-medium text-slate-500 px-3 py-1.5">%</th>
                      {<th className="text-center font-medium text-slate-500 px-2 py-1.5">Status</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {topMovers.length === 0 ? (
                      <tr><td colSpan={6} className="text-center text-slate-400 py-6">No increases found</td></tr>
                    ) : topMovers.map((g, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer" onClick={() => handleRowClick(g)}>
                        <td className="px-3 py-1.5">
                          <div className="font-medium text-slate-800">{g.key}</div>
                          {g.isSignificant && <AlertTriangle className="inline w-2.5 h-2.5 text-amber-500 ml-1" />}
                        </td>
                        <td className="px-3 py-1.5 text-right text-slate-600">${fmtCompact(g.current)}</td>
                        <td className="px-3 py-1.5 text-right text-slate-600">${fmtCompact(g.prior)}</td>
                        <td className="px-3 py-1.5 text-right">
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-50 text-green-700 text-[10px] font-medium border border-green-200">
                            <TrendingUp className="w-2.5 h-2.5" />+${fmtCompact(g.varDollar)}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right text-green-700 font-medium">+{fmtPct(g.varPct)}</td>
                        {<td className="px-2 py-1.5 text-center"><StatusBadge status={g.status} /></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom movers */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-700">Top Decreases</span>
                <span className="text-[10px] text-slate-400">{bottomMovers.length} of {filteredGroups.length}</span>
              </div>
              <div className="overflow-auto" style={{ maxHeight: '280px' }}>
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="border-b border-slate-100">
                      <th className="text-left font-medium text-slate-500 px-3 py-1.5">Account</th>
                      <th className="text-right font-medium text-slate-500 px-3 py-1.5">Current</th>
                      <th className="text-right font-medium text-slate-500 px-3 py-1.5">Prior</th>
                      <th className="text-right font-medium text-slate-500 px-3 py-1.5">$ Var</th>
                      <th className="text-right font-medium text-slate-500 px-3 py-1.5">%</th>
                      {<th className="text-center font-medium text-slate-500 px-2 py-1.5">Status</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {bottomMovers.length === 0 ? (
                      <tr><td colSpan={6} className="text-center text-slate-400 py-6">No decreases found</td></tr>
                    ) : bottomMovers.map((g, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer" onClick={() => handleRowClick(g)}>
                        <td className="px-3 py-1.5">
                          <div className="font-medium text-slate-800">{g.key}</div>
                          {g.isSignificant && <AlertTriangle className="inline w-2.5 h-2.5 text-amber-500 ml-1" />}
                        </td>
                        <td className="px-3 py-1.5 text-right text-slate-600">${fmtCompact(g.current)}</td>
                        <td className="px-3 py-1.5 text-right text-slate-600">${fmtCompact(g.prior)}</td>
                        <td className="px-3 py-1.5 text-right">
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-medium border border-red-200">
                            <TrendingDown className="w-2.5 h-2.5" />-${fmtCompact(Math.abs(g.varDollar))}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right text-red-600 font-medium">{fmtPct(g.varPct)}</td>
                        {<td className="px-2 py-1.5 text-center"><StatusBadge status={g.status} /></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* All Variances full table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-700">
                All Variances
                <span className="font-normal text-slate-400 ml-2">Account Data · {effectiveGroups.length} accounts</span>
              </span>
              <span className="text-[10px] text-slate-400">{filteredGroups.length} accounts</span>
            </div>
            <div className="overflow-auto" style={{ maxHeight: '400px' }}>
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-100">
                    <th className="text-left font-medium text-slate-500 px-3 py-2 w-[200px]">Account</th>
                    <th className="text-right font-medium text-slate-500 px-3 py-2">Current</th>
                    <th className="text-right font-medium text-slate-500 px-3 py-2">Prior</th>
                    <th className="text-right font-medium text-slate-500 px-3 py-2">$ Variance</th>
                    <th className="text-right font-medium text-slate-500 px-3 py-2">%</th>
                    <th className="font-medium text-slate-500 px-3 py-2 w-[90px]">Magnitude</th>
                    {<th className="text-center font-medium text-slate-500 px-2 py-2">Status</th>}
                    {<th className="text-center font-medium text-slate-500 px-2 py-2 w-[30px]"><Eye className="w-3 h-3 mx-auto" /></th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.length === 0 ? (
                    <tr><td colSpan={8} className="text-center text-slate-400 py-8">No data available</td></tr>
                  ) : [...filteredGroups]
                    .sort((a, b) => Math.abs(b.varDollar) - Math.abs(a.varDollar))
                    .map((g, idx) => {
                      const isPos = g.varDollar >= 0;
                      return (
                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer" onClick={() => handleRowClick(g)}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-slate-800">{g.key}</span>
                              {g.isSignificant && <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                              {g.accountNumber && <span className="text-[10px] text-slate-400">#{g.accountNumber}</span>}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-slate-600">${fmtCompact(g.current)}</td>
                          <td className="px-3 py-2 text-right text-slate-600">${fmtCompact(g.prior)}</td>
                          <td className="px-3 py-2 text-right">
                            <span className={cn(
                              "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border",
                              isPos ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                            )}>
                              {isPos ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                              {isPos ? '+' : '-'}${fmtCompact(Math.abs(g.varDollar))}
                            </span>
                          </td>
                          <td className={cn("px-3 py-2 text-right font-medium", isPos ? "text-green-700" : "text-red-600")}>
                            {isPos ? '+' : ''}{fmtPct(g.varPct)}
                          </td>
                          <td className="px-3 py-2"><VarianceBar value={g.varDollar} maxAbs={maxAbsVar} /></td>
                          {<td className="px-2 py-2 text-center"><StatusBadge status={g.status} /></td>}
                          <td className="px-2 py-2 text-center">
                            {g.aiExplanation && <Sparkles className="w-3 h-3 text-primary mx-auto" />}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      <Sheet open={showDrawer} onOpenChange={setShowDrawer}>
        <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-sm font-semibold">{selectedRow?.key}</SheetTitle>
          </SheetHeader>
          {selectedRow && (
            <div className="mt-4 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 mb-0.5">Current Period</div>
                  <div className="text-sm font-semibold">${fmtCompact(selectedRow.current)}</div>
                  {selectedRow.currentPeriodLabel && <div className="text-[10px] text-slate-400">{selectedRow.currentPeriodLabel}</div>}
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 mb-0.5">Prior Period</div>
                  <div className="text-sm font-semibold">${fmtCompact(selectedRow.prior)}</div>
                  {selectedRow.priorPeriodLabel && <div className="text-[10px] text-slate-400">{selectedRow.priorPeriodLabel}</div>}
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 mb-0.5">$ Variance</div>
                  <div className={cn("text-sm font-semibold", selectedRow.varDollar >= 0 ? "text-green-700" : "text-red-600")}>
                    {selectedRow.varDollar >= 0 ? '+' : '-'}${fmtCompact(Math.abs(selectedRow.varDollar))}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 mb-0.5">% Variance</div>
                  <div className={cn("text-sm font-semibold", selectedRow.varPct >= 0 ? "text-green-700" : "text-red-600")}>
                    {selectedRow.varPct >= 0 ? '+' : ''}{fmtPct(selectedRow.varPct)}
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                {selectedRow.status && <StatusBadge status={selectedRow.status} />}
                {selectedRow.isSignificant && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border bg-amber-50 border-amber-200 text-amber-700">
                    <AlertTriangle className="w-2.5 h-2.5" />Material
                  </span>
                )}
                {selectedRow.threshold !== undefined && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border bg-slate-50 border-slate-200 text-slate-500">
                    Threshold: {selectedRow.threshold}%
                  </span>
                )}
                {selectedRow.accountNumber && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border bg-slate-50 border-slate-200 text-slate-500">
                    <FileText className="w-2.5 h-2.5" />Account #{selectedRow.accountNumber}
                  </span>
                )}
              </div>

              {/* Variance bar */}
              <div>
                <div className="text-[10px] text-slate-500 mb-1.5">Relative Magnitude</div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", selectedRow.varDollar >= 0 ? "bg-green-400" : "bg-red-400")}
                    style={{ width: `${Math.min(Math.abs(selectedRow.varDollar) / maxAbsVar * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                  <span>0</span>
                  <span>${fmtCompact(maxAbsVar)}</span>
                </div>
              </div>

              {/* AI Explanation */}
              {selectedRow.aiExplanation && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-slate-700">AI Explanation</span>
                  </div>
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-xs text-slate-700 leading-relaxed">
                    {selectedRow.aiExplanation}
                  </div>
                </div>
              )}

              {/* Reviewer info */}
              {selectedRow.reviewedBy && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  Reviewed by {selectedRow.reviewedBy}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => { toast.success(`Marked ${selectedRow.key} as reviewed`); setShowDrawer(false); }}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5" />Mark Reviewed
                </button>
                <button onClick={() => { toast.info(`Flagged ${selectedRow.key} for follow-up`); }}
                  className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <AlertTriangle className="w-3.5 h-3.5" />Flag
                </button>
                <button onClick={() => setShowDrawer(false)}
                  className="flex items-center justify-center h-8 w-8 rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
