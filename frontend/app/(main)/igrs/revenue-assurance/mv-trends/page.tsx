"use client";

import { useMemo, useState } from "react";
import { useIGRSTrends, useIGRSMVHotspots } from "@/hooks/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatINR } from "@/lib/data/utils/format-currency";
import { AlertTriangle, MapPin, TrendingDown, Activity } from "lucide-react";
import type { MVHotspot } from "@/lib/data/types";

// ── DRR Severity Bands ──────────────────────────────────────────────────────
type DRRBand = { label: string; min: number; max: number; color: string; bg: string; border: string };

const DRR_BANDS: DRRBand[] = [
  { label: "Critical", min: 0, max: 0.50, color: "text-red-800", bg: "bg-red-100", border: "border-red-300" },
  { label: "High", min: 0.50, max: 0.70, color: "text-orange-800", bg: "bg-orange-100", border: "border-orange-300" },
  { label: "Medium", min: 0.70, max: 0.85, color: "text-amber-800", bg: "bg-amber-100", border: "border-amber-300" },
  { label: "Watch", min: 0.85, max: 0.95, color: "text-blue-800", bg: "bg-blue-100", border: "border-blue-300" },
  { label: "Normal", min: 0.95, max: Infinity, color: "text-green-800", bg: "bg-green-100", border: "border-green-300" },
];

function getDRRBand(drr: number): DRRBand {
  return DRR_BANDS.find((b) => drr >= b.min && drr < b.max) ?? DRR_BANDS[4];
}

function severityBadgeVariant(severity: string): "default" | "secondary" | "destructive" | "outline" {
  switch (severity) {
    case "Critical": return "destructive";
    case "High": return "destructive";
    case "Medium": return "secondary";
    case "Low":
    case "Watch": return "outline";
    default: return "default";
  }
}

export default function MVTrendsPage() {
  const { data: trends, loading: trendsLoading, error: trendsError, refetch: trendsRefetch } = useIGRSTrends();
  const { data: hotspots, loading: hotspotsLoading, error: hotspotsError, refetch: hotspotsRefetch } = useIGRSMVHotspots();

  const [severityFilter, setSeverityFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");

  const loading = trendsLoading || hotspotsLoading;
  const error = trendsError || hotspotsError;

  // Derived data
  const districts = useMemo(
    () => Array.from(new Set(hotspots.map((h) => h.district))).sort(),
    [hotspots]
  );

  const filteredHotspots = useMemo(() => {
    let result = hotspots;
    if (severityFilter !== "all") result = result.filter((h) => h.severity === severityFilter);
    if (districtFilter !== "all") result = result.filter((h) => h.district === districtFilter);
    return result.sort((a, b) => a.drr - b.drr);
  }, [hotspots, severityFilter, districtFilter]);

  // Summary stats from hotspots
  const stats = useMemo(() => {
    if (!hotspots.length) return null;
    const totalLoss = hotspots.reduce((s, h) => s + h.estimatedLoss, 0);
    const avgDRR = hotspots.reduce((s, h) => s + h.drr, 0) / hotspots.length;
    const totalTxn = hotspots.reduce((s, h) => s + h.transactionCount, 0);
    const criticalCount = hotspots.filter((h) => h.severity === "Critical").length;
    return { totalLoss, avgDRR, totalTxn, criticalCount };
  }, [hotspots]);

  // DRR band distribution
  const bandDistribution = useMemo(() => {
    return DRR_BANDS.map((band) => ({
      ...band,
      count: hotspots.filter((h) => h.drr >= band.min && h.drr < band.max).length,
      totalLoss: hotspots
        .filter((h) => h.drr >= band.min && h.drr < band.max)
        .reduce((s, h) => s + h.estimatedLoss, 0),
    }));
  }, [hotspots]);

  // Monthly trend stats
  const trendStats = useMemo(() => {
    if (!trends.length) return null;
    const totalCases = trends.reduce((s, t) => s + t.cases, 0);
    const totalGap = trends.reduce((s, t) => s + t.gapInr, 0);
    const totalHighRisk = trends.reduce((s, t) => s + t.highRisk, 0);
    const avgGap = totalGap / trends.length;
    return { totalCases, totalGap, totalHighRisk, avgGap };
  }, [trends]);

  if (loading)
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => { trendsRefetch(); hotspotsRefetch(); }}
            className="mt-2 text-sm text-red-600 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Market Value Trends & DRR Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Declared-to-Rate Ratio analysis across SRO offices and locations
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {hotspots.length} hotspot{hotspots.length !== 1 ? "s" : ""} detected
        </Badge>
      </div>

      {/* Summary KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-red-200 bg-red-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Estimated Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-700">{formatINR(stats.totalLoss, true)}</p>
              <p className="text-xs text-muted-foreground">Across all hotspots</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Average DRR</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.avgDRR.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                <span className={getDRRBand(stats.avgDRR).color}>
                  {getDRRBand(stats.avgDRR).label} severity
                </span>
              </p>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Critical Hotspots</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-700">{stats.criticalCount}</p>
              <p className="text-xs text-muted-foreground">DRR below 0.70</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Transactions Affected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalTxn}</p>
              <p className="text-xs text-muted-foreground">In hotspot locations</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* DRR Severity Bands */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            DRR Severity Bands
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            DRR = Declared Value / Rate Card Value. Lower DRR indicates higher under-declaration risk.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {bandDistribution.map((band) => (
              <div
                key={band.label}
                className={`rounded-lg border p-3 text-center ${band.bg} ${band.border}`}
              >
                <p className={`text-xs font-semibold ${band.color}`}>{band.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {band.min.toFixed(2)} – {band.max === Infinity ? "1.00+" : band.max.toFixed(2)}
                </p>
                <p className={`text-2xl font-bold mt-1 ${band.color}`}>{band.count}</p>
                {band.totalLoss > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatINR(band.totalLoss, true)} loss
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hotspots Table with Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location Hotspots
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  {["Critical", "High", "Medium", "Watch", "Normal"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={districtFilter} onValueChange={setDistrictFilter}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>SRO</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">DRR</TableHead>
                  <TableHead className="text-center">Severity</TableHead>
                  <TableHead className="text-right">Rate Card (INR)</TableHead>
                  <TableHead className="text-right">Median Declared</TableHead>
                  <TableHead className="text-right">Txn Count</TableHead>
                  <TableHead className="text-right">Est. Loss</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHotspots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                      No hotspots match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHotspots.map((h) => {
                    const band = getDRRBand(h.drr);
                    return (
                      <TableRow key={`${h.caseId}-${h.locationLabel}`}>
                        <TableCell className="font-medium text-sm max-w-[200px]">
                          {h.locationLabel}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="font-mono text-xs">{h.sroCode}</span>
                          <span className="text-muted-foreground ml-1 text-xs">{h.sroName}</span>
                        </TableCell>
                        <TableCell className="text-sm">{h.district}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {h.locationType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${band.bg} ${band.color} border ${band.border}`}>
                            {h.drr.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={severityBadgeVariant(h.severity)}>
                            {h.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatINR(h.rateCardUnitRate)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatINR(h.medianDeclared)}
                        </TableCell>
                        <TableCell className="text-right">{h.transactionCount}</TableCell>
                        <TableCell className="text-right font-bold text-red-700">
                          {formatINR(h.estimatedLoss, true)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              h.status === "Confirmed" ? "default"
                                : h.status === "In Review" ? "secondary"
                                : "outline"
                            }
                          >
                            {h.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      {trendStats && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Monthly Trends
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{trendStats.totalCases} total cases</span>
                <span>{formatINR(trendStats.totalGap, true)} total gap</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Cases</TableHead>
                  <TableHead className="text-right">Gap (INR)</TableHead>
                  <TableHead className="text-right">High Risk</TableHead>
                  <TableHead className="text-right">High Risk %</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trends.map((t) => {
                  const highPct = t.cases > 0 ? ((t.highRisk / t.cases) * 100).toFixed(1) : "0.0";
                  const isHotspot = t.gapInr > (trendStats.avgGap ?? 0);
                  return (
                    <TableRow key={t.month} className={isHotspot ? "bg-orange-50/50" : ""}>
                      <TableCell className="font-medium">{t.month}</TableCell>
                      <TableCell className="text-right">{t.cases}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatINR(t.gapInr, true)}
                      </TableCell>
                      <TableCell className="text-right">{t.highRisk}</TableCell>
                      <TableCell className="text-right">{highPct}%</TableCell>
                      <TableCell className="w-8">
                        {isHotspot && (
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
