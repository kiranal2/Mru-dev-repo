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
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Activity,
  FileWarning,
  Users,
} from "lucide-react";

const SIGNAL_LABELS: Record<string, string> = {
  RevenueGap: "Revenue Gap",
  MarketValueRisk: "Market Value Risk",
  ChallanDelay: "Challan Delay",
  ExemptionRisk: "Exemption Risk",
  DataIntegrity: "Data Integrity",
  HolidayFee: "Holiday Fee",
  ProhibitedLand: "Prohibited Land",
};

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

  // SLA
  const sla = dashboard?.slaSummary;
  const slaTotal = (sla?.withinSla ?? 0) + (sla?.breached ?? 0);
  const slaPct = slaTotal > 0 ? ((sla?.withinSla ?? 0) / slaTotal) * 100 : 0;

  // Exemptions
  const exemptions = dashboard?.exemptionSummary;

  // Rules health
  const rules = dashboard?.rulesHealth;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
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

      {/* Row: Leakage by Signal + SLA + Exemptions + Rules Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leakage by Signal Type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Leakage by Signal Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(dashboard?.leakageBySignal?.length ?? 0) > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Signal</TableHead>
                    <TableHead className="text-center">
                      <span className="inline-flex items-center gap-1 text-red-600">High</span>
                    </TableHead>
                    <TableHead className="text-center">
                      <span className="inline-flex items-center gap-1 text-amber-600">Med</span>
                    </TableHead>
                    <TableHead className="text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-600">Low</span>
                    </TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard!.leakageBySignal.map((row) => {
                    const total = row.high + row.medium + row.low;
                    return (
                      <TableRow key={row.signal}>
                        <TableCell className="font-medium text-sm">
                          {SIGNAL_LABELS[row.signal] ?? row.signal}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.high > 0 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                              {row.high}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.medium > 0 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                              {row.medium}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.low > 0 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                              {row.low}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">{total}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No signal data available.</p>
            )}
          </CardContent>
        </Card>

        {/* SLA Compliance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              SLA Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sla ? (
              <>
                {/* Gauge-like visual */}
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={slaPct >= 80 ? "#16a34a" : slaPct >= 60 ? "#d97706" : "#dc2626"}
                        strokeWidth="3"
                        strokeDasharray={`${slaPct}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{slaPct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>{sla.withinSla} within SLA</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span>{sla.breached} breached</span>
                    </div>
                  </div>
                </div>

                {/* Ageing buckets */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Ageing Distribution</p>
                  <div className="flex gap-2">
                    {Object.entries(sla.ageingBuckets).map(([bucket, count]) => (
                      <div
                        key={bucket}
                        className="flex-1 text-center border rounded-lg py-2 px-1"
                      >
                        <p className="text-lg font-bold">{count}</p>
                        <p className="text-[10px] text-muted-foreground">{bucket}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No SLA data available.</p>
            )}
          </CardContent>
        </Card>

        {/* Exemption Anomalies */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileWarning className="w-4 h-4" />
              Exemption Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {exemptions ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Total Exemptions</p>
                  <p className="text-xl font-bold mt-1">{exemptions.totalExemptions}</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Exempted Amount</p>
                  <p className="text-xl font-bold mt-1">{formatINR(exemptions.totalAmount, true)}</p>
                </div>
                <div className="border border-red-200 bg-red-50/50 rounded-lg p-3">
                  <p className="text-xs text-red-600 font-medium">Failed Eligibility</p>
                  <p className="text-xl font-bold text-red-700 mt-1">{exemptions.failedEligibility}</p>
                  <p className="text-[10px] text-red-500 mt-0.5">Claims that failed checks</p>
                </div>
                <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-3">
                  <p className="text-xs text-amber-600 font-medium">Repeat Offenders</p>
                  <p className="text-xl font-bold text-amber-700 mt-1">{exemptions.repeatOffenders}</p>
                  <p className="text-[10px] text-amber-500 mt-0.5">Parties with repeat usage</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No exemption data available.</p>
            )}
          </CardContent>
        </Card>

        {/* Rules Engine Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Rules Engine Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rules ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {rules.failures === 0 ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-semibold text-green-800">All Systems Healthy</p>
                        <p className="text-xs text-green-600">0 failures in last run</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-sm font-semibold text-red-800">{rules.failures} Failure{rules.failures !== 1 ? "s" : ""}</p>
                        <p className="text-xs text-red-600">Requires attention</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Enabled Rules</p>
                    <p className="text-xl font-bold mt-1">{rules.enabled}</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Last Run</p>
                    <p className="text-sm font-medium mt-1">
                      {rules.lastRun ? new Date(rules.lastRun).toLocaleString() : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No rules health data available.</p>
            )}
          </CardContent>
        </Card>
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
                  className={`flex items-start gap-3 text-sm border-l-2 pl-3 py-1 ${
                    h.icon === "alert"
                      ? "border-red-400"
                      : h.icon === "trending-up"
                      ? "border-blue-400"
                      : "border-slate-300"
                  }`}
                >
                  <span className="shrink-0 w-5">
                    {h.icon === "alert" ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : h.icon === "trending-up" ? (
                      <Activity className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Users className="w-4 h-4 text-slate-400" />
                    )}
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
