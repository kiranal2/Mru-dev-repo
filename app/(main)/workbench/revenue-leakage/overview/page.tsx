"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { revenueLeakageApi } from "@/lib/revenue-leakage/revenueLeakageApi";
import { OverviewEnhanced, LeakageSignal } from "@/lib/revenue-leakage/types";
import { formatINR, type INRDisplayMode } from "@/lib/revenue-leakage/formatINR";
import { RevenueLeakageShell } from "@/components/revenue-leakage/RevenueLeakageShell";
import {
  LeakageBySignalChart,
  ImpactShareDonut,
  GapTrendLineChart,
  StatusFunnelChart,
  MicroSparkline,
} from "@/components/revenue-leakage/OverviewCharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  RefreshCw,
  Plus,
  Activity,
  ShieldCheck,
  Filter,
  Clock,
  FileSearch,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  MapPin,
  Shield,
  ExternalLink,
} from "lucide-react";

const DISPLAY_MODES: { label: string; value: INRDisplayMode }[] = [
  { label: "Auto", value: "auto" },
  { label: "₹", value: "rupees" },
  { label: "Lakhs", value: "lakhs" },
  { label: "Crores", value: "crores" },
];

const SIGNAL_LABELS: Record<LeakageSignal, string> = {
  RevenueGap: "Revenue Gap",
  ChallanDelay: "Challan Delay",
  ExemptionRisk: "Exemption Risk",
  MarketValueRisk: "Market Value",
  ProhibitedLand: "Prohibited Land",
  DataIntegrity: "Data Integrity",
  HolidayFee: "Holiday Fee",
};

const RISK_BADGE: Record<string, string> = {
  High: "bg-red-600 text-white",
  Medium: "bg-amber-500 text-white",
  Low: "bg-emerald-600 text-white",
};

const SIGNAL_COLORS: Record<LeakageSignal, string> = {
  RevenueGap: "bg-red-100 text-red-800 border-red-300",
  ChallanDelay: "bg-orange-100 text-orange-800 border-orange-300",
  ExemptionRisk: "bg-purple-100 text-purple-800 border-purple-300",
  MarketValueRisk: "bg-sky-100 text-sky-800 border-sky-300",
  ProhibitedLand: "bg-pink-100 text-pink-800 border-pink-300",
  DataIntegrity: "bg-slate-200 text-slate-800 border-slate-400",
  HolidayFee: "bg-amber-100 text-amber-800 border-amber-300",
};

const confidenceColor = (pct: number) => {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 60) return "bg-amber-500";
  return "bg-red-500";
};

const HIGHLIGHT_ICONS: Record<string, React.ElementType> = {
  "trending-down": TrendingDown,
  "trending-up": TrendingUp,
  alert: AlertTriangle,
  clock: Clock,
  shield: Shield,
  "bar-chart": BarChart3,
  "map-pin": MapPin,
};

function DeltaBadge({ pct }: { pct: number }) {
  const isUp = pct > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${isUp ? "text-rose-600" : "text-emerald-600"}`}
    >
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isUp ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

export default function RevenueLeakageOverviewPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<OverviewEnhanced | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showManualDrawer, setShowManualDrawer] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showRollingAvg, setShowRollingAvg] = useState(false);
  const [displayMode, setDisplayMode] = useState<INRDisplayMode>("auto");
  const [docKey, setDocKey] = useState({ SR_CODE: "", BOOK_NO: "", DOCT_NO: "", REG_YEAR: "" });

  // Filter state (overview-local)
  const [filterDateRange, setFilterDateRange] = useState("30");
  const [filterRisk, setFilterRisk] = useState<string[]>([]);
  const [filterSignals, setFilterSignals] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  const fmt = (v: number) => formatINR(v, displayMode);

  const loadOverview = async () => {
    setIsLoading(true);
    const data = await revenueLeakageApi.getOverviewEnhanced();
    setOverview(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleRunDetection = async () => {
    await revenueLeakageApi.runDetection();
    toast.success("Detection run started");
    await loadOverview();
  };

  const handleCreateManualCase = async () => {
    if (!docKey.SR_CODE || !docKey.BOOK_NO || !docKey.DOCT_NO || !docKey.REG_YEAR) {
      toast.error("Please fill all Document Key fields");
      return;
    }
    await revenueLeakageApi.createManualCase(docKey);
    toast.success("Manual case created");
    setShowManualDrawer(false);
    setDocKey({ SR_CODE: "", BOOK_NO: "", DOCT_NO: "", REG_YEAR: "" });
    await loadOverview();
  };

  const navigateCasesWithFilter = (filter: string) => {
    router.push(`/workbench/revenue-leakage/cases?filter=${encodeURIComponent(filter)}`);
  };

  // ─── Header chips ──────────────────────────────────
  const syncColor =
    overview?.sync_status === "Healthy"
      ? "bg-emerald-100 text-emerald-700 border-emerald-300"
      : overview?.sync_status === "Degraded"
        ? "bg-amber-100 text-amber-700 border-amber-300"
        : "bg-red-100 text-red-700 border-red-300";
  const statusChips = (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${syncColor}`}
      >
        <ShieldCheck className="w-3 h-3" />
        Sync: {overview?.sync_status || "—"}
      </span>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <Activity className="w-3 h-3" />
        {overview?.last_refresh ? new Date(overview.last_refresh).toLocaleDateString() : "—"}
      </span>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <Clock className="w-3 h-3" />
        Run:{" "}
        {overview?.last_detection_run
          ? new Date(overview.last_detection_run).toLocaleTimeString()
          : "—"}
      </span>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <FileSearch className="w-3 h-3" />
        {overview?.docs_scanned?.toLocaleString("en-IN") || "—"} docs
      </span>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => setShowFilterDrawer(true)}>
        <Filter className="w-4 h-4 mr-1" />
        Filters
      </Button>
      <Button size="sm" variant="outline" onClick={handleRunDetection} disabled={isLoading}>
        <RefreshCw className="w-4 h-4 mr-1" />
        Run Detection
      </Button>
      {/* Create Case button hidden
      <Button size="sm" onClick={() => setShowManualDrawer(true)}>
        <Plus className="w-4 h-4 mr-1" />
        Create Case
      </Button>
      */}
    </div>
  );

  return (
    <RevenueLeakageShell statusChips={statusChips} actions={actions}>
      <div className="px-5 py-3 space-y-4">
        {/* ─── Display Mode Toggle ─────────────────────────── */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Operational Snapshot
          </h2>
          <div className="flex items-center gap-0.5 bg-slate-100 rounded-md p-0.5">
            {DISPLAY_MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setDisplayMode(m.value)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  displayMode === m.value
                    ? "bg-white text-slate-900 shadow-sm font-medium"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── KPI Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-2">
          {[
            {
              label: "Total Payable",
              value: overview?.total_payable || 0,
              delta: overview?.kpi_deltas.total_payable_delta_pct,
              spark: overview?.kpi_sparklines.total_payable,
              isCurrency: true,
              color: "border-blue-200 bg-blue-50/40",
            },
            {
              label: "Total Paid",
              value: overview?.total_paid || 0,
              delta: overview?.kpi_deltas.total_paid_delta_pct,
              spark: overview?.kpi_sparklines.total_paid,
              isCurrency: true,
              color: "border-emerald-200 bg-emerald-50/40",
            },
            {
              label: "Total Gap",
              value: overview?.total_gap || 0,
              delta: overview?.kpi_deltas.total_gap_delta_pct,
              spark: overview?.kpi_sparklines.total_gap,
              isCurrency: true,
              highlight: true,
              color: "ring-2 ring-red-300 border-red-200 bg-red-50",
            },
            {
              label: "High Risk Cases",
              value: overview?.high_risk_cases || 0,
              delta: overview?.kpi_deltas.high_risk_cases_delta_pct,
              spark: overview?.kpi_sparklines.high_risk_cases,
              isCurrency: false,
              color: "border-amber-200 bg-amber-50/40",
            },
            {
              label: "Avg Challan Delay",
              value: overview?.avg_challan_delay_days || 0,
              delta: overview?.kpi_deltas.avg_challan_delay_delta_pct,
              spark: overview?.kpi_sparklines.avg_challan_delay,
              isCurrency: false,
              suffix: " days",
              color: "border-orange-200 bg-orange-50/40",
            },
            {
              label: "Awaiting Review",
              value: overview?.cases_awaiting_review || 0,
              delta: overview?.kpi_deltas.cases_awaiting_review_delta_pct,
              spark: overview?.kpi_sparklines.cases_awaiting_review,
              isCurrency: false,
              color: "border-violet-200 bg-violet-50/40",
            },
          ].map((kpi) => (
            <Card key={kpi.label} className={`p-3 ${kpi.color}`}>
              <p className="text-[11px] font-medium text-slate-500">{kpi.label}</p>
              <p
                className={`text-lg font-bold mt-0.5 ${kpi.highlight ? "text-red-700" : "text-slate-900"}`}
              >
                {kpi.isCurrency ? fmt(kpi.value) : kpi.value}
                {kpi.suffix || ""}
              </p>
              <div className="flex items-center justify-between mt-1">
                {kpi.delta !== undefined && <DeltaBadge pct={kpi.delta} />}
                {kpi.spark && (
                  <MicroSparkline
                    values={kpi.spark}
                    color={kpi.highlight ? "#ef4444" : "#3b82f6"}
                  />
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* ─── Mini KPI Strip ─────────────────────────────── */}
        {overview?.mini_kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              {
                label: "Prohibited Land Hits",
                value: overview.mini_kpis.prohibited_land_hits,
                filter: "signal:ProhibitedLand",
                accent: "border-pink-200 hover:bg-pink-50",
              },
              {
                label: "Gap > Threshold",
                value: overview.mini_kpis.gap_above_threshold,
                filter: "gap_above_threshold",
                accent: "border-red-200 hover:bg-red-50",
              },
              {
                label: "Delay > Threshold",
                value: overview.mini_kpis.delay_above_threshold,
                filter: "signal:ChallanDelay",
                accent: "border-orange-200 hover:bg-orange-50",
              },
              {
                label: "Data Integrity Flags",
                value: overview.mini_kpis.data_integrity_flags,
                filter: "signal:DataIntegrity",
                accent: "border-slate-300 hover:bg-slate-50",
              },
            ].map((pill) => (
              <button
                key={pill.label}
                onClick={() => navigateCasesWithFilter(pill.filter)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border bg-white transition-colors text-left group shadow-sm ${pill.accent}`}
              >
                <span className="text-xs font-medium text-slate-600">{pill.label}</span>
                <span className="text-base font-bold text-slate-900 group-hover:text-blue-600">
                  {pill.value}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ─── Charts Grid ────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Drivers & Trends
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {overview?.signal_impact && (
              <LeakageBySignalChart data={overview.signal_impact} mode={displayMode} />
            )}
            {overview?.signal_impact && (
              <ImpactShareDonut
                data={overview.signal_impact}
                totalGap={overview.total_gap}
                mode={displayMode}
              />
            )}
            {overview?.gap_trend_monthly && (
              <div className="relative">
                <GapTrendLineChart
                  data={overview.gap_trend_monthly}
                  showRollingAvg={showRollingAvg}
                  mode={displayMode}
                />
                <button
                  onClick={() => setShowRollingAvg(!showRollingAvg)}
                  className={`absolute top-2 right-3 text-[10px] px-2 py-0.5 rounded border transition-colors ${
                    showRollingAvg
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-slate-50 text-slate-500 border-slate-200"
                  }`}
                >
                  Rolling Avg
                </button>
              </div>
            )}
            {overview?.status_funnel && <StatusFunnelChart data={overview.status_funnel} />}
          </div>
        </div>

        {/* ─── Highlights Panel ───────────────────────────── */}
        {overview?.highlights && overview.highlights.length > 0 && (
          <Card className="p-4 border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Highlights (Last 30 Days)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {overview.highlights.map((h, i) => {
                const Icon = HIGHLIGHT_ICONS[h.icon] || AlertTriangle;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-slate-800 bg-white/60 rounded-md px-3 py-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-xs leading-relaxed">{h.text}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ─── Tables Section ─────────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Operational Drilldowns
          </h2>

          {/* Top Offices + Top Rules */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-3">
            {/* Enhanced Top Offices */}
            <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b">
                <h3 className="text-sm font-bold text-slate-900">Top 10 Offices by Gap</h3>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-slate-300 bg-slate-700">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold">Office</th>
                      <th className="text-right py-2 px-3 font-semibold">Gap</th>
                      <th className="text-right py-2 px-3 font-semibold">Cases</th>
                      <th className="text-right py-2 px-3 font-semibold">High %</th>
                      <th className="text-right py-2 px-3 font-semibold">Avg Delay</th>
                      <th className="text-right py-2 px-3 font-semibold">Prohib.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(overview?.top_offices_enhanced || []).map((office) => (
                      <tr
                        key={office.SR_CODE}
                        className="text-slate-800 hover:bg-blue-50/50 cursor-pointer transition-colors"
                        onClick={() => navigateCasesWithFilter(`office:${office.SR_CODE}`)}
                      >
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900">{office.SR_CODE}</span>
                          <span className="text-slate-400 ml-1 text-xs">{office.SR_NAME}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-red-700">
                          {fmt(office.gap_inr)}
                        </td>
                        <td className="py-2 px-3 text-right font-medium">{office.cases}</td>
                        <td className="py-2 px-3 text-right">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${office.high_risk_pct >= 50 ? "bg-red-100 text-red-700" : office.high_risk_pct >= 25 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                          >
                            {office.high_risk_pct}%
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span
                            className={`text-xs font-medium ${office.avg_delay_days > 7 ? "text-red-600" : "text-slate-600"}`}
                          >
                            {office.avg_delay_days}d
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-medium">
                          {office.prohibited_hits}
                        </td>
                      </tr>
                    ))}
                    {!overview?.top_offices_enhanced?.length && (
                      <tr>
                        <td colSpan={6} className="py-4 px-3 text-sm text-slate-500 text-center">
                          No data yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Rules Triggered */}
            <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b">
                <h3 className="text-sm font-bold text-slate-900">Top Rules Triggered</h3>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-slate-300 bg-slate-700">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold">Rule</th>
                      <th className="text-right py-2 px-3 font-semibold">Triggers</th>
                      <th className="text-right py-2 px-3 font-semibold">Impact</th>
                      <th className="text-right py-2 px-3 font-semibold">Avg Conf.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(overview?.top_rules_triggered || []).map((rule) => (
                      <tr
                        key={rule.rule_id}
                        className="text-slate-800 hover:bg-blue-50/50 cursor-pointer transition-colors"
                        onClick={() =>
                          router.push(`/workbench/revenue-leakage/rules?rule=${rule.rule_id}`)
                        }
                      >
                        <td className="py-2 px-3">
                          <span className="font-bold text-xs font-mono">{rule.rule_id}</span>
                          <span className="text-slate-500 ml-1.5 text-xs">{rule.rule_name}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold">{rule.trigger_count}</td>
                        <td className="py-2 px-3 text-right font-medium">
                          {fmt(rule.total_impact_inr)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <div className="w-12 h-2 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${confidenceColor(rule.avg_confidence)}`}
                                style={{ width: `${rule.avg_confidence}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-700">
                              {rule.avg_confidence}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!overview?.top_rules_triggered?.length && (
                      <tr>
                        <td colSpan={4} className="py-4 px-3 text-sm text-slate-500 text-center">
                          No rules triggered yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Enhanced Newest High Risk + Rules Health */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden xl:col-span-2">
              <div className="px-4 py-2.5 bg-slate-50 border-b">
                <h3 className="text-sm font-bold text-slate-900">Newest High Risk Cases</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-300 bg-slate-700">
                  <tr>
                    <th className="text-left py-2 px-3 font-semibold">Case ID</th>
                    <th className="text-left py-2 px-3 font-semibold">Document</th>
                    <th className="text-left py-2 px-3 font-semibold">Signals</th>
                    <th className="text-right py-2 px-3 font-semibold">Confidence</th>
                    <th className="text-right py-2 px-3 font-semibold">Gap</th>
                    <th className="text-right py-2 px-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(overview?.newest_high_risk_enhanced || []).map((item) => (
                    <tr
                      key={item.case_id}
                      className="text-slate-800 hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="py-2 px-3 font-bold text-slate-900">{item.case_id}</td>
                      <td
                        className="py-2 px-3 text-xs text-blue-700 font-semibold cursor-pointer hover:underline"
                        onClick={() => navigateCasesWithFilter(`case:${item.case_id}`)}
                      >
                        {item.document_key.SR_CODE}/{item.document_key.BOOK_NO}/
                        {item.document_key.DOCT_NO}/{item.document_key.REG_YEAR}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {item.signals.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${SIGNAL_COLORS[s]}`}
                            >
                              {SIGNAL_LABELS[s].split(" ")[0]}
                            </span>
                          ))}
                          {item.signals.length > 3 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              +{item.signals.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-10 h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${confidenceColor(item.confidence)}`}
                              style={{ width: `${item.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">
                            {item.confidence}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-red-700">
                        {fmt(item.gap_inr)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Button
                          size="sm"
                          className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => navigateCasesWithFilter(`case:${item.case_id}`)}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!overview?.newest_high_risk_enhanced?.length && (
                    <tr>
                      <td colSpan={6} className="py-4 px-3 text-sm text-slate-500 text-center">
                        No high risk cases yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Rules Health</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Enabled Rules</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-bold bg-emerald-100 text-emerald-700">
                    {overview?.rules_health.enabled || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Last Run</span>
                  <span className="text-xs font-medium text-slate-700">
                    {overview?.rules_health.last_run
                      ? new Date(overview.rules_health.last_run).toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Failures</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-bold ${(overview?.rules_health.failures || 0) > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                  >
                    {overview?.rules_health.failures || 0}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ─── Create Case Drawer ─────────────────────────── */}
      <Sheet open={showManualDrawer} onOpenChange={setShowManualDrawer}>
        <SheetContent className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>Create Case (Manual)</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-slate-500">SR_CODE</label>
              <Input
                value={docKey.SR_CODE}
                onChange={(e) => setDocKey((prev) => ({ ...prev, SR_CODE: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">BOOK_NO</label>
              <Input
                value={docKey.BOOK_NO}
                onChange={(e) => setDocKey((prev) => ({ ...prev, BOOK_NO: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">DOCT_NO</label>
              <Input
                value={docKey.DOCT_NO}
                onChange={(e) => setDocKey((prev) => ({ ...prev, DOCT_NO: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">REG_YEAR</label>
              <Input
                value={docKey.REG_YEAR}
                onChange={(e) => setDocKey((prev) => ({ ...prev, REG_YEAR: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowManualDrawer(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateManualCase}>Create Case</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Overview Filter Drawer ─────────────────────── */}
      <Sheet open={showFilterDrawer} onOpenChange={setShowFilterDrawer}>
        <SheetContent className="w-[400px] sm:max-w-[400px]">
          <SheetHeader>
            <SheetTitle>Overview Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-5">
            {/* Date range */}
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Date Range</label>
              <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Risk */}
            <div>
              <label className="text-xs font-medium text-slate-700 mb-2 block">Risk Level</label>
              <div className="space-y-1.5">
                {(["High", "Medium", "Low"] as const).map((level) => (
                  <label key={level} className="flex items-center gap-2 text-sm text-slate-700">
                    <Checkbox
                      checked={filterRisk.includes(level)}
                      onCheckedChange={(checked) => {
                        setFilterRisk((prev) =>
                          checked ? [...prev, level] : prev.filter((r) => r !== level)
                        );
                      }}
                    />
                    {level}
                  </label>
                ))}
              </div>
            </div>

            {/* Signals */}
            <div>
              <label className="text-xs font-medium text-slate-700 mb-2 block">Signals</label>
              <div className="space-y-1.5">
                {(Object.keys(SIGNAL_LABELS) as LeakageSignal[]).map((signal) => (
                  <label key={signal} className="flex items-center gap-2 text-sm text-slate-700">
                    <Checkbox
                      checked={filterSignals.includes(signal)}
                      onCheckedChange={(checked) => {
                        setFilterSignals((prev) =>
                          checked ? [...prev, signal] : prev.filter((s) => s !== signal)
                        );
                      }}
                    />
                    {SIGNAL_LABELS[signal]}
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-medium text-slate-700 mb-2 block">Status</label>
              <div className="space-y-1.5">
                {["New", "In Review", "Confirmed", "Resolved"].map((status) => (
                  <label key={status} className="flex items-center gap-2 text-sm text-slate-700">
                    <Checkbox
                      checked={filterStatus.includes(status)}
                      onCheckedChange={(checked) => {
                        setFilterStatus((prev) =>
                          checked ? [...prev, status] : prev.filter((s) => s !== status)
                        );
                      }}
                    />
                    {status}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setFilterDateRange("30");
                  setFilterRisk([]);
                  setFilterSignals([]);
                  setFilterStatus([]);
                }}
              >
                Reset
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowFilterDrawer(false);
                  toast.success("Filters applied");
                }}
              >
                Apply
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const parts: string[] = [];
                if (filterRisk.length) parts.push(`risk:${filterRisk.join(",")}`);
                if (filterSignals.length) parts.push(`signal:${filterSignals.join(",")}`);
                if (filterStatus.length) parts.push(`status:${filterStatus.join(",")}`);
                navigateCasesWithFilter(parts.join("|") || "all");
                setShowFilterDrawer(false);
              }}
            >
              View matching cases
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </RevenueLeakageShell>
  );
}
