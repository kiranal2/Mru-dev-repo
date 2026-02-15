"use client";

import { useIGRSDashboard, useIGRSTrends } from "@/hooks/data";
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

export default function OverviewPage() {
  const {
    data: dashboard,
    loading: dashLoading,
    error: dashError,
    refetch: dashRefetch,
  } = useIGRSDashboard();
  const {
    data: trends,
    loading: trendsLoading,
    error: trendsError,
    refetch: trendsRefetch,
  } = useIGRSTrends();

  const loading = dashLoading || trendsLoading;
  const error = dashError || trendsError;

  if (loading)
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
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
            onClick={() => {
              dashRefetch();
              trendsRefetch();
            }}
            className="mt-2 text-sm text-red-600 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );

  const kpis = [
    {
      title: "Total Payable",
      value: formatINR(dashboard?.totalPayable ?? 0, true),
      description: "Aggregate government fees payable",
    },
    {
      title: "Total Paid",
      value: formatINR(dashboard?.totalPaid ?? 0, true),
      description: "Total amount collected",
    },
    {
      title: "Total Gap",
      value: formatINR(dashboard?.totalGap ?? 0, true),
      description: "Payable minus paid",
      highlight: true,
    },
    {
      title: "High Risk Cases",
      value: String(dashboard?.highRiskCases ?? 0),
      description: "Cases requiring urgent attention",
      highlight: true,
    },
    {
      title: "Avg Challan Delay",
      value: `${dashboard?.avgChallanDelayDays ?? 0} days`,
      description: "Average delay in challan processing",
    },
    {
      title: "Cases Awaiting Review",
      value: String(dashboard?.casesAwaitingReview ?? 0),
      description: "New or In Review status",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Revenue Assurance Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Last refresh: {dashboard?.lastRefresh ? new Date(dashboard.lastRefresh).toLocaleString() : "N/A"}</span>
          <Badge
            variant={
              dashboard?.syncStatus === "Healthy"
                ? "default"
                : dashboard?.syncStatus === "Degraded"
                ? "secondary"
                : "destructive"
            }
          >
            {dashboard?.syncStatus ?? "Unknown"}
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className={kpi.highlight ? "border-orange-300 bg-orange-50/50" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {kpi.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Trends Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {(dashboard?.monthlyTrends?.length ?? 0) > 0 || (trends?.length ?? 0) > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Cases</TableHead>
                  <TableHead className="text-right">Gap (INR)</TableHead>
                  <TableHead className="text-right">High Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(dashboard?.monthlyTrends ?? trends ?? []).map((t) => (
                  <TableRow key={t.month}>
                    <TableCell className="font-medium">{t.month}</TableCell>
                    <TableCell className="text-right">{t.cases}</TableCell>
                    <TableCell className="text-right">
                      {formatINR(t.gapInr, true)}
                    </TableCell>
                    <TableCell className="text-right">{t.highRisk}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No trend data available.</p>
          )}
        </CardContent>
      </Card>

      {/* Top Offices by Gap */}
      <Card>
        <CardHeader>
          <CardTitle>Top Offices by Gap</CardTitle>
        </CardHeader>
        <CardContent>
          {(dashboard?.topOfficesByGap?.length ?? 0) > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SRO Code</TableHead>
                  <TableHead>Office Name</TableHead>
                  <TableHead className="text-right">Gap (INR)</TableHead>
                  <TableHead className="text-right">Cases</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard!.topOfficesByGap.map((office) => (
                  <TableRow key={office.srCode}>
                    <TableCell className="font-mono text-sm">
                      {office.srCode}
                    </TableCell>
                    <TableCell>{office.srName}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatINR(office.gapInr, true)}
                    </TableCell>
                    <TableCell className="text-right">{office.cases}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No office data available.</p>
          )}
        </CardContent>
      </Card>

      {/* Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          {(dashboard?.highlights?.length ?? 0) > 0 ? (
            <ul className="space-y-2">
              {dashboard!.highlights.map((h, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm border-l-2 border-blue-400 pl-3 py-1"
                >
                  <span className="text-muted-foreground shrink-0 w-5">
                    {h.icon === "alert" ? "!" : h.icon === "trending-up" ? "^" : "*"}
                  </span>
                  <span>{h.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No highlights available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
