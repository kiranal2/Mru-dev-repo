"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { LeakageSignal } from "@/lib/revenue-leakage/types";
import { formatINR, type INRDisplayMode } from "@/lib/revenue-leakage/formatINR";

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
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      content,
    });
  }, []);

  const hideTooltip = useCallback(() => setTooltip(null), []);

  return { tooltip, containerRef, showTooltip, hideTooltip };
}

const SIGNAL_COLORS: Record<LeakageSignal, string> = {
  RevenueGap: "#ef4444",
  ChallanDelay: "#f59e0b",
  ExemptionRisk: "#8b5cf6",
  MarketValueRisk: "#3b82f6",
  ProhibitedLand: "#ec4899",
  DataIntegrity: "#6b7280",
  HolidayFee: "#d97706",
};

const SIGNAL_LABELS: Record<LeakageSignal, string> = {
  RevenueGap: "Revenue Gap",
  ChallanDelay: "Challan Delay",
  ExemptionRisk: "Exemption Risk",
  MarketValueRisk: "Market Value",
  ProhibitedLand: "Prohibited Land",
  DataIntegrity: "Data Integrity",
  HolidayFee: "Holiday Fee",
};

const RISK_COLORS = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

// ─── Stacked Bar: Leakage by Signal ────────────────────────────
interface SignalBarData {
  signal: LeakageSignal;
  high: number;
  medium: number;
  low: number;
  total_impact_inr: number;
}

export function LeakageBySignalChart({
  data,
  mode,
}: {
  data: SignalBarData[];
  mode: INRDisplayMode;
}) {
  const { tooltip, containerRef, showTooltip, hideTooltip } = useChartTooltip();
  // Use square-root scale so small values remain visible alongside large ones
  const totals = useMemo(() => data.map((d) => d.high + d.medium + d.low), [data]);
  const maxSqrt = useMemo(() => Math.max(...totals.map((t) => Math.sqrt(t)), 1), [totals]);
  const barW = 100 / Math.max(data.length, 1);
  const baseline = 92;
  const chartH = 80;
  const minSegH = 1.8; // minimum visible segment height

  const barTooltip = (e: React.MouseEvent, d: SignalBarData, level: string, count: number) => {
    const total = d.high + d.medium + d.low;
    showTooltip(
      e,
      <div>
        <div className="font-semibold mb-0.5">{SIGNAL_LABELS[d.signal]}</div>
        <div>
          {level}: {count} cases
        </div>
        <div className="text-slate-300">Total: {total} cases</div>
        <div className="text-slate-300">Impact: {formatINR(d.total_impact_inr, mode)}</div>
      </div>
    );
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Leakage by Signal</h3>
          <p className="text-xs text-slate-500">Case counts by risk level per signal</p>
        </div>
        <div className="flex items-center gap-3">
          {(["high", "medium", "low"] as const).map((level) => (
            <div key={level} className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <span
                className="inline-block w-3 h-3 rounded"
                style={{ background: RISK_COLORS[level] }}
              />
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </div>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="relative" style={{ height: 220 }}>
        <ChartTooltip tooltip={tooltip} />
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: 190 }}
        >
          {/* grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = baseline - (pct / 100) * chartH;
            return (
              <line key={pct} x1="2" y1={y} x2="98" y2={y} stroke="#e2e8f0" strokeWidth="0.25" />
            );
          })}
          {data.map((d, i) => {
            const total = d.high + d.medium + d.low;
            // sqrt-scale the total height, then distribute proportionally among segments
            const totalBarH = (Math.sqrt(total) / maxSqrt) * chartH;
            const lH =
              total > 0 ? Math.max(d.low > 0 ? minSegH : 0, (d.low / total) * totalBarH) : 0;
            const mH =
              total > 0 ? Math.max(d.medium > 0 ? minSegH : 0, (d.medium / total) * totalBarH) : 0;
            const hH =
              total > 0 ? Math.max(d.high > 0 ? minSegH : 0, (d.high / total) * totalBarH) : 0;
            const x = i * barW + barW * 0.15;
            const w = barW * 0.7;

            // Stack from bottom: low, then medium, then high
            const lowY = baseline - lH;
            const medY = lowY - mH;
            const highY = medY - hH;

            return (
              <g key={d.signal}>
                {/* low segment */}
                {d.low > 0 && (
                  <rect
                    x={x}
                    y={lowY}
                    width={w}
                    height={lH}
                    fill={RISK_COLORS.low}
                    rx="0.4"
                    className="cursor-pointer"
                    onMouseMove={(e) => barTooltip(e, d, "Low", d.low)}
                    onMouseLeave={hideTooltip}
                  />
                )}
                {/* medium segment */}
                {d.medium > 0 && (
                  <rect
                    x={x}
                    y={medY}
                    width={w}
                    height={mH}
                    fill={RISK_COLORS.medium}
                    rx="0.4"
                    className="cursor-pointer"
                    onMouseMove={(e) => barTooltip(e, d, "Medium", d.medium)}
                    onMouseLeave={hideTooltip}
                  />
                )}
                {/* high segment */}
                {d.high > 0 && (
                  <rect
                    x={x}
                    y={highY}
                    width={w}
                    height={hH}
                    fill={RISK_COLORS.high}
                    rx="0.4"
                    className="cursor-pointer"
                    onMouseMove={(e) => barTooltip(e, d, "High", d.high)}
                    onMouseLeave={hideTooltip}
                  />
                )}
                {/* count label above bar */}
                {total > 0 && (
                  <text
                    x={x + w / 2}
                    y={highY - 1.5}
                    textAnchor="middle"
                    fontSize="3.2"
                    fontWeight="600"
                    fill="#334155"
                  >
                    {total}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {/* X axis labels — positioned below the SVG */}
        <div className="flex" style={{ marginTop: -4 }}>
          {data.map((d) => (
            <div key={d.signal} className="flex-1 text-center">
              <span className="text-[10px] font-medium text-slate-600 leading-none">
                {SIGNAL_LABELS[d.signal].split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Donut: Impact Share ────────────────────────────────────────
export function ImpactShareDonut({
  data,
  totalGap,
  mode,
}: {
  data: SignalBarData[];
  totalGap: number;
  mode: INRDisplayMode;
}) {
  const slices = useMemo(() => {
    const total = data.reduce((s, d) => s + d.total_impact_inr, 0) || 1;
    const minAngle = 8; // minimum degrees so every non-zero slice is visible
    const nonZero = data.filter((d) => d.total_impact_inr > 0);
    const reservedAngle =
      nonZero.filter((d) => (d.total_impact_inr / total) * 360 < minAngle).length * minAngle;
    const remainAngle = 360 - reservedAngle;

    let cumAngle = 0;
    return data.map((d) => {
      const rawPct = d.total_impact_inr / total;
      const rawAngle = rawPct * 360;
      // If slice is below min, use minAngle; otherwise scale proportionally within remaining space
      const adjustedAngle =
        d.total_impact_inr === 0
          ? 0
          : rawAngle < minAngle
            ? minAngle
            : (rawAngle / (360 - reservedAngle)) * remainAngle;
      const startAngle = cumAngle;
      cumAngle += adjustedAngle;
      return { ...d, pct: rawPct, startAngle, endAngle: cumAngle };
    });
  }, [data]);

  const describeArc = (cx: number, cy: number, r: number, startDeg: number, endDeg: number) => {
    const rad = (d: number) => (d - 90) * (Math.PI / 180);
    const s = { x: cx + r * Math.cos(rad(startDeg)), y: cy + r * Math.sin(rad(startDeg)) };
    const e = { x: cx + r * Math.cos(rad(endDeg)), y: cy + r * Math.sin(rad(endDeg)) };
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const formatPct = (pct: number) => {
    const val = pct * 100;
    if (val === 0) return "0%";
    if (val < 1) return `<1%`;
    return `${Math.round(val)}%`;
  };

  const { tooltip, containerRef, showTooltip, hideTooltip } = useChartTooltip();

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-1">Leakage Impact Share</h3>
      <p className="text-xs text-slate-500 mb-3">Impact distribution by signal type</p>
      <div ref={containerRef} className="relative flex items-center gap-4">
        <ChartTooltip tooltip={tooltip} />
        <div className="relative" style={{ width: 140, height: 140 }}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {slices.map((s) => {
              if (s.endAngle - s.startAngle < 0.1) return null;
              return (
                <path
                  key={s.signal}
                  d={describeArc(
                    50,
                    50,
                    38,
                    s.startAngle,
                    Math.min(s.endAngle, s.startAngle + 359.9)
                  )}
                  fill="none"
                  stroke={SIGNAL_COLORS[s.signal]}
                  strokeWidth="12"
                  strokeLinecap="butt"
                  className="cursor-pointer"
                  onMouseMove={(e) =>
                    showTooltip(
                      e,
                      <div>
                        <div className="font-semibold mb-0.5">{SIGNAL_LABELS[s.signal]}</div>
                        <div>{formatINR(s.total_impact_inr, mode)}</div>
                        <div className="text-slate-300">
                          {s.pct > 0 && s.pct < 0.01 ? "<1" : Math.round(s.pct * 100)}% of total
                        </div>
                      </div>
                    )
                  }
                  onMouseLeave={hideTooltip}
                />
              );
            })}
            <text x="50" y="47" textAnchor="middle" fontSize="6" fill="#334155" fontWeight="600">
              {formatINR(totalGap, "auto")}
            </text>
            <text x="50" y="56" textAnchor="middle" fontSize="3.5" fill="#64748b">
              Total Gap
            </text>
          </svg>
        </div>
        <div className="flex-1 space-y-1.5">
          {slices.map((s) => (
            <div key={s.signal} className="flex items-center gap-2 text-xs">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: SIGNAL_COLORS[s.signal] }}
              />
              <span className="text-slate-600 flex-1 truncate">{SIGNAL_LABELS[s.signal]}</span>
              <span className="font-semibold text-slate-800 tabular-nums w-10 text-right">
                {formatPct(s.pct)}
              </span>
              {s.total_impact_inr > 0 && (
                <span className="text-[10px] text-slate-400 w-14 text-right">
                  {formatINR(s.total_impact_inr, "auto")}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Line: Gap Trend Over Time ──────────────────────────────────
interface GapTrendPoint {
  month: string;
  total_gap: number;
  total_payable: number;
  rolling_avg: number;
}

export function GapTrendLineChart({
  data,
  showRollingAvg,
  mode,
}: {
  data: GapTrendPoint[];
  showRollingAvg: boolean;
  mode: INRDisplayMode;
}) {
  const { tooltip, containerRef, showTooltip, hideTooltip } = useChartTooltip();
  const maxY = useMemo(
    () => Math.max(...data.flatMap((d) => [d.total_gap, d.total_payable, d.rolling_avg]), 1),
    [data]
  );

  const toPath = (values: number[]) => {
    const pts = values.map((v, i) => {
      const x = data.length > 1 ? (i / (data.length - 1)) * 94 + 3 : 50;
      const y = 90 - (v / maxY) * 80;
      return `${x},${y}`;
    });
    return `M ${pts.join(" L ")}`;
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-1">Gap Trend Over Time</h3>
      <p className="text-xs text-slate-500 mb-3">Monthly gap and payable trends</p>
      <div ref={containerRef} className="relative" style={{ height: 160 }}>
        <ChartTooltip tooltip={tooltip} />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = 90 - (pct / 100) * 80;
            return (
              <line key={pct} x1="3" y1={y} x2="97" y2={y} stroke="#e2e8f0" strokeWidth="0.3" />
            );
          })}
          {/* payable line */}
          <path
            d={toPath(data.map((d) => d.total_payable))}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="0.6"
            strokeDasharray="2,1"
          />
          {/* gap line */}
          <path
            d={toPath(data.map((d) => d.total_gap))}
            fill="none"
            stroke="#ef4444"
            strokeWidth="0.8"
          />
          {/* rolling avg */}
          {showRollingAvg && (
            <path
              d={toPath(data.map((d) => d.rolling_avg))}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.6"
              strokeDasharray="1.5,1"
            />
          )}
          {/* dots for gap — with larger invisible hit area */}
          {data.map((d, i) => {
            const x = data.length > 1 ? (i / (data.length - 1)) * 94 + 3 : 50;
            const y = 90 - (d.total_gap / maxY) * 80;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="1.2" fill="#ef4444" />
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseMove={(e) =>
                    showTooltip(
                      e,
                      <div>
                        <div className="font-semibold mb-0.5">{d.month}</div>
                        <div>Gap: {formatINR(d.total_gap, mode)}</div>
                        <div className="text-slate-300">
                          Payable: {formatINR(d.total_payable, mode)}
                        </div>
                      </div>
                    )
                  }
                  onMouseLeave={hideTooltip}
                />
              </g>
            );
          })}
        </svg>
        <div className="flex justify-between mt-1 px-1">
          {data.map((d) => (
            <span key={d.month} className="text-[10px] text-slate-400">
              {d.month.slice(5)}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2 justify-center text-[10px] text-slate-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-red-500 rounded" /> Gap
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-0.5 bg-slate-400 rounded border-dashed"
            style={{ borderTop: "1px dashed #94a3b8", height: 0 }}
          />{" "}
          Payable
        </span>
        {showRollingAvg && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-blue-500 rounded" /> Rolling Avg
          </span>
        )}
      </div>
    </Card>
  );
}

// ─── Funnel: Status Funnel ──────────────────────────────────────
interface FunnelItem {
  status: string;
  count: number;
  pct: number;
}

const FUNNEL_COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#22c55e"];

export function StatusFunnelChart({ data }: { data: FunnelItem[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-1">Case Status Funnel</h3>
      <p className="text-xs text-slate-500 mb-3">Progression from New to Resolved</p>
      <div className="space-y-2">
        {data.map((d, i) => {
          const widthPct = Math.max(10, (d.count / maxCount) * 100);
          return (
            <div key={d.status}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-slate-700 font-medium">{d.status}</span>
                <span className="text-slate-500">
                  {d.count} ({d.pct}%)
                </span>
              </div>
              <div className="h-5 rounded-md overflow-hidden bg-slate-100">
                <div
                  className="h-full rounded-md transition-all"
                  style={{
                    width: `${widthPct}%`,
                    background: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Micro Sparkline (inline for KPI cards) ─────────────────────
export function MicroSparkline({
  values,
  color = "#3b82f6",
}: {
  values: number[];
  color?: string;
}) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = values.length > 1 ? (i / (values.length - 1)) * 48 : 24;
    const y = 16 - ((v - min) / range) * 14;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 48 18" className="w-12 h-4 inline-block ml-1">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
