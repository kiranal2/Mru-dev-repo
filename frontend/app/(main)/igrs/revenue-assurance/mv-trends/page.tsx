"use client";

import { useMemo, useState } from "react";
import {
  useIGRSTrends,
  useIGRSMVHotspots,
  useIGRSMVGrowthAttribution,
  useIGRSMVRevisionComparison,
  useIGRSMVAnomalies,
} from "@/hooks/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  AlertTriangle,
  MapPin,
  TrendingDown,
  TrendingUp,
  Activity,
  BarChart3,
  ChevronRight,
  GitCompare,
  ShieldAlert,
} from "lucide-react";
import type {
  MVHotspot,
  MVGrowthAttribution,
  MVRevisionComparison,
  MVAnomaliesData,
} from "@/lib/data/types";

// ── Types ────────────────────────────────────────────────────────────────────
type TabKey = "dashboard" | "growth" | "comparison" | "anomalies";

// ── DRR Severity Bands ──────────────────────────────────────────────────────
type DRRBand = {
  label: string;
  min: number;
  max: number;
  color: string;
  bg: string;
  border: string;
};

const DRR_BANDS: DRRBand[] = [
  { label: "Critical", min: 0, max: 0.5, color: "text-red-800", bg: "bg-red-100", border: "border-red-300" },
  { label: "High", min: 0.5, max: 0.7, color: "text-orange-800", bg: "bg-orange-100", border: "border-orange-300" },
  { label: "Medium", min: 0.7, max: 0.85, color: "text-amber-800", bg: "bg-amber-100", border: "border-amber-300" },
  { label: "Watch", min: 0.85, max: 0.95, color: "text-blue-800", bg: "bg-blue-100", border: "border-blue-300" },
  { label: "Normal", min: 0.95, max: Infinity, color: "text-green-800", bg: "bg-green-100", border: "border-green-300" },
];

function getDRRBand(drr: number): DRRBand {
  return DRR_BANDS.find((b) => drr >= b.min && drr < b.max) ?? DRR_BANDS[4];
}

function severityBadgeVariant(severity: string): "default" | "secondary" | "destructive" | "outline" {
  switch (severity) {
    case "Critical":
    case "High":
      return "destructive";
    case "Medium":
      return "secondary";
    default:
      return "outline";
  }
}

function KPICard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <Card className={accent ? `border-${accent}-200 bg-${accent}-50/30` : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${accent ? `text-${accent}-700` : ""}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Tab Definitions ─────────────────────────────────────────────────────────
const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "growth", label: "Growth Attribution" },
  { key: "comparison", label: "Revision Comparison" },
  { key: "anomalies", label: "Anomalies" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Dashboard Tab (existing hotspot-based view)
// ═══════════════════════════════════════════════════════════════════════════════

function DashboardTab({
  hotspots,
  trends,
}: {
  hotspots: MVHotspot[];
  trends: { month: string; cases: number; gapInr: number; highRisk: number }[];
}) {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");

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

  const stats = useMemo(() => {
    if (!hotspots.length) return null;
    const totalLoss = hotspots.reduce((s, h) => s + h.estimatedLoss, 0);
    const avgDRR = hotspots.reduce((s, h) => s + h.drr, 0) / hotspots.length;
    const totalTxn = hotspots.reduce((s, h) => s + h.transactionCount, 0);
    const criticalCount = hotspots.filter((h) => h.severity === "Critical").length;
    return { totalLoss, avgDRR, totalTxn, criticalCount };
  }, [hotspots]);

  const bandDistribution = useMemo(() => {
    return DRR_BANDS.map((band) => ({
      ...band,
      count: hotspots.filter((h) => h.drr >= band.min && h.drr < band.max).length,
      totalLoss: hotspots
        .filter((h) => h.drr >= band.min && h.drr < band.max)
        .reduce((s, h) => s + h.estimatedLoss, 0),
    }));
  }, [hotspots]);

  const trendStats = useMemo(() => {
    if (!trends.length) return null;
    const totalCases = trends.reduce((s, t) => s + t.cases, 0);
    const totalGap = trends.reduce((s, t) => s + t.gapInr, 0);
    const totalHighRisk = trends.reduce((s, t) => s + t.highRisk, 0);
    const avgGap = totalGap / trends.length;
    return { totalCases, totalGap, totalHighRisk, avgGap };
  }, [trends]);

  return (
    <div className="space-y-6">
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
              <p className="text-2xl font-bold">{stats.totalTxn.toLocaleString()}</p>
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

      {/* Hotspots Table */}
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
                        <TableCell className="font-medium text-sm max-w-[200px]">{h.locationLabel}</TableCell>
                        <TableCell className="text-sm">
                          <span className="font-mono text-xs">{h.sroCode}</span>
                          <span className="text-muted-foreground ml-1 text-xs">{h.sroName}</span>
                        </TableCell>
                        <TableCell className="text-sm">{h.district}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{h.locationType}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${band.bg} ${band.color} border ${band.border}`}>
                            {h.drr.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={severityBadgeVariant(h.severity)}>{h.severity}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatINR(h.rateCardUnitRate)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatINR(h.medianDeclared)}</TableCell>
                        <TableCell className="text-right">{h.transactionCount}</TableCell>
                        <TableCell className="text-right font-bold text-red-700">{formatINR(h.estimatedLoss, true)}</TableCell>
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
                      <TableCell className="text-right font-medium">{formatINR(t.gapInr, true)}</TableCell>
                      <TableCell className="text-right">{t.highRisk}</TableCell>
                      <TableCell className="text-right">{highPct}%</TableCell>
                      <TableCell className="w-8">
                        {isHotspot && <AlertTriangle className="w-4 h-4 text-orange-500" />}
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

// ═══════════════════════════════════════════════════════════════════════════════
// Growth Attribution Tab
// ═══════════════════════════════════════════════════════════════════════════════

function GrowthAttributionTab({ data, loading }: { data: MVGrowthAttribution | null; loading: boolean }) {
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set());

  if (loading) return <div className="animate-pulse space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded" />)}</div>;
  if (!data) return <p className="text-sm text-muted-foreground">No growth attribution data available.</p>;

  const { summary, monthlyAttribution, districtAttribution, hierarchyData } = data;

  const toggleDistrict = (code: string) => {
    setExpandedDistricts((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  // Stacked bar chart for monthly attribution
  const maxMonthly = Math.max(...monthlyAttribution.map((m) => m.totalRevenue), 1);

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Revenue Growth</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-700">{formatINR(summary.totalRevenueGrowth, true)}</p></CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">MV-Driven Growth</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700">{formatINR(summary.mvDrivenGrowth, true)}</p>
            <p className="text-xs text-muted-foreground">{summary.mvDrivenPercent}% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Volume-Driven Growth</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatINR(summary.volumeDrivenGrowth, true)}</p>
            <p className="text-xs text-muted-foreground">{summary.volumeDrivenPercent}% of total</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Net MV Revision Impact</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-orange-700">{formatINR(summary.netMVRevisionImpact, true)}</p></CardContent>
        </Card>
      </div>

      {/* Monthly Attribution Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Monthly Revenue Attribution
          </CardTitle>
          <p className="text-xs text-muted-foreground">MV-driven vs Volume-driven revenue breakdown by month</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {monthlyAttribution.map((m) => {
              const mvPct = (m.mvDrivenRevenue / maxMonthly) * 100;
              const volPct = (m.volumeDrivenRevenue / maxMonthly) * 100;
              return (
                <div key={m.month} className="flex items-center gap-3 text-xs">
                  <span className="w-16 text-right text-slate-600 font-medium">{m.month.slice(5)}</span>
                  <div className="flex-1 flex h-6 rounded overflow-hidden bg-slate-100">
                    <div className="bg-blue-500 h-full" style={{ width: `${mvPct}%` }} title={`MV: ${formatINR(m.mvDrivenRevenue, true)}`} />
                    <div className="bg-emerald-400 h-full" style={{ width: `${volPct}%` }} title={`Vol: ${formatINR(m.volumeDrivenRevenue, true)}`} />
                  </div>
                  <span className="w-24 text-right font-medium">{formatINR(m.totalRevenue, true)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /> MV-Driven</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400" /> Volume-Driven</span>
          </div>
        </CardContent>
      </Card>

      {/* District Attribution Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            District-Level Attribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>District</TableHead>
                  <TableHead className="text-right">Total Growth</TableHead>
                  <TableHead className="text-right">MV Contribution</TableHead>
                  <TableHead className="text-right">MV %</TableHead>
                  <TableHead className="text-right">Volume Contribution</TableHead>
                  <TableHead className="text-right">Doc Count Change</TableHead>
                  <TableHead className="text-right">Rev/Doc</TableHead>
                  <TableHead>Last MV Revision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {districtAttribution.map((d) => (
                  <TableRow key={d.districtCode}>
                    <TableCell className="font-medium">{d.districtName}</TableCell>
                    <TableCell className="text-right font-medium">{formatINR(d.totalGrowth, true)}</TableCell>
                    <TableCell className="text-right">{formatINR(d.mvContribution, true)}</TableCell>
                    <TableCell className="text-right">
                      <span className={d.mvContributionPercent > 60 ? "text-blue-700 font-semibold" : ""}>
                        {d.mvContributionPercent.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatINR(d.volumeContribution, true)}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-emerald-600">+{d.docCountChange}%</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatINR(d.revenuePerDoc)}</TableCell>
                    <TableCell className="text-xs">{d.lastMVRevisionDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchy Drill-Down */}
      {hierarchyData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              District → SRO → Mandal Drill-Down
            </CardTitle>
            <p className="text-xs text-muted-foreground">Click a district to expand its SRO and mandal breakdown</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {hierarchyData.districts.map((dist) => (
                <div key={dist.code}>
                  <button
                    onClick={() => toggleDistrict(dist.code)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-50 text-left text-sm"
                  >
                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedDistricts.has(dist.code) ? "rotate-90" : ""}`} />
                    <span className="font-semibold">{dist.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatINR(dist.revenue, true)} · MV: {formatINR(dist.mvDriven, true)} · Vol: {formatINR(dist.volumeDriven, true)}
                    </span>
                  </button>
                  {expandedDistricts.has(dist.code) && dist.children && (
                    <div className="ml-6 border-l border-slate-200 pl-3 space-y-1">
                      {dist.children.map((sro) => (
                        <div key={sro.code}>
                          <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700">
                            <span className="font-medium">{sro.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {formatINR(sro.revenue, true)} · {sro.docCount.toLocaleString()} docs
                            </span>
                          </div>
                          {sro.children && (
                            <div className="ml-6 border-l border-slate-100 pl-3">
                              {sro.children.map((mandal) => (
                                <div key={mandal.code} className="flex items-center gap-2 px-3 py-1 text-xs text-slate-600">
                                  <span>{mandal.name}</span>
                                  <span className="ml-auto text-muted-foreground">
                                    {formatINR(mandal.revenue, true)} · {mandal.docCount.toLocaleString()} docs
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Revision Comparison Tab
// ═══════════════════════════════════════════════════════════════════════════════

function RevisionComparisonTab({ data, loading }: { data: MVRevisionComparison | null; loading: boolean }) {
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");

  if (loading) return <div className="animate-pulse space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded" />)}</div>;
  if (!data) return <p className="text-sm text-muted-foreground">No revision comparison data available.</p>;

  const { revisions, sroPeerComparison } = data;

  const filteredRevisions = selectedDistrict === "all"
    ? revisions
    : revisions.filter((r) => r.district === selectedDistrict);

  const districts = Array.from(new Set(revisions.map((r) => r.district))).sort();

  return (
    <div className="space-y-6">
      {/* District Filter */}
      <div className="flex items-center gap-3">
        <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue placeholder="District" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {districts.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-xs">{filteredRevisions.length} revision{filteredRevisions.length !== 1 ? "s" : ""}</Badge>
      </div>

      {/* Revision Cards */}
      {filteredRevisions.map((rev) => {
        const preAvgDocs = rev.preRevision.avgDocsPerMonth;
        const postAvgDocs = rev.postRevision.avgDocsPerMonth;
        const docChange = ((postAvgDocs - preAvgDocs) / preAvgDocs * 100).toFixed(1);
        const revChange = ((rev.postRevision.totalRevenue - rev.preRevision.totalRevenue) / rev.preRevision.totalRevenue * 100).toFixed(1);
        const mvChange = ((rev.postRevision.avgMV - rev.preRevision.avgMV) / rev.preRevision.avgMV * 100).toFixed(1);

        return (
          <Card key={`${rev.district}-${rev.sroCode}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitCompare className="w-4 h-4" />
                  {rev.district} ({rev.sroCode})
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Revision: {new Date(rev.revisionDate).toLocaleDateString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pre vs Post Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 border">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Pre-Revision</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-slate-500">Avg Docs/Month</p><p className="font-bold">{preAvgDocs.toLocaleString()}</p></div>
                    <div><p className="text-slate-500">Avg MV</p><p className="font-bold">{formatINR(rev.preRevision.avgMV)}</p></div>
                    <div><p className="text-slate-500">Total Revenue</p><p className="font-bold">{formatINR(rev.preRevision.totalRevenue, true)}</p></div>
                    <div><p className="text-slate-500">Avg Gap</p><p className="font-bold">{rev.preRevision.avgGap}%</p></div>
                    <div><p className="text-slate-500">High Risk Rate</p><p className="font-bold">{rev.preRevision.highRiskRate}%</p></div>
                    <div><p className="text-slate-500">Exemption Claims</p><p className="font-bold">{rev.preRevision.exemptionClaims}</p></div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">Post-Revision</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-slate-500">Avg Docs/Month</p><p className="font-bold">{postAvgDocs.toLocaleString()} <span className="text-xs text-red-600">({docChange}%)</span></p></div>
                    <div><p className="text-slate-500">Avg MV</p><p className="font-bold">{formatINR(rev.postRevision.avgMV)} <span className="text-xs text-emerald-600">(+{mvChange}%)</span></p></div>
                    <div><p className="text-slate-500">Total Revenue</p><p className="font-bold">{formatINR(rev.postRevision.totalRevenue, true)} <span className="text-xs text-emerald-600">(+{revChange}%)</span></p></div>
                    <div><p className="text-slate-500">Avg Gap</p><p className="font-bold">{rev.postRevision.avgGap}%</p></div>
                    <div><p className="text-slate-500">High Risk Rate</p><p className="font-bold">{rev.postRevision.highRiskRate}%</p></div>
                    <div><p className="text-slate-500">Exemption Claims</p><p className="font-bold">{rev.postRevision.exemptionClaims}</p></div>
                  </div>
                </div>
              </div>

              {/* Document Volume Timeline SVG */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Document Volume Timeline</p>
                <div className="overflow-x-auto">
                  <svg viewBox="0 0 600 120" className="w-full h-[120px]">
                    {rev.documentVolumeTimeline.map((pt, i) => {
                      const maxCount = Math.max(...rev.documentVolumeTimeline.map((p) => p.count));
                      const x = 40 + (i * (520 / (rev.documentVolumeTimeline.length - 1)));
                      const y = 100 - ((pt.count / maxCount) * 80);
                      const color = pt.phase === "pre" ? "#94a3b8" : "#3b82f6";
                      return (
                        <g key={pt.month}>
                          {i > 0 && (
                            <line
                              x1={40 + ((i - 1) * (520 / (rev.documentVolumeTimeline.length - 1)))}
                              y1={100 - ((rev.documentVolumeTimeline[i - 1].count / maxCount) * 80)}
                              x2={x}
                              y2={y}
                              stroke={color}
                              strokeWidth={2}
                            />
                          )}
                          <circle cx={x} cy={y} r={3} fill={color} />
                          <text x={x} y={115} textAnchor="middle" className="text-[8px] fill-slate-400">
                            {pt.month.slice(5)}
                          </text>
                        </g>
                      );
                    })}
                    {/* Revision date marker */}
                    {(() => {
                      const revIdx = rev.documentVolumeTimeline.findIndex((p) => p.phase === "post");
                      if (revIdx < 0) return null;
                      const x = 40 + (revIdx * (520 / (rev.documentVolumeTimeline.length - 1)));
                      return (
                        <line x1={x} y1={5} x2={x} y2={105} stroke="#ef4444" strokeWidth={1} strokeDasharray="4 2" />
                      );
                    })()}
                  </svg>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-1 rounded bg-slate-400" /> Pre-Revision</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-1 rounded bg-blue-500" /> Post-Revision</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0 border-t border-dashed border-red-400" style={{ width: 12 }} /> Revision Date</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* SRO Peer Comparison */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            SRO Peer Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Rank</TableHead>
                  <TableHead>Office</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Growth %</TableHead>
                  <TableHead className="text-right">MV Compliance</TableHead>
                  <TableHead className="text-right">Avg Gap</TableHead>
                  <TableHead className="text-right">High Risk %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sroPeerComparison.map((sro) => (
                  <TableRow key={sro.sroCode}>
                    <TableCell className="text-center font-bold">{sro.rank}</TableCell>
                    <TableCell className="font-medium">{sro.officeName}</TableCell>
                    <TableCell className="text-sm">{sro.district}</TableCell>
                    <TableCell className="text-right font-medium">{formatINR(sro.revenue, true)}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-emerald-600 font-medium">+{sro.revenueGrowth}%</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={sro.mvCompliance >= 92 ? "text-emerald-600" : sro.mvCompliance >= 88 ? "text-amber-600" : "text-red-600"}>
                        {sro.mvCompliance}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{sro.avgGap}%</TableCell>
                    <TableCell className="text-right">
                      <span className={sro.highRiskPercent > 8 ? "text-red-600 font-medium" : ""}>
                        {sro.highRiskPercent}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Anomalies Tab
// ═══════════════════════════════════════════════════════════════════════════════

function AnomaliesTab({ data, loading }: { data: MVAnomaliesData | null; loading: boolean }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  if (loading) return <div className="animate-pulse space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded" />)}</div>;
  if (!data) return <p className="text-sm text-muted-foreground">No anomaly data available.</p>;

  const { summary, anomalies, anomalyDistribution, sroRiskHeatmap } = data;

  const filteredAnomalies = anomalies.filter((a) => {
    if (typeFilter !== "all" && a.anomalyType !== typeFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  const anomalyTypes = Array.from(new Set(anomalies.map((a) => a.anomalyType)));
  const statuses = Array.from(new Set(anomalies.map((a) => a.status)));

  const ANOMALY_LABELS: Record<string, string> = {
    ExecutionRegistrationGap: "Execution Gap",
    AbnormalUDS: "Abnormal UDS",
    CompositeRateMisuse: "Composite Rate Misuse",
    ClassificationDowngrade: "Classification Downgrade",
  };

  const ANOMALY_COLORS: Record<string, string> = {
    ExecutionRegistrationGap: "bg-red-100 text-red-700 border-red-200",
    AbnormalUDS: "bg-orange-100 text-orange-700 border-orange-200",
    CompositeRateMisuse: "bg-amber-100 text-amber-700 border-amber-200",
    ClassificationDowngrade: "bg-purple-100 text-purple-700 border-purple-200",
  };

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Anomalies</p>
            <p className="text-2xl font-bold text-red-700">{summary.totalAnomalies}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Execution Gap</p>
            <p className="text-2xl font-bold">{summary.executionGapCases}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">UDS Anomalies</p>
            <p className="text-2xl font-bold">{summary.udsAnomalies}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Composite Rate</p>
            <p className="text-2xl font-bold">{summary.compositeRateCases}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Classification</p>
            <p className="text-2xl font-bold">{summary.classificationCases}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/30">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Est. Leakage</p>
            <p className="text-2xl font-bold text-orange-700">{formatINR(summary.totalEstimatedLeakage, true)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Anomaly Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {anomalyDistribution.map((d) => {
              const pct = (d.count / summary.totalAnomalies) * 100;
              return (
                <div key={d.type} className="flex items-center gap-3">
                  <span className="w-44 text-sm font-medium">{ANOMALY_LABELS[d.type] ?? d.type}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                    <div
                      className={`h-full ${d.type === "ExecutionRegistrationGap" ? "bg-red-400" : d.type === "AbnormalUDS" ? "bg-orange-400" : d.type === "CompositeRateMisuse" ? "bg-amber-400" : "bg-purple-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-bold">{d.count}</span>
                  <span className="w-20 text-right text-xs text-muted-foreground">{formatINR(d.amount, true)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* SRO Risk Heatmap */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            SRO Risk Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {sroRiskHeatmap.map((sro) => {
              const bg = sro.score >= 80 ? "bg-red-100 border-red-300" : sro.score >= 60 ? "bg-orange-100 border-orange-300" : sro.score >= 40 ? "bg-amber-100 border-amber-300" : "bg-green-100 border-green-300";
              const textColor = sro.score >= 80 ? "text-red-800" : sro.score >= 60 ? "text-orange-800" : sro.score >= 40 ? "text-amber-800" : "text-green-800";
              return (
                <div key={sro.sroCode} className={`rounded-lg border p-3 text-center ${bg}`}>
                  <p className="text-xs font-semibold text-slate-600">{sro.sroCode}</p>
                  <p className={`text-2xl font-bold mt-1 ${textColor}`}>{sro.score}</p>
                  <p className="text-[10px] text-muted-foreground">{sro.anomalyCount} anomalies</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Anomalies Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Anomaly Cases
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {anomalyTypes.map((t) => (
                    <SelectItem key={t} value={t}>{ANOMALY_LABELS[t] ?? t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
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
                  <TableHead>Case ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Office</TableHead>
                  <TableHead className="text-right">MV Declared</TableHead>
                  <TableHead className="text-right">MV Expected</TableHead>
                  <TableHead className="text-right">Deviation</TableHead>
                  <TableHead className="text-right">Leakage</TableHead>
                  <TableHead className="text-center">Risk</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnomalies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">No anomalies match filters.</TableCell>
                  </TableRow>
                ) : (
                  filteredAnomalies.map((a) => (
                    <TableRow key={a.caseId}>
                      <TableCell className="font-mono text-xs">{a.caseId}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${ANOMALY_COLORS[a.anomalyType] ?? ""}`}>
                          {ANOMALY_LABELS[a.anomalyType] ?? a.anomalyType}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{a.documentKey}</TableCell>
                      <TableCell className="text-sm">{a.officeName}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatINR(a.mvDeclared)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatINR(a.mvExpected)}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-red-600 font-medium">{a.deviationPercent.toFixed(1)}%</span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-700">{formatINR(a.estimatedLeakage, true)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-8 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500" style={{ width: `${a.riskScore}%` }} />
                          </div>
                          <span className="text-xs font-bold">{a.riskScore}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.status === "Confirmed" ? "default"
                              : a.status === "In Review" ? "secondary"
                              : a.status === "Resolved" ? "outline"
                              : "destructive"
                          }
                        >
                          {a.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════════

export default function MVTrendsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

  const { data: trends, loading: trendsLoading, error: trendsError, refetch: trendsRefetch } = useIGRSTrends();
  const { data: hotspots, loading: hotspotsLoading, error: hotspotsError, refetch: hotspotsRefetch } = useIGRSMVHotspots();
  const growth = useIGRSMVGrowthAttribution();
  const comparison = useIGRSMVRevisionComparison();
  const anomalies = useIGRSMVAnomalies();

  const loading = trendsLoading || hotspotsLoading;
  const error = trendsError || hotspotsError;

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

      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && <DashboardTab hotspots={hotspots} trends={trends} />}
      {activeTab === "growth" && <GrowthAttributionTab data={growth.data} loading={growth.loading} />}
      {activeTab === "comparison" && <RevisionComparisonTab data={comparison.data} loading={comparison.loading} />}
      {activeTab === "anomalies" && <AnomaliesTab data={anomalies.data} loading={anomalies.loading} />}
    </div>
  );
}
