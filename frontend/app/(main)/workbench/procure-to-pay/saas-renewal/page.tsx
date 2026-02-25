'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  Ghost,
  Layers,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Bar, Doughnut } from 'react-chartjs-2';
import Breadcrumb from '@/components/layout/breadcrumb';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

/* ──────────────────────────────── TYPES ──────────────────────────────── */

interface SaaSRecord {
  id: number;
  exec: string;
  vendor: string;
  app: string;
  renewalDays: number;
  renewal: string;
  provisioned: number;
  active90: number;
  t12mSpend: number;
  ppau: number;
  dupRisk: boolean;
  shadow: boolean;
}

/* ──────────────────────────────── DATA ──────────────────────────────── */

const SYNTHETIC_DATA: SaaSRecord[] = [
  {"id": 1, "exec": "CFO", "vendor": "Anaplan", "app": "Anaplan", "renewalDays": 175, "renewal": "2026-04-13", "provisioned": 107, "active90": 39, "t12mSpend": 287619, "ppau": 7375, "dupRisk": true, "shadow": false},
  {"id": 2, "exec": "CFO", "vendor": "BlackLine", "app": "BlackLine", "renewalDays": 185, "renewal": "2026-04-23", "provisioned": 429, "active90": 380, "t12mSpend": 607309, "ppau": 1598, "dupRisk": false, "shadow": false},
  {"id": 3, "exec": "CFO", "vendor": "Coupa", "app": "Coupa", "renewalDays": 19, "renewal": "2025-11-08", "provisioned": 97, "active90": 47, "t12mSpend": 163292, "ppau": 3474, "dupRisk": false, "shadow": true},
  {"id": 4, "exec": "CFO", "vendor": "Workiva", "app": "Workiva", "renewalDays": 62, "renewal": "2025-12-21", "provisioned": 416, "active90": 214, "t12mSpend": 1170843, "ppau": 5471, "dupRisk": false, "shadow": false},
  {"id": 5, "exec": "CFO", "vendor": "Stripe", "app": "Stripe", "renewalDays": 13, "renewal": "2025-11-02", "provisioned": 438, "active90": 365, "t12mSpend": 791382, "ppau": 2168, "dupRisk": false, "shadow": false},
  {"id": 6, "exec": "CFO", "vendor": "NetSuite", "app": "SuiteAnalytics", "renewalDays": 51, "renewal": "2025-12-10", "provisioned": 160, "active90": 148, "t12mSpend": 252067, "ppau": 1703, "dupRisk": false, "shadow": false},
  {"id": 7, "exec": "CFO", "vendor": "OneStream", "app": "OneStream", "renewalDays": 36, "renewal": "2025-11-25", "provisioned": 233, "active90": 200, "t12mSpend": 406907, "ppau": 2035, "dupRisk": false, "shadow": false},
  {"id": 8, "exec": "CFO", "vendor": "Planful", "app": "Planful", "renewalDays": 149, "renewal": "2026-03-18", "provisioned": 113, "active90": 106, "t12mSpend": 181055, "ppau": 1708, "dupRisk": true, "shadow": false},
  {"id": 9, "exec": "CTO", "vendor": "Atlassian", "app": "Jira", "renewalDays": 170, "renewal": "2026-04-08", "provisioned": 820, "active90": 731, "t12mSpend": 854436, "ppau": 1169, "dupRisk": true, "shadow": false},
  {"id": 10, "exec": "CTO", "vendor": "GitHub", "app": "GitHub", "renewalDays": 32, "renewal": "2025-11-21", "provisioned": 556, "active90": 484, "t12mSpend": 688126, "ppau": 1422, "dupRisk": false, "shadow": false},
  {"id": 11, "exec": "CTO", "vendor": "Datadog", "app": "Datadog", "renewalDays": 102, "renewal": "2026-01-30", "provisioned": 509, "active90": 383, "t12mSpend": 2302162, "ppau": 6011, "dupRisk": false, "shadow": false},
  {"id": 12, "exec": "CTO", "vendor": "Snowflake", "app": "Snowflake", "renewalDays": 30, "renewal": "2025-11-19", "provisioned": 430, "active90": 344, "t12mSpend": 534010, "ppau": 1552, "dupRisk": false, "shadow": false},
  {"id": 13, "exec": "CTO", "vendor": "Okta", "app": "Okta", "renewalDays": 175, "renewal": "2026-04-13", "provisioned": 529, "active90": 486, "t12mSpend": 736621, "ppau": 1516, "dupRisk": false, "shadow": false},
  {"id": 14, "exec": "CTO", "vendor": "Postman", "app": "Postman", "renewalDays": 20, "renewal": "2025-11-09", "provisioned": 726, "active90": 429, "t12mSpend": 763585, "ppau": 1780, "dupRisk": false, "shadow": false},
  {"id": 15, "exec": "CTO", "vendor": "Linear", "app": "Linear", "renewalDays": 157, "renewal": "2026-03-26", "provisioned": 724, "active90": 346, "t12mSpend": 911972, "ppau": 2636, "dupRisk": false, "shadow": false},
  {"id": 16, "exec": "CTO", "vendor": "Sentry", "app": "Sentry", "renewalDays": 48, "renewal": "2025-12-07", "provisioned": 622, "active90": 270, "t12mSpend": 856863, "ppau": 3174, "dupRisk": false, "shadow": false},
  {"id": 17, "exec": "CMO", "vendor": "Salesforce", "app": "Marketing Cloud", "renewalDays": 161, "renewal": "2026-03-30", "provisioned": 259, "active90": 230, "t12mSpend": 915347, "ppau": 3980, "dupRisk": true, "shadow": false},
  {"id": 18, "exec": "CMO", "vendor": "HubSpot", "app": "HubSpot", "renewalDays": 142, "renewal": "2026-03-11", "provisioned": 292, "active90": 118, "t12mSpend": 507406, "ppau": 4300, "dupRisk": true, "shadow": false},
  {"id": 19, "exec": "CMO", "vendor": "Figma", "app": "Figma", "renewalDays": 186, "renewal": "2026-04-24", "provisioned": 256, "active90": 181, "t12mSpend": 514000, "ppau": 2840, "dupRisk": true, "shadow": false},
  {"id": 20, "exec": "CMO", "vendor": "Canva", "app": "Canva", "renewalDays": 76, "renewal": "2026-01-04", "provisioned": 323, "active90": 114, "t12mSpend": 735334, "ppau": 6450, "dupRisk": false, "shadow": false},
  {"id": 21, "exec": "CMO", "vendor": "Marketo", "app": "Marketo", "renewalDays": 80, "renewal": "2026-01-08", "provisioned": 433, "active90": 166, "t12mSpend": 1418724, "ppau": 8547, "dupRisk": true, "shadow": false},
  {"id": 22, "exec": "CMO", "vendor": "Braze", "app": "Braze", "renewalDays": 79, "renewal": "2026-01-07", "provisioned": 296, "active90": 239, "t12mSpend": 623419, "ppau": 2608, "dupRisk": false, "shadow": false},
  {"id": 23, "exec": "CMO", "vendor": "Segment", "app": "Segment", "renewalDays": 172, "renewal": "2026-04-10", "provisioned": 192, "active90": 164, "t12mSpend": 404377, "ppau": 2466, "dupRisk": false, "shadow": true},
  {"id": 24, "exec": "CMO", "vendor": "Miro", "app": "Miro", "renewalDays": 107, "renewal": "2026-02-04", "provisioned": 430, "active90": 192, "t12mSpend": 1048317, "ppau": 5460, "dupRisk": false, "shadow": false},
];

/* ──────────────────────────────── HELPERS ──────────────────────────────── */

const formatCurrency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const formatCompact = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

const utilizationPercent = (r: SaaSRecord) =>
  r.active90 && r.provisioned ? Math.round((r.active90 / r.provisioned) * 100) : 0;

const renewalBadgeClass = (days: number) => {
  if (days <= 30) return 'bg-red-50 text-red-700 border-red-200';
  if (days <= 60) return 'bg-orange-50 text-orange-700 border-orange-200';
  if (days <= 90) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (days <= 120) return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const renewalLabel = (days: number) => {
  if (days <= 30) return 'Critical';
  if (days <= 60) return 'Urgent';
  if (days <= 90) return 'Soon';
  if (days <= 120) return 'Upcoming';
  return 'Healthy';
};

const utilBadgeClass = (util: number) =>
  util < 50
    ? 'bg-red-50 text-red-700 border-red-200'
    : util < 70
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

const sparklinePoints = (data: number[]) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  return data
    .map((v, i) => `${(i / Math.max(data.length - 1, 1)) * 70},${22 - ((v - min) / range) * 20}`)
    .join(' ');
};

const recommendedActions = (r: SaaSRecord): string[] => {
  const util = utilizationPercent(r);
  const acts: string[] = [];
  if (util < 70) acts.push(`Rightsize to ${Math.ceil(r.active90 * 1.15)} seats (active + 15% buffer)`);
  if (r.dupRisk) acts.push('Consolidate overlapping tools — evaluate feature overlap');
  if (r.ppau > 5000) acts.push('Renegotiate rate card — $/active above market benchmark');
  if (r.shadow) acts.push('Bring under SSO & master service agreement');
  if (r.renewalDays <= 30) acts.push('Expedite renewal decision — auto-renew risk');
  if (acts.length === 0) acts.push('Hold: maintain current terms at renewal');
  return acts;
};

/* ──────────────────────────────── COMPONENT ──────────────────────────────── */

export default function SaaSRenewalWorkbenchPage() {
  const [execFilter, setExecFilter] = useState<string>('ALL');
  const [renewalFilter, setRenewalFilter] = useState<string>('ALL');
  const [dupToggle, setDupToggle] = useState(false);
  const [shadowToggle, setShadowToggle] = useState(false);
  const [lowUtilToggle, setLowUtilToggle] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<SaaSRecord | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    return SYNTHETIC_DATA.filter(r => {
      if (execFilter !== 'ALL' && r.exec !== execFilter) return false;
      if (renewalFilter !== 'ALL' && r.renewalDays > Number(renewalFilter)) return false;
      if (dupToggle && !r.dupRisk) return false;
      if (shadowToggle && !r.shadow) return false;
      if (lowUtilToggle && utilizationPercent(r) >= 70) return false;
      const q = searchQuery.trim().toLowerCase();
      if (q && !(r.vendor.toLowerCase().includes(q) || r.app.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [execFilter, renewalFilter, dupToggle, shadowToggle, lowUtilToggle, searchQuery]);

  const kpis = useMemo(() => {
    const spend = filtered.reduce((a, r) => a + r.t12mSpend, 0);
    const wasteSeats = filtered.reduce((a, r) => a + Math.max(0, r.provisioned - r.active90), 0);
    const wasteSpend = filtered.reduce((a, r) => {
      const waste = Math.max(0, r.provisioned - r.active90);
      return a + (r.provisioned > 0 ? (r.t12mSpend / r.provisioned) * waste : 0);
    }, 0);
    const renewals90 = filtered.filter(r => r.renewalDays <= 90).length;
    const shadowCount = filtered.filter(r => r.shadow).length;
    const dupCount = filtered.filter(r => r.dupRisk).length;
    const avgUtil = filtered.length
      ? Math.round(filtered.reduce((a, r) => a + utilizationPercent(r), 0) / filtered.length)
      : 0;
    return { spend, wasteSeats, wasteSpend, renewals90, shadowCount, dupCount, avgUtil };
  }, [filtered]);

  const topApps = useMemo(() => {
    return [...filtered]
      .sort((a, b) => utilizationPercent(a) - utilizationPercent(b))
      .slice(0, 8);
  }, [filtered]);

  const renewalBuckets = useMemo(() => {
    const buckets: Record<string, number> = { '≤30d': 0, '31-60d': 0, '61-90d': 0, '91-120d': 0, '120d+': 0 };
    filtered.forEach(r => {
      if (r.renewalDays <= 30) buckets['≤30d']++;
      else if (r.renewalDays <= 60) buckets['31-60d']++;
      else if (r.renewalDays <= 90) buckets['61-90d']++;
      else if (r.renewalDays <= 120) buckets['91-120d']++;
      else buckets['120d+']++;
    });
    return buckets;
  }, [filtered]);

  const execBreakdown = useMemo(() => {
    const map: Record<string, { count: number; spend: number; avgUtil: number }> = {};
    filtered.forEach(r => {
      if (!map[r.exec]) map[r.exec] = { count: 0, spend: 0, avgUtil: 0 };
      map[r.exec].count++;
      map[r.exec].spend += r.t12mSpend;
      map[r.exec].avgUtil += utilizationPercent(r);
    });
    return Object.entries(map).map(([exec, v]) => ({
      exec,
      count: v.count,
      spend: v.spend,
      avgUtil: v.count ? Math.round(v.avgUtil / v.count) : 0,
    }));
  }, [filtered]);

  const activeFilterCount = [
    execFilter !== 'ALL',
    renewalFilter !== 'ALL',
    dupToggle,
    shadowToggle,
    lowUtilToggle,
    searchQuery.trim().length > 0,
  ].filter(Boolean).length;

  const handleReset = () => {
    setExecFilter('ALL');
    setRenewalFilter('ALL');
    setDupToggle(false);
    setShadowToggle(false);
    setLowUtilToggle(false);
    setSearchQuery('');
  };

  const openBrief = (r: SaaSRecord) => {
    setSelectedRecord(r);
    setSheetOpen(true);
  };

  const sr = selectedRecord;
  const srUtil = sr ? utilizationPercent(sr) : 0;
  const srWasteSeats = sr ? Math.max(0, sr.provisioned - sr.active90) : 0;
  const srWasteSpend = sr && sr.provisioned > 0 ? (sr.t12mSpend / sr.provisioned) * srWasteSeats : 0;
  const srRightsizeTarget = sr ? Math.ceil(sr.active90 * 1.15) : 0;
  const srSavings = sr && sr.provisioned > 0 ? (sr.t12mSpend / sr.provisioned) * Math.max(0, sr.provisioned - srRightsizeTarget) : 0;

  /* ── KPI sparkline data (simulated trailing 6-month trend) ── */
  const spendSpark = [0.82, 0.85, 0.91, 0.88, 0.95, 1.0].map(m => Math.round(kpis.spend * m));
  const wasteSpark = [120, 105, 95, 88, 78, kpis.wasteSeats > 0 ? kpis.wasteSeats : 60];
  const renewalSpark = [3, 5, 4, 7, 6, kpis.renewals90];
  const utilSpark = [68, 71, 73, 70, 74, kpis.avgUtil];

  return (
    <div className="flex flex-col bg-white" style={{ height: '100%', minHeight: 0 }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="workbench/procure-to-pay/saas-renewal" className="mb-1.5" />
        <div className="flex items-center justify-between mt-2">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <Layers className="w-4.5 h-4.5 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold text-slate-900">SaaS Renewal</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1 ml-[42px]">
              Monitor SaaS subscriptions, optimize licensing, and prepare negotiation briefs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
          </div>
        </div>
        <div className="border-b border-slate-200 mt-4" />
      </header>

      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-[1363px] mx-auto px-6 py-6 space-y-5">

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {/* T12M Spend */}
            <Card className={cn("shadow-none border-blue-200 cursor-default transition-all hover:shadow-md")}>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">T12M SaaS Spend</p>
                  <svg width="70" height="22" viewBox="0 0 70 22" className="opacity-80">
                    <polyline fill="none" stroke="#3b82f6" strokeWidth="1.8" points={sparklinePoints(spendSpark)} />
                  </svg>
                </div>
                <p className="text-2xl font-semibold mt-1 text-slate-900">{formatCompact(kpis.spend)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-red-500" />
                  <span className="text-[11px] text-red-600 font-medium">+8.2% vs prior year</span>
                </div>
              </CardContent>
            </Card>

            {/* Waste */}
            <Card className={cn("shadow-none border-red-200 cursor-default transition-all hover:shadow-md")}>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Waste (Est.)</p>
                  <svg width="70" height="22" viewBox="0 0 70 22" className="opacity-80">
                    <polyline fill="none" stroke="#ef4444" strokeWidth="1.8" points={sparklinePoints(wasteSpark)} />
                  </svg>
                </div>
                <p className="text-2xl font-semibold mt-1 text-slate-900">{kpis.wasteSeats.toLocaleString()} <span className="text-sm font-normal text-slate-500">seats</span></p>
                <div className="flex items-center gap-1 mt-1">
                  <DollarSign className="w-3 h-3 text-red-500" />
                  <span className="text-[11px] text-red-600 font-medium">{formatCompact(kpis.wasteSpend)} recoverable</span>
                </div>
              </CardContent>
            </Card>

            {/* Renewals ≤90d */}
            <Card className={cn("shadow-none border-amber-200 cursor-default transition-all hover:shadow-md")}>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Renewals ≤ 90d</p>
                  <svg width="70" height="22" viewBox="0 0 70 22" className="opacity-80">
                    <polyline fill="none" stroke="#f59e0b" strokeWidth="1.8" points={sparklinePoints(renewalSpark)} />
                  </svg>
                </div>
                <p className="text-2xl font-semibold mt-1 text-slate-900">{kpis.renewals90}</p>
                <div className="flex items-center gap-1 mt-1">
                  <CalendarClock className="w-3 h-3 text-amber-600" />
                  <span className="text-[11px] text-amber-700 font-medium">{filtered.filter(r => r.renewalDays <= 30).length} critical (&le;30d)</span>
                </div>
              </CardContent>
            </Card>

            {/* Avg Utilization */}
            <Card className={cn("shadow-none border-emerald-200 cursor-default transition-all hover:shadow-md")}>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Avg Utilization</p>
                  <svg width="70" height="22" viewBox="0 0 70 22" className="opacity-80">
                    <polyline fill="none" stroke="#10b981" strokeWidth="1.8" points={sparklinePoints(utilSpark)} />
                  </svg>
                </div>
                <p className="text-2xl font-semibold mt-1 text-slate-900">{kpis.avgUtil}%</p>
                <div className="flex items-center gap-1 mt-1">
                  {kpis.avgUtil >= 70 ? (
                    <>
                      <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                      <span className="text-[11px] text-emerald-600 font-medium">Above 70% target</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-3 h-3 text-red-500" />
                      <span className="text-[11px] text-red-600 font-medium">Below 70% target</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Filter Bar ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={execFilter} onValueChange={setExecFilter}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue placeholder="Executive" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Executives</SelectItem>
                  <SelectItem value="CFO">CFO</SelectItem>
                  <SelectItem value="CTO">CTO</SelectItem>
                  <SelectItem value="CMO">CMO</SelectItem>
                </SelectContent>
              </Select>

              <Select value={renewalFilter} onValueChange={setRenewalFilter}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue placeholder="Renewal window" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Windows</SelectItem>
                  <SelectItem value="30">&le; 30 days</SelectItem>
                  <SelectItem value="60">&le; 60 days</SelectItem>
                  <SelectItem value="90">&le; 90 days</SelectItem>
                  <SelectItem value="120">&le; 120 days</SelectItem>
                  <SelectItem value="180">&le; 180 days</SelectItem>
                </SelectContent>
              </Select>

              <div className="h-6 w-px bg-slate-200 mx-1" />

              <button
                type="button"
                onClick={() => setDupToggle(!dupToggle)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                  dupToggle
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                <Layers className="w-3 h-3" /> Dup Risk {dupToggle && `(${kpis.dupCount})`}
              </button>

              <button
                type="button"
                onClick={() => setShadowToggle(!shadowToggle)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                  shadowToggle
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                <Ghost className="w-3 h-3" /> Shadow IT {shadowToggle && `(${kpis.shadowCount})`}
              </button>

              <button
                type="button"
                onClick={() => setLowUtilToggle(!lowUtilToggle)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                  lowUtilToggle
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                <TrendingDown className="w-3 h-3" /> Util &lt;70%
              </button>

              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-[10px] font-semibold">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search vendor or app..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 w-56 text-xs"
                />
              </div>
              {activeFilterCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs gap-1.5">
                  <RotateCcw className="w-3 h-3" /> Reset
                </Button>
              )}
            </div>
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2 shadow-none border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-900">Utilization vs Provisioned</h3>
                  </div>
                  <span className="text-[11px] text-slate-500">Active90 / Provisioned — bottom 8 apps</span>
                </div>
                <Bar
                  data={{
                    labels: topApps.map(r => r.app),
                    datasets: [{
                      label: 'Utilization %',
                      data: topApps.map(r => utilizationPercent(r)),
                      backgroundColor: topApps.map(r => {
                        const u = utilizationPercent(r);
                        return u < 50 ? '#fca5a5' : u < 70 ? '#fcd34d' : '#86efac';
                      }),
                      borderRadius: 4,
                      barThickness: 28,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => `${ctx.parsed.y}% utilization`,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: '#f1f5f9' },
                        ticks: { font: { size: 10 }, color: '#94a3b8' },
                      },
                      x: {
                        grid: { display: false },
                        ticks: { font: { size: 10 }, color: '#64748b', maxRotation: 45 },
                      },
                    },
                  }}
                  height={100}
                />
              </CardContent>
            </Card>

            <Card className="shadow-none border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-900">Renewal Timeline</h3>
                  </div>
                  <span className="text-[11px] text-slate-500">Apps by window</span>
                </div>
                <Doughnut
                  data={{
                    labels: Object.keys(renewalBuckets),
                    datasets: [{
                      data: Object.values(renewalBuckets),
                      backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#10b981'],
                      borderWidth: 2,
                      borderColor: '#fff',
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '55%',
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { font: { size: 10 }, padding: 12, usePointStyle: true, pointStyleWidth: 8 },
                      },
                    },
                  }}
                  height={120}
                />
              </CardContent>
            </Card>
          </div>

          {/* ── Executive Breakdown ── */}
          {execFilter === 'ALL' && execBreakdown.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {execBreakdown.map(e => (
                <Card
                  key={e.exec}
                  className="shadow-none border-slate-200 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                  onClick={() => setExecFilter(e.exec)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{e.exec}</p>
                        <p className="text-lg font-semibold text-slate-900 mt-0.5">{formatCompact(e.spend)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">{e.count} apps</p>
                        <p className={cn("text-xs font-medium mt-0.5", e.avgUtil >= 70 ? "text-emerald-600" : "text-red-600")}>
                          {e.avgUtil}% avg util
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ── Renewal Watchlist Table ── */}
          <Card className="shadow-none border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">Renewal Watchlist</h3>
                <Badge variant="secondary" className="text-[10px]">{filtered.length} apps</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Click a row for negotiation brief</p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Exec</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Vendor / App</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Renewal</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">Provisioned</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">Active90</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">Util %</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">T12M Spend</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">$/Active</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">Flags</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => {
                    const util = utilizationPercent(r);
                    return (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                        onClick={() => openBrief(r)}
                      >
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {r.exec}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-slate-900">{r.vendor}</div>
                          {r.vendor !== r.app && <div className="text-[11px] text-slate-500">{r.app}</div>}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-[10px] font-semibold border", renewalBadgeClass(r.renewalDays))}>
                            {r.renewalDays}d — {renewalLabel(r.renewalDays)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">{r.provisioned.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums">{r.active90.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={cn("text-[10px] font-semibold border", utilBadgeClass(util))}>
                            {util}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium tabular-nums">{formatCurrency(r.t12mSpend)}</TableCell>
                        <TableCell className={cn("text-right text-xs tabular-nums", r.ppau > 5000 ? "text-red-600 font-semibold" : "")}>
                          {formatCurrency(r.ppau)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {r.dupRisk && (
                              <Badge className="text-[9px] bg-purple-50 text-purple-700 border-purple-200 border">
                                Dup
                              </Badge>
                            )}
                            {r.shadow && (
                              <Badge className="text-[9px] bg-rose-50 text-rose-700 border-rose-200 border">
                                Shadow
                              </Badge>
                            )}
                            {!r.dupRisk && !r.shadow && (
                              <span className="text-[11px] text-slate-400">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 max-w-[200px] truncate">
                          {recommendedActions(r)[0]}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-sm text-slate-500">
                        No apps match the current filters. Try adjusting your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Negotiation Brief Sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[720px] sm:max-w-[720px] p-0 flex flex-col">
          {sr && (
            <>
              {/* Dark Header */}
              <SheetHeader className="px-6 pt-5 pb-4 border-b bg-gradient-to-r from-slate-800 to-slate-700 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SheetTitle className="text-base text-white font-bold tracking-tight">
                      {sr.vendor} — {sr.app}
                    </SheetTitle>
                    <p className="text-xs text-slate-300 mt-1">
                      {sr.exec} &middot; Renewal in {sr.renewalDays} days &middot; {new Date(sr.renewal).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={cn("text-[10px] font-bold border", renewalBadgeClass(sr.renewalDays))}>
                      {renewalLabel(sr.renewalDays)}
                    </Badge>
                    <Badge className={cn("text-[10px] font-bold border", utilBadgeClass(srUtil))}>
                      {srUtil}% Util
                    </Badge>
                  </div>
                </div>

                {/* Urgency bar */}
                {sr.renewalDays <= 60 && (
                  <div className={cn(
                    "mt-3 flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium",
                    sr.renewalDays <= 30
                      ? "bg-red-500/20 text-red-200 border border-red-400/30"
                      : "bg-amber-500/20 text-amber-200 border border-amber-400/30"
                  )}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>
                      {sr.renewalDays <= 30
                        ? `Critical: Auto-renew in ${sr.renewalDays} days — action required immediately`
                        : `Urgent: ${sr.renewalDays} days until renewal — begin negotiation`}
                    </span>
                  </div>
                )}
              </SheetHeader>

              {/* Tabs */}
              <div className="flex-1 overflow-y-auto">
                <Tabs defaultValue="overview" className="w-full">
                  <div className="sticky top-0 z-10 bg-white border-b px-6 pt-3">
                    <TabsList className="w-full justify-start h-9 gap-0 bg-slate-100 p-0.5 rounded-lg">
                      <TabsTrigger value="overview" className="text-xs rounded-md">Overview</TabsTrigger>
                      <TabsTrigger value="usage" className="text-xs rounded-md">Usage Analysis</TabsTrigger>
                      <TabsTrigger value="actions" className="text-xs rounded-md">Actions</TabsTrigger>
                      <TabsTrigger value="deprovision" className="text-xs rounded-md">De-provision</TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Tab: Overview */}
                  <TabsContent value="overview" className="px-6 py-4 space-y-4">
                    {/* Spend Summary */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Spend Summary</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <Card className="p-3 bg-blue-50 border-blue-200">
                          <p className="text-xs text-blue-700">T12M Spend</p>
                          <p className="text-lg font-bold text-blue-900">{formatCurrency(sr.t12mSpend)}</p>
                        </Card>
                        <Card className="p-3 bg-red-50 border-red-200">
                          <p className="text-xs text-red-700">Waste Est.</p>
                          <p className="text-lg font-bold text-red-700">{formatCurrency(Math.round(srWasteSpend))}</p>
                        </Card>
                        <Card className="p-3 bg-emerald-50 border-emerald-200">
                          <p className="text-xs text-emerald-700">Potential Savings</p>
                          <p className="text-lg font-bold text-emerald-700">{formatCurrency(Math.round(srSavings))}</p>
                        </Card>
                      </div>
                    </div>

                    {/* License Details */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">License Details</h4>
                      <div className="grid grid-cols-4 gap-2">
                        <Card className="p-3">
                          <p className="text-xs text-slate-500">Provisioned</p>
                          <p className="text-lg font-bold">{sr.provisioned.toLocaleString()}</p>
                        </Card>
                        <Card className="p-3">
                          <p className="text-xs text-slate-500">Active (90d)</p>
                          <p className="text-lg font-bold">{sr.active90.toLocaleString()}</p>
                        </Card>
                        <Card className="p-3">
                          <p className="text-xs text-slate-500">Waste Seats</p>
                          <p className="text-lg font-bold text-red-600">{srWasteSeats.toLocaleString()}</p>
                        </Card>
                        <Card className="p-3">
                          <p className="text-xs text-slate-500">$/Active User</p>
                          <p className={cn("text-lg font-bold", sr.ppau > 5000 ? "text-red-600" : "")}>{formatCurrency(sr.ppau)}</p>
                        </Card>
                      </div>
                    </div>

                    {/* Utilization Bar */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Utilization</h4>
                      <div className="rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-700">{srUtil}% utilized</span>
                          <Badge className={cn("text-[10px] font-semibold border", utilBadgeClass(srUtil))}>
                            {srUtil < 50 ? 'Critical' : srUtil < 70 ? 'Low' : srUtil < 85 ? 'Healthy' : 'Optimal'}
                          </Badge>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              srUtil < 50 ? "bg-red-400" : srUtil < 70 ? "bg-amber-400" : "bg-emerald-400"
                            )}
                            style={{ width: `${Math.min(srUtil, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                          <span>0</span>
                          <span className="border-l border-dashed border-slate-300 pl-2">70% target</span>
                          <span>{sr.provisioned}</span>
                        </div>
                      </div>
                    </div>

                    {/* Flags */}
                    {(sr.dupRisk || sr.shadow) && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Risk Flags
                        </h4>
                        <div className="space-y-2">
                          {sr.dupRisk && (
                            <Card className="p-3 border-purple-200 bg-purple-50/50">
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-purple-600" />
                                <div>
                                  <p className="text-xs font-semibold text-purple-700">Duplicate Tool Risk</p>
                                  <p className="text-[11px] text-purple-600 mt-0.5">Overlapping functionality detected with existing tools in the portfolio</p>
                                </div>
                              </div>
                            </Card>
                          )}
                          {sr.shadow && (
                            <Card className="p-3 border-rose-200 bg-rose-50/50">
                              <div className="flex items-center gap-2">
                                <Ghost className="w-4 h-4 text-rose-600" />
                                <div>
                                  <p className="text-xs font-semibold text-rose-700">Shadow IT</p>
                                  <p className="text-[11px] text-rose-600 mt-0.5">Not under IT governance — no SSO, no master agreement, no security review</p>
                                </div>
                              </div>
                            </Card>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab: Usage Analysis */}
                  <TabsContent value="usage" className="px-6 py-4 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Seat Allocation</h4>
                      <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                        {[
                          { label: 'Active users (90d)', value: sr.active90, color: 'bg-emerald-400', pct: sr.provisioned > 0 ? (sr.active90 / sr.provisioned) * 100 : 0 },
                          { label: 'Inactive users', value: srWasteSeats, color: 'bg-red-400', pct: sr.provisioned > 0 ? (srWasteSeats / sr.provisioned) * 100 : 0 },
                        ].map(row => (
                          <div key={row.label}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-600">{row.label}</span>
                              <span className="font-semibold">{row.value.toLocaleString()} ({row.pct.toFixed(0)}%)</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", row.color)} style={{ width: `${Math.min(row.pct, 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Cost Efficiency</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Card className="p-3">
                          <p className="text-xs text-slate-500">Cost / Provisioned Seat</p>
                          <p className="text-lg font-bold">{formatCurrency(sr.provisioned > 0 ? Math.round(sr.t12mSpend / sr.provisioned) : 0)}</p>
                        </Card>
                        <Card className="p-3">
                          <p className="text-xs text-slate-500">Cost / Active User</p>
                          <p className={cn("text-lg font-bold", sr.ppau > 5000 ? "text-red-600" : "")}>{formatCurrency(sr.ppau)}</p>
                        </Card>
                        <Card className="p-3">
                          <p className="text-xs text-slate-500">Rightsize Target</p>
                          <p className="text-lg font-bold text-primary">{srRightsizeTarget} seats</p>
                        </Card>
                        <Card className="p-3">
                          <p className="text-xs text-slate-500">At Rightsize Cost</p>
                          <p className="text-lg font-bold text-emerald-600">
                            {formatCurrency(sr.provisioned > 0 ? Math.round((sr.t12mSpend / sr.provisioned) * srRightsizeTarget) : 0)}
                          </p>
                        </Card>
                      </div>
                    </div>

                    {/* AI Insight */}
                    <Card className="p-4 border-primary/20 bg-primary/5">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-primary">AI Insight</p>
                          <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                            {srUtil < 50
                              ? `${sr.app} has critically low utilization at ${srUtil}%. Consider downgrading to a lower tier or consolidating with ${sr.dupRisk ? 'overlapping tools' : 'existing alternatives'}. Estimated annual savings: ${formatCurrency(Math.round(srSavings))}.`
                              : srUtil < 70
                                ? `${sr.app} is underperforming at ${srUtil}% utilization. Rightsizing to ${srRightsizeTarget} seats would save ${formatCurrency(Math.round(srSavings))}/year while maintaining a 15% growth buffer.`
                                : `${sr.app} shows healthy utilization at ${srUtil}%. Focus negotiation on rate improvement — current $/active of ${formatCurrency(sr.ppau)} ${sr.ppau > 5000 ? 'is above market benchmark' : 'is competitive'}.`}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  {/* Tab: Actions */}
                  <TabsContent value="actions" className="px-6 py-4 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" /> Recommended Actions
                      </h4>
                      <div className="space-y-2">
                        {recommendedActions(sr).map((act, i) => (
                          <Card key={i} className="p-3 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0 mt-0.5">
                                {i + 1}
                              </div>
                              <p className="text-sm text-slate-700">{act}</p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Negotiation Leverage</h4>
                      <div className="space-y-2">
                        <Card className="p-3 border-amber-200 bg-amber-50/50">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <p className="text-xs text-amber-800">
                              {srWasteSeats > 50
                                ? `${srWasteSeats} unused seats give strong leverage — demand volume discount or seat reduction`
                                : sr.ppau > 5000
                                  ? `$/active user of ${formatCurrency(sr.ppau)} exceeds market rates — benchmark against competitors`
                                  : 'Standard negotiation position — focus on multi-year discount or added features'}
                            </p>
                          </div>
                        </Card>
                        {sr.renewalDays <= 60 && (
                          <Card className="p-3 border-red-200 bg-red-50/50">
                            <div className="flex items-center gap-2">
                              <CalendarClock className="w-3.5 h-3.5 text-red-600" />
                              <p className="text-xs text-red-800">
                                Only {sr.renewalDays} days to renewal — negotiate quickly or risk auto-renew at current rates
                              </p>
                            </div>
                          </Card>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="gap-1.5 text-xs">
                        <FileText className="w-3.5 h-3.5" /> Generate Brief PDF
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                        <Users className="w-3.5 h-3.5" /> Assign to Procurement
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Tab: De-provision */}
                  <TabsContent value="deprovision" className="px-6 py-4 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                        Inactive Users (&ge;90 days)
                      </h4>
                      <p className="text-xs text-slate-600 mb-3">
                        {srWasteSeats} users have not accessed {sr.app} in the last 90 days. De-provisioning these would save approximately {formatCurrency(Math.round(srWasteSpend))}/year.
                      </p>

                      <div className="rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-left text-slate-500 border-b">
                              <th className="py-2 px-3 font-semibold">User</th>
                              <th className="py-2 px-3 font-semibold">Department</th>
                              <th className="py-2 px-3 font-semibold text-right">Last Active</th>
                              <th className="py-2 px-3 font-semibold text-right">Cost/Year</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: Math.min(8, Math.max(2, srWasteSeats)) }).map((_, i) => {
                              const depts = ['Engineering', 'Finance', 'Marketing', 'Sales', 'Operations', 'HR', 'Legal', 'Product'];
                              const days = [95, 112, 138, 167, 201, 89, 154, 120];
                              const costPerSeat = sr.provisioned > 0 ? Math.round(sr.t12mSpend / sr.provisioned) : 0;
                              return (
                                <tr key={i} className="border-b last:border-0 hover:bg-slate-50/50">
                                  <td className="py-2 px-3">
                                    <span className="font-medium text-slate-700">user{i + 1}@company.com</span>
                                  </td>
                                  <td className="py-2 px-3 text-slate-600">{depts[i % depts.length]}</td>
                                  <td className="py-2 px-3 text-right text-slate-500">{days[i % days.length]}d ago</td>
                                  <td className="py-2 px-3 text-right text-red-600 font-medium">{formatCurrency(costPerSeat)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {srWasteSeats > 8 && (
                        <p className="text-[11px] text-slate-500 mt-2">
                          Showing 8 of {srWasteSeats} inactive users. Export for full list.
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                        <Download className="w-3.5 h-3.5" /> Export Inactive List
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50">
                        <Users className="w-3.5 h-3.5" /> Request De-provision
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
