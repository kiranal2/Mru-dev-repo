"use client";

import { useEffect, useState, useMemo } from "react";
import { RevenueLeakageShell } from "@/components/revenue-leakage/revenue-leakage-shell";
import { revenueLeakageApi } from "@/lib/revenue-leakage/revenueLeakageApi";
import { PatternDimension, RegistrationPatternSummary } from "@/lib/revenue-leakage/types";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Calendar,
  Building2,
  Landmark,
  FileText,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatCompact = (value: number) => {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString("en-IN");
};

const dimensionMeta: Record<
  PatternDimension,
  { label: string; icon: typeof MapPin; color: string }
> = {
  geography: { label: "Geography", icon: MapPin, color: "text-blue-600 bg-blue-100" },
  time: { label: "Time", icon: Calendar, color: "text-emerald-600 bg-emerald-100" },
  propertyType: { label: "Property Type", icon: Building2, color: "text-violet-600 bg-violet-100" },
  landNature: { label: "Land Nature", icon: Landmark, color: "text-amber-600 bg-amber-100" },
  docType: { label: "Document Type", icon: FileText, color: "text-pink-600 bg-pink-100" },
  valuationSlab: { label: "Valuation Slab", icon: IndianRupee, color: "text-cyan-600 bg-cyan-100" },
};

const allDimensions: PatternDimension[] = [
  "geography",
  "time",
  "propertyType",
  "landNature",
  "docType",
  "valuationSlab",
];

/* ─── Inline SVG: Distribution Bar Chart ─── */
function DistributionBars({
  data,
  valueKey,
  labelSuffix,
}: {
  data: Array<{ label: string; value: number; high: number; medium: number; low: number }>;
  valueKey: "registrations" | "gap";
  labelSuffix?: string;
}) {
  if (!data?.length) return null;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barH = 32;
  const gap = 6;
  const labelW = 120;
  const chartW = 360;
  const svgH = data.length * (barH + gap) + gap;

  return (
    <svg
      viewBox={`0 0 ${labelW + chartW + 90} ${svgH}`}
      className="w-full"
      style={{ maxHeight: Math.min(400, svgH + 10) }}
    >
      {data.map((d, i) => {
        const y = i * (barH + gap) + gap;
        const totalW = (d.value / maxVal) * chartW;
        const total = d.high + d.medium + d.low;
        const wH = total > 0 ? (d.high / total) * totalW : 0;
        const wM = total > 0 ? (d.medium / total) * totalW : 0;
        const wL = total > 0 ? (d.low / total) * totalW : totalW;
        return (
          <g key={d.label}>
            <text
              x={labelW - 6}
              y={y + barH / 2 + 4}
              textAnchor="end"
              className="text-[11px] fill-slate-600 font-medium"
            >
              {d.label.length > 16 ? d.label.slice(0, 14) + ".." : d.label}
            </text>
            <rect x={labelW} y={y} width={Math.max(wH, 0)} height={barH} rx={4} fill="#dc2626" />
            <rect x={labelW + wH} y={y} width={Math.max(wM, 0)} height={barH} fill="#f59e0b" />
            <rect
              x={labelW + wH + wM}
              y={y}
              width={Math.max(wL, 0)}
              height={barH}
              rx={4}
              fill="#10b981"
            />
            <text
              x={labelW + totalW + 6}
              y={y + barH / 2 + 4}
              className="text-[11px] fill-slate-700 font-bold"
            >
              {valueKey === "gap" ? formatCompact(d.value) : d.value}
              {labelSuffix || ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Cross-Dimension Heatmap ─── */
function CrossDimensionMatrix({ matrix }: { matrix: RegistrationPatternSummary["matrix"] }) {
  const { row_keys, col_keys, cells } = matrix;
  if (!row_keys.length || !col_keys.length) return null;

  const allValues: number[] = [];
  row_keys.forEach((rk) => col_keys.forEach((ck) => allValues.push(cells[rk]?.[ck] || 0)));
  const maxVal = Math.max(...allValues, 1);

  const getColor = (v: number) => {
    if (v === 0) return "bg-slate-50 text-slate-400";
    const pct = v / maxVal;
    if (pct > 0.75) return "bg-red-500 text-white";
    if (pct > 0.5) return "bg-orange-400 text-white";
    if (pct > 0.25) return "bg-amber-300 text-slate-900";
    return "bg-emerald-100 text-slate-700";
  };

  const rowLabel = dimensionMeta[matrix.row_dimension]?.label || matrix.row_dimension;
  const colLabel = dimensionMeta[matrix.col_dimension]?.label || matrix.col_dimension;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{rowLabel}</span>
        <ArrowRight className="w-3 h-3 text-slate-400" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{colLabel}</span>
      </div>
      <div className="overflow-auto">
        <table
          className="text-xs border-collapse"
          style={{ minWidth: Math.max(400, col_keys.length * 80 + 130) }}
        >
          <thead>
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-600 bg-slate-50 border border-slate-200 sticky left-0 z-10 min-w-[120px]">
                {rowLabel}
              </th>
              {col_keys.map((ck) => (
                <th
                  key={ck}
                  className="px-3 py-2 text-center font-semibold text-slate-600 bg-slate-50 border border-slate-200 whitespace-nowrap min-w-[70px]"
                >
                  {ck.length > 12 ? ck.slice(0, 10) + ".." : ck}
                </th>
              ))}
              <th className="px-3 py-2 text-center font-bold text-slate-700 bg-slate-100 border border-slate-200">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {row_keys.map((rk) => {
              const rowTotal = col_keys.reduce((sum, ck) => sum + (cells[rk]?.[ck] || 0), 0);
              return (
                <tr key={rk}>
                  <td className="px-3 py-2 font-semibold text-slate-900 border border-slate-200 bg-white sticky left-0 z-10 whitespace-nowrap">
                    {rk.length > 16 ? rk.slice(0, 14) + ".." : rk}
                  </td>
                  {col_keys.map((ck) => {
                    const v = cells[rk]?.[ck] || 0;
                    return (
                      <td
                        key={ck}
                        className={`px-3 py-2 text-center font-bold border border-slate-200 ${getColor(v)} transition-colors`}
                      >
                        {v || "—"}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center font-bold text-slate-800 bg-slate-50 border border-slate-200">
                    {rowTotal}
                  </td>
                </tr>
              );
            })}
            {/* Column totals */}
            <tr>
              <td className="px-3 py-2 font-bold text-slate-700 bg-slate-100 border border-slate-200 sticky left-0 z-10">
                Total
              </td>
              {col_keys.map((ck) => {
                const colTotal = row_keys.reduce((sum, rk) => sum + (cells[rk]?.[ck] || 0), 0);
                return (
                  <td
                    key={ck}
                    className="px-3 py-2 text-center font-bold text-slate-800 bg-slate-100 border border-slate-200"
                  >
                    {colTotal}
                  </td>
                );
              })}
              <td className="px-3 py-2 text-center font-black text-slate-900 bg-slate-200 border border-slate-200">
                {row_keys.reduce(
                  (sum, rk) => sum + col_keys.reduce((s, ck) => s + (cells[rk]?.[ck] || 0), 0),
                  0
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 mt-3">
        <span className="text-[10px] text-slate-500 uppercase font-bold">Concentration:</span>
        {[
          { label: "None", cls: "bg-slate-50 border-slate-200" },
          { label: "Low", cls: "bg-emerald-100 border-emerald-200" },
          { label: "Med", cls: "bg-amber-300 border-amber-400" },
          { label: "High", cls: "bg-orange-400 border-orange-500" },
          { label: "V. High", cls: "bg-red-500 border-red-600" },
        ].map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1 text-[10px] text-slate-600">
            <span className={`w-3 h-3 rounded-sm border ${l.cls} inline-block`} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RegistrationPatternsPage() {
  const [data, setData] = useState<RegistrationPatternSummary | null>(null);
  const [primaryDim, setPrimaryDim] = useState<PatternDimension>("geography");
  const [secondaryDim, setSecondaryDim] = useState<PatternDimension>("docType");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    revenueLeakageApi.getRegistrationPatterns(primaryDim, secondaryDim).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [primaryDim, secondaryDim]);

  const secondaryOptions = useMemo(
    () => allDimensions.filter((d) => d !== primaryDim),
    [primaryDim]
  );

  // Auto-fix secondary if it matches primary
  useEffect(() => {
    if (secondaryDim === primaryDim) {
      setSecondaryDim(secondaryOptions[0]);
    }
  }, [primaryDim, secondaryDim, secondaryOptions]);

  const regBars = useMemo(() => {
    if (!data) return [];
    return data.buckets.map((b) => ({
      label: b.label,
      value: b.total_registrations,
      high: b.high_risk_count,
      medium: b.medium_risk_count,
      low: b.low_risk_count,
    }));
  }, [data]);

  const gapBars = useMemo(() => {
    if (!data) return [];
    return data.buckets
      .filter((b) => b.total_gap > 0)
      .sort((a, b) => b.total_gap - a.total_gap)
      .map((b) => ({
        label: b.label,
        value: b.total_gap,
        high: b.high_risk_count,
        medium: b.medium_risk_count,
        low: b.low_risk_count,
      }));
  }, [data]);

  return (
    <RevenueLeakageShell subtitle="Multi-dimensional registration pattern analysis">
      <div className="px-6 py-3 space-y-4">
        {/* ─── KPI Summary Strip ─── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
          <Card className="p-3 bg-blue-50/40 border-blue-200">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-[11px] font-medium text-blue-600">Total Registrations</p>
            </div>
            <p className="text-xl font-bold text-blue-700">{data?.total_registrations ?? "—"}</p>
          </Card>
          <Card className="p-3 bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-[11px] font-medium text-emerald-600">Total Market Value</p>
            </div>
            <p className="text-lg font-bold text-emerald-700">
              {data ? formatCompact(data.total_mv) : "—"}
            </p>
          </Card>
          <Card className="p-3 bg-slate-50 border-slate-200">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-[11px] font-medium text-slate-500">Avg Market Value</p>
            </div>
            <p className="text-lg font-bold text-slate-700">
              {data ? formatCompact(data.avg_mv) : "—"}
            </p>
          </Card>
          <Card className="p-3 bg-red-50 border-red-200">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <p className="text-[11px] font-medium text-red-600">Total Gap</p>
            </div>
            <p className="text-lg font-bold text-red-700">
              {data ? formatCompact(data.total_gap) : "—"}
            </p>
          </Card>
          <Card className="p-3 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-[11px] font-medium text-amber-600">High Risk %</p>
            </div>
            <p className="text-xl font-bold text-amber-700">{data?.high_risk_pct ?? "—"}%</p>
          </Card>
        </div>

        {/* ─── Dimension Selectors ─── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Analyze by
            </span>
            <div className="flex items-center gap-1">
              {allDimensions.map((dim) => {
                const meta = dimensionMeta[dim];
                const Icon = meta.icon;
                const isActive = primaryDim === dim;
                return (
                  <button
                    key={dim}
                    onClick={() => setPrimaryDim(dim)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                      isActive
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-300">|</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Cross with
            </span>
            <Select
              value={secondaryDim}
              onValueChange={(v) => setSecondaryDim(v as PatternDimension)}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {secondaryOptions.map((dim) => (
                  <SelectItem key={dim} value={dim}>
                    {dimensionMeta[dim].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="h-60 flex items-center justify-center">
            <div className="text-sm text-slate-400">Loading patterns...</div>
          </div>
        ) : data ? (
          <>
            {/* ─── Distribution Charts ─── */}
            {/* <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Distribution by {dimensionMeta[primaryDim].label}
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              
                <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      Registrations by {dimensionMeta[primaryDim].label}
                    </h3>
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
                    <DistributionBars data={regBars} valueKey="registrations" />
                  </div>
                </div>

          
                <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b">
                    <h3 className="text-sm font-bold text-slate-900">
                      Revenue Gap by {dimensionMeta[primaryDim].label}
                    </h3>
                  </div>
                  <div className="p-4">
                    {gapBars.length > 0 ? (
                      <DistributionBars data={gapBars} valueKey="gap" />
                    ) : (
                      <div className="h-32 flex items-center justify-center text-xs text-slate-400">
                        No gap data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div> */}

            {/* ─── Cross-Dimension Matrix ─── */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Cross-Dimension Analysis
              </h2>
              <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b">
                  <h3 className="text-sm font-bold text-slate-900">
                    {dimensionMeta[primaryDim].label} vs {dimensionMeta[secondaryDim].label}
                  </h3>
                </div>
                <div className="p-4">
                  <CrossDimensionMatrix matrix={data.matrix} />
                </div>
              </div>
            </div>

            {/* ─── Detail Table ─── */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Breakdown Detail
              </h2>
              <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-slate-200 bg-slate-800">
                      <tr>
                        <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold">
                          {dimensionMeta[primaryDim].label}
                        </th>
                        <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold">
                          Registrations
                        </th>
                        <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold">
                          Total MV
                        </th>
                        <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold">
                          Avg MV
                        </th>
                        <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold">
                          Total Gap
                        </th>
                        <th className="px-3 py-2.5 text-center whitespace-nowrap font-semibold">
                          High
                        </th>
                        <th className="px-3 py-2.5 text-center whitespace-nowrap font-semibold">
                          Medium
                        </th>
                        <th className="px-3 py-2.5 text-center whitespace-nowrap font-semibold">
                          Low
                        </th>
                        <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold">
                          Risk %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.buckets.map((bucket) => {
                        const riskPct =
                          bucket.total_registrations > 0
                            ? Math.round(
                                (bucket.high_risk_count / bucket.total_registrations) * 100
                              )
                            : 0;
                        return (
                          <tr
                            key={bucket.key}
                            className="text-slate-800 hover:bg-blue-50/50 transition-colors"
                          >
                            <td className="px-3 py-2.5 font-bold text-slate-900">{bucket.label}</td>
                            <td className="px-3 py-2.5 text-right font-medium">
                              {bucket.total_registrations}
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium">
                              {formatCurrency(bucket.total_mv)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium">
                              {formatCurrency(bucket.avg_mv)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-red-700">
                              {bucket.total_gap > 0 ? formatCurrency(bucket.total_gap) : "—"}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {bucket.high_risk_count > 0 ? (
                                <span className="inline-flex items-center justify-center w-6 h-5 rounded text-xs font-bold bg-red-600 text-white">
                                  {bucket.high_risk_count}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {bucket.medium_risk_count > 0 ? (
                                <span className="inline-flex items-center justify-center w-6 h-5 rounded text-xs font-bold bg-amber-500 text-white">
                                  {bucket.medium_risk_count}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {bucket.low_risk_count > 0 ? (
                                <span className="inline-flex items-center justify-center w-6 h-5 rounded text-xs font-bold bg-emerald-600 text-white">
                                  {bucket.low_risk_count}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      riskPct >= 50
                                        ? "bg-red-500"
                                        : riskPct >= 25
                                          ? "bg-amber-500"
                                          : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${riskPct}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-slate-700">
                                  {riskPct}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {!data.buckets.length && (
                        <tr>
                          <td colSpan={9} className="py-4 px-3 text-sm text-slate-500 text-center">
                            No data available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </RevenueLeakageShell>
  );
}
