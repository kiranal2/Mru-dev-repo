"use client";

import { useState, useMemo } from "react";
import { useAIIntelligence } from "@/hooks/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Building2,
  ArrowUpRight,
  Landmark,
  Target,
  Sparkles,
  FileText,
  AlertTriangle,
  IndianRupee,
  Shield,
  Brain,
} from "lucide-react";
import type {
  PredictiveForecastingData,
  ForecastScenario,
  DistrictForecast,
  DocumentRiskScoringData,
  RiskScoredDocument,
  RiskDimension,
  SROIntegrityIndexData,
  SROIntegrityRecord,
  IntegrityComponent,
} from "@/lib/data/types/igrs";

// ── Types ────────────────────────────────────────────────────────────────────

type TabKey = "forecasting" | "risk-scoring" | "integrity-index";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "forecasting", label: "Predictive Forecasting", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { key: "risk-scoring", label: "Risk Scoring", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  { key: "integrity-index", label: "SRO Integrity", icon: <Building2 className="w-3.5 h-3.5" /> },
];

// ── Format Helper ────────────────────────────────────────────────────────────

function formatINR(val: number): string {
  if (val >= 10000000) return `\u20B9${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `\u20B9${(val / 100000).toFixed(1)}L`;
  return `\u20B9${val.toLocaleString("en-IN")}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-Tab 1: Predictive Revenue Forecasting
// ═══════════════════════════════════════════════════════════════════════════════

function ForecastingTab({ data }: { data: PredictiveForecastingData }) {
  const [scenario, setScenario] = useState<ForecastScenario>("baseline");
  const [sortCol, setSortCol] = useState<string>("district");
  const [sortAsc, setSortAsc] = useState(true);

  const { stateLevel, districtForecasts, modelPerformance, metadata } = data;

  // KPI computations
  const forecastRevenueNTM = useMemo(
    () => stateLevel.forecastMonths.reduce((s, m) => s + m.scenarios[scenario].forecast, 0),
    [stateLevel.forecastMonths, scenario]
  );

  const projectedYoYGrowth = useMemo(() => {
    if (districtForecasts.length === 0) return 0;
    return districtForecasts.reduce((s, d) => s + d.yoyGrowth, 0) / districtForecasts.length;
  }, [districtForecasts]);

  const mvRevisionImpactTotal = useMemo(
    () => districtForecasts.reduce((s, d) => s + d.mvRevisionImpact, 0),
    [districtForecasts]
  );

  // Combined historical + forecast for chart
  const historicalValues = stateLevel.historicalMonths.map((m) => m.actual);
  const forecastValues = stateLevel.forecastMonths.map((m) => m.scenarios[scenario].forecast);
  const allValues = [...historicalValues, ...forecastValues];
  const allMonths = [
    ...stateLevel.historicalMonths.map((m) => m.month),
    ...stateLevel.forecastMonths.map((m) => m.month),
  ];
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;

  const chartW = 900;
  const chartH = 350;
  const padL = 70;
  const padR = 30;
  const padT = 30;
  const padB = 50;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  function xPos(i: number): number {
    return padL + (i / Math.max(allMonths.length - 1, 1)) * plotW;
  }
  function yPos(v: number): number {
    return padT + plotH - ((v - minVal) / range) * plotH;
  }

  const histLen = stateLevel.historicalMonths.length;

  // Historical line path
  const histPath = stateLevel.historicalMonths
    .map((m, i) => `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yPos(m.actual).toFixed(1)}`)
    .join(" ");

  // Forecast line path
  const forecastPath = stateLevel.forecastMonths
    .map((m, i) => {
      const idx = histLen + i;
      const y = yPos(m.scenarios[scenario].forecast);
      return `${i === 0 ? `M${xPos(histLen - 1).toFixed(1)},${yPos(stateLevel.historicalMonths[histLen - 1].actual).toFixed(1)} L` : "L"}${xPos(idx).toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Confidence bands
  const ci95Path = useMemo(() => {
    const upper = stateLevel.forecastMonths.map((m, i) => ({
      x: xPos(histLen + i),
      y: yPos(m.scenarios[scenario].upper95),
    }));
    const lower = stateLevel.forecastMonths.map((m, i) => ({
      x: xPos(histLen + i),
      y: yPos(m.scenarios[scenario].lower95),
    }));
    if (upper.length === 0) return "";
    const up = upper.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const down = [...lower].reverse().map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    return `${up} ${down} Z`;
  }, [stateLevel.forecastMonths, scenario, histLen]);

  const ci80Path = useMemo(() => {
    const upper = stateLevel.forecastMonths.map((m, i) => ({
      x: xPos(histLen + i),
      y: yPos(m.scenarios[scenario].upper80),
    }));
    const lower = stateLevel.forecastMonths.map((m, i) => ({
      x: xPos(histLen + i),
      y: yPos(m.scenarios[scenario].lower80),
    }));
    if (upper.length === 0) return "";
    const up = upper.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const down = [...lower].reverse().map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    return `${up} ${down} Z`;
  }, [stateLevel.forecastMonths, scenario, histLen]);

  // MV revision markers
  const mvRevisionForecastMonths = stateLevel.forecastMonths
    .map((m, i) => ({ ...m, idx: histLen + i }))
    .filter((m) => m.isMVRevision);
  const mvRevisionHistMonths = stateLevel.historicalMonths
    .map((m, i) => ({ ...m, idx: i }))
    .filter((m) => m.isMVRevision);

  // Growth attribution data
  const growthAttrib = stateLevel.growthAttribution;
  const maxGrowth = useMemo(
    () => Math.max(...growthAttrib.map((g) => g.mvRevision + g.volumeGrowth + g.newAreas + g.complianceImprovement), 1),
    [growthAttrib]
  );

  // Sorted district forecasts
  const sortedDistricts = useMemo(() => {
    const copy = [...districtForecasts];
    copy.sort((a, b) => {
      let va: number | string, vb: number | string;
      switch (sortCol) {
        case "district": va = a.district; vb = b.district; break;
        case "actualLTM": va = a.actualLTM; vb = b.actualLTM; break;
        case "forecastNTM": va = a.forecastNTM; vb = b.forecastNTM; break;
        case "yoyGrowth": va = a.yoyGrowth; vb = b.yoyGrowth; break;
        case "mvRevisionImpact": va = a.mvRevisionImpact; vb = b.mvRevisionImpact; break;
        case "volumeGrowth": va = a.volumeGrowth; vb = b.volumeGrowth; break;
        case "confidenceRange": va = a.confidenceRange; vb = b.confidenceRange; break;
        default: va = a.district; vb = b.district;
      }
      if (typeof va === "string") return sortAsc ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return copy;
  }, [districtForecasts, sortCol, sortAsc]);

  function handleSort(col: string) {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  }

  function riskFlagColor(flag: string) {
    if (flag === "high") return "bg-red-500";
    if (flag === "medium") return "bg-amber-500";
    return "bg-green-500";
  }

  function miniSparkline(trend: number[], w = 60, h = 20): string {
    if (trend.length < 2) return "";
    const mn = Math.min(...trend);
    const mx = Math.max(...trend);
    const rng = mx - mn || 1;
    return trend
      .map((v, i) => {
        const x = (i / (trend.length - 1)) * w;
        const y = h - ((v - mn) / rng) * h;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-violet-200 bg-violet-50/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-violet-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Forecast Revenue (NTM)</span>
          </div>
          <p className="text-2xl font-bold text-violet-700">{formatINR(forecastRevenueNTM)}</p>
          <p className="text-xs text-slate-500">Next twelve months ({scenario})</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Projected YoY Growth</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{projectedYoYGrowth.toFixed(1)}%</p>
          <p className="text-xs text-slate-500">Avg across {districtForecasts.length} districts</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">MV Revision Impact</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{formatINR(mvRevisionImpactTotal)}</p>
          <p className="text-xs text-slate-500">Total across all districts</p>
        </div>
        <div className="rounded-lg border border-violet-200 bg-violet-50/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-violet-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Model Accuracy (MAPE)</span>
          </div>
          <p className="text-2xl font-bold text-violet-700">{modelPerformance.mape}%</p>
          <p className="text-xs text-slate-500">Mean Absolute Percent Error</p>
        </div>
      </div>

      {/* Primary Forecast Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-600" />
              State Revenue Forecast
            </CardTitle>
            <Select value={scenario} onValueChange={(v) => setScenario(v as ForecastScenario)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Scenario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baseline">Baseline</SelectItem>
                <SelectItem value="optimistic">Optimistic</SelectItem>
                <SelectItem value="conservative">Conservative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ minWidth: 700 }}>
              {/* Y-axis grid lines */}
              {Array.from({ length: 5 }).map((_, i) => {
                const v = minVal + (range * i) / 4;
                const y = yPos(v);
                return (
                  <g key={`y-${i}`}>
                    <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
                    <text x={padL - 8} y={y + 4} textAnchor="end" className="text-[9px] fill-slate-400">
                      {formatINR(v)}
                    </text>
                  </g>
                );
              })}

              {/* 95% CI band */}
              {ci95Path && <path d={ci95Path} fill="#7c3aed" opacity={0.1} />}

              {/* 80% CI band */}
              {ci80Path && <path d={ci80Path} fill="#7c3aed" opacity={0.2} />}

              {/* "Today" divider */}
              <line
                x1={xPos(histLen - 1)}
                y1={padT}
                x2={xPos(histLen - 1)}
                y2={padT + plotH}
                stroke="#6d28d9"
                strokeWidth={1}
                strokeDasharray="4 3"
              />
              <text x={xPos(histLen - 1)} y={padT - 6} textAnchor="middle" className="text-[9px] fill-violet-600 font-medium">
                Today
              </text>

              {/* MV revision markers - historical */}
              {mvRevisionHistMonths.map((m) => (
                <g key={`mvh-${m.idx}`}>
                  <line x1={xPos(m.idx)} y1={padT} x2={xPos(m.idx)} y2={padT + plotH} stroke="#3b82f6" strokeWidth={1} strokeDasharray="3 2" />
                  {m.mvRevisionLabel && (
                    <text x={xPos(m.idx)} y={padT + plotH + 16} textAnchor="middle" className="text-[7px] fill-blue-500">
                      {m.mvRevisionLabel}
                    </text>
                  )}
                </g>
              ))}

              {/* MV revision markers - forecast */}
              {mvRevisionForecastMonths.map((m) => (
                <g key={`mvf-${m.idx}`}>
                  <line x1={xPos(m.idx)} y1={padT} x2={xPos(m.idx)} y2={padT + plotH} stroke="#3b82f6" strokeWidth={1} strokeDasharray="3 2" />
                  {m.mvRevisionLabel && (
                    <text x={xPos(m.idx)} y={padT + plotH + 16} textAnchor="middle" className="text-[7px] fill-blue-500">
                      {m.mvRevisionLabel}
                    </text>
                  )}
                </g>
              ))}

              {/* Historical line - solid violet */}
              <path d={histPath} fill="none" stroke="#7c3aed" strokeWidth={2} />
              {stateLevel.historicalMonths.map((m, i) => (
                <circle key={`h-${i}`} cx={xPos(i)} cy={yPos(m.actual)} r={3} fill="#7c3aed" />
              ))}

              {/* Forecast line - dashed violet */}
              <path d={forecastPath} fill="none" stroke="#7c3aed" strokeWidth={2} strokeDasharray="6 3" />
              {stateLevel.forecastMonths.map((m, i) => (
                <circle
                  key={`f-${i}`}
                  cx={xPos(histLen + i)}
                  cy={yPos(m.scenarios[scenario].forecast)}
                  r={3}
                  fill="#7c3aed"
                  opacity={0.7}
                />
              ))}

              {/* X-axis labels */}
              {allMonths.map((m, i) => {
                if (i % Math.max(1, Math.floor(allMonths.length / 12)) !== 0 && i !== allMonths.length - 1) return null;
                return (
                  <text key={m} x={xPos(i)} y={padT + plotH + 30} textAnchor="middle" className="text-[8px] fill-slate-400">
                    {m.length > 7 ? m.slice(2, 7) : m}
                  </text>
                );
              })}
            </svg>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-5 h-0.5 bg-violet-600 inline-block" /> Historical</span>
            <span className="flex items-center gap-1"><span className="w-5 h-0.5 bg-violet-600 inline-block border-dashed" style={{ borderTop: "2px dashed #7c3aed", height: 0 }} /> Forecast</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-violet-600/20 inline-block" /> 80% CI</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-violet-600/10 inline-block" /> 95% CI</span>
            <span className="flex items-center gap-1"><span className="w-5 h-0.5 inline-block" style={{ borderTop: "2px dashed #3b82f6", height: 0 }} /> MV Revision</span>
          </div>
        </CardContent>
      </Card>

      {/* Growth Attribution Stacked Bars */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Growth Attribution</CardTitle>
          <p className="text-xs text-muted-foreground">Revenue growth components by month</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <svg viewBox="0 0 700 200" className="w-full" style={{ minWidth: 500 }}>
              {growthAttrib.map((g, i) => {
                const barX = 70 + i * 100;
                const barW = 60;
                const total = g.mvRevision + g.volumeGrowth + g.newAreas + g.complianceImprovement;
                const scale = total > 0 ? 150 / maxGrowth : 0;
                let y = 170;

                const segments = [
                  { val: g.mvRevision, color: "#7c3aed" },
                  { val: g.volumeGrowth, color: "#3b82f6" },
                  { val: g.newAreas, color: "#10b981" },
                  { val: g.complianceImprovement, color: "#f59e0b" },
                ];

                return (
                  <g key={g.month}>
                    {segments.map((seg, si) => {
                      const h = seg.val * scale;
                      y -= h;
                      return (
                        <rect key={si} x={barX} y={y} width={barW} height={h} fill={seg.color} rx={si === segments.length - 1 ? 2 : 0} />
                      );
                    })}
                    <text x={barX + barW / 2} y={185} textAnchor="middle" className="text-[9px] fill-slate-500">
                      {g.month.length > 7 ? g.month.slice(5) : g.month}
                    </text>
                    <text x={barX + barW / 2} y={170 - total * scale - 4} textAnchor="middle" className="text-[8px] fill-slate-600 font-medium">
                      {formatINR(total)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-violet-600 inline-block" /> MV Revision</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Volume Growth</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> New Areas</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Compliance</span>
          </div>
        </CardContent>
      </Card>

      {/* District Forecast Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">District Forecasts</CardTitle>
          <p className="text-xs text-muted-foreground">Click column headers to sort</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    { key: "district", label: "District" },
                    { key: "actualLTM", label: "Actual LTM" },
                    { key: "forecastNTM", label: "Forecast NTM" },
                    { key: "yoyGrowth", label: "YoY Growth %" },
                    { key: "mvRevisionImpact", label: "MV Impact" },
                    { key: "volumeGrowth", label: "Vol Growth %" },
                    { key: "confidenceRange", label: "Confidence" },
                  ].map((col) => (
                    <TableHead
                      key={col.key}
                      className={`cursor-pointer hover:bg-slate-50 ${col.key !== "district" ? "text-right" : ""}`}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      {sortCol === col.key && <span className="ml-1">{sortAsc ? "\u2191" : "\u2193"}</span>}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Risk</TableHead>
                  <TableHead className="text-center">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDistricts.map((d) => (
                  <TableRow key={d.district}>
                    <TableCell className="font-medium">{d.district}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatINR(d.actualLTM)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatINR(d.forecastNTM)}</TableCell>
                    <TableCell className="text-right">
                      <span className={d.yoyGrowth >= 0 ? "text-emerald-600" : "text-red-600"}>
                        {d.yoyGrowth >= 0 ? "+" : ""}{d.yoyGrowth.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatINR(d.mvRevisionImpact)}</TableCell>
                    <TableCell className="text-right">
                      <span className={d.volumeGrowth >= 0 ? "text-emerald-600" : "text-red-600"}>
                        {d.volumeGrowth >= 0 ? "+" : ""}{d.volumeGrowth.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-slate-500">
                      +/-{d.confidenceRange.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${riskFlagColor(d.riskFlag)}`} title={d.riskFlag} />
                    </TableCell>
                    <TableCell className="text-center">
                      <svg width={60} height={20} viewBox="0 0 60 20" className="inline-block">
                        <path d={miniSparkline(d.monthlyTrend)} fill="none" stroke="#7c3aed" strokeWidth={1.5} />
                      </svg>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* AI Narrative Card */}
      <Card className="border-l-4 border-l-violet-500">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-violet-700 mb-1">AI Forecast Narrative</p>
              <p className="text-sm text-slate-600 leading-relaxed">{stateLevel.forecastNarrative}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">MAPE</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{modelPerformance.mape}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">R-squared</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{modelPerformance.r2}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">MAE</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{formatINR(modelPerformance.mae)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Training Period</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{metadata.trainingMonths}mo</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-Tab 2: Document Risk Scoring Model
// ═══════════════════════════════════════════════════════════════════════════════

function RiskScoringTab({ data }: { data: DocumentRiskScoringData }) {
  const { metadata, summary, distribution, dimensionAvg, monthlyTrend, dimensionWeights, topDocuments, aiExplanation } = data;

  // Risk distribution histogram
  const maxBucketCount = Math.max(...distribution.map((b) => b.count), 1);

  // Radar chart calculations
  const radarCx = 150;
  const radarCy = 150;
  const radarR = 110;
  const dimensions: { key: RiskDimension; label: string; maxVal: number }[] = [
    { key: "revenue", label: "Revenue", maxVal: 40 },
    { key: "exemption", label: "Exemption", maxVal: 25 },
    { key: "classification", label: "Classification", maxVal: 20 },
    { key: "cash", label: "Cash", maxVal: 15 },
  ];

  function radarPoint(axisIdx: number, value: number, maxVal: number): { x: number; y: number } {
    const angle = (Math.PI * 2 * axisIdx) / dimensions.length - Math.PI / 2;
    const r = (value / maxVal) * radarR;
    return {
      x: radarCx + r * Math.cos(angle),
      y: radarCy + r * Math.sin(angle),
    };
  }

  const currentRadarPoints = dimensions.map((d, i) =>
    radarPoint(i, dimensionAvg[d.key].avg, d.maxVal)
  );
  const prevRadarPoints = dimensions.map((d, i) =>
    radarPoint(i, dimensionAvg[d.key].prevAvg, d.maxVal)
  );

  const currentRadarPath = currentRadarPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
  const prevRadarPath = prevRadarPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

  // Monthly trend chart
  const trendMaxScore = Math.max(...monthlyTrend.map((t) => t.avgScore), 1);
  const trendMaxHR = Math.max(...monthlyTrend.map((t) => t.highRiskCount), 1);
  const trendW = 700;
  const trendH = 200;
  const tPadL = 50;
  const tPadR = 50;
  const tPadT = 20;
  const tPadB = 40;
  const tPlotW = trendW - tPadL - tPadR;
  const tPlotH = trendH - tPadT - tPadB;

  // Waterfall: build stacked horizontal bars
  const totalWaterfallWeight = dimensionWeights.reduce((s, w) => s + w.avgContribution, 0);

  function scoreColor(score: number): string {
    if (score >= 90) return "bg-red-600 text-white";
    if (score >= 70) return "bg-orange-500 text-white";
    if (score >= 50) return "bg-amber-500 text-white";
    if (score >= 30) return "bg-lime-500 text-white";
    return "bg-green-500 text-white";
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-lg border border-violet-200 bg-violet-50/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-violet-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Docs Scored</span>
          </div>
          <p className="text-2xl font-bold text-violet-700">{metadata.totalDocumentsScored.toLocaleString("en-IN")}</p>
          <p className="text-xs text-slate-500">{metadata.period}</p>
        </div>
        <div className="rounded-lg border border-violet-200 bg-violet-50/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-violet-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Avg Risk Score</span>
          </div>
          <p className="text-2xl font-bold text-violet-700">
            {summary.avgCompositeScore.toFixed(1)}
            <span className={`text-sm ml-1 ${summary.avgCompositeScoreChange >= 0 ? "text-red-500" : "text-green-500"}`}>
              {summary.avgCompositeScoreChange >= 0 ? "+" : ""}{summary.avgCompositeScoreChange.toFixed(1)}
            </span>
          </p>
          <p className="text-xs text-slate-500">Composite average</p>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">High Risk &gt;70</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">
            {summary.highRiskCount.toLocaleString("en-IN")}
            <span className="text-sm ml-1 font-normal text-orange-500">{summary.highRiskPct}%</span>
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Critical &gt;90</span>
          </div>
          <p className="text-2xl font-bold text-red-700">
            {summary.criticalCount.toLocaleString("en-IN")}
            <span className="text-sm ml-1 font-normal text-red-500">{summary.criticalPct}%</span>
          </p>
        </div>
        <div className="rounded-lg border border-violet-200 bg-violet-50/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="w-4 h-4 text-violet-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Est. Revenue at Risk</span>
          </div>
          <p className="text-2xl font-bold text-violet-700">{formatINR(summary.estimatedRevenueAtRisk)}</p>
          <p className="text-xs text-slate-500">
            <span className={summary.estimatedRevenueAtRiskChange >= 0 ? "text-red-500" : "text-green-500"}>
              {summary.estimatedRevenueAtRiskChange >= 0 ? "+" : ""}{summary.estimatedRevenueAtRiskChange.toFixed(1)}%
            </span>{" "}MoM
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Histogram */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Risk Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {distribution.map((bucket) => (
                <div key={bucket.band} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-slate-600 text-right">{bucket.label}</span>
                  <div className="flex-1 h-7 bg-slate-100 rounded overflow-hidden">
                    <div
                      className="h-full rounded flex items-center justify-end px-2"
                      style={{
                        width: `${(bucket.count / maxBucketCount) * 100}%`,
                        backgroundColor: bucket.color,
                      }}
                    >
                      <span className="text-white text-[10px] font-bold">{bucket.count}</span>
                    </div>
                  </div>
                  <span className="w-12 text-right text-xs text-slate-500">{bucket.pct}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Risk by Dimension</CardTitle>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto">
              {/* Grid circles */}
              {[0.25, 0.5, 0.75, 1].map((scale) => (
                <circle
                  key={scale}
                  cx={radarCx}
                  cy={radarCy}
                  r={radarR * scale}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={0.5}
                />
              ))}

              {/* Axis lines and labels */}
              {dimensions.map((d, i) => {
                const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
                const endX = radarCx + radarR * Math.cos(angle);
                const endY = radarCy + radarR * Math.sin(angle);
                const labelX = radarCx + (radarR + 18) * Math.cos(angle);
                const labelY = radarCy + (radarR + 18) * Math.sin(angle);
                return (
                  <g key={d.key}>
                    <line x1={radarCx} y1={radarCy} x2={endX} y2={endY} stroke="#e2e8f0" strokeWidth={0.5} />
                    <text x={labelX} y={labelY + 4} textAnchor="middle" className="text-[9px] fill-slate-600 font-medium">
                      {d.label}
                    </text>
                    <text x={labelX} y={labelY + 14} textAnchor="middle" className="text-[7px] fill-slate-400">
                      (max {d.maxVal})
                    </text>
                  </g>
                );
              })}

              {/* Previous month outline */}
              <path d={prevRadarPath} fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 2" />

              {/* Current month filled */}
              <path d={currentRadarPath} fill="#7c3aed" fillOpacity={0.2} stroke="#7c3aed" strokeWidth={2} />
              {currentRadarPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill="#7c3aed" />
              ))}
            </svg>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-violet-600/20 border border-violet-600 inline-block" /> Current</span>
              <span className="flex items-center gap-1"><span className="w-5 h-0.5 inline-block" style={{ borderTop: "2px dashed #94a3b8", height: 0 }} /> Previous</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Risk Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly Risk Trend</CardTitle>
          <p className="text-xs text-muted-foreground">Average risk score (line) and high-risk document count (bars)</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${trendW} ${trendH}`} className="w-full" style={{ minWidth: 500 }}>
              {/* Bars for high-risk count */}
              {monthlyTrend.map((t, i) => {
                const barW = tPlotW / monthlyTrend.length * 0.5;
                const barX = tPadL + (i / Math.max(monthlyTrend.length - 1, 1)) * tPlotW - barW / 2;
                const barH = (t.highRiskCount / trendMaxHR) * tPlotH;
                return (
                  <g key={`bar-${i}`}>
                    <rect
                      x={barX}
                      y={tPadT + tPlotH - barH}
                      width={barW}
                      height={barH}
                      fill="#7c3aed"
                      opacity={0.15}
                      rx={2}
                    />
                    {/* Right axis label */}
                    {i === monthlyTrend.length - 1 && (
                      <text x={trendW - 5} y={tPadT + tPlotH - barH + 4} textAnchor="end" className="text-[8px] fill-violet-400">
                        {t.highRiskCount}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Line for avg score */}
              <path
                d={monthlyTrend
                  .map((t, i) => {
                    const x = tPadL + (i / Math.max(monthlyTrend.length - 1, 1)) * tPlotW;
                    const y = tPadT + tPlotH - (t.avgScore / trendMaxScore) * tPlotH;
                    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#7c3aed"
                strokeWidth={2}
              />
              {monthlyTrend.map((t, i) => {
                const x = tPadL + (i / Math.max(monthlyTrend.length - 1, 1)) * tPlotW;
                const y = tPadT + tPlotH - (t.avgScore / trendMaxScore) * tPlotH;
                return (
                  <g key={`dot-${i}`}>
                    <circle cx={x} cy={y} r={3} fill="#7c3aed" />
                    {t.annotation && (
                      <g>
                        <line x1={x} y1={y - 8} x2={x} y2={y - 20} stroke="#7c3aed" strokeWidth={0.5} />
                        <text x={x} y={y - 23} textAnchor="middle" className="text-[7px] fill-violet-600">
                          {t.annotation}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* X-axis labels */}
              {monthlyTrend.map((t, i) => {
                const x = tPadL + (i / Math.max(monthlyTrend.length - 1, 1)) * tPlotW;
                return (
                  <text key={`xl-${i}`} x={x} y={tPadT + tPlotH + 20} textAnchor="middle" className="text-[8px] fill-slate-400">
                    {t.month.length > 7 ? t.month.slice(5) : t.month}
                  </text>
                );
              })}

              {/* Left axis label */}
              <text x={10} y={tPadT + tPlotH / 2} textAnchor="middle" className="text-[8px] fill-slate-400" transform={`rotate(-90, 10, ${tPadT + tPlotH / 2})`}>
                Avg Score
              </text>

              {/* Right axis label */}
              <text x={trendW - 10} y={tPadT + tPlotH / 2} textAnchor="middle" className="text-[8px] fill-violet-400" transform={`rotate(90, ${trendW - 10}, ${tPadT + tPlotH / 2})`}>
                High Risk Count
              </text>
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factor Waterfall */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Risk Factor Contribution (Waterfall)</CardTitle>
          <p className="text-xs text-muted-foreground">Each dimension contribution to composite score</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dimensionWeights.map((w) => {
              const widthPct = totalWaterfallWeight > 0 ? (w.avgContribution / totalWaterfallWeight) * 100 : 0;
              return (
                <div key={w.dimension} className="flex items-center gap-3">
                  <span className="w-28 text-xs text-slate-600 text-right capitalize">{w.dimension}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                    <div
                      className="h-full rounded flex items-center px-2"
                      style={{ width: `${widthPct}%`, backgroundColor: w.color }}
                    >
                      <span className="text-white text-[10px] font-bold">{w.avgContribution.toFixed(1)}</span>
                    </div>
                  </div>
                  <span className="w-16 text-xs text-slate-500 text-right">wt: {w.weight}%</span>
                </div>
              );
            })}
            <div className="flex items-center gap-3 border-t pt-2">
              <span className="w-28 text-xs text-slate-800 text-right font-bold">Total</span>
              <div className="flex-1 h-6 bg-slate-200 rounded">
                <div className="h-full rounded bg-slate-700 flex items-center px-2" style={{ width: "100%" }}>
                  <span className="text-white text-[10px] font-bold">{totalWaterfallWeight.toFixed(1)}</span>
                </div>
              </div>
              <span className="w-16 text-xs text-slate-800 text-right font-bold">100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Risk Documents Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top Risk Documents</CardTitle>
          <p className="text-xs text-muted-foreground">Top 20 highest-risk documents</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Document ID</TableHead>
                  <TableHead>SRO</TableHead>
                  <TableHead className="text-center">Composite</TableHead>
                  <TableHead className="text-center">Revenue</TableHead>
                  <TableHead className="text-center">Exemption</TableHead>
                  <TableHead className="text-center">Classification</TableHead>
                  <TableHead className="text-center">Cash</TableHead>
                  <TableHead className="text-right">Gap Amount</TableHead>
                  <TableHead>Signals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDocuments.slice(0, 20).map((doc) => (
                  <TableRow key={doc.documentId}>
                    <TableCell className="font-bold text-slate-500">{doc.rank}</TableCell>
                    <TableCell className="font-mono text-xs">{doc.documentId}</TableCell>
                    <TableCell className="text-xs">
                      <span className="font-mono">{doc.sro}</span>
                      <span className="text-slate-400 ml-1">{doc.sroName}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${scoreColor(doc.compositeScore)}`}>
                        {doc.compositeScore.toFixed(1)}
                      </span>
                    </TableCell>
                    {[doc.revenueScore, doc.exemptionScore, doc.classificationScore, doc.cashScore].map((score, si) => {
                      const maxes = [40, 25, 20, 15];
                      const pct = (score / maxes[si]) * 100;
                      return (
                        <TableCell key={si} className="text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(pct, 100)}%`,
                                  backgroundColor: pct > 80 ? "#ef4444" : pct > 60 ? "#f97316" : pct > 40 ? "#eab308" : "#22c55e",
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-600 w-6 text-right">{score.toFixed(0)}</span>
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-mono text-sm text-red-600">{formatINR(doc.gapAmount)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {doc.signals.map((sig, i) => (
                          <Badge key={i} variant="outline" className="text-[9px] px-1 py-0">
                            {sig}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* AI Explanation Card */}
      <Card className="border-l-4 border-l-violet-500">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-violet-700 mb-1">AI Risk Analysis</p>
              <p className="text-sm text-slate-600 leading-relaxed">{aiExplanation}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-Tab 3: SRO Monthly Integrity Index
// ═══════════════════════════════════════════════════════════════════════════════

function IntegrityIndexTab({ data }: { data: SROIntegrityIndexData }) {
  const [expandedSRO, setExpandedSRO] = useState<string | null>(null);

  const { metadata, summary, componentDefinitions, sros } = data;

  // Band color helpers
  function bandColor(band: string): string {
    switch (band) {
      case "excellent": return "bg-green-100 text-green-700 border-green-300";
      case "good": return "bg-lime-100 text-lime-700 border-lime-300";
      case "needsImprovement": return "bg-amber-100 text-amber-700 border-amber-300";
      case "atRisk": return "bg-orange-100 text-orange-700 border-orange-300";
      case "critical": return "bg-red-100 text-red-700 border-red-300";
      default: return "bg-slate-100 text-slate-700 border-slate-300";
    }
  }

  function bandLabel(band: string): string {
    switch (band) {
      case "excellent": return "Excellent";
      case "good": return "Good";
      case "needsImprovement": return "Needs Improvement";
      case "atRisk": return "At Risk";
      case "critical": return "Critical";
      default: return band;
    }
  }

  function bandTextColor(band: string): string {
    switch (band) {
      case "excellent": return "text-green-600";
      case "good": return "text-lime-600";
      case "needsImprovement": return "text-amber-500";
      case "atRisk": return "text-orange-500";
      case "critical": return "text-red-600";
      default: return "text-slate-600";
    }
  }

  function heatmapColor(score: number): string {
    if (score >= 80) return "#16a34a";
    if (score >= 60) return "#84cc16";
    if (score >= 40) return "#f59e0b";
    if (score >= 20) return "#f97316";
    return "#ef4444";
  }

  function heatmapTextColor(score: number): string {
    if (score >= 60) return "#1e293b";
    return "#ffffff";
  }

  // Get unique months from first SRO (assume all SROs have same months)
  const months = sros.length > 0 ? sros[0].monthlyHistory.map((m) => m.month) : [];

  // Sorted SROs by current score descending for component bars
  const sortedByScore = useMemo(() => [...sros].sort((a, b) => b.currentScore - a.currentScore), [sros]);

  // Sorted by rank for table
  const sortedByRank = useMemo(() => [...sros].sort((a, b) => a.rank - b.rank), [sros]);

  // Components order
  const compKeys: IntegrityComponent[] = ["revenueCompliance", "cashHandling", "exemptionAdherence", "slaCompliance", "dataQuality"];

  function miniSparkline(history: { month: string; score: number }[], w = 60, h = 20): string {
    if (history.length < 2) return "";
    const vals = history.map((h) => h.score);
    const mn = Math.min(...vals);
    const mx = Math.max(...vals);
    const rng = mx - mn || 1;
    return vals
      .map((v, i) => {
        const x = (i / (vals.length - 1)) * w;
        const y = h - ((v - mn) / rng) * h;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-violet-200 bg-violet-50/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-violet-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">State Avg Integrity</span>
          </div>
          <p className="text-2xl font-bold text-violet-700">
            {summary.stateAvgScore.toFixed(1)}<span className="text-sm font-normal text-slate-500">/100</span>
            <span className={`text-sm ml-1 ${summary.stateAvgChange >= 0 ? "text-green-500" : "text-red-500"}`}>
              {summary.stateAvgChange >= 0 ? "+" : ""}{summary.stateAvgChange.toFixed(1)}
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Top SRO</span>
          </div>
          <p className="text-lg font-bold text-green-700">{summary.topSRO.name}</p>
          <p className="text-xs text-slate-500">Score: {summary.topSRO.score}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Bottom SRO</span>
          </div>
          <p className="text-lg font-bold text-red-700">{summary.bottomSRO.name}</p>
          <p className="text-xs text-slate-500">Score: {summary.bottomSRO.score}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Improving SROs</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            {summary.improvingSROCount}<span className="text-sm font-normal text-slate-500">/{metadata.totalSROs}</span>
          </p>
          <p className="text-xs text-slate-500">{summary.decliningSROCount} declining, {summary.stableSROCount} stable</p>
        </div>
      </div>

      {/* Integrity Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">SRO Integrity Heatmap</CardTitle>
          <p className="text-xs text-muted-foreground">{sros.length} SROs x {months.length} months</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${120 + months.length * 65} ${30 + sros.length * 30}`}
              className="w-full"
              style={{ minWidth: 500 }}
            >
              {/* Month headers */}
              {months.map((m, mi) => (
                <text
                  key={m}
                  x={130 + mi * 65 + 25}
                  y={18}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-500 font-medium"
                >
                  {m.length > 7 ? m.slice(5) : m}
                </text>
              ))}

              {/* SRO rows */}
              {sortedByRank.map((sro, si) => (
                <g key={sro.code}>
                  {/* SRO name */}
                  <text x={118} y={38 + si * 30 + 15} textAnchor="end" className="text-[9px] fill-slate-600">
                    {sro.name.length > 16 ? sro.name.slice(0, 15) + ".." : sro.name}
                  </text>

                  {/* Month cells */}
                  {sro.monthlyHistory.map((mh, mi) => (
                    <g key={`${sro.code}-${mh.month}`}>
                      <rect
                        x={130 + mi * 65}
                        y={28 + si * 30}
                        width={55}
                        height={26}
                        rx={3}
                        fill={heatmapColor(mh.score)}
                        opacity={0.85}
                      />
                      <text
                        x={130 + mi * 65 + 27.5}
                        y={28 + si * 30 + 17}
                        textAnchor="middle"
                        fill={heatmapTextColor(mh.score)}
                        className="text-[9px] font-bold"
                      >
                        {mh.score.toFixed(0)}
                      </text>
                    </g>
                  ))}
                </g>
              ))}
            </svg>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-4 h-3 rounded" style={{ backgroundColor: "#16a34a" }} /> 80+</span>
            <span className="flex items-center gap-1"><span className="w-4 h-3 rounded" style={{ backgroundColor: "#84cc16" }} /> 60-79</span>
            <span className="flex items-center gap-1"><span className="w-4 h-3 rounded" style={{ backgroundColor: "#f59e0b" }} /> 40-59</span>
            <span className="flex items-center gap-1"><span className="w-4 h-3 rounded" style={{ backgroundColor: "#f97316" }} /> 20-39</span>
            <span className="flex items-center gap-1"><span className="w-4 h-3 rounded" style={{ backgroundColor: "#ef4444" }} /> &lt;20</span>
          </div>
        </CardContent>
      </Card>

      {/* Component Score Stacked Bars */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Component Score Breakdown</CardTitle>
          <p className="text-xs text-muted-foreground">Sorted by total score, stacked by 5 integrity components</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedByScore.map((sro) => {
              const compTotal = compKeys.reduce((s, k) => s + sro.components[k], 0);
              return (
                <div key={sro.code} className="flex items-center gap-3">
                  <span className="w-28 text-xs text-slate-600 text-right truncate">{sro.name}</span>
                  <div className="flex-1 flex h-5 rounded overflow-hidden bg-slate-100">
                    {compKeys.map((ck, ci) => {
                      const def = componentDefinitions.find((d) => d.id === ck);
                      const widthPct = (sro.components[ck] / 100) * 100;
                      return (
                        <div
                          key={ck}
                          className="h-full"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: def?.color || "#94a3b8",
                          }}
                          title={`${def?.label || ck}: ${sro.components[ck].toFixed(1)}`}
                        />
                      );
                    })}
                  </div>
                  <span className="w-10 text-xs font-bold text-slate-700 text-right">{compTotal.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
            {componentDefinitions.map((def) => (
              <span key={def.id} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: def.color }} />
                {def.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SRO Ranking Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">SRO Integrity Rankings</CardTitle>
          <p className="text-xs text-muted-foreground">Click a row to see detailed breakdown</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-right">MoM</TableHead>
                  {componentDefinitions.map((def) => (
                    <TableHead key={def.id} className="text-center text-[10px]">{def.label}</TableHead>
                  ))}
                  <TableHead className="text-center">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedByRank.map((sro) => {
                  const rankChange = sro.previousRank - sro.rank;
                  return (
                    <TableRow
                      key={sro.code}
                      className={`cursor-pointer hover:bg-violet-50/30 ${expandedSRO === sro.code ? "bg-violet-50/50" : ""}`}
                      onClick={() => setExpandedSRO(expandedSRO === sro.code ? null : sro.code)}
                    >
                      <TableCell className="font-bold text-slate-500">
                        {sro.rank}
                        {rankChange !== 0 && (
                          <span className={`text-[10px] ml-1 ${rankChange > 0 ? "text-green-500" : "text-red-500"}`}>
                            {rankChange > 0 ? `\u2191${rankChange}` : `\u2193${Math.abs(rankChange)}`}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{sro.code}</TableCell>
                      <TableCell className="font-medium text-sm">{sro.name}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${bandColor(sro.band)}`}>
                          {sro.currentScore.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={sro.momChange >= 0 ? "text-green-600" : "text-red-600"}>
                          {sro.momChange >= 0 ? "+" : ""}{sro.momChange.toFixed(1)}
                        </span>
                      </TableCell>
                      {compKeys.map((ck) => {
                        const def = componentDefinitions.find((d) => d.id === ck);
                        const maxScore = def?.maxScore || 20;
                        const pct = (sro.components[ck] / maxScore) * 100;
                        return (
                          <TableCell key={ck} className="text-center">
                            <div className="flex items-center gap-1 justify-center">
                              <div className="w-8 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(pct, 100)}%`,
                                    backgroundColor: def?.color || "#94a3b8",
                                  }}
                                />
                              </div>
                              <span className="text-[9px] text-slate-600">{sro.components[ck].toFixed(0)}</span>
                            </div>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center">
                        <svg width={60} height={20} viewBox="0 0 60 20" className="inline-block">
                          <path
                            d={miniSparkline(sro.monthlyHistory)}
                            fill="none"
                            stroke="#7c3aed"
                            strokeWidth={1.5}
                          />
                        </svg>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* SRO Detail Drill-Down */}
      {expandedSRO && (() => {
        const sro = sros.find((s) => s.code === expandedSRO);
        if (!sro) return null;
        return (
          <Card className="border-violet-200 border-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-violet-600" />
                    {sro.name} ({sro.code})
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">{sro.district} District</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${bandColor(sro.band)}`}>
                    {sro.currentScore.toFixed(1)} - {bandLabel(sro.band)}
                  </span>
                  <button
                    onClick={() => setExpandedSRO(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Component bars */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Component Scores</p>
                <div className="space-y-2">
                  {compKeys.map((ck) => {
                    const def = componentDefinitions.find((d) => d.id === ck);
                    const maxScore = def?.maxScore || 20;
                    const pct = (sro.components[ck] / maxScore) * 100;
                    return (
                      <div key={ck} className="flex items-center gap-3">
                        <span className="w-36 text-xs text-slate-600">{def?.label || ck}</span>
                        <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              backgroundColor: def?.color || "#94a3b8",
                            }}
                          />
                        </div>
                        <span className="w-12 text-xs font-bold text-slate-700 text-right">
                          {sro.components[ck].toFixed(1)}/{maxScore}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Component sparklines */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">6-Month Component Trends</p>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {compKeys.map((ck) => {
                    const def = componentDefinitions.find((d) => d.id === ck);
                    const compField = ck === "revenueCompliance" ? "rc"
                      : ck === "cashHandling" ? "ch"
                      : ck === "exemptionAdherence" ? "ea"
                      : ck === "slaCompliance" ? "sc"
                      : "dq";
                    const vals = sro.monthlyHistory.map((h) => h[compField as keyof typeof h] as number);
                    const mn = Math.min(...vals);
                    const mx = Math.max(...vals);
                    const rng = mx - mn || 1;
                    const path = vals
                      .map((v, i) => {
                        const x = (i / (vals.length - 1)) * 80;
                        const y = 24 - ((v - mn) / rng) * 20;
                        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(" ");
                    return (
                      <div key={ck} className="text-center">
                        <p className="text-[10px] text-slate-500 mb-1">{def?.label || ck}</p>
                        <svg width={80} height={28} viewBox="0 0 80 28" className="inline-block">
                          <path d={path} fill="none" stroke={def?.color || "#94a3b8"} strokeWidth={1.5} />
                        </svg>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Assessment */}
              <div className="rounded-lg border-l-4 border-l-violet-500 bg-violet-50/50 p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-violet-700 mb-1">AI Assessment</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{sro.aiAssessment}</p>
                  </div>
                </div>
              </div>

              {/* Improvement Actions */}
              {sro.improvementActions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Improvement Actions</p>
                  <ul className="space-y-1">
                    {sro.improvementActions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════════════════════════════════════

export default function AIIntelligencePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("forecasting");
  const { forecasting, riskScoring, integrityIndex, isLoading, error } = useAIIntelligence(activeTab);

  // Loading state
  if (isLoading && !forecasting && !riskScoring && !integrityIndex) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 bg-gray-200 rounded w-36" />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-80 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">Error loading AI Intelligence data</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  function renderTabContent() {
    switch (activeTab) {
      case "forecasting":
        return forecasting ? <ForecastingTab data={forecasting} /> : <LoadingSkeleton />;
      case "risk-scoring":
        return riskScoring ? <RiskScoringTab data={riskScoring} /> : <LoadingSkeleton />;
      case "integrity-index":
        return integrityIndex ? <IntegrityIndexTab data={integrityIndex} /> : <LoadingSkeleton />;
      default:
        return null;
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">AI Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered predictive analytics, risk scoring, and integrity monitoring
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? "bg-violet-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-violet-50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading overlay for tab switches */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-violet-500">
          <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      )}

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded" />
        ))}
      </div>
      <div className="h-80 bg-gray-200 rounded" />
      <div className="h-64 bg-gray-200 rounded" />
    </div>
  );
}
