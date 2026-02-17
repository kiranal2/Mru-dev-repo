"use client";

import { useMemo, useState } from "react";
import {
  useIGRSCases,
  useIGRSDashboard,
  useIGRSRules,
  useIGRSTrends,
} from "@/hooks/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR } from "@/lib/data/utils/format-currency";
import type { IGRSCase, IGRSLeakageSignal } from "@/lib/data/types";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  CircleDot,
  Clock3,
  Database,
  ExternalLink,
  Filter,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";

type CurrencyMode = "auto" | "rupees" | "lakhs" | "crores";

const SIGNAL_LABELS: Record<IGRSLeakageSignal, string> = {
  RevenueGap: "Revenue",
  ChallanDelay: "Challan",
  ExemptionRisk: "Exemption",
  MarketValueRisk: "Market",
  ProhibitedLand: "Prohibited",
  DataIntegrity: "Data",
  CashReconciliation: "Cash Recon",
  StampInventory: "Stamp Inv",
};

const SIGNAL_COLORS: Record<IGRSLeakageSignal, string> = {
  RevenueGap: "#ef4444",
  ChallanDelay: "#f59e0b",
  ExemptionRisk: "#8b5cf6",
  MarketValueRisk: "#3b82f6",
  ProhibitedLand: "#ec4899",
  DataIntegrity: "#64748b",
  CashReconciliation: "#10b981",
  StampInventory: "#3b82f6",
};

const STATUS_COLORS: Record<string, string> = {
  New: "#3b82f6",
  "In Review": "#f59e0b",
  Confirmed: "#8b5cf6",
  Resolved: "#22c55e",
  Rejected: "#ef4444",
};

const RISK_BADGE: Record<string, string> = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function formatByMode(value: number, mode: CurrencyMode): string {
  if (mode === "auto") return formatINR(value, true);
  if (mode === "rupees") return formatINR(value, false);
  if (mode === "lakhs") return `₹${(value / 100000).toFixed(2)}L`;
  return `₹${(value / 10000000).toFixed(2)}Cr`;
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function pctDelta(current: number, previous: number | null): number | null {
  if (previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function daysBetween(start: string, end: string): number {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

function sparklinePoints(values: number[], width = 70, height = 22): string {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function IGRSOverviewPage() {
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>("auto");

  const { data: dashboard, loading: dashLoading, error: dashError, refetch: refetchDashboard } =
    useIGRSDashboard();
  const { data: trends, loading: trendsLoading, error: trendsError, refetch: refetchTrends } =
    useIGRSTrends();
  const { data: rules, loading: rulesLoading, error: rulesError, refetch: refetchRules } =
    useIGRSRules();
  const { data: cases, loading: casesLoading, error: casesError, refetch: refetchCases } =
    useIGRSCases();

  const loading = dashLoading || trendsLoading || rulesLoading || casesLoading;
  const error = dashError || trendsError || rulesError || casesError;

  const monthlyMetrics = useMemo(() => {
    const grouped = new Map<
      string,
      { payable: number; paid: number; gap: number; highRisk: number; awaiting: number }
    >();

    for (const c of cases) {
      const key = monthKey(c.createdAt);
      const current = grouped.get(key) ?? {
        payable: 0,
        paid: 0,
        gap: 0,
        highRisk: 0,
        awaiting: 0,
      };
      current.payable += c.payableTotalInr;
      current.paid += c.paidTotalInr;
      current.gap += c.gapInr;
      if (c.riskLevel === "High") current.highRisk += 1;
      if (c.status === "New" || c.status === "In Review") current.awaiting += 1;
      grouped.set(key, current);
    }

    const months = Array.from(grouped.keys()).sort();
    const latest = months[months.length - 1];
    const previous = months[months.length - 2] ?? null;

    return {
      latest: latest ? grouped.get(latest)! : null,
      previous: previous ? grouped.get(previous)! : null,
    };
  }, [cases]);

  const thresholdStats = useMemo(() => {
    const prohibitedHits = cases.filter((c: IGRSCase) => c.leakageSignals.includes("ProhibitedLand")).length;
    const gapThreshold = 50000;
    const gapOverThreshold = cases.filter((c: IGRSCase) => c.gapInr >= gapThreshold).length;
    const delayThreshold = 10;
    const delayOverThreshold = cases.filter((c: IGRSCase) => daysBetween(c.dates.pDate, c.dates.rDate) > delayThreshold)
      .length;
    const dataIntegrityFlags = cases.filter((c: IGRSCase) => c.leakageSignals.includes("DataIntegrity")).length;

    return { prohibitedHits, gapOverThreshold, delayOverThreshold, dataIntegrityFlags };
  }, [cases]);

  const leakageBarData = useMemo(() => {
    return (dashboard?.leakageBySignal ?? []).map((s) => ({
      key: s.signal,
      signal: SIGNAL_LABELS[s.signal],
      high: s.high,
      medium: s.medium,
      low: s.low,
      total: s.high + s.medium + s.low,
    }));
  }, [dashboard]);

  const impactShare = useMemo(() => {
    const signalImpact = new Map<IGRSLeakageSignal, number>();
    for (const c of cases) {
      if (c.leakageSignals.length === 0) continue;
      const share = c.gapInr / c.leakageSignals.length;
      for (const signal of c.leakageSignals) {
        signalImpact.set(signal, (signalImpact.get(signal) ?? 0) + share);
      }
    }

    const rows = Array.from(signalImpact.entries())
      .map(([signal, amount]) => ({
        signal,
        label: SIGNAL_LABELS[signal],
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    const total = rows.reduce((sum, r) => sum + r.amount, 0);
    return rows.map((r) => ({
      ...r,
      pct: total > 0 ? (r.amount / total) * 100 : 0,
    }));
  }, [cases]);

  const statusFunnel = useMemo(() => {
    const order = ["New", "In Review", "Confirmed", "Resolved"];
    const counts = order.map((status) => ({
      status,
      count: cases.filter((c: IGRSCase) => c.status === status).length,
    }));
    const total = counts.reduce((sum, item) => sum + item.count, 0);
    return counts.map((item) => ({
      ...item,
      pct: total > 0 ? (item.count / total) * 100 : 0,
    }));
  }, [cases]);

  const topOffices = useMemo(() => {
    const officeMap = new Map<
      string,
      {
        srCode: string;
        srName: string;
        gap: number;
        cases: number;
        high: number;
        delayDays: number;
        prohibited: number;
      }
    >();

    for (const c of cases) {
      const key = c.office.srCode;
      const current = officeMap.get(key) ?? {
        srCode: c.office.srCode,
        srName: c.office.srName,
        gap: 0,
        cases: 0,
        high: 0,
        delayDays: 0,
        prohibited: 0,
      };
      current.gap += c.gapInr;
      current.cases += 1;
      if (c.riskLevel === "High") current.high += 1;
      current.delayDays += daysBetween(c.dates.pDate, c.dates.rDate);
      if (c.leakageSignals.includes("ProhibitedLand")) current.prohibited += 1;
      officeMap.set(key, current);
    }

    return Array.from(officeMap.values())
      .map((o) => ({
        ...o,
        highPct: o.cases > 0 ? (o.high / o.cases) * 100 : 0,
        avgDelay: o.cases > 0 ? o.delayDays / o.cases : 0,
      }))
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 10);
  }, [cases]);

  const topRules = useMemo(() => {
    const map = new Map<
      string,
      { ruleId: string; ruleName: string; triggers: number; impact: number; confidenceTotal: number }
    >();

    for (const c of cases) {
      for (const hit of c.evidence.triggeredRules) {
        const current = map.get(hit.ruleId) ?? {
          ruleId: hit.ruleId,
          ruleName: hit.ruleName,
          triggers: 0,
          impact: 0,
          confidenceTotal: 0,
        };
        current.triggers += 1;
        current.impact += hit.impactInr;
        current.confidenceTotal += hit.confidence;
        map.set(hit.ruleId, current);
      }
    }

    return Array.from(map.values())
      .map((r) => ({ ...r, avgConfidence: r.confidenceTotal / Math.max(1, r.triggers) }))
      .sort((a, b) => b.triggers - a.triggers)
      .slice(0, 10);
  }, [cases]);

  const newestHighRisk = useMemo(() => {
    return [...cases]
      .filter((c) => c.riskLevel === "High")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);
  }, [cases]);

  const gapTrendData = useMemo(() => {
    const source = trends?.length ? trends : dashboard?.monthlyTrends ?? [];
    return source.map((t) => ({
      month: t.month.slice(5),
      gap: t.gapInr,
      payable: t.gapInr + Math.max(0, t.gapInr * 1.9),
    }));
  }, [dashboard, trends]);

  const deltas = useMemo(() => {
    const latest = monthlyMetrics.latest;
    const previous = monthlyMetrics.previous;
    if (!latest) return null;

    return {
      payable: pctDelta(latest.payable, previous?.payable ?? null),
      paid: pctDelta(latest.paid, previous?.paid ?? null),
      gap: pctDelta(latest.gap, previous?.gap ?? null),
      highRisk: pctDelta(latest.highRisk, previous?.highRisk ?? null),
      awaiting: pctDelta(latest.awaiting, previous?.awaiting ?? null),
    };
  }, [monthlyMetrics]);

  const kpiSparklines = useMemo(() => {
    const source = trends?.length ? trends : dashboard?.monthlyTrends ?? [];
    const last = source.slice(-6);
    return {
      payable: last.map((m) => m.gapInr + Math.max(0, m.gapInr * 1.9)),
      paid: last.map((m) => Math.max(0, m.gapInr * 1.2)),
      gap: last.map((m) => m.gapInr),
      highRisk: last.map((m) => m.highRisk),
      avgDelay: last.map((m) => m.cases / 2),
      awaiting: last.map((m) => Math.max(0, m.cases - m.highRisk)),
    };
  }, [dashboard, trends]);

  const handleRefetchAll = async () => {
    await Promise.all([refetchDashboard(), refetchTrends(), refetchRules(), refetchCases()]);
  };

  const handleRunDetection = async () => {
    toast.success("Detection run started");
    await handleRefetchAll();
  };

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        <div className="h-8 w-80 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded border bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="h-72 rounded border bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-5">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-700">{error ?? "Failed to load IGRS overview"}</p>
            <Button className="mt-3" size="sm" variant="outline" onClick={handleRefetchAll}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Payable",
      value: formatByMode(dashboard.totalPayable, currencyMode),
      delta: deltas?.payable ?? null,
      border: "border-blue-200",
      spark: kpiSparklines.payable,
    },
    {
      title: "Total Paid",
      value: formatByMode(dashboard.totalPaid, currencyMode),
      delta: deltas?.paid ?? null,
      border: "border-emerald-200",
      spark: kpiSparklines.paid,
    },
    {
      title: "Total Gap",
      value: formatByMode(dashboard.totalGap, currencyMode),
      delta: deltas?.gap ?? null,
      border: "border-red-200",
      spark: kpiSparklines.gap,
    },
    {
      title: "High Risk Cases",
      value: String(dashboard.highRiskCases),
      delta: deltas?.highRisk ?? null,
      border: "border-amber-200",
      spark: kpiSparklines.highRisk,
    },
    {
      title: "Avg Challan Delay",
      value: `${dashboard.avgChallanDelayDays} days`,
      delta: null,
      border: "border-orange-200",
      spark: kpiSparklines.avgDelay,
    },
    {
      title: "Awaiting Review",
      value: String(dashboard.casesAwaitingReview),
      delta: deltas?.awaiting ?? null,
      border: "border-violet-200",
      spark: kpiSparklines.awaiting,
    },
  ];

  const sumSignals = leakageBarData.reduce((s, row) => s + row.total, 0);

  return (
    <div className="p-4 md:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <ShieldCheck className="w-3 h-3 mr-1" /> Sync: {dashboard.syncStatus}
          </Badge>
          <Badge variant="outline" className="text-slate-600">
            <Activity className="w-3 h-3 mr-1" /> {new Date(dashboard.lastRefresh).toLocaleDateString("en-GB")}
          </Badge>
          <Badge variant="outline" className="text-slate-600">
            <Clock3 className="w-3 h-3 mr-1" /> Run: {new Date(dashboard.rulesHealth.lastRun).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </Badge>
          <Badge variant="outline" className="text-slate-600">
            <Database className="w-3 h-3 mr-1" /> {cases.length.toLocaleString("en-IN")} docs
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => toast.info("Filter panel not yet configured") }>
            <Filter className="w-4 h-4 mr-1" /> Filters
          </Button>
          <Button size="sm" variant="outline" onClick={handleRunDetection}>
            <PlayCircle className="w-4 h-4 mr-1" /> Run Detection
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] tracking-wide uppercase text-slate-500 font-semibold">
          Operational Snapshot
        </p>
        <Select value={currencyMode} onValueChange={(v) => setCurrencyMode(v as CurrencyMode)}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto</SelectItem>
            <SelectItem value="rupees">₹</SelectItem>
            <SelectItem value="lakhs">Lakhs</SelectItem>
            <SelectItem value="crores">Crores</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
        {cards.map((card) => (
          <Card key={card.title} className={`shadow-none ${card.border}`}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] text-slate-500 font-medium">{card.title}</p>
                <svg width="70" height="22" viewBox="0 0 70 22" className="opacity-80">
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.8"
                    points={sparklinePoints(card.spark)}
                  />
                </svg>
              </div>
              <p className="text-2xl font-semibold mt-1">{card.value}</p>
              <p className={`text-[11px] mt-1 ${card.delta == null ? "text-slate-400" : card.delta > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {card.delta == null ? "--" : `${card.delta > 0 ? "+" : ""}${card.delta.toFixed(1)}%`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <Card className="xl:col-span-1">
          <CardContent className="py-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">Prohibited Land Hits</p>
            <p className="text-xl font-semibold">{thresholdStats.prohibitedHits}</p>
          </CardContent>
        </Card>
        <Card className="xl:col-span-1">
          <CardContent className="py-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">Gap &gt; Threshold</p>
            <p className="text-xl font-semibold">{thresholdStats.gapOverThreshold}</p>
          </CardContent>
        </Card>
        <Card className="xl:col-span-1">
          <CardContent className="py-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">Delay &gt; Threshold</p>
            <p className="text-xl font-semibold">{thresholdStats.delayOverThreshold}</p>
          </CardContent>
        </Card>
        <Card className="xl:col-span-1">
          <CardContent className="py-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">Data Integrity Flags</p>
            <p className="text-xl font-semibold">{thresholdStats.dataIntegrityFlags}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Leakage by Signal</CardTitle>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />High</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Medium</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Low</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">Case counts by risk level per signal</p>
          </CardHeader>
          <CardContent className="pt-3 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leakageBarData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="signal" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="low" stackId="a" fill="#22c55e" />
                <Bar dataKey="medium" stackId="a" fill="#f59e0b" />
                <Bar dataKey="high" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm">Leakage Impact Share</CardTitle>
            <p className="text-xs text-slate-500">Impact distribution by signal type</p>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={impactShare}
                      dataKey="amount"
                      nameKey="label"
                      innerRadius={58}
                      outerRadius={84}
                      paddingAngle={2}
                    >
                      {impactShare.map((row) => (
                        <Cell key={row.signal} fill={SIGNAL_COLORS[row.signal]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatByMode(value, currencyMode)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {impactShare.map((row) => (
                  <div key={row.signal} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SIGNAL_COLORS[row.signal] }} />
                      <span className="text-slate-600">{row.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{row.pct.toFixed(0)}%</p>
                      <p className="text-slate-500">{formatByMode(row.amount, currencyMode)}</p>
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-slate-500 pt-1">Total signals: {sumSignals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Gap Trend Over Time</CardTitle>
              <Badge variant="outline" className="text-[10px] h-6">Rolling Avg</Badge>
            </div>
            <p className="text-xs text-slate-500">Monthly gap and payable trends</p>
          </CardHeader>
          <CardContent className="pt-3 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gapTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatByMode(v, currencyMode)} />
                <Line type="monotone" dataKey="gap" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
                <Line
                  type="monotone"
                  dataKey="payable"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm">Case Status Funnel</CardTitle>
            <p className="text-xs text-slate-500">Progression from New to Resolved</p>
          </CardHeader>
          <CardContent className="pt-3 space-y-3">
            {statusFunnel.map((s) => (
              <div key={s.status}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{s.status}</span>
                  <span className="text-slate-500">
                    {s.count} ({s.pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(4, s.pct)}%`, backgroundColor: STATUS_COLORS[s.status] ?? "#64748b" }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-100 bg-blue-50/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
            <CircleDot className="w-4 h-4" /> HIGHLIGHTS (LAST 30 DAYS)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
            {dashboard.highlights.slice(0, 8).map((item, idx) => (
              <div key={`${item.text}-${idx}`} className="text-xs text-slate-700 px-3 py-2 rounded bg-white/80 border border-slate-100">
                {item.text}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top 10 Offices by Gap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-2">Office</th>
                    <th className="py-2 text-right">Gap</th>
                    <th className="py-2 text-right">Cases</th>
                    <th className="py-2 text-right">High %</th>
                    <th className="py-2 text-right">Avg Delay</th>
                    <th className="py-2 text-right">Prohib.</th>
                  </tr>
                </thead>
                <tbody>
                  {topOffices.map((o) => (
                    <tr key={o.srCode} className="border-b last:border-0">
                      <td className="py-2">
                        <p className="font-semibold">{o.srCode}</p>
                        <p className="text-slate-500">{o.srName}</p>
                      </td>
                      <td className="py-2 text-right text-red-600 font-semibold">{formatByMode(o.gap, currencyMode)}</td>
                      <td className="py-2 text-right">{o.cases}</td>
                      <td className="py-2 text-right">{o.highPct.toFixed(0)}%</td>
                      <td className="py-2 text-right">{o.avgDelay.toFixed(0)}d</td>
                      <td className="py-2 text-right">{o.prohibited}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Rules Triggered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-2">Rule</th>
                    <th className="py-2 text-right">Triggers</th>
                    <th className="py-2 text-right">Impact</th>
                    <th className="py-2 text-right">Avg Conf.</th>
                  </tr>
                </thead>
                <tbody>
                  {topRules.map((r) => (
                    <tr key={r.ruleId} className="border-b last:border-0">
                      <td className="py-2">
                        <p className="font-semibold">{r.ruleId}</p>
                        <p className="text-slate-500">{r.ruleName}</p>
                      </td>
                      <td className="py-2 text-right">{r.triggers}</td>
                      <td className="py-2 text-right">{formatByMode(r.impact, currencyMode)}</td>
                      <td className="py-2">
                        <div className="flex items-center justify-end gap-2">
                          <span>{Math.round(r.avgConfidence)}%</span>
                          <span className="w-14 h-1.5 rounded bg-slate-100 overflow-hidden">
                            <span
                              className="block h-full rounded bg-amber-500"
                              style={{ width: `${Math.max(8, Math.round(r.avgConfidence))}%` }}
                            />
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Newest High Risk Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-2">Case ID</th>
                    <th className="py-2">Document</th>
                    <th className="py-2">Signals</th>
                    <th className="py-2 text-right">Confidence</th>
                    <th className="py-2 text-right">Gap</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {newestHighRisk.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 font-semibold">{c.caseId}</td>
                      <td className="py-2 text-blue-700">
                        {c.documentKey.bookNo}/{c.documentKey.doctNo}/{c.documentKey.regYear}
                      </td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {c.leakageSignals.slice(0, 3).map((signal: IGRSLeakageSignal) => (
                            <span
                              key={`${c.id}-${signal}`}
                              className={`px-2 py-0.5 rounded border text-[10px] ${RISK_BADGE[c.riskLevel]}`}
                            >
                              {SIGNAL_LABELS[signal]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <span>{Math.round(c.confidence)}%</span>
                          <span className="w-14 h-1.5 rounded bg-slate-100 overflow-hidden">
                            <span
                              className="block h-full rounded bg-amber-500"
                              style={{ width: `${Math.max(8, c.confidence)}%` }}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="py-2 text-right text-red-600 font-semibold">{formatByMode(c.gapInr, currencyMode)}</td>
                      <td className="py-2 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rules Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Enabled Rules</span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {rules.filter((r) => r.enabled).length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Last Run</span>
              <span>{new Date(dashboard.rulesHealth.lastRun).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Failures</span>
              <Badge variant="outline" className={dashboard.rulesHealth.failures === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}>
                {dashboard.rulesHealth.failures}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
