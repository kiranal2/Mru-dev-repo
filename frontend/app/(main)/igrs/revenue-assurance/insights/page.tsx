"use client";

import { useState, useMemo } from "react";
import {
  useIGRSDashboard,
  useIGRSSignals,
  useIGRSOffices,
  useIGRSPatterns,
  useIGRSStampIntelligence,
} from "@/hooks/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  TrendingUp,
  Info,
  Building2,
  ShieldAlert,
  Clock,
  FileWarning,
  Activity,
  RefreshCw,
  Users as UsersIcon,
  Stamp,
} from "lucide-react";
import type { StampVendorAnalysis } from "@/lib/data/types";

// ─── Inline SVG chart components ─────────────────────────────────────────────

/** Stacked horizontal bars showing signal breakdown by severity */
function SignalBreakdownChart({
  data,
}: {
  data: Array<{ signal: string; high: number; medium: number; low: number }>;
}) {
  const maxTotal = Math.max(...data.map((d) => d.high + d.medium + d.low), 1);
  return (
    <div className="space-y-2">
      {data.map((row) => {
        const total = row.high + row.medium + row.low;
        const hW = (row.high / maxTotal) * 100;
        const mW = (row.medium / maxTotal) * 100;
        const lW = (row.low / maxTotal) * 100;
        return (
          <div key={row.signal} className="flex items-center gap-2 text-xs">
            <span className="w-28 truncate text-right text-slate-600">
              {row.signal}
            </span>
            <div className="flex-1 flex h-5 rounded overflow-hidden bg-slate-100">
              {row.high > 0 && (
                <div
                  className="bg-red-500 transition-all"
                  style={{ width: `${hW}%` }}
                  title={`High: ${row.high}`}
                />
              )}
              {row.medium > 0 && (
                <div
                  className="bg-amber-400 transition-all"
                  style={{ width: `${mW}%` }}
                  title={`Medium: ${row.medium}`}
                />
              )}
              {row.low > 0 && (
                <div
                  className="bg-blue-300 transition-all"
                  style={{ width: `${lW}%` }}
                  title={`Low: ${row.low}`}
                />
              )}
            </div>
            <span className="w-8 text-slate-500 text-right">{total}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-red-500" /> High
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-amber-400" /> Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-blue-300" /> Low
        </span>
      </div>
    </div>
  );
}

/** SVG sparkline-style area chart for monthly trends */
function MonthlyGapTrend({
  data,
}: {
  data: Array<{ month: string; cases: number; gapInr: number; highRisk: number }>;
}) {
  if (!data.length) return null;
  const w = 400;
  const h = 120;
  const pad = { top: 10, right: 10, bottom: 24, left: 10 };
  const iw = w - pad.left - pad.right;
  const ih = h - pad.top - pad.bottom;
  const maxGap = Math.max(...data.map((d) => d.gapInr), 1);
  const points = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * iw,
    y: pad.top + ih - (d.gapInr / maxGap) * ih,
  }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1].x},${pad.top + ih} L${points[0].x},${pad.top + ih} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="gapGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#gapGrad)" />
      <path d={line} fill="none" stroke="#3b82f6" strokeWidth={2} />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#3b82f6" />
      ))}
      {data.map((d, i) => (
        <text
          key={i}
          x={points[i].x}
          y={pad.top + ih + 14}
          textAnchor="middle"
          className="text-[8px] fill-slate-400"
        >
          {d.month.slice(5)}
        </text>
      ))}
    </svg>
  );
}

/** Case status funnel – simple horizontal stacked bar */
function CaseFunnel({
  signals,
}: {
  signals: Array<{ status: string }>;
}) {
  const counts: Record<string, number> = {};
  signals.forEach((s) => {
    counts[s.status] = (counts[s.status] || 0) + 1;
  });
  const stages = ["Active", "Resolved", "Dismissed"];
  const colors: Record<string, string> = {
    Active: "bg-blue-500",
    Resolved: "bg-emerald-500",
    Dismissed: "bg-slate-400",
  };
  const total = signals.length || 1;

  return (
    <div className="space-y-2">
      <div className="flex h-7 rounded overflow-hidden bg-slate-100">
        {stages.map((s) =>
          counts[s] ? (
            <div
              key={s}
              className={`${colors[s]} flex items-center justify-center text-white text-[10px] font-medium transition-all`}
              style={{ width: `${((counts[s] || 0) / total) * 100}%` }}
            >
              {counts[s]}
            </div>
          ) : null
        )}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-500">
        {stages.map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-sm ${colors[s]}`} />
            {s} ({counts[s] || 0})
          </span>
        ))}
      </div>
    </div>
  );
}

/** Office risk grid — compact grid of offices by risk level */
function OfficeRiskGrid({
  offices,
}: {
  offices: Array<{
    srCode: string;
    srName: string;
    riskScore: number;
    riskLevel: string;
    totalGapInr: number;
    totalCases: number;
  }>;
}) {
  const sorted = [...offices].sort((a, b) => b.riskScore - a.riskScore);
  const riskColor = (level: string) => {
    switch (level) {
      case "High":
        return "bg-red-50 border-red-200 text-red-700";
      case "Medium":
        return "bg-amber-50 border-amber-200 text-amber-700";
      default:
        return "bg-green-50 border-green-200 text-green-700";
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
      {sorted.map((o) => (
        <div
          key={o.srCode}
          className={`rounded-lg border p-2.5 text-xs ${riskColor(o.riskLevel)}`}
        >
          <div className="font-semibold truncate">{o.srName}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-bold text-sm">{o.riskScore}</span>
            <span className="text-[10px] opacity-70">{o.totalCases} cases</span>
          </div>
          <div className="text-[10px] opacity-70 mt-0.5">
            Gap: {formatInr(o.totalGapInr)}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Exemption category breakdown */
function ExemptionCategoryBars({
  summary,
}: {
  summary: {
    totalExemptions: number;
    totalAmount: number;
    failedEligibility: number;
    repeatOffenders: number;
  };
}) {
  const items = [
    { label: "Total Claims", value: summary.totalExemptions, color: "bg-blue-500" },
    { label: "Failed Eligibility", value: summary.failedEligibility, color: "bg-red-500" },
    { label: "Repeat Offenders", value: summary.repeatOffenders, color: "bg-amber-500" },
  ];
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600">{item.label}</span>
            <span className="font-medium">{item.value}</span>
          </div>
          <div className="h-3 bg-slate-100 rounded overflow-hidden">
            <div
              className={`${item.color} h-full rounded transition-all`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <div className="mt-2 text-xs text-slate-500">
        Total exempted amount: <span className="font-semibold">{formatInr(summary.totalAmount)}</span>
      </div>
    </div>
  );
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function formatInr(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function highlightIcon(icon: string) {
  switch (icon) {
    case "alert":
      return <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />;
    case "trending-up":
      return <TrendingUp className="w-4 h-4 text-blue-500 flex-shrink-0" />;
    default:
      return <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />;
  }
}

// ─── Main Page ───────────────────────────────────────────────────────────────

type TabKey = "overview" | "office-risk" | "patterns" | "exemptions" | "stamp-intelligence";

export default function InsightsPage() {
  const dashboard = useIGRSDashboard();
  const signals = useIGRSSignals();
  const offices = useIGRSOffices();
  const patterns = useIGRSPatterns();
  const stampIntel = useIGRSStampIntelligence();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const loading = dashboard.loading || signals.loading || offices.loading || patterns.loading;
  const error = dashboard.error || signals.error || offices.error || patterns.error;

  // Computed metrics
  const signalsBySeverity = useMemo(() => {
    const high = signals.data.filter((s) => s.severity === "High").length;
    const medium = signals.data.filter((s) => s.severity === "Medium").length;
    const low = signals.data.filter((s) => s.severity === "Low").length;
    return { high, medium, low };
  }, [signals.data]);

  const highRiskOffices = useMemo(
    () => offices.data.filter((o) => o.riskLevel === "High").length,
    [offices.data]
  );

  const handleRefresh = () => {
    dashboard.refetch();
    signals.refetch();
    offices.refetch();
    patterns.refetch();
  };

  if (loading && !dashboard.data)
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );

  if (error && !dashboard.data)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button onClick={handleRefresh} className="mt-2 text-sm text-red-600 underline">
            Retry
          </button>
        </div>
      </div>
    );

  const kpi = dashboard.data!;
  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "office-risk", label: "Office Risk" },
    { key: "patterns", label: "Patterns" },
    { key: "exemptions", label: "Exemptions" },
    { key: "stamp-intelligence", label: "Stamp Intelligence" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">AI Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automated analytics across {signals.data.length} signals, {offices.data.length} offices, and {patterns.data.length} patterns
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          icon={<Activity className="w-4 h-4 text-blue-600" />}
          label="Total Signals"
          value={signals.data.length.toString()}
          sub={`${signalsBySeverity.high} high severity`}
          accent="blue"
        />
        <KPICard
          icon={<Building2 className="w-4 h-4 text-red-600" />}
          label="High Risk Offices"
          value={highRiskOffices.toString()}
          sub={`of ${offices.data.length} total`}
          accent="red"
        />
        <KPICard
          icon={<Clock className="w-4 h-4 text-amber-600" />}
          label="SLA Breached"
          value={kpi.slaSummary.breached.toString()}
          sub={`${kpi.slaSummary.withinSla} within SLA`}
          accent="amber"
        />
        <KPICard
          icon={<FileWarning className="w-4 h-4 text-purple-600" />}
          label="Exemption Flags"
          value={kpi.exemptionSummary.failedEligibility.toString()}
          sub={`of ${kpi.exemptionSummary.totalExemptions} claims`}
          accent="purple"
        />
        <KPICard
          icon={<ShieldAlert className="w-4 h-4 text-emerald-600" />}
          label="Rules Active"
          value={kpi.rulesHealth.enabled.toString()}
          sub={`${kpi.rulesHealth.failures} failures`}
          accent="emerald"
        />
        <KPICard
          icon={<TrendingUp className="w-4 h-4 text-indigo-600" />}
          label="Total Gap"
          value={formatInr(kpi.totalGap)}
          sub={`${kpi.highRiskCases} high-risk cases`}
          accent="indigo"
        />
      </div>

      {/* Highlights Strip */}
      {kpi.highlights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Key Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {kpi.highlights.map((h, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded-md bg-slate-50 text-xs text-slate-700"
                >
                  {highlightIcon(h.icon)}
                  <span>{h.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Signal Breakdown by Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <SignalBreakdownChart data={kpi.leakageBySignal} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Signal Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <CaseFunnel signals={signals.data} />
              <div className="mt-4 text-xs text-slate-500">
                Total signals: {signals.data.length} across {new Set(signals.data.map((s) => s.caseId)).size} cases
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Monthly Revenue Gap Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyGapTrend data={kpi.monthlyTrends} />
              <div className="grid grid-cols-3 gap-4 mt-3 text-xs text-center">
                {kpi.monthlyTrends.length > 0 && (
                  <>
                    <div>
                      <div className="text-slate-500">Latest Month</div>
                      <div className="font-semibold">
                        {formatInr(kpi.monthlyTrends[kpi.monthlyTrends.length - 1].gapInr)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Peak Month</div>
                      <div className="font-semibold">
                        {formatInr(Math.max(...kpi.monthlyTrends.map((t) => t.gapInr)))}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Total Cases (12m)</div>
                      <div className="font-semibold">
                        {kpi.monthlyTrends.reduce((sum, t) => sum + t.cases, 0)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Offices by Gap */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top Offices by Revenue Gap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {kpi.topOfficesByGap.map((o, i) => {
                  const maxGap = Math.max(...kpi.topOfficesByGap.map((x) => x.gapInr), 1);
                  return (
                    <div key={o.srCode} className="flex items-center gap-3 text-xs">
                      <span className="w-5 text-slate-400 text-right">{i + 1}</span>
                      <span className="w-40 truncate font-medium">{o.srName}</span>
                      <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded transition-all"
                          style={{ width: `${(o.gapInr / maxGap) * 100}%` }}
                        />
                      </div>
                      <span className="w-16 text-right font-medium">{formatInr(o.gapInr)}</span>
                      <span className="w-16 text-right text-slate-500">{o.cases} cases</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "office-risk" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Office Risk Scores</CardTitle>
              <p className="text-xs text-muted-foreground">
                Composite risk score based on revenue gap, challan delay, prohibited land matches, MV deviation, and exemption anomalies
              </p>
            </CardHeader>
            <CardContent>
              <OfficeRiskGrid offices={offices.data} />
            </CardContent>
          </Card>

          {/* Risk Component Breakdown Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Risk Component Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="text-left py-2 px-2">Office</th>
                      <th className="text-left py-2 px-2">District</th>
                      <th className="text-center py-2 px-2">Score</th>
                      <th className="text-center py-2 px-2">Revenue Gap</th>
                      <th className="text-center py-2 px-2">Challan Delay</th>
                      <th className="text-center py-2 px-2">Prohibited</th>
                      <th className="text-center py-2 px-2">MV Dev.</th>
                      <th className="text-center py-2 px-2">Exemption</th>
                      <th className="text-center py-2 px-2">Cash Risk</th>
                      <th className="text-center py-2 px-2">Stamp Gap</th>
                      <th className="text-right py-2 px-2">Gap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...offices.data]
                      .sort((a, b) => b.riskScore - a.riskScore)
                      .map((o) => (
                        <tr key={o.srCode} className="border-b hover:bg-slate-50">
                          <td className="py-2 px-2 font-medium">{o.srName}</td>
                          <td className="py-2 px-2 text-slate-500">{o.district}</td>
                          <td className="py-2 px-2 text-center">
                            <Badge
                              variant={
                                o.riskLevel === "High"
                                  ? "destructive"
                                  : o.riskLevel === "Medium"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {o.riskScore}
                            </Badge>
                          </td>
                          <td className="py-2 px-2 text-center">{o.componentScores.revenueGap}</td>
                          <td className="py-2 px-2 text-center">{o.componentScores.challanDelay}</td>
                          <td className="py-2 px-2 text-center">{o.componentScores.prohibitedMatch}</td>
                          <td className="py-2 px-2 text-center">{o.componentScores.mvDeviation}</td>
                          <td className="py-2 px-2 text-center">{o.componentScores.exemptionAnomaly}</td>
                          <td className="py-2 px-2 text-center">{o.cashRiskScore ?? "—"}</td>
                          <td className="py-2 px-2 text-center">{o.stampInventoryGap ? formatInr(o.stampInventoryGap) : "—"}</td>
                          <td className="py-2 px-2 text-right font-medium">
                            {formatInr(o.totalGapInr)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "patterns" && (
        <div className="space-y-4">
          {/* Pattern Type Summary */}
          <div className="flex flex-wrap gap-2">
            {(() => {
              const grouped: Record<string, number> = {};
              patterns.data.forEach((p) => {
                grouped[p.type] = (grouped[p.type] || 0) + 1;
              });
              const colorMap: Record<string, string> = {
                spike: "bg-red-100 text-red-700",
                trend: "bg-blue-100 text-blue-700",
                anomaly: "bg-purple-100 text-purple-700",
                cluster: "bg-amber-100 text-amber-700",
                decline: "bg-emerald-100 text-emerald-700",
                seasonal: "bg-green-100 text-green-700",
                outlier: "bg-orange-100 text-orange-700",
              };
              return Object.entries(grouped).map(([type, count]) => (
                <span
                  key={type}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${colorMap[type] || "bg-slate-100 text-slate-700"}`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}: {count}
                </span>
              ));
            })()}
          </div>

          {/* Pattern Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patterns.data.map((pattern) => {
              const borderColors: Record<string, string> = {
                spike: "border-l-red-500",
                trend: "border-l-blue-500",
                anomaly: "border-l-purple-500",
                cluster: "border-l-amber-500",
                decline: "border-l-emerald-500",
                seasonal: "border-l-green-500",
                outlier: "border-l-orange-500",
              };
              return (
                <Card
                  key={pattern.id}
                  className={`border-l-4 ${borderColors[pattern.type] || "border-l-slate-400"}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{pattern.metric}</CardTitle>
                      <span className="text-lg font-bold text-slate-800">{pattern.magnitude}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">
                        {pattern.type}
                      </Badge>
                      <span>{pattern.period}</span>
                      {pattern.office && <span>· Office: {pattern.office}</span>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-600">{pattern.explanation}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "exemptions" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Exemption Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ExemptionCategoryBars summary={kpi.exemptionSummary} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">SLA Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Within SLA</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {kpi.slaSummary.withinSla}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Breached</span>
                  <span className="text-lg font-bold text-red-600">{kpi.slaSummary.breached}</span>
                </div>
                <div className="h-px bg-slate-200 my-2" />
                <div className="text-xs text-slate-500 font-medium mb-2">Ageing Buckets</div>
                {Object.entries(kpi.slaSummary.ageingBuckets).map(([bucket, count]) => {
                  const maxBucket = Math.max(
                    ...Object.values(kpi.slaSummary.ageingBuckets),
                    1
                  );
                  return (
                    <div key={bucket} className="flex items-center gap-2 text-xs">
                      <span className="w-12 text-right text-slate-500">{bucket}</span>
                      <div className="flex-1 h-3 bg-slate-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded transition-all"
                          style={{ width: `${(count / maxBucket) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 text-right font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Exemption-related signals */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Exemption-Related Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="text-left py-2 px-2">Signal ID</th>
                      <th className="text-left py-2 px-2">Case</th>
                      <th className="text-left py-2 px-2">Severity</th>
                      <th className="text-left py-2 px-2">Explanation</th>
                      <th className="text-right py-2 px-2">Impact</th>
                      <th className="text-center py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.data
                      .filter((s) => s.signalType === "ExemptionRisk")
                      .map((s) => (
                        <tr key={s.id} className="border-b hover:bg-slate-50">
                          <td className="py-2 px-2 font-mono">{s.id}</td>
                          <td className="py-2 px-2">{s.caseId}</td>
                          <td className="py-2 px-2">
                            <Badge
                              variant={
                                s.severity === "High"
                                  ? "destructive"
                                  : s.severity === "Medium"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {s.severity}
                            </Badge>
                          </td>
                          <td className="py-2 px-2 max-w-xs truncate">{s.explanation}</td>
                          <td className="py-2 px-2 text-right font-medium">
                            {s.impactInr > 0 ? formatInr(s.impactInr) : "—"}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <Badge variant="outline">{s.status}</Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "stamp-intelligence" && (
        <StampIntelligenceTab data={stampIntel.data} loading={stampIntel.loading} />
      )}
    </div>
  );
}

// ─── Stamp Intelligence Tab ──────────────────────────────────────────────────

function StampIntelligenceTab({ data, loading }: { data: StampVendorAnalysis | null; loading: boolean }) {
  if (loading || !data) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  const s = data.summary;
  const maxRisk = Math.max(...data.vendorRiskRanking.map((v) => v.vendorRiskScore), 1);
  const maxNJ = Math.max(...data.njStampAnomalies.map((a) => a.njStampCount), 1);

  // Usage trends: group by jurisdiction for multi-line chart
  const jurisdictions = Array.from(new Set(data.usageTrends.map((t) => t.jurisdiction)));
  const months = Array.from(new Set(data.usageTrends.map((t) => t.month))).sort();
  const TREND_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard icon={<UsersIcon className="w-4 h-4 text-blue-600" />} label="Total Vendors" value={String(s.totalVendors)} sub={`${s.atRiskVendors} at risk`} accent="blue" />
        <KPICard icon={<AlertTriangle className="w-4 h-4 text-red-600" />} label="At-Risk Vendors" value={String(s.atRiskVendors)} sub={`${s.atRiskVendorPercent}% of total`} accent="red" />
        <KPICard icon={<FileWarning className="w-4 h-4 text-amber-600" />} label="NJ Stamp Anomalies" value={String(s.njStampAnomalies)} sub={`${formatInr(s.njStampImpact)} est. impact`} accent="amber" />
        <KPICard icon={<Stamp className="w-4 h-4 text-purple-600" />} label="Franking Alerts" value={String(s.frankingAlerts)} sub="Above ₹1,000 threshold" accent="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vendor Risk Ranking Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Vendor Risk Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="text-left py-2 px-1">#</th>
                    <th className="text-left py-2 px-1">Vendor</th>
                    <th className="text-left py-2 px-1">Jurisdiction</th>
                    <th className="text-left py-2 px-1">Type</th>
                    <th className="text-right py-2 px-1">Usage</th>
                    <th className="text-right py-2 px-1">Expected</th>
                    <th className="text-right py-2 px-1">Dev %</th>
                    <th className="text-right py-2 px-1">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vendorRiskRanking.slice(0, 10).map((v, i) => (
                    <tr key={v.vendorId} className="border-b hover:bg-slate-50">
                      <td className="py-1.5 px-1 text-slate-400">{i + 1}</td>
                      <td className="py-1.5 px-1 font-medium">{v.vendorName}</td>
                      <td className="py-1.5 px-1 text-slate-500">{v.jurisdiction}</td>
                      <td className="py-1.5 px-1">
                        <Badge variant="outline" className="text-[10px]">{v.stampType}</Badge>
                      </td>
                      <td className="py-1.5 px-1 text-right">{v.usageCurrent}</td>
                      <td className="py-1.5 px-1 text-right text-slate-500">{v.usageExpected}</td>
                      <td className={`py-1.5 px-1 text-right font-medium ${v.deviationPercent > 50 ? "text-red-600" : v.deviationPercent > 25 ? "text-amber-600" : "text-slate-600"}`}>
                        +{v.deviationPercent}%
                      </td>
                      <td className="py-1.5 px-1 text-right">
                        <div className="inline-flex items-center gap-1">
                          <span className="w-12 h-1.5 rounded bg-slate-100 overflow-hidden">
                            <span className="block h-full rounded bg-red-500" style={{ width: `${(v.vendorRiskScore / maxRisk) * 100}%` }} />
                          </span>
                          <span className="text-[10px]">{v.vendorRiskScore}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Stamp Leakage Index Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Stamp Leakage Index</CardTitle>
            <p className="text-xs text-muted-foreground">Leakage distribution by stamp type</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <svg viewBox="0 0 120 120" className="w-40 h-40 flex-shrink-0">
                {(() => {
                  let offset = 0;
                  return data.stampLeakageByType.map((item) => {
                    const circumference = 2 * Math.PI * 45;
                    const strokeDash = (item.percent / 100) * circumference;
                    const el = (
                      <circle
                        key={item.type}
                        cx="60" cy="60" r="45"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="14"
                        strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                        strokeDashoffset={-offset}
                        transform="rotate(-90 60 60)"
                      />
                    );
                    offset += strokeDash;
                    return el;
                  });
                })()}
                <text x="60" y="56" textAnchor="middle" className="text-[10px] fill-slate-500">Total</text>
                <text x="60" y="72" textAnchor="middle" className="text-sm font-bold fill-slate-800">{formatInr(s.totalStampLeakage)}</text>
              </svg>
              <div className="space-y-2 flex-1">
                {data.stampLeakageByType.map((item) => (
                  <div key={item.type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{item.percent}%</p>
                      <p className="text-slate-500">{formatInr(item.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* NJ Stamp Anomaly Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">NJ Stamp Anomalies (&gt;₹100)</CardTitle>
            <p className="text-xs text-muted-foreground">Vendors with NJ stamp denominations above threshold</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.njStampAnomalies.map((a) => (
                <div key={a.vendorId} className="flex items-center gap-2 text-xs">
                  <span className="w-28 truncate text-right text-slate-600">{a.vendorName}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded transition-all"
                      style={{ width: `${(a.njStampCount / maxNJ) * 100}%` }}
                      title={`${a.njStampCount} NJ stamps`}
                    />
                  </div>
                  <span className="w-8 text-right font-medium">{a.njStampCount}</span>
                  <span className="w-16 text-right text-slate-500">{formatInr(a.estimatedImpact)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Franking Monitoring Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Franking Monitoring</CardTitle>
            <p className="text-xs text-muted-foreground">Franking transactions above ₹1,000 threshold</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="text-left py-2 px-1">Document</th>
                    <th className="text-right py-2 px-1">Amount</th>
                    <th className="text-right py-2 px-1">Expected</th>
                    <th className="text-right py-2 px-1">Variance</th>
                    <th className="text-center py-2 px-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.frankingAlerts.map((f) => (
                    <tr key={f.documentId} className="border-b hover:bg-slate-50">
                      <td className="py-1.5 px-1 font-mono text-[10px]">{f.documentId}</td>
                      <td className="py-1.5 px-1 text-right">{formatInr(f.frankingAmount)}</td>
                      <td className="py-1.5 px-1 text-right text-slate-500">{formatInr(f.expectedAmount)}</td>
                      <td className="py-1.5 px-1 text-right text-red-600 font-medium">{formatInr(f.variance)}</td>
                      <td className="py-1.5 px-1 text-center">
                        <Badge variant={f.reviewStatus === "Escalated" ? "destructive" : f.reviewStatus === "Pending" ? "secondary" : "outline"} className="text-[10px]">
                          {f.reviewStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trend Multi-line Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Monthly Stamp Usage Trend</CardTitle>
          <p className="text-xs text-muted-foreground">Top jurisdictions — last 12 months</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {jurisdictions.slice(0, 5).map((j, i) => (
              <span key={j} className="flex items-center gap-1 text-[10px] text-slate-600">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TREND_COLORS[i % TREND_COLORS.length] }} />
                {j}
              </span>
            ))}
          </div>
          <svg viewBox="0 0 500 160" className="w-full" preserveAspectRatio="xMidYMid meet">
            {(() => {
              const allCounts = data.usageTrends.map((t) => t.stampCount);
              const maxCount = Math.max(...allCounts, 1);
              const pad = { top: 10, right: 10, bottom: 24, left: 10 };
              const iw = 500 - pad.left - pad.right;
              const ih = 160 - pad.top - pad.bottom;

              return jurisdictions.slice(0, 5).map((jurisdiction, ji) => {
                const jData = months.map((m) => data.usageTrends.find((t) => t.month === m && t.jurisdiction === jurisdiction));
                const points = jData.map((d, i) => {
                  const x = pad.left + (i / Math.max(months.length - 1, 1)) * iw;
                  const y = pad.top + ih - ((d?.stampCount ?? 0) / maxCount) * ih;
                  return `${x},${y}`;
                });
                const anomalyPoints = jData.map((d, i) => ({
                  x: pad.left + (i / Math.max(months.length - 1, 1)) * iw,
                  y: pad.top + ih - ((d?.stampCount ?? 0) / maxCount) * ih,
                  anomaly: d?.anomaly ?? false,
                }));
                return (
                  <g key={jurisdiction}>
                    <polyline
                      fill="none"
                      stroke={TREND_COLORS[ji % TREND_COLORS.length]}
                      strokeWidth="1.5"
                      points={points.join(" ")}
                    />
                    {anomalyPoints.filter((p) => p.anomaly).map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ef4444" />
                    ))}
                  </g>
                );
              });
            })()}
            {months.map((m, i) => (
              <text
                key={m}
                x={10 + (i / Math.max(months.length - 1, 1)) * 480}
                y={150}
                textAnchor="middle"
                className="text-[7px] fill-slate-400"
              >
                {m.slice(5)}
              </text>
            ))}
          </svg>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── KPI Card Component ──────────────────────────────────────────────────────

function KPICard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  const bgMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-100",
    red: "bg-red-50 border-red-100",
    amber: "bg-amber-50 border-amber-100",
    purple: "bg-purple-50 border-purple-100",
    emerald: "bg-emerald-50 border-emerald-100",
    indigo: "bg-indigo-50 border-indigo-100",
  };

  return (
    <div className={`rounded-lg border p-3 ${bgMap[accent] || "bg-slate-50 border-slate-100"}`}>
      <div className="flex items-center gap-1.5 mb-1.5">{icon}<span className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</span></div>
      <div className="text-xl font-bold text-slate-800">{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}
