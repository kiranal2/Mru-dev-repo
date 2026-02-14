"use client";

import { useEffect, useState } from "react";
import { RevenueLeakageShell } from "@/components/revenue-leakage/revenue-leakage-shell";
import { revenueLeakageApi } from "@/lib/revenue-leakage/revenueLeakageApi";
import {
  RevenueLeakageOverview,
  RiskLevel,
  LeakageSignal,
  OfficeRiskScore,
} from "@/lib/revenue-leakage/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Shield,
  Activity,
  Lightbulb,
  Target,
  Clock,
  ShieldAlert,
  Eye,
  Zap,
  Building2,
} from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const signalLabels: Record<LeakageSignal, string> = {
  RevenueGap: "Revenue Gap",
  ChallanDelay: "Challan Delay",
  ExemptionRisk: "Exemption Risk",
  MarketValueRisk: "Market Value",
  ProhibitedLand: "Prohibited Land",
  DataIntegrity: "Data Integrity",
  HolidayFee: "Holiday Fee",
};

const signalColor: Record<LeakageSignal, string> = {
  RevenueGap: "bg-red-100 text-red-800 border-red-300",
  ChallanDelay: "bg-orange-100 text-orange-800 border-orange-300",
  ExemptionRisk: "bg-purple-100 text-purple-800 border-purple-300",
  MarketValueRisk: "bg-sky-100 text-sky-800 border-sky-300",
  ProhibitedLand: "bg-pink-100 text-pink-800 border-pink-300",
  DataIntegrity: "bg-slate-200 text-slate-800 border-slate-400",
  HolidayFee: "bg-amber-100 text-amber-800 border-amber-300",
};

const riskChipStyles: Record<RiskLevel, { active: string; idle: string }> = {
  High: {
    active: "bg-red-600 text-white border-red-700 shadow-sm",
    idle: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  },
  Medium: {
    active: "bg-amber-500 text-white border-amber-600 shadow-sm",
    idle: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  Low: {
    active: "bg-emerald-600 text-white border-emerald-700 shadow-sm",
    idle: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
};

const riskBadgeStyles: Record<RiskLevel, string> = {
  High: "bg-red-600 text-white",
  Medium: "bg-amber-500 text-white",
  Low: "bg-emerald-600 text-white",
};

const patternIcons: Record<string, typeof TrendingUp> = {
  spike: TrendingUp,
  drop: TrendingDown,
  drift: Activity,
  seasonal: BarChart3,
};

const patternStyles: Record<string, { border: string; bg: string; icon: string; badge: string }> = {
  spike: {
    border: "border-red-200",
    bg: "bg-red-50/60",
    icon: "text-red-600 bg-red-100",
    badge: "bg-red-100 text-red-700 border-red-200",
  },
  drop: {
    border: "border-emerald-200",
    bg: "bg-emerald-50/60",
    icon: "text-emerald-600 bg-emerald-100",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  drift: {
    border: "border-amber-200",
    bg: "bg-amber-50/60",
    icon: "text-amber-600 bg-amber-100",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  seasonal: {
    border: "border-blue-200",
    bg: "bg-blue-50/60",
    icon: "text-blue-600 bg-blue-100",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
};

/* ─── Inline SVG: Signal Breakdown Bars ─── */
function SignalBreakdownChart({ data }: { data: RevenueLeakageOverview["leakage_by_signal"] }) {
  if (!data?.length) return null;
  const maxTotal = Math.max(...data.map((d) => d.high + d.medium + d.low), 1);
  const barH = 28;
  const gap = 8;
  const labelW = 90;
  const chartW = 400;
  const svgH = data.length * (barH + gap) + gap;

  return (
    <svg
      viewBox={`0 0 ${labelW + chartW + 50} ${svgH}`}
      className="w-full"
      style={{ maxHeight: 220 }}
    >
      {data.map((d, i) => {
        const total = d.high + d.medium + d.low;
        const y = i * (barH + gap) + gap;
        const scale = (chartW - 10) / maxTotal;
        const wH = d.high * scale;
        const wM = d.medium * scale;
        const wL = d.low * scale;
        return (
          <g key={d.signal}>
            <text
              x={labelW - 6}
              y={y + barH / 2 + 4}
              textAnchor="end"
              className="text-[11px] fill-slate-600 font-medium"
            >
              {signalLabels[d.signal]?.split(" ")[0]}
            </text>
            <rect x={labelW} y={y} width={wH} height={barH} rx={4} fill="#dc2626" />
            <rect x={labelW + wH} y={y} width={wM} height={barH} rx={0} fill="#f59e0b" />
            <rect x={labelW + wH + wM} y={y} width={wL} height={barH} rx={4} fill="#10b981" />
            <text
              x={labelW + wH + wM + wL + 6}
              y={y + barH / 2 + 4}
              className="text-[11px] fill-slate-700 font-bold"
            >
              {total}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Inline SVG: Case Funnel ─── */
function CaseFunnelChart({
  sla,
  overview,
}: {
  sla: RevenueLeakageOverview["sla_summary"];
  overview: RevenueLeakageOverview;
}) {
  const statuses = [
    {
      label: "Total Cases",
      count:
        overview.high_risk_cases + (overview.cases_awaiting_review || 0) + (sla?.within_sla || 0),
      color: "#3b82f6",
    },
    { label: "Awaiting Review", count: overview.cases_awaiting_review || 0, color: "#f59e0b" },
    { label: "Within SLA", count: sla?.within_sla || 0, color: "#10b981" },
    { label: "SLA Breached", count: sla?.breached || 0, color: "#ef4444" },
  ];
  const maxCount = Math.max(...statuses.map((s) => s.count), 1);

  return (
    <div className="space-y-2.5">
      {statuses.map((s) => {
        const pct = Math.max(8, (s.count / maxCount) * 100);
        return (
          <div key={s.label} className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600 w-28 text-right shrink-0">
              {s.label}
            </span>
            <div className="flex-1 h-7 bg-slate-100 rounded-md overflow-hidden relative">
              <div
                className="h-full rounded-md transition-all"
                style={{ width: `${pct}%`, backgroundColor: s.color }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-700">
                {s.count}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Inline SVG: Monthly Gap Trend Sparkline ─── */
function MonthlyGapTrend({ data }: { data: RevenueLeakageOverview["monthly_trends"] }) {
  if (!data?.length) return null;
  const maxGap = Math.max(...data.map((d) => d.gap_inr), 1);
  const w = 400;
  const h = 120;
  const padX = 40;
  const padY = 16;
  const plotW = w - padX * 2;
  const plotH = h - padY * 2;

  const points = data.map((d, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * plotW,
    y: padY + plotH - (d.gap_inr / maxGap) * plotH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padY + plotH} L ${points[0].x} ${padY + plotH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 140 }}>
      <defs>
        <linearGradient id="gapGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
        <line
          key={pct}
          x1={padX}
          x2={w - padX}
          y1={padY + plotH * (1 - pct)}
          y2={padY + plotH * (1 - pct)}
          stroke="#e2e8f0"
          strokeWidth={0.5}
        />
      ))}
      <path d={areaPath} fill="url(#gapGrad)" />
      <path d={linePath} fill="none" stroke="#ef4444" strokeWidth={2} strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="#ef4444" stroke="white" strokeWidth={1.5} />
          <text
            x={p.x}
            y={padY + plotH + 12}
            textAnchor="middle"
            className="text-[9px] fill-slate-500"
          >
            {data[i].month.slice(0, 3)}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ─── Inline SVG: Office Risk Grid ─── */
function OfficeRiskGrid({ offices }: { offices: OfficeRiskScore[] }) {
  if (!offices?.length) return null;
  const sorted = [...offices].sort((a, b) => b.risk_score - a.risk_score);
  const components = [
    "revenue_gap",
    "challan_delay",
    "prohibited_match",
    "mv_deviation",
    "exemption_anomaly",
  ] as const;
  const compLabels = ["Rev Gap", "Challan", "Prohib", "MV Dev", "Exempt"];
  const cellW = 72;
  const cellH = 34;
  const labelW = 140;
  const scoreColW = 56;
  const headerH = 36;
  const rowGap = 1;
  const w = labelW + scoreColW + components.length * cellW + 20;
  const h = headerH + sorted.length * (cellH + rowGap) + 10;

  const getColor = (score: number) => {
    if (score >= 20) return "#dc2626";
    if (score >= 15) return "#ea580c";
    if (score >= 10) return "#f59e0b";
    if (score >= 5) return "#84cc16";
    return "#10b981";
  };
  const getOpacity = (score: number) => {
    if (score === 0) return 0.25;
    return 0.75 + Math.min(score / 30, 1) * 0.25;
  };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 520 }}>
      {/* Column headers */}
      <text
        x={labelW - 6}
        y={headerH - 10}
        textAnchor="end"
        className="text-[10px] fill-slate-400 font-semibold"
      >
        Office
      </text>
      <text
        x={labelW + scoreColW / 2}
        y={headerH - 10}
        textAnchor="middle"
        className="text-[10px] fill-slate-400 font-semibold"
      >
        Score
      </text>
      {compLabels.map((label, ci) => (
        <text
          key={ci}
          x={labelW + scoreColW + ci * cellW + cellW / 2}
          y={headerH - 10}
          textAnchor="middle"
          className="text-[10px] fill-slate-400 font-semibold"
        >
          {label}
        </text>
      ))}
      <line x1={0} y1={headerH - 4} x2={w} y2={headerH - 4} stroke="#e2e8f0" strokeWidth={1} />
      {/* Rows */}
      {sorted.map((office, ri) => {
        const y = headerH + ri * (cellH + rowGap);
        const rowBg = ri % 2 === 0 ? "#f8fafc" : "#ffffff";
        return (
          <g key={office.SR_CODE}>
            <rect x={0} y={y} width={w} height={cellH} fill={rowBg} />
            {/* Office label */}
            <text
              x={8}
              y={y + cellH / 2 + 1}
              dominantBaseline="middle"
              className="text-[11px] fill-slate-800 font-bold"
            >
              {office.SR_CODE}
            </text>
            <text
              x={42}
              y={y + cellH / 2 + 1}
              dominantBaseline="middle"
              className="text-[10px] fill-slate-400"
            >
              {office.SR_NAME}
            </text>
            {/* Overall score bar */}
            <rect
              x={labelW + 4}
              y={y + cellH / 2 - 5}
              width={scoreColW - 24}
              height={10}
              rx={5}
              fill="#e2e8f0"
            />
            <rect
              x={labelW + 4}
              y={y + cellH / 2 - 5}
              width={Math.max(2, (office.risk_score / 100) * (scoreColW - 24))}
              height={10}
              rx={5}
              fill={
                office.risk_score >= 70
                  ? "#dc2626"
                  : office.risk_score >= 40
                    ? "#f59e0b"
                    : "#10b981"
              }
            />
            <text
              x={labelW + scoreColW - 14}
              y={y + cellH / 2 + 1}
              dominantBaseline="middle"
              textAnchor="end"
              className="text-[11px] fill-slate-700 font-bold"
            >
              {office.risk_score}
            </text>
            {/* Component cells */}
            {components.map((comp, ci) => {
              const score = office.component_scores[comp];
              return (
                <g key={comp}>
                  <rect
                    x={labelW + scoreColW + ci * cellW + 3}
                    y={y + 3}
                    width={cellW - 6}
                    height={cellH - 6}
                    rx={6}
                    fill={score === 0 ? "#f1f5f9" : getColor(score)}
                    opacity={getOpacity(score)}
                  />
                  <text
                    x={labelW + scoreColW + ci * cellW + cellW / 2}
                    y={y + cellH / 2 + 1}
                    dominantBaseline="middle"
                    textAnchor="middle"
                    className={`text-[11px] font-bold ${score === 0 ? "fill-slate-300" : "fill-white"}`}
                  >
                    {score}
                  </text>
                  <title>{`${office.SR_CODE} - ${compLabels[ci]}: ${score}`}</title>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Inline SVG: Exemption Category Bars ─── */
function ExemptionCategoryBars({
  categories,
  total,
}: {
  categories: Array<{ code: string; count: number; amount: number }>;
  total: number;
}) {
  if (!categories?.length) return null;
  const maxAmount = Math.max(...categories.map((c) => c.amount), 1);
  const barH = 28;
  const gap = 8;
  const labelW = 70;
  const chartW = 340;
  const svgH = categories.length * (barH + gap) + gap;

  return (
    <svg
      viewBox={`0 0 ${labelW + chartW + 80} ${svgH}`}
      className="w-full"
      style={{ maxHeight: 200 }}
    >
      {categories.map((cat, i) => {
        const y = i * (barH + gap) + gap;
        const w = (cat.amount / maxAmount) * chartW;
        const pct = total > 0 ? ((cat.amount / total) * 100).toFixed(1) : "0";
        return (
          <g key={cat.code}>
            <text
              x={labelW - 6}
              y={y + barH / 2 + 4}
              textAnchor="end"
              className="text-[10px] fill-slate-600 font-medium"
            >
              {cat.code}
            </text>
            <rect
              x={labelW}
              y={y}
              width={Math.max(w, 2)}
              height={barH}
              rx={4}
              fill="#7c3aed"
              opacity={0.8}
            />
            <text
              x={labelW + w + 6}
              y={y + barH / 2 + 4}
              className="text-[10px] fill-slate-700 font-bold"
            >
              {pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function RevenueLeakageInsightsPage() {
  const [overview, setOverview] = useState<RevenueLeakageOverview | null>(null);
  const [dateRange, setDateRange] = useState("all");
  const [officeFilter, setOfficeFilter] = useState("all");
  const [riskFilters, setRiskFilters] = useState<RiskLevel[]>([]);
  const [signalFilters, setSignalFilters] = useState<LeakageSignal[]>([]);

  useEffect(() => {
    revenueLeakageApi.getOverview().then(setOverview);
  }, []);

  const toggleFilter = <T extends string>(value: T, list: T[], setter: (next: T[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else {
      setter([...list, value]);
    }
  };

  const officeOptions = overview?.top_offices_by_gap?.map((o) => o.SR_CODE) || [];

  // Compute KPI stats
  const kpiStats = overview
    ? {
        patternAlerts: overview.pattern_insights?.length || 0,
        officeRiskHigh:
          overview.office_risk_scores?.filter((o) => o.risk_level === "High").length || 0,
        slaBreached: overview.sla_summary?.breached || 0,
        exemptionFlags: overview.exemption_summary?.failed_eligibility || 0,
        totalTrends: overview.monthly_trends?.length || 0,
        topSignal: overview.leakage_by_signal?.reduce(
          (max, s) => (s.high + s.medium + s.low > max.high + max.medium + max.low ? s : max),
          overview.leakage_by_signal[0]
        ),
      }
    : null;

  return (
    <RevenueLeakageShell subtitle="Trends and anomalies from recent detection runs">
      <div className="px-6 py-3 space-y-3">
        {/* ─── KPI Summary Strip ─── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          <Card className="p-3 bg-blue-50/40 border-blue-200">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-[11px] font-medium text-blue-600">Pattern Alerts</p>
            </div>
            <p className="text-xl font-bold text-blue-700">{kpiStats?.patternAlerts ?? "—"}</p>
          </Card>
          <Card className="p-3 bg-red-50 border-red-200">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              <p className="text-[11px] font-medium text-red-600">High Risk Offices</p>
            </div>
            <p className="text-xl font-bold text-red-700">{kpiStats?.officeRiskHigh ?? "—"}</p>
          </Card>
          <Card className="p-3 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-[11px] font-medium text-amber-600">SLA Breached</p>
            </div>
            <p className="text-xl font-bold text-amber-700">{kpiStats?.slaBreached ?? "—"}</p>
          </Card>
          <Card className="p-3 bg-purple-50 border-purple-200">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-purple-500" />
              <p className="text-[11px] font-medium text-purple-600">Exemption Flags</p>
            </div>
            <p className="text-xl font-bold text-purple-700">{kpiStats?.exemptionFlags ?? "—"}</p>
          </Card>
          <Card className="p-3 bg-slate-50 border-slate-200">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-[11px] font-medium text-slate-500">Months Tracked</p>
            </div>
            <p className="text-xl font-bold text-slate-700">{kpiStats?.totalTrends ?? "—"}</p>
          </Card>
          <Card className="p-3 bg-orange-50 border-orange-200">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-orange-500" />
              <p className="text-[11px] font-medium text-orange-600">Top Signal</p>
            </div>
            <p className="text-sm font-bold text-orange-700 truncate">
              {kpiStats?.topSignal ? signalLabels[kpiStats.topSignal.signal] : "—"}
            </p>
          </Card>
        </div>

        {/* ─── Filter Controls ─── */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 180 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={officeFilter} onValueChange={setOfficeFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Office" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Offices</SelectItem>
              {officeOptions.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 py-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide mr-0.5">
            Risk
          </span>
          {(["High", "Medium", "Low"] as RiskLevel[]).map((risk) => {
            const styles = riskChipStyles[risk];
            return (
              <button
                key={risk}
                onClick={() => toggleFilter(risk, riskFilters, setRiskFilters)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                  riskFilters.includes(risk) ? styles.active : styles.idle
                }`}
              >
                {risk}
              </button>
            );
          })}

          <span className="text-slate-300 mx-1.5">|</span>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide mr-0.5">
            Signal
          </span>
          {(Object.keys(signalLabels) as LeakageSignal[]).map((signal) => (
            <button
              key={signal}
              onClick={() => toggleFilter(signal, signalFilters, setSignalFilters)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                signalFilters.includes(signal)
                  ? signalColor[signal] + " shadow-sm ring-1 ring-offset-1 ring-current"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {signalLabels[signal]}
            </button>
          ))}
        </div>

        {/* ─── Tabbed Insight Sections ─── */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="office-risk">Office Risk</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="exemptions">Exemptions</TabsTrigger>
          </TabsList>

          {/* ─── Overview Tab ─── */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Charts */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Signal & Funnel Analysis
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Leakage by Signal</h3>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px]">
                        <span className="w-2.5 h-2.5 rounded-sm bg-red-600 inline-block" /> High
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px]">
                        <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Med
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px]">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Low
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    {overview?.leakage_by_signal ? (
                      <SignalBreakdownChart data={overview.leakage_by_signal} />
                    ) : (
                      <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                        Loading...
                      </div>
                    )}
                  </div>
                </div>
                <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b">
                    <h3 className="text-sm font-bold text-slate-900">Case Funnel</h3>
                  </div>
                  <div className="p-4">
                    {overview?.sla_summary ? (
                      <CaseFunnelChart sla={overview.sla_summary} overview={overview} />
                    ) : (
                      <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                        Loading...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Gap Trend */}
            {overview?.monthly_trends && overview.monthly_trends.length > 0 && (
              <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b">
                  <h3 className="text-sm font-bold text-slate-900">Gap Trend (Monthly)</h3>
                </div>
                <div className="p-4">
                  <MonthlyGapTrend data={overview.monthly_trends} />
                </div>
              </div>
            )}

            {/* Monthly Trends Table */}
            {overview?.monthly_trends && overview.monthly_trends.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Monthly Breakdown
                </h2>
                <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase text-slate-200 bg-slate-800">
                        <tr>
                          <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold">
                            Month
                          </th>
                          <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold">
                            Cases
                          </th>
                          <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold">
                            Gap
                          </th>
                          <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold">
                            High Risk
                          </th>
                          <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold">
                            Trend
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {overview.monthly_trends.map((trend, idx) => {
                          const prev = idx > 0 ? overview.monthly_trends[idx - 1] : null;
                          const gapChange = prev ? trend.gap_inr - prev.gap_inr : 0;
                          return (
                            <tr
                              key={trend.month}
                              className="text-slate-800 hover:bg-blue-50/50 transition-colors"
                            >
                              <td className="px-3 py-2.5 font-semibold text-slate-900">
                                {trend.month}
                              </td>
                              <td className="px-3 py-2.5 text-right font-medium">{trend.cases}</td>
                              <td className="px-3 py-2.5 text-right font-bold text-red-700">
                                {formatCurrency(trend.gap_inr)}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${trend.high_risk > 5 ? "bg-red-600 text-white" : trend.high_risk > 2 ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"}`}
                                >
                                  {trend.high_risk}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                {gapChange > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                                    <TrendingUp className="w-3 h-3" />+{formatCurrency(gapChange)}
                                  </span>
                                ) : gapChange < 0 ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                    <TrendingDown className="w-3 h-3" />
                                    {formatCurrency(gapChange)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Grid: Top Offices + SLA */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Operational Drilldowns
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden xl:col-span-2">
                  <div className="px-4 py-2.5 bg-slate-50 border-b">
                    <h3 className="text-sm font-bold text-slate-900">Top Offices by Gap</h3>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase text-slate-200 bg-slate-800">
                        <tr>
                          <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold">
                            Office
                          </th>
                          <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold">
                            Gap
                          </th>
                          <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold">
                            Cases
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(overview?.top_offices_by_gap || []).map((office) => (
                          <tr
                            key={office.SR_CODE}
                            className="text-slate-800 hover:bg-blue-50/50 transition-colors"
                          >
                            <td className="px-3 py-2.5">
                              <span className="font-bold text-slate-900">{office.SR_CODE}</span>
                              <span className="text-slate-400 ml-1 text-xs">{office.SR_NAME}</span>
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-red-700">
                              {formatCurrency(office.gap_inr)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium">{office.cases}</td>
                          </tr>
                        ))}
                        {!overview?.top_offices_by_gap?.length && (
                          <tr>
                            <td
                              colSpan={3}
                              className="py-4 px-3 text-sm text-slate-500 text-center"
                            >
                              No data yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Card className="p-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">SLA Summary</h3>
                  {overview?.sla_summary ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-emerald-50 rounded-lg text-center border border-emerald-200">
                          <p className="text-2xl font-bold text-emerald-700">
                            {overview.sla_summary.within_sla}
                          </p>
                          <p className="text-[10px] text-emerald-600 uppercase font-semibold">
                            Within SLA
                          </p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg text-center border border-red-200">
                          <p className="text-2xl font-bold text-red-700">
                            {overview.sla_summary.breached}
                          </p>
                          <p className="text-[10px] text-red-600 uppercase font-semibold">
                            Breached
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Ageing Buckets
                        </h4>
                        {Object.entries(overview.sla_summary.ageing_buckets).map(
                          ([bucket, count]) => {
                            const maxBucket = Math.max(
                              ...Object.values(overview.sla_summary.ageing_buckets),
                              1
                            );
                            const pct = (count / maxBucket) * 100;
                            return (
                              <div key={bucket} className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-600 w-12">
                                  {bucket}
                                </span>
                                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-slate-500 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-slate-700 w-6 text-right">
                                  {count}
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No SLA data available.</p>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ─── Office Risk Tab ─── */}
          <TabsContent value="office-risk" className="mt-4 space-y-5">
            {/* Summary cards for Office Risk */}
            {(() => {
              const scores = overview?.office_risk_scores || [];
              const highCount = scores.filter((o) => o.risk_level === "High").length;
              const medCount = scores.filter((o) => o.risk_level === "Medium").length;
              const lowCount = scores.filter((o) => o.risk_level === "Low").length;
              const avgScore = scores.length
                ? Math.round(scores.reduce((s, o) => s + o.risk_score, 0) / scores.length)
                : 0;
              return (
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium">Total Offices</p>
                      <p className="text-lg font-bold text-slate-800">{scores.length}</p>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-[11px] text-red-600 font-medium">High Risk</p>
                      <p className="text-lg font-bold text-red-700">{highCount}</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[11px] text-amber-600 font-medium">Medium Risk</p>
                      <p className="text-lg font-bold text-amber-700">{medCount}</p>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium">Avg Risk Score</p>
                      <p
                        className={`text-lg font-bold ${avgScore >= 70 ? "text-red-700" : avgScore >= 40 ? "text-amber-700" : "text-emerald-700"}`}
                      >
                        {avgScore}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Risk Heatmap */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Component Risk Heatmap
              </h2>
              <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Office Risk by Component</h3>
                  <div className="flex items-center gap-3">
                    {[
                      { label: "High (20+)", color: "#dc2626" },
                      { label: "Med-High (15+)", color: "#ea580c" },
                      { label: "Medium (10+)", color: "#f59e0b" },
                      { label: "Low (5+)", color: "#84cc16" },
                      { label: "Minimal", color: "#10b981" },
                    ].map((l) => (
                      <span
                        key={l.label}
                        className="inline-flex items-center gap-1.5 text-[10px] text-slate-500"
                      >
                        <span
                          className="w-3 h-3 rounded inline-block"
                          style={{ backgroundColor: l.color }}
                        />
                        {l.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <OfficeRiskGrid offices={overview?.office_risk_scores || []} />
                </div>
              </div>
            </div>

            {/* Office Risk Rankings */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Office Rankings
              </h2>
              <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                <div className="overflow-auto">
                  <table className="w-full text-sm" style={{ minWidth: 1100 }}>
                    <thead className="text-xs uppercase text-slate-200 bg-slate-800">
                      <tr>
                        <th className="px-2 py-2.5 text-center whitespace-nowrap font-semibold w-10">
                          #
                        </th>
                        <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold">
                          Office
                        </th>
                        <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold">
                          District
                        </th>
                        <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold">
                          Zone
                        </th>
                        <th
                          className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                          style={{ minWidth: 120 }}
                        >
                          Risk Score
                        </th>
                        <th className="px-3 py-2.5 text-center whitespace-nowrap font-semibold">
                          Level
                        </th>
                        <th className="px-3 py-2.5 text-center whitespace-nowrap font-semibold">
                          Rev Gap
                        </th>
                        <th className="px-3 py-2.5 text-center whitespace-nowrap font-semibold">
                          Challan
                        </th>
                        <th className="px-3 py-2.5 text-center whitespace-nowrap font-semibold">
                          Prohib
                        </th>
                        <th className="px-3 py-2.5 text-center whitespace-nowrap font-semibold">
                          MV Dev
                        </th>
                        <th className="px-3 py-2.5 text-center whitespace-nowrap font-semibold">
                          Exempt
                        </th>
                        <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold">
                          Cases
                        </th>
                        <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold">
                          Total Gap
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(overview?.office_risk_scores || [])
                        .sort((a, b) => b.risk_score - a.risk_score)
                        .map((office, idx) => {
                          const compScoreBg = (score: number, max: number) => {
                            const pct = score / max;
                            if (pct >= 0.8) return "bg-red-100 text-red-800";
                            if (pct >= 0.5) return "bg-amber-100 text-amber-800";
                            if (pct > 0) return "bg-emerald-50 text-emerald-700";
                            return "bg-slate-50 text-slate-300";
                          };
                          return (
                            <tr
                              key={office.SR_CODE}
                              className="text-slate-800 hover:bg-blue-50/40 transition-colors"
                            >
                              <td className="px-2 py-2.5 text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                    idx === 0
                                      ? "bg-red-600 text-white"
                                      : idx === 1
                                        ? "bg-red-400 text-white"
                                        : idx === 2
                                          ? "bg-amber-400 text-white"
                                          : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900 text-xs">
                                    {office.SR_CODE}
                                  </span>
                                  <span className="text-slate-400 text-[10px] leading-tight">
                                    {office.SR_NAME}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-xs text-slate-600">
                                {office.district}
                              </td>
                              <td className="px-3 py-2.5 text-xs text-slate-600">{office.zone}</td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        office.risk_score >= 70
                                          ? "bg-red-500"
                                          : office.risk_score >= 40
                                            ? "bg-amber-500"
                                            : "bg-emerald-500"
                                      }`}
                                      style={{ width: `${office.risk_score}%` }}
                                    />
                                  </div>
                                  <span
                                    className={`text-xs font-bold tabular-nums ${
                                      office.risk_score >= 70
                                        ? "text-red-700"
                                        : office.risk_score >= 40
                                          ? "text-amber-700"
                                          : "text-emerald-700"
                                    }`}
                                  >
                                    {office.risk_score}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${riskBadgeStyles[office.risk_level]} whitespace-nowrap`}
                                >
                                  {office.risk_level}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs font-bold ${compScoreBg(office.component_scores.revenue_gap, 30)}`}
                                >
                                  {office.component_scores.revenue_gap}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs font-bold ${compScoreBg(office.component_scores.challan_delay, 25)}`}
                                >
                                  {office.component_scores.challan_delay}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs font-bold ${compScoreBg(office.component_scores.prohibited_match, 25)}`}
                                >
                                  {office.component_scores.prohibited_match}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs font-bold ${compScoreBg(office.component_scores.mv_deviation, 20)}`}
                                >
                                  {office.component_scores.mv_deviation}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs font-bold ${compScoreBg(office.component_scores.exemption_anomaly, 15)}`}
                                >
                                  {office.component_scores.exemption_anomaly}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-right font-medium text-xs">
                                {office.total_cases}
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold text-red-700 text-xs">
                                {formatCurrency(office.total_gap_inr)}
                              </td>
                            </tr>
                          );
                        })}
                      {!overview?.office_risk_scores?.length && (
                        <tr>
                          <td colSpan={13} className="py-8 px-3 text-sm text-slate-400 text-center">
                            No office risk data available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─── Patterns Tab ─── */}
          <TabsContent value="patterns" className="mt-4 space-y-4">
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Detected Anomalies & Patterns
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(overview?.pattern_insights || []).map((insight) => {
                  const Icon = patternIcons[insight.type] || Activity;
                  const style = patternStyles[insight.type] || patternStyles.seasonal;

                  return (
                    <Card
                      key={insight.id}
                      className={`p-0 overflow-hidden ${style.border} ${style.bg}`}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${style.icon} flex-shrink-0`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {insight.metric}
                              </h4>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${style.badge} capitalize whitespace-nowrap`}
                              >
                                {insight.type}
                              </span>
                            </div>
                            {insight.office && (
                              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                <Target className="w-3 h-3" /> Office: {insight.office}
                              </p>
                            )}
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {insight.period}
                            </p>
                            <p className="text-base font-bold text-slate-900 mt-2">
                              {insight.magnitude}
                            </p>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {insight.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                {!overview?.pattern_insights?.length && (
                  <Card className="p-6 col-span-2 border-slate-200">
                    <div className="text-center">
                      <Eye className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-500">
                        No pattern insights detected yet.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Patterns will appear after multiple detection runs.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ─── Exemptions Tab ─── */}
          <TabsContent value="exemptions" className="mt-4 space-y-4">
            {overview?.exemption_summary ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Card className="p-3 text-center bg-slate-50 border-slate-200">
                    <p className="text-2xl font-bold text-slate-900">
                      {overview.exemption_summary.total_exemptions}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold mt-1">
                      Total Exemptions
                    </p>
                  </Card>
                  <Card className="p-3 text-center bg-blue-50/40 border-blue-200">
                    <p className="text-2xl font-bold text-blue-700">
                      {formatCurrency(overview.exemption_summary.total_amount)}
                    </p>
                    <p className="text-[10px] text-blue-600 uppercase font-semibold mt-1">
                      Total Amount
                    </p>
                  </Card>
                  <Card className="p-3 text-center bg-red-50 border-red-200">
                    <p className="text-2xl font-bold text-red-700">
                      {overview.exemption_summary.failed_eligibility}
                    </p>
                    <p className="text-[10px] text-red-600 uppercase font-semibold mt-1">
                      Failed Eligibility
                    </p>
                  </Card>
                  <Card className="p-3 text-center bg-amber-50 border-amber-200">
                    <p className="text-2xl font-bold text-amber-700">
                      {overview.exemption_summary.repeat_offenders}
                    </p>
                    <p className="text-[10px] text-amber-600 uppercase font-semibold mt-1">
                      Repeat Offenders
                    </p>
                  </Card>
                </div>

                {/* Exemption Category Visualization + Table */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b">
                      <h3 className="text-sm font-bold text-slate-900">Category Distribution</h3>
                    </div>
                    <div className="p-4">
                      <ExemptionCategoryBars
                        categories={overview.exemption_summary.top_categories}
                        total={overview.exemption_summary.total_amount}
                      />
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b">
                      <h3 className="text-sm font-bold text-slate-900">Top Exemption Categories</h3>
                    </div>
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="text-xs uppercase text-slate-200 bg-slate-800">
                          <tr>
                            <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold">
                              Code
                            </th>
                            <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold">
                              Count
                            </th>
                            <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold">
                              Amount
                            </th>
                            <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold">
                              Share
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {overview.exemption_summary.top_categories.map((cat) => {
                            const pct =
                              overview.exemption_summary.total_amount > 0
                                ? (
                                    (cat.amount / overview.exemption_summary.total_amount) *
                                    100
                                  ).toFixed(1)
                                : "0";
                            return (
                              <tr
                                key={cat.code}
                                className="text-slate-800 hover:bg-blue-50/50 transition-colors"
                              >
                                <td className="px-3 py-2.5 font-bold text-slate-900">{cat.code}</td>
                                <td className="px-3 py-2.5 text-right font-medium">{cat.count}</td>
                                <td className="px-3 py-2.5 text-right font-bold text-purple-700">
                                  {formatCurrency(cat.amount)}
                                </td>
                                <td className="px-3 py-2.5 text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-purple-500 rounded-full"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700">
                                      {pct}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {!overview.exemption_summary.top_categories.length && (
                            <tr>
                              <td
                                colSpan={4}
                                className="py-4 px-3 text-sm text-slate-500 text-center"
                              >
                                No exemption categories found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Exemption Risk Highlight */}
                <Card className="p-4 border-purple-200 bg-gradient-to-r from-purple-50/50 to-violet-50/50">
                  <h3 className="text-xs font-bold text-purple-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Exemption Risk Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white/60 rounded-md px-3 py-2.5">
                      <p className="text-xs text-slate-500">
                        Failed eligibility checks indicate documents claiming exemptions without
                        meeting statutory criteria.
                      </p>
                    </div>
                    <div className="bg-white/60 rounded-md px-3 py-2.5">
                      <p className="text-xs text-slate-500">
                        Repeat offenders are parties who have claimed exemptions across multiple
                        registrations within the analysis window.
                      </p>
                    </div>
                    <div className="bg-white/60 rounded-md px-3 py-2.5">
                      <p className="text-xs text-slate-500">
                        Category distribution shows which exemption types carry the highest revenue
                        impact and warrant priority review.
                      </p>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-6 border-slate-200">
                <div className="text-center">
                  <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">No exemption data available.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Exemption analysis runs as part of detection.
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </RevenueLeakageShell>
  );
}
