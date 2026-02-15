"use client";

import { useIGRSTrends } from "@/hooks/data";
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
import { formatINR } from "@/lib/data/utils/format-currency";

export default function MVTrendsPage() {
  const { data: trends, loading, error, refetch } = useIGRSTrends();

  if (loading)
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button onClick={refetch} className="mt-2 text-sm text-red-600 underline">
            Retry
          </button>
        </div>
      </div>
    );

  // Derive summary stats from trends
  const totalCases = trends.reduce((sum, t) => sum + t.cases, 0);
  const totalGap = trends.reduce((sum, t) => sum + t.gapInr, 0);
  const totalHighRisk = trends.reduce((sum, t) => sum + t.highRisk, 0);
  const avgGapPerMonth =
    trends.length > 0 ? totalGap / trends.length : 0;

  // Identify hotspot months (months with above-average gaps)
  const hotspots = trends.filter((t) => t.gapInr > avgGapPerMonth);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Market Value Trends</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCases}</p>
            <p className="text-xs text-muted-foreground">
              Across {trends.length} months
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Gap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatINR(totalGap, true)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              High Risk Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalHighRisk}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Avg Gap / Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatINR(avgGapPerMonth, true)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Data</CardTitle>
        </CardHeader>
        <CardContent>
          {trends.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Cases</TableHead>
                  <TableHead className="text-right">Gap (INR)</TableHead>
                  <TableHead className="text-right">High Risk</TableHead>
                  <TableHead className="text-right">High Risk %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trends.map((t) => {
                  const highRiskPct =
                    t.cases > 0
                      ? ((t.highRisk / t.cases) * 100).toFixed(1)
                      : "0.0";
                  const isHotspot = t.gapInr > avgGapPerMonth;
                  return (
                    <TableRow
                      key={t.month}
                      className={isHotspot ? "bg-orange-50/50" : ""}
                    >
                      <TableCell className="font-medium">
                        {t.month}
                        {isHotspot && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Hotspot
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{t.cases}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatINR(t.gapInr, true)}
                      </TableCell>
                      <TableCell className="text-right">{t.highRisk}</TableCell>
                      <TableCell className="text-right">{highRiskPct}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No trend data available.</p>
          )}
        </CardContent>
      </Card>

      {/* Hotspot Months */}
      <Card>
        <CardHeader>
          <CardTitle>Hotspot Months</CardTitle>
          <p className="text-sm text-muted-foreground">
            Months where the gap exceeds the average of {formatINR(avgGapPerMonth, true)} per
            month
          </p>
        </CardHeader>
        <CardContent>
          {hotspots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {hotspots.map((h) => (
                <div
                  key={h.month}
                  className="border border-orange-200 bg-orange-50/50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{h.month}</span>
                    <Badge variant="destructive">
                      {formatINR(h.gapInr, true)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{h.cases} cases | {h.highRisk} high risk</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hotspot months identified.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
