"use client";

import { useState, useMemo } from "react";
import {
  useIGRSPatterns,
  useIGRSMVHotspots,
  useIGRSOffices,
  useIGRSTrends,
} from "@/hooks/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

// ─── Utility ─────────────────────────────────────────────────────────────────

function formatInr(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function pctLabel(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

// ─── Dimension types ─────────────────────────────────────────────────────────

type Dimension = "district" | "severity" | "locationType" | "status" | "sroCode";

const DIMENSION_LABELS: Record<Dimension, string> = {
  district: "District",
  severity: "Severity",
  locationType: "Location Type",
  status: "Status",
  sroCode: "SRO Office",
};

// ─── Inline SVG charts ───────────────────────────────────────────────────────

/** Horizontal distribution bars for a single dimension */
function DistributionBars({
  buckets,
}: {
  buckets: Array<{ label: string; value: number; pct: number }>;
}) {
  const max = Math.max(...buckets.map((b) => b.value), 1);
  return (
    <div className="space-y-1.5">
      {buckets.map((b) => (
        <div key={b.label} className="flex items-center gap-2 text-xs">
          <span className="w-28 truncate text-right text-slate-600">{b.label}</span>
          <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded transition-all"
              style={{ width: `${(b.value / max) * 100}%` }}
            />
          </div>
          <span className="w-14 text-right font-medium">{b.value}</span>
          <span className="w-10 text-right text-slate-400">{pctLabel(b.pct)}</span>
        </div>
      ))}
    </div>
  );
}

/** Cross-dimension heatmap grid */
function CrossDimensionMatrix({
  rows,
  cols,
  matrix,
}: {
  rows: string[];
  cols: string[];
  matrix: Record<string, Record<string, number>>;
}) {
  const allVals = Object.values(matrix).flatMap((r) => Object.values(r));
  const maxVal = Math.max(...allVals, 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="py-1 px-2 text-left text-slate-500" />
            {cols.map((c) => (
              <th key={c} className="py-1 px-2 text-center text-slate-500 min-w-[60px]">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <td className="py-1 px-2 text-slate-600 font-medium whitespace-nowrap">{r}</td>
              {cols.map((c) => {
                const val = matrix[r]?.[c] || 0;
                const intensity = val / maxVal;
                const bg =
                  intensity > 0.7
                    ? "bg-red-200 text-red-900"
                    : intensity > 0.4
                      ? "bg-amber-100 text-amber-800"
                      : intensity > 0
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-50 text-slate-300";
                return (
                  <td key={c} className={`py-1 px-2 text-center rounded ${bg}`}>
                    {val || "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Monthly trend sparkline for pattern detection context */
function TrendSparkline({
  data,
}: {
  data: Array<{ month: string; gapInr: number }>;
}) {
  if (data.length < 2) return null;
  const w = 200;
  const h = 40;
  const maxGap = Math.max(...data.map((d) => d.gapInr), 1);
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - (d.gapInr / maxGap) * (h - 4) - 2,
  }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[200px]" preserveAspectRatio="xMidYMid meet">
      <path d={path} fill="none" stroke="#3b82f6" strokeWidth={1.5} />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={1.5} fill="#3b82f6" />
      ))}
    </svg>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PatternsPage() {
  const patterns = useIGRSPatterns();
  const hotspots = useIGRSMVHotspots();
  const offices = useIGRSOffices();
  const trends = useIGRSTrends();

  const [primaryDim, setPrimaryDim] = useState<Dimension>("district");
  const [crossDim, setCrossDim] = useState<Dimension>("severity");

  const loading = patterns.loading || hotspots.loading || offices.loading || trends.loading;
  const error = patterns.error || hotspots.error || offices.error || trends.error;

  // ── Computed KPIs ──
  const kpis = useMemo(() => {
    const hs = hotspots.data;
    const totalHotspots = hs.length;
    const totalEstLoss = hs.reduce((sum, h) => sum + h.estimatedLoss, 0);
    const avgDrr = hs.length ? hs.reduce((sum, h) => sum + h.drr, 0) / hs.length : 0;
    const totalTxns = hs.reduce((sum, h) => sum + h.transactionCount, 0);
    const criticalCount = hs.filter((h) => h.severity === "Critical").length;
    return { totalHotspots, totalEstLoss, avgDrr, totalTxns, criticalCount };
  }, [hotspots.data]);

  // ── Primary dimension distribution ──
  const distribution = useMemo(() => {
    const hs = hotspots.data;
    if (!hs.length) return [];
    const grouped: Record<string, number> = {};
    hs.forEach((h) => {
      const key =
        primaryDim === "district"
          ? h.district
          : primaryDim === "severity"
            ? h.severity
            : primaryDim === "locationType"
              ? h.locationType
              : primaryDim === "status"
                ? h.status
                : h.sroCode;
      grouped[key] = (grouped[key] || 0) + 1;
    });
    const total = hs.length;
    return Object.entries(grouped)
      .map(([label, value]) => ({ label, value, pct: value / total }))
      .sort((a, b) => b.value - a.value);
  }, [hotspots.data, primaryDim]);

  // ── Cross-dimension matrix ──
  const crossMatrix = useMemo(() => {
    const hs = hotspots.data;
    if (!hs.length) return { rows: [] as string[], cols: [] as string[], matrix: {} as Record<string, Record<string, number>> };
    const getVal = (h: (typeof hs)[0], dim: Dimension) =>
      dim === "district"
        ? h.district
        : dim === "severity"
          ? h.severity
          : dim === "locationType"
            ? h.locationType
            : dim === "status"
              ? h.status
              : h.sroCode;

    const rowSet = new Set<string>();
    const colSet = new Set<string>();
    const matrix: Record<string, Record<string, number>> = {};

    hs.forEach((h) => {
      const r = getVal(h, primaryDim);
      const c = getVal(h, crossDim);
      rowSet.add(r);
      colSet.add(c);
      if (!matrix[r]) matrix[r] = {};
      matrix[r][c] = (matrix[r][c] || 0) + 1;
    });

    return {
      rows: Array.from(rowSet).sort(),
      cols: Array.from(colSet).sort(),
      matrix,
    };
  }, [hotspots.data, primaryDim, crossDim]);

  const handleRefresh = () => {
    patterns.refetch();
    hotspots.refetch();
    offices.refetch();
    trends.refetch();
  };

  if (loading && !hotspots.data.length)
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );

  if (error && !hotspots.data.length)
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

  // ── Pattern type grouping ──
  const patternTypes = useMemo(() => {
    const grouped: Record<string, typeof patterns.data> = {};
    patterns.data.forEach((p) => {
      if (!grouped[p.type]) grouped[p.type] = [];
      grouped[p.type].push(p);
    });
    return grouped;
  }, [patterns.data]);

  const typeColors: Record<string, { border: string; badge: string }> = {
    spike: { border: "border-l-red-500", badge: "bg-red-100 text-red-700" },
    trend: { border: "border-l-blue-500", badge: "bg-blue-100 text-blue-700" },
    anomaly: { border: "border-l-purple-500", badge: "bg-purple-100 text-purple-700" },
    cluster: { border: "border-l-amber-500", badge: "bg-amber-100 text-amber-700" },
    decline: { border: "border-l-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
    seasonal: { border: "border-l-green-500", badge: "bg-green-100 text-green-700" },
    outlier: { border: "border-l-orange-500", badge: "bg-orange-100 text-orange-700" },
  };

  const dimensions: Dimension[] = ["district", "severity", "locationType", "status", "sroCode"];
  const crossDimensions = dimensions.filter((d) => d !== primaryDim);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pattern Detection</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {patterns.data.length} patterns detected across {hotspots.data.length} MV hotspots
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-lg border bg-blue-50 border-blue-100 p-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">MV Hotspots</div>
          <div className="text-xl font-bold text-slate-800">{kpis.totalHotspots}</div>
          <div className="text-[10px] text-slate-500">{kpis.criticalCount} critical</div>
        </div>
        <div className="rounded-lg border bg-red-50 border-red-100 p-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Est. Loss</div>
          <div className="text-xl font-bold text-slate-800">{formatInr(kpis.totalEstLoss)}</div>
          <div className="text-[10px] text-slate-500">across all hotspots</div>
        </div>
        <div className="rounded-lg border bg-amber-50 border-amber-100 p-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Avg DRR</div>
          <div className="text-xl font-bold text-slate-800">{(kpis.avgDrr * 100).toFixed(0)}%</div>
          <div className="text-[10px] text-slate-500">declared / rate card</div>
        </div>
        <div className="rounded-lg border bg-purple-50 border-purple-100 p-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Transactions</div>
          <div className="text-xl font-bold text-slate-800">{kpis.totalTxns}</div>
          <div className="text-[10px] text-slate-500">in hotspot zones</div>
        </div>
        <div className="rounded-lg border bg-emerald-50 border-emerald-100 p-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Trend (12m)</div>
          <TrendSparkline data={trends.data} />
        </div>
      </div>

      {/* Dimension Selectors */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Multi-Dimension Analysis</CardTitle>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Cross:</span>
              <select
                value={crossDim}
                onChange={(e) => setCrossDim(e.target.value as Dimension)}
                className="border rounded px-2 py-1 text-xs bg-white"
              >
                {crossDimensions.map((d) => (
                  <option key={d} value={d}>
                    {DIMENSION_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {dimensions.map((d) => (
              <Button
                key={d}
                variant={primaryDim === d ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setPrimaryDim(d);
                  if (crossDim === d) {
                    setCrossDim(crossDimensions.find((x) => x !== d) || crossDimensions[0]);
                  }
                }}
              >
                {DIMENSION_LABELS[d]}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribution */}
            <div>
              <h3 className="text-xs font-medium text-slate-500 mb-2">
                Distribution by {DIMENSION_LABELS[primaryDim]}
              </h3>
              <DistributionBars buckets={distribution} />
            </div>

            {/* Cross-dimension */}
            <div>
              <h3 className="text-xs font-medium text-slate-500 mb-2">
                {DIMENSION_LABELS[primaryDim]} × {DIMENSION_LABELS[crossDim]}
              </h3>
              <CrossDimensionMatrix
                rows={crossMatrix.rows}
                cols={crossMatrix.cols}
                matrix={crossMatrix.matrix}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hotspot Detail Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">MV Hotspot Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="text-left py-2 px-2">Location</th>
                  <th className="text-left py-2 px-2">SRO</th>
                  <th className="text-left py-2 px-2">District</th>
                  <th className="text-center py-2 px-2">Type</th>
                  <th className="text-center py-2 px-2">Severity</th>
                  <th className="text-center py-2 px-2">DRR</th>
                  <th className="text-right py-2 px-2">Rate Card</th>
                  <th className="text-right py-2 px-2">Declared</th>
                  <th className="text-right py-2 px-2">Est. Loss</th>
                  <th className="text-center py-2 px-2">Txns</th>
                  <th className="text-center py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...hotspots.data]
                  .sort((a, b) => a.drr - b.drr)
                  .map((h) => (
                    <tr key={h.caseId} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-2 font-medium">{h.locationLabel}</td>
                      <td className="py-2 px-2 text-slate-500">{h.sroName}</td>
                      <td className="py-2 px-2 text-slate-500">{h.district}</td>
                      <td className="py-2 px-2 text-center">
                        <Badge variant="outline" className="text-[10px]">
                          {h.locationType}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <Badge
                          variant={
                            h.severity === "Critical"
                              ? "destructive"
                              : h.severity === "High"
                                ? "destructive"
                                : h.severity === "Medium"
                                  ? "secondary"
                                  : "outline"
                          }
                          className="text-[10px]"
                        >
                          {h.severity}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-center">
                        {/* DRR visual indicator */}
                        <div className="flex items-center gap-1 justify-center">
                          <div className="w-12 h-2 bg-slate-100 rounded overflow-hidden">
                            <div
                              className={`h-full rounded ${h.drr < 0.65 ? "bg-red-500" : h.drr < 0.75 ? "bg-amber-500" : "bg-green-500"}`}
                              style={{ width: `${h.drr * 100}%` }}
                            />
                          </div>
                          <span className="font-mono">{(h.drr * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right">₹{h.rateCardUnitRate.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-2 text-right">₹{h.medianDeclared.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-2 text-right font-medium">{formatInr(h.estimatedLoss)}</td>
                      <td className="py-2 px-2 text-center">{h.transactionCount}</td>
                      <td className="py-2 px-2 text-center">
                        <Badge variant="outline" className="text-[10px]">
                          {h.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pattern Detection Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Detected Patterns</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(patternTypes).map(([type, items]) => (
            <span
              key={type}
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[type]?.badge || "bg-slate-100 text-slate-700"}`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}: {items.length}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patterns.data.map((pattern) => {
            const colors = typeColors[pattern.type] || {
              border: "border-l-slate-400",
              badge: "bg-slate-100 text-slate-700",
            };
            return (
              <Card key={pattern.id} className={`border-l-4 ${colors.border}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{pattern.metric}</CardTitle>
                    <span className="text-lg font-bold text-slate-800">{pattern.magnitude}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colors.badge}`}>
                      {pattern.type}
                    </span>
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
    </div>
  );
}
