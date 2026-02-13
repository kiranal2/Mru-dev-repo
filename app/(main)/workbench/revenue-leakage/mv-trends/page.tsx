"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { RevenueLeakageShell } from "@/components/revenue-leakage/RevenueLeakageShell";
import {
  mvTrendsData,
  getMVHotspotDetail,
  getMVLocationsForSro,
} from "@/lib/revenue-leakage/mvTrendsData";
import {
  MVHotspotDetail,
  MVHotspotItem,
  MVSeverity,
  MVLocationType,
  MVOfficeComparison,
  MVRateCardAnomaly,
  MVDeclaredTrend,
  MVSeasonalPattern,
} from "@/lib/revenue-leakage/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Clock,
  Eye,
  Filter,
  MapPin,
  Search,
  Shield,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { APDistrictMap, DistrictData } from "@/components/revenue-leakage/APDistrictMap";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatShort = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return formatCurrency(value);
};

const severityBadge: Record<MVSeverity, string> = {
  Critical: "bg-red-600 text-white border-red-700",
  High: "bg-orange-600 text-white border-orange-700",
  Medium: "bg-amber-500 text-white border-amber-600",
  Watch: "bg-teal-600 text-white border-teal-700",
  Normal: "bg-emerald-600 text-white border-emerald-700",
};

const drrText = (drr: number) => {
  if (drr < 0.5) return "text-red-600";
  if (drr < 0.7) return "text-orange-600";
  if (drr < 0.85) return "text-amber-600";
  if (drr < 0.95) return "text-teal-600";
  return "text-emerald-600";
};

const highlightIcons: Record<string, React.ElementType> = {
  "trending-down": TrendingDown,
  "trending-up": TrendingUp,
  "map-pin": MapPin,
  "bar-chart": BarChart3,
  clock: Clock,
  shield: Shield,
  alert: AlertTriangle,
};

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface TooltipState {
  x: number;
  y: number;
  content: React.ReactNode;
}

function ChartTooltip({ tooltip }: { tooltip: TooltipState | null }) {
  if (!tooltip) return null;
  return (
    <div
      className="absolute z-50 pointer-events-none px-2.5 py-1.5 rounded-md bg-slate-800 text-white text-xs shadow-lg whitespace-pre-line leading-relaxed"
      style={{
        left: tooltip.x,
        top: tooltip.y,
        transform: "translate(-50%, -100%) translateY(-8px)",
      }}
    >
      {tooltip.content}
    </div>
  );
}

function useChartTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const showTooltip = useCallback((e: React.MouseEvent, content: React.ReactNode) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, content });
  }, []);
  const hideTooltip = useCallback(() => setTooltip(null), []);
  return { tooltip, containerRef, showTooltip, hideTooltip };
}

function DrrTrendChart({
  data,
}: {
  data: { quarter: string; avg_drr: number; hotspot_count: number; loss: number }[];
}) {
  const { tooltip, containerRef, showTooltip, hideTooltip } = useChartTooltip();
  const threshold = 0.85;
  // Tight Y-axis range so variation is visible
  const yMin = 0.7;
  const yMax = 1.05;
  const yRange = yMax - yMin;
  // Chart area dimensions within viewBox
  const left = 14;
  const right = 96;
  const top = 6;
  const bottom = 52;
  const chartW = right - left;
  const chartH = bottom - top;
  const yTicks = [0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0];
  const toY = (drr: number) => bottom - ((drr - yMin) / yRange) * chartH;
  const toX = (i: number) => left + (i / Math.max(data.length - 1, 1)) * chartW;
  const threshY = toY(threshold);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">DRR Trend Over Time</h3>
          <p className="text-xs text-slate-500">Average DRR per quarter</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-600">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-red-600 rounded" /> Avg DRR
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 border-t border-dashed border-slate-400" />{" "}
            Threshold (0.85)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 bg-green-50 border border-green-200 rounded-sm" />{" "}
            Above
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 bg-red-50 border border-red-200 rounded-sm" />{" "}
            Below
          </span>
        </div>
      </div>
      <div ref={containerRef} className="relative" style={{ height: 220 }}>
        <ChartTooltip tooltip={tooltip} />
        <svg viewBox="0 0 100 62" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Background zones */}
          <rect
            x={left}
            y={top}
            width={chartW}
            height={threshY - top}
            fill="#dcfce7"
            opacity="0.30"
          />
          <rect
            x={left}
            y={threshY}
            width={chartW}
            height={bottom - threshY}
            fill="#fee2e2"
            opacity="0.30"
          />

          {/* Y-axis gridlines and labels */}
          {yTicks.map((tick) => {
            const y = toY(tick);
            return (
              <g key={tick}>
                <line
                  x1={left}
                  y1={y}
                  x2={right}
                  y2={y}
                  stroke={tick === threshold ? "#94a3b8" : "#e2e8f0"}
                  strokeWidth={tick === threshold ? 0.5 : 0.3}
                  strokeDasharray={tick === threshold ? "2 1.5" : "none"}
                />
                <text
                  x={left - 1.5}
                  y={y + 1}
                  textAnchor="end"
                  fontSize="3"
                  fill={tick === threshold ? "#64748b" : "#94a3b8"}
                  fontWeight={tick === threshold ? 600 : 400}
                >
                  {tick.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Threshold label */}
          <text x={right + 0.5} y={threshY + 1} fontSize="2.8" fill="#64748b" fontWeight={600}>
            Threshold
          </text>

          {/* Data line */}
          <polyline
            points={data.map((d, i) => `${toX(i)},${toY(d.avg_drr)}`).join(" ")}
            fill="none"
            stroke="#dc2626"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Data points with DRR value labels */}
          {data.map((d, i) => {
            const x = toX(i);
            const y = toY(d.avg_drr);
            return (
              <g key={d.quarter}>
                <circle cx={x} cy={y} r={1.6} fill="#dc2626" stroke="#fff" strokeWidth="0.5" />
                <circle
                  cx={x}
                  cy={y}
                  r={4}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseMove={(e) =>
                    showTooltip(
                      e,
                      <div>
                        <div className="font-semibold mb-0.5">{d.quarter}</div>
                        <div>Avg DRR: {d.avg_drr.toFixed(2)}</div>
                        <div className="text-slate-300">Hotspots: {d.hotspot_count}</div>
                        <div className="text-slate-300">Est. Loss: {formatShort(d.loss)}</div>
                      </div>
                    )
                  }
                  onMouseLeave={hideTooltip}
                />
                <text
                  x={x}
                  y={y - 2.5}
                  textAnchor="middle"
                  fontSize="2.8"
                  fill="#dc2626"
                  fontWeight={600}
                >
                  {d.avg_drr.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* X-axis labels (quarter names) */}
          {data.map((d, i) => (
            <text
              key={d.quarter}
              x={toX(i)}
              y={bottom + 4}
              textAnchor="middle"
              fontSize="2.8"
              fill="#64748b"
            >
              {d.quarter}
            </text>
          ))}

          {/* Axes */}
          <line x1={left} y1={top} x2={left} y2={bottom} stroke="#cbd5e1" strokeWidth="0.3" />
          <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#cbd5e1" strokeWidth="0.3" />
        </svg>
      </div>
    </Card>
  );
}

function SeverityDonut({ data }: { data: { label: string; count: number; color: string }[] }) {
  const { tooltip, containerRef, showTooltip, hideTooltip } = useChartTooltip();
  const total = data.reduce((sum, item) => sum + item.count, 0) || 1;
  let angle = 0;
  const slices = data.map((d) => {
    const pct = d.count / total;
    const start = angle;
    angle += pct * 360;
    return { ...d, start, end: angle };
  });
  const describeArc = (cx: number, cy: number, r: number, startDeg: number, endDeg: number) => {
    const rad = (d: number) => (d - 90) * (Math.PI / 180);
    const s = { x: cx + r * Math.cos(rad(startDeg)), y: cy + r * Math.sin(rad(startDeg)) };
    const e = { x: cx + r * Math.cos(rad(endDeg)), y: cy + r * Math.sin(rad(endDeg)) };
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-slate-900">Severity Distribution</h3>
      <p className="text-xs text-slate-500 mb-3">Hotspot count by severity</p>
      <div ref={containerRef} className="relative flex items-center gap-4">
        <ChartTooltip tooltip={tooltip} />
        <div className="relative" style={{ width: 140, height: 140 }}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {slices.map((s) => (
              <path
                key={s.label}
                d={describeArc(50, 50, 38, s.start, Math.min(s.end, s.start + 359.9))}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeLinecap="butt"
                className="cursor-pointer"
                onMouseMove={(e) =>
                  showTooltip(
                    e,
                    <div>
                      <div className="font-semibold mb-0.5">{s.label}</div>
                      <div>{s.count} hotspots</div>
                      <div className="text-slate-300">
                        {Math.round((s.count / total) * 100)}% of total
                      </div>
                    </div>
                  )
                }
                onMouseLeave={hideTooltip}
              />
            ))}
            <text x="50" y="47" textAnchor="middle" fontSize="8" fill="#1e293b" fontWeight="700">
              {total}
            </text>
            <text x="50" y="56" textAnchor="middle" fontSize="4" fill="#64748b">
              Hotspots
            </text>
          </svg>
        </div>
        <div className="flex-1 space-y-1.5">
          {slices.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-xs">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: s.color }}
              />
              <span className="text-slate-600 flex-1 truncate">{s.label}</span>
              <span className="font-medium text-slate-800">
                {s.count} ({Math.round((s.count / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function HotspotDrawer({
  open,
  onOpenChange,
  detail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: MVHotspotDetail | null;
}) {
  if (!detail) return null;
  const riskScore = Math.round(100 - detail.drr * 60 + (detail.severity === "Critical" ? 15 : 0));
  const totalExtent = detail.transactions.reduce((sum, txn) => sum + txn.extent, 0);
  const extentUnit = detail.transactions[0]?.extent_unit || "sq.yd";
  const lossSplit = {
    stamp: Math.round(detail.estimated_loss * 0.8),
    transfer: Math.round(detail.estimated_loss * 0.12),
    registration: Math.round(detail.estimated_loss * 0.08),
  };

  const drrHistory = detail.trend_history;
  const rateHistory = detail.rate_card_history;
  const scatter = detail.scatter_points;
  const maxDrr = Math.max(...drrHistory.map((item) => Math.max(item.drr, item.sro_avg)), 1);
  const maxRate = Math.max(
    ...rateHistory.map((item) => Math.max(item.unit_rate, item.prev_rate)),
    1
  );
  const maxScatter = Math.max(
    ...scatter.map((item) => item.declared_per_unit),
    detail.rate_card_unit_rate
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[760px] sm:max-w-[760px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-5 pb-4 border-b bg-gradient-to-r from-slate-800 to-slate-700">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="text-xl font-bold text-white tracking-tight">
                {detail.case_id}
              </SheetTitle>
              <p className="text-xs text-slate-300 mt-1">{detail.location_label}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${severityBadge[detail.severity]}`}
              >
                {detail.severity}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500 text-white">
                {detail.status}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-white/15 text-white border border-white/20">
                {detail.confidence}% conf.
              </span>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="bg-slate-100">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="trend">Trend</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4 mt-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Valuation Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <Card className="p-3 border-slate-200">
                    <p className="text-[11px] text-slate-500">Rate Card / Unit</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(detail.rate_card_unit_rate)}
                    </p>
                  </Card>
                  <Card className="p-3 border-red-200 bg-red-50">
                    <p className="text-[11px] text-slate-500">Median Declared / Unit</p>
                    <p className="text-lg font-bold text-red-700">
                      {formatCurrency(detail.median_declared)}
                    </p>
                  </Card>
                  <Card className="p-3 border-red-200 bg-red-50">
                    <p className="text-[11px] text-slate-500">DRR</p>
                    <p className={`text-lg font-bold ${drrText(detail.drr)}`}>
                      {detail.drr.toFixed(2)}
                    </p>
                  </Card>
                  <Card className="p-3 border-slate-200">
                    <p className="text-[11px] text-slate-500">Transactions</p>
                    <p className="text-lg font-bold text-slate-900">
                      {detail.transaction_count} Sale Deeds
                    </p>
                  </Card>
                  <Card className="p-3 border-slate-200">
                    <p className="text-[11px] text-slate-500">Total Extent</p>
                    <p className="text-lg font-bold text-slate-900">
                      {totalExtent} {extentUnit}
                    </p>
                  </Card>
                  <Card className="p-3 border-slate-200">
                    <p className="text-[11px] text-slate-500">Consecutive Quarters</p>
                    <p className="text-lg font-bold text-slate-900">
                      {detail.consecutive_quarters}
                    </p>
                  </Card>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Risk Score</span>
                    <span className="font-semibold text-slate-700">{riskScore}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${riskScore >= 80 ? "bg-red-500" : riskScore >= 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${riskScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Estimated Loss Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Card className="p-3 border-slate-200">
                    <p className="text-[11px] text-slate-500">Stamp Duty Loss</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(lossSplit.stamp)}
                    </p>
                  </Card>
                  <Card className="p-3 border-slate-200">
                    <p className="text-[11px] text-slate-500">Transfer Duty Loss</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(lossSplit.transfer)}
                    </p>
                  </Card>
                  <Card className="p-3 border-slate-200">
                    <p className="text-[11px] text-slate-500">Registration Fee Loss</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(lossSplit.registration)}
                    </p>
                  </Card>
                </div>
                <Card className="p-3 border-emerald-200 bg-emerald-50 mt-2">
                  <p className="text-[11px] text-emerald-700">Total Estimated Loss</p>
                  <p className="text-lg font-bold text-emerald-700">
                    {formatCurrency(detail.estimated_loss)}
                  </p>
                </Card>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Why Flagged
                </h3>
                <div className="space-y-2">
                  {detail.rules_detail.slice(0, 2).map((rule) => (
                    <div key={rule.rule_id} className="bg-white/70 rounded-md px-3 py-2">
                      <p className="text-xs font-semibold text-slate-800">
                        Rule: {rule.rule_name} ({rule.rule_id})
                      </p>
                      <p className="text-xs text-slate-600 mt-1">{rule.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Peer Comparison
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                      <tr>
                        <th className="text-left px-3 py-2">Location</th>
                        <th className="text-center px-3 py-2">DRR</th>
                        <th className="text-center px-3 py-2">Txns</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {detail.peer_locations.map((peer, idx) => (
                        <tr
                          key={`${peer.label}-${idx}`}
                          className={peer.is_sro_avg ? "bg-emerald-50" : ""}
                        >
                          <td className="px-3 py-2 text-slate-700">{peer.label}</td>
                          <td
                            className={`px-3 py-2 text-center font-semibold ${drrText(peer.drr)}`}
                          >
                            {peer.drr.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center text-slate-600">
                            {peer.txn_count || "--"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="mt-4">
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#1B2A4A] text-xs text-slate-200 uppercase">
                    <tr>
                      <th className="text-left px-3 py-2">Document</th>
                      <th className="text-left px-3 py-2">Date</th>
                      <th className="text-right px-3 py-2">Extent</th>
                      <th className="text-right px-3 py-2">Declared / Unit</th>
                      <th className="text-center px-3 py-2">DRR</th>
                      <th className="text-right px-3 py-2">Gap (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {detail.transactions.map((txn) => (
                      <tr key={txn.doc_key} className="hover:bg-blue-50/40">
                        <td className="px-3 py-2 text-blue-700 font-semibold">{txn.doc_key}</td>
                        <td className="px-3 py-2 text-slate-600">{txn.date}</td>
                        <td className="px-3 py-2 text-right text-slate-600">
                          {txn.extent} {txn.extent_unit}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-red-600">
                          {formatCurrency(txn.declared_per_unit)}
                        </td>
                        <td className={`px-3 py-2 text-center font-semibold ${drrText(txn.drr)}`}>
                          {txn.drr.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                          {formatCurrency(txn.gap)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="trend" className="mt-4 space-y-4">
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">DRR History</h3>
                <div style={{ height: 160 }}>
                  <svg viewBox="0 0 100 60" className="w-full h-full">
                    <rect x="0" y="0" width="100" height="60" fill="#f8fafc" />
                    <line
                      x1="6"
                      y1={56 - (0.85 / maxDrr) * 46}
                      x2="96"
                      y2={56 - (0.85 / maxDrr) * 46}
                      stroke="#94a3b8"
                      strokeDasharray="2 2"
                    />
                    <polyline
                      points={drrHistory
                        .map((point, idx) => {
                          const x = 6 + (idx / Math.max(drrHistory.length - 1, 1)) * 88;
                          const y = 56 - (point.drr / maxDrr) * 46;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="1.6"
                    />
                    <polyline
                      points={drrHistory
                        .map((point, idx) => {
                          const x = 6 + (idx / Math.max(drrHistory.length - 1, 1)) * 88;
                          const y = 56 - (point.sro_avg / maxDrr) * 46;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                    />
                  </svg>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Rate Card History</h3>
                <div style={{ height: 160 }}>
                  <svg viewBox="0 0 100 60" className="w-full h-full">
                    <rect x="0" y="0" width="100" height="60" fill="#f8fafc" />
                    <polyline
                      points={rateHistory
                        .map((point, idx) => {
                          const x = 6 + (idx / Math.max(rateHistory.length - 1, 1)) * 88;
                          const y = 56 - (point.unit_rate / maxRate) * 46;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="1.6"
                    />
                    <polyline
                      points={rateHistory
                        .map((point, idx) => {
                          const x = 6 + (idx / Math.max(rateHistory.length - 1, 1)) * 88;
                          const y = 56 - (point.prev_rate / maxRate) * 46;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.2"
                    />
                  </svg>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Transaction Scatter</h3>
                <div style={{ height: 160 }}>
                  <svg viewBox="0 0 100 60" className="w-full h-full">
                    <rect x="0" y="0" width="100" height="60" fill="#f8fafc" />
                    <line
                      x1="6"
                      y1={56 - (detail.rate_card_unit_rate / maxScatter) * 46}
                      x2="96"
                      y2={56 - (detail.rate_card_unit_rate / maxScatter) * 46}
                      stroke="#dc2626"
                      strokeDasharray="2 2"
                    />
                    {scatter.map((point, idx) => {
                      const x = 6 + (idx / Math.max(scatter.length - 1, 1)) * 88;
                      const y = 56 - (point.declared_per_unit / maxScatter) * 46;
                      const color =
                        point.drr < 0.5 ? "#dc2626" : point.drr < 0.7 ? "#ea580c" : "#f59e0b";
                      return <circle key={`sc-${idx}`} cx={x} cy={y} r={2} fill={color} />;
                    })}
                  </svg>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="rules" className="mt-4">
              <Accordion type="single" collapsible>
                {detail.rules_detail.map((rule) => (
                  <AccordionItem key={rule.rule_id} value={rule.rule_id}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {rule.rule_id}: {rule.rule_name}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${severityBadge[detail.severity]}`}
                        >
                          {detail.severity}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm text-slate-700">
                        <p>{rule.explanation}</p>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Fields Used</p>
                          <div className="flex flex-wrap gap-2">
                            {rule.fields_used.map((field) => (
                              <span
                                key={field}
                                className="px-2 py-0.5 rounded bg-slate-100 text-xs"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Thresholds</p>
                          <div className="space-y-1 text-xs">
                            {rule.thresholds.map((t) => (
                              <div key={t.label} className="flex items-center justify-between">
                                <span>{t.label}</span>
                                <span className="font-medium">{t.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Confidence</span>
                          <span className="font-semibold">{rule.confidence}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Impact</span>
                          <span className="font-semibold">{formatCurrency(rule.impact)}</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <div className="space-y-3">
                {(detail.activity_log || []).map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3">
                    <div className="mt-1 w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{entry.action}</p>
                      <p className="text-xs text-slate-500">{entry.detail}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {entry.ts} - {entry.actor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function MVTrendsPage() {
  const [activeView, setActiveView] = useState<"dashboard" | "map" | "comparison" | "anomalies">(
    "dashboard"
  );
  const [selectedQuarter, setSelectedQuarter] = useState(
    mvTrendsData.quarters[mvTrendsData.quarters.length - 1] || "2024-Q4"
  );
  const [hotspots] = useState<MVHotspotItem[]>(mvTrendsData.hotspots);
  const [sroTiles] = useState(mvTrendsData.sroTiles);
  const [officePairs] = useState<MVOfficeComparison[]>(mvTrendsData.pairs);
  const [rateCardAnomalies] = useState<MVRateCardAnomaly[]>(mvTrendsData.rateCardAnomalies);
  const [declaredTrends] = useState<MVDeclaredTrend[]>(mvTrendsData.declaredTrends);
  const [seasonalPatterns] = useState<MVSeasonalPattern[]>(mvTrendsData.seasonalPatterns);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilters, setSeverityFilters] = useState<MVSeverity[]>([]);
  const [typeFilter, setTypeFilter] = useState<"all" | MVLocationType>("all");
  const [sortBy, setSortBy] = useState("loss");
  const [filterOpen, setFilterOpen] = useState(false);
  const [districtFilter, setDistrictFilter] = useState("all");
  const [sroFilter, setSroFilter] = useState("all");
  const [minTxns, setMinTxns] = useState("");
  const [minLoss, setMinLoss] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<MVHotspotDetail | null>(null);
  const [mapView, setMapView] = useState<"state" | "district">("state");
  const [selectedSro, setSelectedSro] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [expandedPair, setExpandedPair] = useState<string | null>(null);

  const dashboard = mvTrendsData.dashboard;

  const toSroTile = (tile: {
    sro_code: string;
    sro_name: string;
    avg_drr: number;
    hotspot_count: number;
    estimated_loss: number;
  }) => ({
    code: tile.sro_code,
    name: tile.sro_name,
    avg_drr: tile.avg_drr,
    hotspots: tile.hotspot_count,
    color:
      tile.avg_drr < 0.7
        ? "#dc2626"
        : tile.avg_drr < 0.85
          ? "#f97316"
          : tile.avg_drr < 1
            ? "#fbbf24"
            : "#22c55e",
    loss: tile.estimated_loss,
  });

  const filteredHotspots = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return hotspots
      .filter((item) => {
        if (searchQuery) {
          const haystack = `${item.location_label} ${item.sro_code} ${item.sro_name}`.toLowerCase();
          if (!haystack.includes(searchLower)) return false;
        }
        if (severityFilters.length && !severityFilters.includes(item.severity)) return false;
        if (typeFilter !== "all" && item.location_type !== typeFilter) return false;
        if (districtFilter !== "all" && item.district !== districtFilter) return false;
        if (sroFilter !== "all" && item.sro_code !== sroFilter) return false;
        if (minTxns && item.transaction_count < Number(minTxns)) return false;
        if (minLoss && item.estimated_loss < Number(minLoss)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "drr") return a.drr - b.drr;
        if (sortBy === "transactions") return b.transaction_count - a.transaction_count;
        if (sortBy === "severity") {
          const order: MVSeverity[] = ["Critical", "High", "Medium", "Watch", "Normal"];
          return order.indexOf(a.severity) - order.indexOf(b.severity);
        }
        return b.estimated_loss - a.estimated_loss;
      });
  }, [
    hotspots,
    searchQuery,
    severityFilters,
    typeFilter,
    districtFilter,
    sroFilter,
    minTxns,
    minLoss,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredHotspots.length / pageSize));
  const paginatedHotspots = filteredHotspots.slice((page - 1) * pageSize, page * pageSize);

  const openHotspot = (item: MVHotspotItem) => {
    const detail = getMVHotspotDetail(item.case_id);
    if (!detail) {
      toast.error("Hotspot details unavailable");
      return;
    }
    setSelectedHotspot(detail);
    setDrawerOpen(true);
  };

  const topRules = useMemo(() => {
    const map = new Map<
      string,
      { rule_id: string; rule_name: string; count: number; impact: number; avg_drr: number }
    >();
    hotspots.forEach((h) => {
      h.rules_triggered.forEach((ruleId) => {
        const existing = map.get(ruleId) || {
          rule_id: ruleId,
          rule_name: ruleId,
          count: 0,
          impact: 0,
          avg_drr: 0,
        };
        existing.count += 1;
        existing.impact += h.estimated_loss;
        existing.avg_drr += h.drr;
        map.set(ruleId, existing);
      });
    });
    return Array.from(map.values())
      .map((item) => ({ ...item, avg_drr: Number((item.avg_drr / item.count).toFixed(2)) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [hotspots]);

  const severityDistribution = [
    { label: "Critical", count: dashboard.critical_hotspots, color: "#dc2626" },
    { label: "High", count: dashboard.high_hotspots, color: "#ea580c" },
    { label: "Medium", count: dashboard.medium_hotspots, color: "#f59e0b" },
    { label: "Watch", count: dashboard.watch_hotspots, color: "#0d9488" },
  ];

  const districtDataList: DistrictData[] = useMemo(() => {
    const map = new Map<
      string,
      { drrs: number[]; hotspots: number; sros: Set<string>; txns: number; loss: number }
    >();
    sroTiles.forEach((tile) => {
      const entry = map.get(tile.district) || {
        drrs: [],
        hotspots: 0,
        sros: new Set<string>(),
        txns: 0,
        loss: 0,
      };
      entry.drrs.push(tile.avg_drr);
      entry.hotspots += tile.hotspot_count;
      entry.sros.add(tile.sro_code);
      entry.txns += tile.transaction_count;
      entry.loss += tile.estimated_loss;
      map.set(tile.district, entry);
    });
    return Array.from(map.entries()).map(([name, d]) => ({
      name,
      avgDrr: Number((d.drrs.reduce((s, v) => s + v, 0) / d.drrs.length).toFixed(2)),
      hotspotCount: d.hotspots,
      sroCount: d.sros.size,
      transactionCount: d.txns,
      estimatedLoss: d.loss,
    }));
  }, [sroTiles]);

  const quarters = [...mvTrendsData.quarters].reverse();

  return (
    <RevenueLeakageShell subtitle="Market value trend monitoring">
      <div className="px-6 py-3 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "dashboard", label: "Dashboard" },
                { id: "map", label: "Hotspot Map" },
                { id: "comparison", label: "Office Comparison" },
                { id: "anomalies", label: "Growth Anomalies" },
              ] as const
            ).map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  activeView === view.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500">Quarter</span>
            <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Quarter" />
              </SelectTrigger>
              <SelectContent>
                {quarters.map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeView === "dashboard" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-2">
              {[
                {
                  label: "Total Hotspots",
                  value: dashboard.total_hotspots,
                  delta: `+${dashboard.total_hotspots_change_pct}%`,
                  accent: "border-t-red-600",
                },
                {
                  label: "Critical",
                  value: dashboard.critical_hotspots,
                  delta: "+3 vs last quarter",
                  accent: "border-t-[#7f1d1d]",
                },
                {
                  label: "Affected Transactions",
                  value: dashboard.affected_transactions,
                  delta: "Hotspot zones",
                  accent: "border-t-orange-500",
                },
                {
                  label: "Estimated Annual Loss",
                  value: formatShort(dashboard.estimated_annual_loss),
                  delta: "+18.5%",
                  accent: "border-t-red-600",
                },
                {
                  label: "% Registrations in Hotspots",
                  value: `${dashboard.pct_in_hotspots}%`,
                  delta: "Share of all sale deeds",
                  accent: "border-t-[#3ABEF9]",
                },
                {
                  label: "Locations Monitored",
                  value: dashboard.locations_monitored.toLocaleString("en-IN"),
                  delta: "Active locations",
                  accent: "border-t-slate-700",
                },
              ].map((kpi) => (
                <Card key={kpi.label} className={`p-3 border ${kpi.accent}`}>
                  <p className="text-[11px] font-medium text-slate-500">{kpi.label}</p>
                  <p className="text-lg font-bold text-slate-900">{kpi.value}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{kpi.delta}</p>
                </Card>
              ))}
            </div>

            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Drivers & Trends
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                <DrrTrendChart data={dashboard.quarterly_trend} />
                <SeverityDonut data={severityDistribution} />
              </div>
            </div>

            <Card className="p-4 border-amber-200 bg-gradient-to-r from-amber-50/60 to-yellow-50/60">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                MV Trend Highlights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {dashboard.highlights.map((item, idx) => {
                  const Icon = highlightIcons[item.icon] || AlertTriangle;
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-sm text-slate-800 bg-white/70 rounded-md px-3 py-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <span className="text-xs leading-relaxed">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Operational Drilldowns
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b">
                    <h3 className="text-sm font-bold text-slate-900">
                      Top 10 SROs by Estimated Loss
                    </h3>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#1B2A4A] text-xs text-slate-200 uppercase">
                        <tr>
                          <th className="text-left py-2 px-3">SRO</th>
                          <th className="text-center py-2 px-3">Avg DRR</th>
                          <th className="text-center py-2 px-3">Hotspots</th>
                          <th className="text-center py-2 px-3">Txns</th>
                          <th className="text-right py-2 px-3">Est. Loss</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {dashboard.top_sros.map((sro) => (
                          <tr key={sro.sro_code} className="hover:bg-blue-50/40">
                            <td className="px-3 py-2 text-slate-700">
                              <span className="font-bold text-slate-900">{sro.sro_code}</span>
                              <span className="text-slate-400 ml-1 text-xs">{sro.sro_name}</span>
                            </td>
                            <td
                              className={`px-3 py-2 text-center font-semibold ${drrText(sro.avg_drr)}`}
                            >
                              {sro.avg_drr.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-center">{sro.hotspots}</td>
                            <td className="px-3 py-2 text-center">{sro.hotspots * 12}</td>
                            <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                              {formatShort(sro.loss)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b">
                    <h3 className="text-sm font-bold text-slate-900">Top Rules Triggered</h3>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#1B2A4A] text-xs text-slate-200 uppercase">
                        <tr>
                          <th className="text-left py-2 px-3">Rule</th>
                          <th className="text-center py-2 px-3">Triggers</th>
                          <th className="text-right py-2 px-3">Impact</th>
                          <th className="text-right py-2 px-3">Avg DRR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {topRules.map((rule) => (
                          <tr key={rule.rule_id} className="hover:bg-blue-50/40">
                            <td className="px-3 py-2 text-slate-700">
                              <span className="font-bold text-slate-900">{rule.rule_id}</span>
                              <span className="text-slate-400 ml-1 text-xs">{rule.rule_name}</span>
                            </td>
                            <td className="px-3 py-2 text-center">{rule.count}</td>
                            <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                              {formatShort(rule.impact)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className={`text-xs font-semibold ${drrText(rule.avg_drr)}`}>
                                  {rule.avg_drr.toFixed(2)}
                                </span>
                                <div className="w-14 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${rule.avg_drr < 0.7 ? "bg-red-500" : rule.avg_drr < 0.85 ? "bg-amber-500" : "bg-emerald-500"}`}
                                    style={{ width: `${Math.min(rule.avg_drr * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Undervaluation Hotspots
              </h2>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search location, SRO..."
                    className="pl-9 h-9"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  {(["Critical", "High", "Medium", "Watch"] as MVSeverity[]).map((severity) => (
                    <button
                      key={severity}
                      onClick={() =>
                        setSeverityFilters((prev) =>
                          prev.includes(severity)
                            ? prev.filter((s) => s !== severity)
                            : [...prev, severity]
                        )
                      }
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                        severityFilters.includes(severity)
                          ? `${severityBadge[severity]} shadow-sm`
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {severity}
                    </button>
                  ))}
                </div>
                <Select
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as "all" | MVLocationType)}
                >
                  <SelectTrigger className="w-[120px] h-9 text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="RURAL">Rural</SelectItem>
                    <SelectItem value="URBAN">Urban</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="h-9 text-xs"
                  onClick={() => setFilterOpen(true)}
                >
                  <Filter className="w-4 h-4 mr-1" /> More Filters
                </Button>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px] h-9 text-xs">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loss">Sort: Est. Loss</SelectItem>
                    <SelectItem value="drr">Sort: DRR</SelectItem>
                    <SelectItem value="transactions">Sort: Transactions</SelectItem>
                    <SelectItem value="severity">Sort: Severity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#1B2A4A] text-xs text-slate-200 uppercase">
                    <tr>
                      <th className="text-center px-2 py-2 w-[40px]">#</th>
                      <th className="text-left px-3 py-2">Location</th>
                      <th className="text-center px-3 py-2">Type</th>
                      <th className="text-left px-3 py-2">SRO</th>
                      <th className="text-center px-3 py-2">Txns</th>
                      <th className="text-right px-3 py-2">Rate Card</th>
                      <th className="text-right px-3 py-2">Declared</th>
                      <th className="text-center px-3 py-2">DRR</th>
                      <th className="text-center px-3 py-2">Severity</th>
                      <th className="text-right px-3 py-2">Est. Loss</th>
                      <th className="text-center px-3 py-2">Quarters</th>
                      <th className="text-center px-3 py-2">Status</th>
                      <th className="text-center px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedHotspots.map((item, idx) => (
                      <tr
                        key={item.case_id}
                        className="hover:bg-blue-50/40 cursor-pointer"
                        onClick={() => openHotspot(item)}
                      >
                        <td className="text-center px-2 py-2 text-slate-500">
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{item.location_label}</td>
                        <td className="px-3 py-2 text-center text-slate-600">
                          {item.location_type === "RURAL" ? "Rural" : "Urban"}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {item.sro_code} - {item.sro_name}
                        </td>
                        <td className="px-3 py-2 text-center">{item.transaction_count}</td>
                        <td className="px-3 py-2 text-right">
                          {formatCurrency(item.rate_card_unit_rate)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-red-600">
                          {formatCurrency(item.median_declared)}
                        </td>
                        <td className={`px-3 py-2 text-center font-bold ${drrText(item.drr)}`}>
                          {item.drr.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${severityBadge[item.severity]}`}
                          >
                            {item.severity}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                          {formatShort(item.estimated_loss)}
                        </td>
                        <td className="px-3 py-2 text-center">{item.consecutive_quarters}</td>
                        <td className="px-3 py-2 text-center text-slate-600">{item.status}</td>
                        <td className="px-3 py-2 text-center">
                          <Button size="icon" variant="outline" className="h-7 w-7">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!paginatedHotspots.length && (
                      <tr>
                        <td colSpan={13} className="text-center text-sm text-slate-500 py-6">
                          No hotspots match the filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600 mt-2">
                <div>
                  Showing {paginatedHotspots.length} of {filteredHotspots.length} hotspots
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[90px] h-8">
                      <SelectValue placeholder="Rows" />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 12, 20].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}/page
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </Button>
                    <span className="text-xs text-slate-500">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === "map" && (
          <div className="space-y-3">
            {/* Top bar: view toggles + legend */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMapView("state");
                  setSelectedDistrict(null);
                  setSelectedSro(null);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${mapView === "state" && !selectedDistrict && !selectedSro ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
              >
                State View
              </button>
              <button
                onClick={() => {
                  setMapView("district");
                  setSelectedSro(null);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${mapView === "district" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
              >
                District View
              </button>
              <div className="ml-auto text-xs text-slate-500 flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-600 rounded-full" /> DRR &lt; 0.7
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-orange-500 rounded-full" /> 0.7-0.85
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-400 rounded-full" /> 0.85-1.0
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" /> &gt; 1.0
                </span>
              </div>
            </div>

            {/* Breadcrumb */}
            {(selectedDistrict || selectedSro) && (
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => {
                    setSelectedDistrict(null);
                    setSelectedSro(null);
                  }}
                >
                  All Districts
                </button>
                {selectedDistrict && (
                  <>
                    <span>&gt;</span>
                    <button
                      className={
                        selectedSro ? "text-blue-600 hover:underline" : "text-slate-700 font-medium"
                      }
                      onClick={() => setSelectedSro(null)}
                    >
                      {selectedDistrict}
                    </button>
                  </>
                )}
                {selectedSro && (
                  <>
                    <span>&gt;</span>
                    <span className="text-slate-700 font-medium">{selectedSro}</span>
                  </>
                )}
              </div>
            )}

            {/* Location View - SRO drilldown */}
            {selectedSro ? (
              (() => {
                const locations = getMVLocationsForSro(selectedSro);
                const sroInfo = sroTiles.find((t) => t.sro_code === selectedSro);
                return (
                  <div className="space-y-3">
                    {/* SRO header */}
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={() => setSelectedSro(null)}>
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                      </Button>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {sroInfo?.sro_name || selectedSro}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {locations.length} locations monitored
                        </p>
                      </div>
                      {sroInfo && (
                        <div className="ml-auto flex items-center gap-3 text-xs text-slate-600">
                          <span>
                            Avg DRR{" "}
                            <span className={`font-bold ${drrText(sroInfo.avg_drr)}`}>
                              {sroInfo.avg_drr.toFixed(2)}
                            </span>
                          </span>
                          <span>
                            Hotspots{" "}
                            <span className="font-bold text-slate-900">
                              {sroInfo.hotspot_count}
                            </span>
                          </span>
                          <span>
                            Loss{" "}
                            <span className="font-bold text-red-600">
                              {formatShort(sroInfo.estimated_loss)}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Location cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                      {locations.map((loc) => {
                        const hotspot = hotspots.find(
                          (h) =>
                            h.sro_code === selectedSro && h.location_label === loc.location_label
                        );
                        const drrColor =
                          loc.drr < 0.7
                            ? "#dc2626"
                            : loc.drr < 0.85
                              ? "#f97316"
                              : loc.drr < 1
                                ? "#f59e0b"
                                : "#22c55e";
                        const sev =
                          loc.drr < 0.5
                            ? "Critical"
                            : loc.drr < 0.7
                              ? "High"
                              : loc.drr < 0.85
                                ? "Medium"
                                : loc.drr < 0.95
                                  ? "Watch"
                                  : "Normal";
                        return (
                          <div
                            key={`${loc.sro_code}-${loc.location_label}`}
                            className={`rounded-lg bg-white border border-slate-200 overflow-hidden hover:shadow-md transition-shadow ${hotspot ? "cursor-pointer" : "opacity-60"}`}
                            onClick={() => {
                              if (hotspot) openHotspot(hotspot);
                            }}
                          >
                            <div className="flex">
                              <div
                                className="w-1.5 flex-shrink-0"
                                style={{ backgroundColor: drrColor }}
                              />
                              <div className="flex-1 p-3">
                                <div className="flex items-start justify-between">
                                  <p className="text-sm font-bold text-slate-900 leading-tight">
                                    {loc.location_label}
                                  </p>
                                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                    <span
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${loc.location_type === "URBAN" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                                    >
                                      {loc.location_type}
                                    </span>
                                    {sev !== "Normal" && (
                                      <span
                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${severityBadge[sev as MVSeverity]}`}
                                      >
                                        {sev}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {/* DRR gauge */}
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-xs text-slate-500">DRR</span>
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${Math.min(loc.drr, 1) * 100}%`,
                                        backgroundColor: drrColor,
                                      }}
                                    />
                                  </div>
                                  <span className={`text-xs font-bold ${drrText(loc.drr)}`}>
                                    {loc.drr.toFixed(2)}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                                  <span>{loc.transaction_count} txns</span>
                                  <span>Loss {formatShort(loc.estimated_loss)}</span>
                                  {loc.hotspot_count > 0 && (
                                    <span className="text-red-600 font-semibold">Hotspot</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            ) : /* District View - SRO cards within a district */
            selectedDistrict ? (
              (() => {
                const districtSros = sroTiles.filter((t) => t.district === selectedDistrict);
                const districtInfo = districtDataList.find((d) => d.name === selectedDistrict);
                return (
                  <div className="space-y-3">
                    {/* District header */}
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={() => setSelectedDistrict(null)}>
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                      </Button>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {selectedDistrict} District
                        </h3>
                        <p className="text-xs text-slate-500">{districtSros.length} SROs</p>
                      </div>
                      {districtInfo && (
                        <div className="ml-auto flex items-center gap-3 text-xs text-slate-600">
                          <span>
                            Avg DRR{" "}
                            <span className={`font-bold ${drrText(districtInfo.avgDrr)}`}>
                              {districtInfo.avgDrr.toFixed(2)}
                            </span>
                          </span>
                          <span>
                            Hotspots{" "}
                            <span className="font-bold text-slate-900">
                              {districtInfo.hotspotCount}
                            </span>
                          </span>
                          <span>
                            Loss{" "}
                            <span className="font-bold text-red-600">
                              {formatShort(districtInfo.estimatedLoss)}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                    {/* SRO cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                      {districtSros.map((tile) => {
                        const drrColor =
                          tile.avg_drr < 0.7
                            ? "#dc2626"
                            : tile.avg_drr < 0.85
                              ? "#f97316"
                              : tile.avg_drr < 1
                                ? "#f59e0b"
                                : "#22c55e";
                        const sev =
                          tile.avg_drr < 0.5
                            ? "Critical"
                            : tile.avg_drr < 0.7
                              ? "High"
                              : tile.avg_drr < 0.85
                                ? "Medium"
                                : tile.avg_drr < 0.95
                                  ? "Watch"
                                  : "Normal";
                        return (
                          <div
                            key={tile.sro_code}
                            className="rounded-lg bg-white border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => {
                              setSelectedSro(tile.sro_code);
                            }}
                          >
                            <div className="flex">
                              <div
                                className="w-1.5 flex-shrink-0"
                                style={{ backgroundColor: drrColor }}
                              />
                              <div className="flex-1 p-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">
                                      {tile.sro_code}
                                    </p>
                                    <p className="text-xs text-slate-500">{tile.sro_name}</p>
                                  </div>
                                  {sev !== "Normal" && (
                                    <span
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${severityBadge[sev as MVSeverity]}`}
                                    >
                                      {sev}
                                    </span>
                                  )}
                                </div>
                                {/* DRR gauge */}
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-xs text-slate-500">DRR</span>
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${Math.min(tile.avg_drr, 1) * 100}%`,
                                        backgroundColor: drrColor,
                                      }}
                                    />
                                  </div>
                                  <span className={`text-xs font-bold ${drrText(tile.avg_drr)}`}>
                                    {tile.avg_drr.toFixed(2)}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                                  <span>{tile.hotspot_count} hotspots</span>
                                  <span>{tile.transaction_count} txns</span>
                                  <span>Loss {formatShort(tile.estimated_loss)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            ) : /* District View toggle - grouped by district */
            mapView === "district" ? (
              <div className="space-y-4">
                {Object.entries(
                  sroTiles.reduce<Record<string, typeof sroTiles>>((acc, tile) => {
                    acc[tile.district] = acc[tile.district] || [];
                    acc[tile.district].push(tile);
                    return acc;
                  }, {})
                ).map(([district, tiles]) => {
                  const distInfo = districtDataList.find((d) => d.name === district);
                  return (
                    <div key={district}>
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          className="text-xs font-semibold text-blue-600 hover:underline"
                          onClick={() => setSelectedDistrict(district)}
                        >
                          {district}
                        </button>
                        {distInfo && (
                          <span className="text-[10px] text-slate-400">
                            DRR {distInfo.avgDrr.toFixed(2)} | {distInfo.hotspotCount} hotspots |{" "}
                            {formatShort(distInfo.estimatedLoss)}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                        {tiles.map((tile) => {
                          const drrColor =
                            tile.avg_drr < 0.7
                              ? "#dc2626"
                              : tile.avg_drr < 0.85
                                ? "#f97316"
                                : tile.avg_drr < 1
                                  ? "#f59e0b"
                                  : "#22c55e";
                          const sev =
                            tile.avg_drr < 0.5
                              ? "Critical"
                              : tile.avg_drr < 0.7
                                ? "High"
                                : tile.avg_drr < 0.85
                                  ? "Medium"
                                  : tile.avg_drr < 0.95
                                    ? "Watch"
                                    : "Normal";
                          return (
                            <div
                              key={tile.sro_code}
                              className="rounded-lg bg-white border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => {
                                setSelectedDistrict(district);
                                setSelectedSro(tile.sro_code);
                              }}
                            >
                              <div className="flex">
                                <div
                                  className="w-1.5 flex-shrink-0"
                                  style={{ backgroundColor: drrColor }}
                                />
                                <div className="flex-1 p-3">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="text-sm font-bold text-slate-900">
                                        {tile.sro_code}
                                      </p>
                                      <p className="text-xs text-slate-500">{tile.sro_name}</p>
                                    </div>
                                    {sev !== "Normal" && (
                                      <span
                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${severityBadge[sev as MVSeverity]}`}
                                      >
                                        {sev}
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="text-xs text-slate-500">DRR</span>
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${Math.min(tile.avg_drr, 1) * 100}%`,
                                          backgroundColor: drrColor,
                                        }}
                                      />
                                    </div>
                                    <span className={`text-xs font-bold ${drrText(tile.avg_drr)}`}>
                                      {tile.avg_drr.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                                    <span>{tile.hotspot_count} hotspots</span>
                                    <span>{tile.transaction_count} txns</span>
                                    <span>Loss {formatShort(tile.estimated_loss)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* State View - AP geographic map */
              <div className="space-y-3">
                {/* Summary stats bar */}
                <div className="grid grid-cols-3 gap-2">
                  <Card className="p-3 border-t-2 border-t-red-500">
                    <p className="text-[11px] text-slate-500">Total Hotspots</p>
                    <p className="text-lg font-bold text-slate-900">
                      {districtDataList.reduce((s, d) => s + d.hotspotCount, 0)}
                    </p>
                  </Card>
                  <Card className="p-3 border-t-2 border-t-orange-500">
                    <p className="text-[11px] text-slate-500">Critical Districts</p>
                    <p className="text-lg font-bold text-slate-900">
                      {districtDataList.filter((d) => d.avgDrr < 0.85).length} of{" "}
                      {districtDataList.length}
                    </p>
                  </Card>
                  <Card className="p-3 border-t-2 border-t-emerald-500">
                    <p className="text-[11px] text-slate-500">Total Est. Loss</p>
                    <p className="text-lg font-bold text-red-600">
                      {formatShort(districtDataList.reduce((s, d) => s + d.estimatedLoss, 0))}
                    </p>
                  </Card>
                </div>
                {/* Geographic map */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">
                    Andhra Pradesh - District Hotspot Map
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">Click a district to view SROs</p>
                  <APDistrictMap
                    districts={districtDataList}
                    onDistrictClick={(name) => {
                      setSelectedDistrict(name);
                    }}
                    formatShort={formatShort}
                  />
                </Card>
              </div>
            )}
          </div>
        )}

        {activeView === "comparison" &&
          (() => {
            const sortedPairs = [...officePairs].sort((a, b) => b.drr_gap - a.drr_gap);
            const flaggedPairs = sortedPairs.filter((p) => p.drr_gap > 0.3);
            const unflaggedPairs = sortedPairs.filter((p) => p.drr_gap <= 0.3);
            const maxDrr = 1.3;
            return (
              <div className="space-y-4">
                {/* Summary KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Card className="p-3 border-l-4 border-l-red-500">
                    <p className="text-[11px] text-slate-500">Flagged Pairs</p>
                    <p className="text-lg font-bold text-slate-900">{flaggedPairs.length}</p>
                    <p className="text-[11px] text-slate-400">DRR gap &gt; 0.30</p>
                  </Card>
                  <Card className="p-3 border-l-4 border-l-orange-500">
                    <p className="text-[11px] text-slate-500">Largest Gap</p>
                    <p className="text-lg font-bold text-red-600">
                      {sortedPairs[0]?.drr_gap.toFixed(2) || "--"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {sortedPairs[0]?.sro_a.code} vs {sortedPairs[0]?.sro_b.code}
                    </p>
                  </Card>
                  <Card className="p-3 border-l-4 border-l-amber-500">
                    <p className="text-[11px] text-slate-500">Total Est. Impact</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatShort(flaggedPairs.reduce((s, p) => s + p.estimated_impact, 0))}
                    </p>
                    <p className="text-[11px] text-slate-400">flagged pairs only</p>
                  </Card>
                  <Card className="p-3 border-l-4 border-l-slate-500">
                    <p className="text-[11px] text-slate-500">Total Pairs</p>
                    <p className="text-lg font-bold text-slate-900">{officePairs.length}</p>
                    <p className="text-[11px] text-slate-400">monitored comparisons</p>
                  </Card>
                </div>

                {/* Flagged Pairs Section */}
                {flaggedPairs.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Flagged Pairs (Gap &gt; 0.30)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                      {flaggedPairs.map((pair) => {
                        const rowKey = `${pair.sro_a.code}-${pair.sro_b.code}`;
                        const isExpanded = expandedPair === rowKey;
                        return (
                          <Card
                            key={rowKey}
                            className="border-l-4 border-l-red-500 overflow-hidden"
                          >
                            <div className="px-3 py-2.5">
                              {/* Header */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900">
                                  {pair.sro_a.code} vs {pair.sro_b.code}
                                </span>
                                <span className="text-xs font-bold text-red-600">
                                  Gap {pair.drr_gap.toFixed(2)}
                                </span>
                              </div>
                              {/* Side-by-side DRR bars */}
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500 w-8 flex-shrink-0">
                                    {pair.sro_a.code}
                                  </span>
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 rounded-full"
                                      style={{ width: `${(pair.sro_a.avg_drr / maxDrr) * 100}%` }}
                                    />
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold w-7 text-right ${drrText(pair.sro_a.avg_drr)}`}
                                  >
                                    {pair.sro_a.avg_drr.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500 w-8 flex-shrink-0">
                                    {pair.sro_b.code}
                                  </span>
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-orange-500 rounded-full"
                                      style={{ width: `${(pair.sro_b.avg_drr / maxDrr) * 100}%` }}
                                    />
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold w-7 text-right ${drrText(pair.sro_b.avg_drr)}`}
                                  >
                                    {pair.sro_b.avg_drr.toFixed(2)}
                                  </span>
                                </div>
                                {/* 0.85 threshold marker */}
                                <div className="relative h-0">
                                  <div
                                    className="absolute border-l border-dashed border-red-400"
                                    style={{
                                      left: `calc(${(0.85 / maxDrr) * 100}% + 32px)`,
                                      top: -20,
                                      height: 20,
                                    }}
                                  />
                                </div>
                              </div>
                              {/* Footer metrics */}
                              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1.5">
                                <span>
                                  Impact:{" "}
                                  <span className="font-semibold text-emerald-600">
                                    {formatShort(pair.estimated_impact)}
                                  </span>
                                </span>
                                <span>{pair.severity}</span>
                                <button
                                  className="text-blue-600 hover:underline font-medium"
                                  onClick={() => setExpandedPair(isExpanded ? null : rowKey)}
                                >
                                  {isExpanded ? "Hide" : "Details"}
                                </button>
                              </div>
                              {/* Expandable details */}
                              {isExpanded && (
                                <div className="mt-2 border-t border-slate-100 pt-2 space-y-1.5 text-[10px]">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-blue-50 rounded p-1.5">
                                      <p className="font-bold text-slate-700">
                                        {pair.sro_a.code} - {pair.sro_a.name}
                                      </p>
                                      <p className="text-slate-500">
                                        Txns: {pair.sro_a.txn_count} | RC:{" "}
                                        {formatCurrency(pair.sro_a.rate_card_avg)}
                                      </p>
                                      <p className="text-slate-500">
                                        Declared: {formatCurrency(pair.sro_a.declared_avg)}
                                      </p>
                                    </div>
                                    <div className="bg-orange-50 rounded p-1.5">
                                      <p className="font-bold text-slate-700">
                                        {pair.sro_b.code} - {pair.sro_b.name}
                                      </p>
                                      <p className="text-slate-500">
                                        Txns: {pair.sro_b.txn_count} | RC:{" "}
                                        {formatCurrency(pair.sro_b.rate_card_avg)}
                                      </p>
                                      <p className="text-slate-500">
                                        Declared: {formatCurrency(pair.sro_b.declared_avg)}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-slate-500 bg-slate-50 rounded p-1.5">
                                    If {pair.lower_drr_sro} matched peer DRR, additional stamp duty
                                    ~ {formatShort(pair.estimated_impact)}/qtr. RC gap{" "}
                                    {pair.rate_card_gap_pct}%, Declared gap {pair.declared_gap_pct}
                                    %.
                                  </p>
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Other Pairs */}
                {unflaggedPairs.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Other Pairs
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                      {unflaggedPairs.map((pair) => {
                        const rowKey = `${pair.sro_a.code}-${pair.sro_b.code}`;
                        const isExpanded = expandedPair === rowKey;
                        return (
                          <Card
                            key={rowKey}
                            className="border-l-4 border-l-slate-300 overflow-hidden"
                          >
                            <div className="px-3 py-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900">
                                  {pair.sro_a.code} vs {pair.sro_b.code}
                                </span>
                                <span className="text-xs font-semibold text-slate-500">
                                  Gap {pair.drr_gap.toFixed(2)}
                                </span>
                              </div>
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500 w-8 flex-shrink-0">
                                    {pair.sro_a.code}
                                  </span>
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 rounded-full"
                                      style={{ width: `${(pair.sro_a.avg_drr / maxDrr) * 100}%` }}
                                    />
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold w-7 text-right ${drrText(pair.sro_a.avg_drr)}`}
                                  >
                                    {pair.sro_a.avg_drr.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500 w-8 flex-shrink-0">
                                    {pair.sro_b.code}
                                  </span>
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-orange-500 rounded-full"
                                      style={{ width: `${(pair.sro_b.avg_drr / maxDrr) * 100}%` }}
                                    />
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold w-7 text-right ${drrText(pair.sro_b.avg_drr)}`}
                                  >
                                    {pair.sro_b.avg_drr.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1.5">
                                <span>
                                  Impact:{" "}
                                  <span className="font-semibold text-slate-600">
                                    {formatShort(pair.estimated_impact)}
                                  </span>
                                </span>
                                <span>{pair.severity}</span>
                                <button
                                  className="text-blue-600 hover:underline font-medium"
                                  onClick={() => setExpandedPair(isExpanded ? null : rowKey)}
                                >
                                  {isExpanded ? "Hide" : "Details"}
                                </button>
                              </div>
                              {isExpanded && (
                                <div className="mt-2 border-t border-slate-100 pt-2 space-y-1.5 text-[10px]">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-blue-50 rounded p-1.5">
                                      <p className="font-bold text-slate-700">
                                        {pair.sro_a.code} - {pair.sro_a.name}
                                      </p>
                                      <p className="text-slate-500">
                                        Txns: {pair.sro_a.txn_count} | RC:{" "}
                                        {formatCurrency(pair.sro_a.rate_card_avg)}
                                      </p>
                                      <p className="text-slate-500">
                                        Declared: {formatCurrency(pair.sro_a.declared_avg)}
                                      </p>
                                    </div>
                                    <div className="bg-orange-50 rounded p-1.5">
                                      <p className="font-bold text-slate-700">
                                        {pair.sro_b.code} - {pair.sro_b.name}
                                      </p>
                                      <p className="text-slate-500">
                                        Txns: {pair.sro_b.txn_count} | RC:{" "}
                                        {formatCurrency(pair.sro_b.rate_card_avg)}
                                      </p>
                                      <p className="text-slate-500">
                                        Declared: {formatCurrency(pair.sro_b.declared_avg)}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-slate-500 bg-slate-50 rounded p-1.5">
                                    RC gap {pair.rate_card_gap_pct}%, Declared gap{" "}
                                    {pair.declared_gap_pct}%.
                                  </p>
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

        {activeView === "anomalies" && (
          <div className="space-y-3">
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Card className="p-3 border-l-4 border-l-orange-500">
                <p className="text-[11px] text-slate-500">Rate Card Anomalies</p>
                <p className="text-lg font-bold text-slate-900">{rateCardAnomalies.length}</p>
                <p className="text-[11px] text-slate-400">
                  {rateCardAnomalies.filter((r) => r.z_score > 2.5).length} high z-score
                </p>
              </Card>
              <Card className="p-3 border-l-4 border-l-red-500">
                <p className="text-[11px] text-slate-500">Declared Value Divergences</p>
                <p className="text-lg font-bold text-slate-900">{declaredTrends.length}</p>
                <p className="text-[11px] text-slate-400">
                  {declaredTrends.filter((r) => r.divergence > 10).length} high divergence
                </p>
              </Card>
              <Card className="p-3 border-l-4 border-l-amber-500">
                <p className="text-[11px] text-slate-500">Seasonal Alerts</p>
                <p className="text-lg font-bold text-slate-900">
                  {seasonalPatterns.reduce((s, r) => s + r.persistent_alerts.length, 0)}
                </p>
                <p className="text-[11px] text-slate-400">
                  across {seasonalPatterns.length} locations
                </p>
              </Card>
              <Card className="p-3 border-l-4 border-l-slate-700">
                <p className="text-[11px] text-slate-500">Avg Z-Score (Anomalies)</p>
                <p className="text-lg font-bold text-slate-900">
                  {(
                    rateCardAnomalies.reduce((s, r) => s + Math.abs(r.z_score), 0) /
                    Math.max(1, rateCardAnomalies.length)
                  ).toFixed(1)}
                </p>
                <p className="text-[11px] text-slate-400">absolute average</p>
              </Card>
            </div>

            <Tabs defaultValue="rate-card" className="w-full">
              <TabsList className="bg-slate-100">
                <TabsTrigger value="rate-card">Rate Card Anomalies</TabsTrigger>
                <TabsTrigger value="declared">Declared Value Trends</TabsTrigger>
                <TabsTrigger value="seasonal">Seasonal Patterns</TabsTrigger>
              </TabsList>

              <TabsContent value="rate-card" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {rateCardAnomalies.map((row) => {
                    const isSpike = row.z_score > 2.5;
                    const isDecline = row.z_score < -2;
                    const borderColor = isSpike
                      ? "border-l-orange-500"
                      : isDecline
                        ? "border-l-red-500"
                        : "border-l-slate-300";
                    const growthBarWidth = Math.min(Math.abs(row.growth_pct), 80);
                    const growthBarColor =
                      row.growth_pct < 0
                        ? "bg-red-500"
                        : row.growth_pct > 25
                          ? "bg-orange-500"
                          : "bg-emerald-500";
                    return (
                      <Card
                        key={`${row.location_label}-${row.sro_code}`}
                        className={`border-l-4 ${borderColor} overflow-hidden`}
                      >
                        <div className="px-3 py-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {row.location_label}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {row.sro_code} - {row.sro_name}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border flex-shrink-0 ${severityBadge[row.severity]}`}
                            >
                              {row.severity}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] text-slate-400">Prev</p>
                              <p className="text-xs font-semibold text-slate-600">
                                {formatCurrency(row.prev_rate)}
                              </p>
                            </div>
                            <TrendingUp className="w-3 h-3 text-slate-300 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[10px] text-slate-400">Current</p>
                              <p className="text-xs font-semibold text-slate-900">
                                {formatCurrency(row.current_rate)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${growthBarColor}`}
                                  style={{ width: `${growthBarWidth}%` }}
                                />
                              </div>
                              <span
                                className={`text-[11px] font-bold ${row.growth_pct < 0 ? "text-red-600" : row.growth_pct > 25 ? "text-orange-600" : "text-emerald-600"}`}
                              >
                                {row.growth_pct > 0 ? "+" : ""}
                                {row.growth_pct}%
                              </span>
                            </div>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                            <span>SRO avg: {row.sro_avg_growth}%</span>
                            <span className="flex items-center gap-1">
                              Z:{" "}
                              <span
                                className={`font-bold ${isSpike ? "text-orange-600" : isDecline ? "text-red-600" : "text-slate-600"}`}
                              >
                                {row.z_score}
                              </span>
                              {(isSpike || isDecline) && (
                                <AlertTriangle className="w-3 h-3 text-orange-500" />
                              )}
                            </span>
                            <span>{row.rule_id}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="declared" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {declaredTrends.map((row) => {
                    const growthColor = (value: number) =>
                      value > 5
                        ? "text-emerald-600"
                        : value > 1
                          ? "text-slate-600"
                          : "text-red-600";
                    const qValues = [row.q1_growth, row.q2_growth, row.q3_growth, row.q4_growth];
                    const borderColor =
                      row.divergence > 10
                        ? "border-l-red-500"
                        : row.severity === "Medium"
                          ? "border-l-amber-500"
                          : "border-l-teal-500";
                    return (
                      <Card
                        key={`${row.location_label}-${row.sro_code}`}
                        className={`border-l-4 ${borderColor} overflow-hidden`}
                      >
                        <div className="px-3 py-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {row.location_label}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {row.sro_code} - {row.sro_name}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border flex-shrink-0 ${severityBadge[row.severity]}`}
                            >
                              {row.severity}
                            </span>
                          </div>
                          {/* Inline sparkline bar */}
                          <div className="mt-2 flex items-end gap-px h-8">
                            {["Q1", "Q2", "Q3", "Q4"].map((label, i) => {
                              const val = qValues[i];
                              const maxAbs = Math.max(...qValues.map(Math.abs), 1);
                              const barH = Math.max(2, (Math.abs(val) / maxAbs) * 14);
                              const isNeg = val < 0;
                              return (
                                <div
                                  key={label}
                                  className="flex-1 flex flex-col items-center justify-end h-full"
                                  title={`${label}: ${val > 0 ? "+" : ""}${val}%`}
                                >
                                  {!isNeg && (
                                    <div
                                      className={`w-full rounded-t-sm ${val > 5 ? "bg-emerald-400" : "bg-slate-300"}`}
                                      style={{ height: barH }}
                                    />
                                  )}
                                  <div className="w-full h-px bg-slate-200" />
                                  {isNeg && (
                                    <div
                                      className="w-full rounded-b-sm bg-red-400"
                                      style={{ height: barH }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[10px]">
                            {["Q1", "Q2", "Q3", "Q4"].map((label, i) => (
                              <span
                                key={label}
                                className={`flex-1 text-center font-semibold ${growthColor(qValues[i])}`}
                              >
                                {qValues[i] > 0 ? "+" : ""}
                                {qValues[i]}%
                              </span>
                            ))}
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1.5">
                            <span>
                              RC Growth:{" "}
                              <span className="font-semibold text-slate-600">
                                {row.rate_card_growth}%
                              </span>
                            </span>
                            <span>
                              Div:{" "}
                              <span
                                className={`font-bold ${row.divergence > 10 ? "text-red-600" : "text-amber-600"}`}
                              >
                                {row.divergence}%
                              </span>
                            </span>
                            <span>{row.rule_id}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="seasonal" className="mt-4 space-y-3">
                {/* Legend */}
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Heatmap Legend:</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded" style={{ background: "#dc2626" }} /> &le; -15%
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded" style={{ background: "#fca5a5" }} /> -10% to
                    -15%
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="w-3 h-3 rounded border border-slate-200"
                      style={{ background: "#ffffff" }}
                    />{" "}
                    Neutral
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded" style={{ background: "#86efac" }} /> +10% to
                    +15%
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded" style={{ background: "#16a34a" }} /> &ge; +15%
                  </span>
                  <span className="inline-flex items-center gap-1 ml-2">
                    <AlertTriangle className="w-3 h-3 text-red-500" /> Persistent alert
                  </span>
                </div>
                {/* Heatmap table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#1B2A4A] text-xs text-slate-200 uppercase">
                        <th className="text-left px-3 py-2.5 w-[200px]">Location</th>
                        <th className="text-left px-2 py-2.5 w-[120px]">SRO</th>
                        {monthLabels.map((month) => (
                          <th key={month} className="text-center px-0 py-2.5 w-[48px]">
                            {month}
                          </th>
                        ))}
                        <th className="text-center px-2 py-2.5 w-[60px]">Alerts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {seasonalPatterns.map((row) => (
                        <tr
                          key={`${row.location_label}-${row.sro_code}`}
                          className="hover:bg-slate-50/50"
                        >
                          <td className="px-3 py-2 text-slate-700 font-medium truncate max-w-[200px]">
                            {row.location_label}
                          </td>
                          <td className="px-2 py-2 text-slate-500 text-xs truncate max-w-[120px]">
                            {row.sro_code}
                          </td>
                          {row.monthly_delta.map((delta, idx) => {
                            const bgColor =
                              delta <= -0.15
                                ? "#dc2626"
                                : delta <= -0.1
                                  ? "#fca5a5"
                                  : delta >= 0.15
                                    ? "#16a34a"
                                    : delta >= 0.1
                                      ? "#86efac"
                                      : "transparent";
                            const textColor =
                              delta <= -0.15 || delta >= 0.15
                                ? "#ffffff"
                                : delta <= -0.1
                                  ? "#991b1b"
                                  : delta >= 0.1
                                    ? "#166534"
                                    : "#94a3b8";
                            const isAlert = row.persistent_alerts.includes(idx);
                            return (
                              <td
                                key={idx}
                                className="px-0 py-1.5 text-center"
                                title={`${monthLabels[idx]}: ${Math.round(delta * 100)}% delta${isAlert ? " (persistent alert)" : ""}`}
                              >
                                <div
                                  className="mx-auto w-9 h-7 rounded flex items-center justify-center text-[10px] font-semibold"
                                  style={{ background: bgColor, color: textColor }}
                                >
                                  {isAlert ? (
                                    <AlertTriangle
                                      className="w-3 h-3"
                                      style={{ color: delta <= -0.15 ? "#ffffff" : "#dc2626" }}
                                    />
                                  ) : bgColor !== "transparent" ? (
                                    `${Math.round(delta * 100)}`
                                  ) : (
                                    ""
                                  )}
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-2 py-2 text-center">
                            {row.persistent_alerts.length > 0 ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                                {row.persistent_alerts.length}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-300">--</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent className="w-[360px] sm:max-w-[360px]">
          <SheetHeader>
            <SheetTitle>More Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs text-slate-500">SRO</label>
              <Select value={sroFilter} onValueChange={setSroFilter}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Select SRO" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SROs</SelectItem>
                  {Array.from(new Set(hotspots.map((h) => h.sro_code))).map((sro) => (
                    <SelectItem key={sro} value={sro}>
                      {sro}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500">District</label>
              <Select value={districtFilter} onValueChange={setDistrictFilter}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {Array.from(new Set(hotspots.map((h) => h.district))).map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Min Transactions</label>
              <Input
                value={minTxns}
                onChange={(e) => setMinTxns(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Min Loss (₹)</label>
              <Input
                value={minLoss}
                onChange={(e) => setMinLoss(e.target.value)}
                placeholder="e.g. 100000"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFilterOpen(false)}>
                Close
              </Button>
              <Button onClick={() => setFilterOpen(false)}>Apply</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <HotspotDrawer open={drawerOpen} onOpenChange={setDrawerOpen} detail={selectedHotspot} />
    </RevenueLeakageShell>
  );
}
