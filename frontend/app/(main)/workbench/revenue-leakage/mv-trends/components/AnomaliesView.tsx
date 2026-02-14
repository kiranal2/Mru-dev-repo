"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, TrendingUp } from "lucide-react";
import {
  MVRateCardAnomaly,
  MVDeclaredTrend,
  MVSeasonalPattern,
} from "@/lib/revenue-leakage/types";
import { formatCurrency, severityBadge, monthLabels } from "../constants";

interface AnomaliesViewProps {
  rateCardAnomalies: MVRateCardAnomaly[];
  declaredTrends: MVDeclaredTrend[];
  seasonalPatterns: MVSeasonalPattern[];
}

export function AnomaliesView({
  rateCardAnomalies,
  declaredTrends,
  seasonalPatterns,
}: AnomaliesViewProps) {
  return (
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

        {/* Rate Card */}
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

        {/* Declared Trends */}
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

        {/* Seasonal Patterns */}
        <TabsContent value="seasonal" className="mt-4 space-y-3">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Heatmap Legend:</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: "#dc2626" }} /> &le; -15%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: "#fca5a5" }} /> -10% to -15%
            </span>
            <span className="inline-flex items-center gap-1">
              <span
                className="w-3 h-3 rounded border border-slate-200"
                style={{ background: "#ffffff" }}
              />{" "}
              Neutral
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: "#86efac" }} /> +10% to +15%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: "#16a34a" }} /> &ge; +15%
            </span>
            <span className="inline-flex items-center gap-1 ml-2">
              <AlertTriangle className="w-3 h-3 text-red-500" /> Persistent alert
            </span>
          </div>
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
  );
}
