"use client";

import { useState } from "react";
import { useIGRSGovernance } from "@/hooks/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Building2,
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  Shield,
  Clock,
  Activity,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

// ─── Tab Types ───────────────────────────────────────────────────────────────

type TabKey =
  | "revenue-growth"
  | "district-ranking"
  | "low-performing"
  | "classification"
  | "prohibited-property"
  | "anywhere-registration"
  | "sla-monitoring"
  | "demographics"
  | "officer-accountability";

const tabs: { key: TabKey; label: string }[] = [
  { key: "revenue-growth", label: "Revenue Growth" },
  { key: "district-ranking", label: "District Ranking" },
  { key: "low-performing", label: "Low Performing" },
  { key: "classification", label: "Classification" },
  { key: "prohibited-property", label: "Prohibited Property" },
  { key: "anywhere-registration", label: "Anywhere Registration" },
  { key: "sla-monitoring", label: "SLA Monitoring" },
  { key: "demographics", label: "Demographics" },
  { key: "officer-accountability", label: "Officer Accountability" },
];

// ─── Data Type Interfaces ────────────────────────────────────────────────────

interface RevenueGrowthData {
  metadata: { lastUpdated: string; period: string; totalDistricts: number; totalSROs: number };
  summary: {
    currentMonthRevenue: number;
    previousMonthRevenue: number;
    momGrowth: number;
    ytdRevenue: number;
  };
  monthlyRevenue: Array<{
    month: string;
    stampDuty: number;
    transferDuty: number;
    registrationFee: number;
    dsd: number;
    other: number;
    total: number;
    growthPercent: number;
    docCount: number;
  }>;
}

interface DistrictRankingData {
  metadata: { lastUpdated: string; period: string; totalDistricts: number; totalSROs: number };
  rankings: Array<{
    rank: number;
    districtCode: string;
    districtName: string;
    revenue: number;
    target: number;
    achievementPercent: number;
    growthPercent: number;
    docCount: number;
    avgMV: number;
    sroCount: number;
    zone: string;
  }>;
}

interface LowPerformersData {
  metadata: { lastUpdated: string; period: string; totalDistricts: number; totalSROs: number };
  districts: Array<{
    districtCode: string;
    districtName: string;
    rank: number;
    revenue: number;
    target: number;
    achievement: number;
    growth: number;
    reasons: string[];
    suggestedActions: string[];
    keyMetrics: {
      docCountVsPrev: number;
      avgMVVsState: number;
      exemptionRate: number;
      vacantSROCount: number;
    };
  }>;
}

interface ClassificationData {
  metadata: { lastUpdated: string; period: string; totalDistricts: number; totalSROs: number };
  classifications: Array<{
    type: string;
    docCount: number;
    revenue: number;
    sharePercent: number;
    avgMV: number;
    growthPercent: number;
    topDistrict: string;
  }>;
  districtClassificationMatrix: Array<{
    district: string;
    residential: number;
    commercial: number;
    agricultural: number;
    industrial: number;
    mixed: number;
    govt: number;
  }>;
  conversionCases?: {
    summary: {
      totalConversions: number;
      commercialToResidential: number;
      agriculturalToCommercial: number;
      otherConversions: number;
      estimatedRevenueImpact: number;
      flaggedCases: number;
    };
    cases: Array<{
      caseId: string;
      documentKey: string;
      sroCode: string;
      officeName: string;
      district: string;
      weblandClassification: string;
      form1Classification: string;
      form2Classification: string;
      declaredClassification: string;
      conversionType: string;
      mvDeclared: number;
      mvExpected: number;
      revenueImpact: number;
      status: string;
      detectedDate: string;
    }>;
    monthlyTrend: Array<{ month: string; conversions: number; flagged: number; revenueImpact: number }>;
  };
}

interface ProhibitedPropertyData {
  metadata: { lastUpdated: string; period: string; totalDistricts: number; totalSROs: number };
  summary: {
    totalNotifications: number;
    totalDenotifications: number;
    activePPCount: number;
    registrationBlocks: number;
  };
  trends: Array<{ month: string; notifications: number; denotifications: number }>;
  registry: Array<{
    notificationNo: string;
    date: string;
    category: string;
    district: string;
    location: string;
    status: string;
    documentsBlocked: number;
  }>;
  categoryDistribution: Array<{ category: string; count: number; percent: number }>;
}

interface AnywhereRegistrationData {
  metadata: { lastUpdated: string; period: string; totalDistricts: number; totalSROs: number };
  summary: {
    totalAnywhereRegs: number;
    percentOfTotal: number;
    topDestinationSRO: string;
    topSourceDistrict: string;
  };
  flows: Array<{
    propertyLocation: string;
    registeredAt: string;
    docCount: number;
    revenue: number;
    avgMV: number;
  }>;
  monthlyTrend: Array<{ month: string; count: number; percent: number }>;
}

interface SLAMonitoringData {
  metadata: { lastUpdated: string; period: string; totalDistricts: number; totalSROs: number };
  summary: {
    totalPending: number;
    withinSLA: number;
    slaBreached: number;
    avgProcessingDays: number;
    oldestPendingDays: number;
    compliancePercent: number;
  };
  ageingBuckets: Array<{ bucket: string; count: number; color: string }>;
  officeSLA: Array<{
    officeCode: string;
    officeName: string;
    total: number;
    withinSLA: number;
    breached: number;
    avgDays: number;
    oldestDays: number;
    compliancePercent: number;
  }>;
  pendingByDocType: Array<{ docType: string; count: number; percent: number }>;
  monthlyCompliance: Array<{ month: string; compliancePercent: number }>;
}

interface DemographicsData {
  metadata: { lastUpdated: string; period: string; totalDistricts: number; totalSROs: number };
  gender: {
    distribution: Array<{ gender: string; count: number; percent: number; revenue: number }>;
    femaleBuyerPercent: number;
    jointRegistrationPercent: number;
    avgMVFemale: number;
    avgMVMale: number;
    monthlyTrend: Array<{
      month: string;
      femalePercent: number;
      malePercent: number;
      jointPercent: number;
    }>;
  };
  topParties: Array<{
    partyName: string;
    pan: string;
    aadhaar: string;
    entityType: string;
    declaredAs: string;
    verificationStatus: string;
    verificationRemark?: string;
    role: string;
    registrations: number;
    totalValue: number;
    districts: string[];
    flagged: boolean;
  }>;
  departments: Array<{
    department: string;
    docCount: number;
    revenue: number;
    exemptionsClaimed: number;
    exemptAmount: number;
    netRevenue: number;
  }>;
}

interface OfficerAccountabilityData {
  metadata: { lastUpdated: string; period: string; totalDistricts: number; totalSROs: number };
  summary: {
    totalOfficers: number;
    flaggedOfficers: number;
    avgAccountabilityScore: number;
    highRiskOfficers: number;
    totalCashVariance: number;
    pendingReconciliations: number;
  };
  officers: Array<{
    officerId: string;
    officerName: string;
    designation: string;
    sroCode: string;
    officeName: string;
    district: string;
    dailyCashRiskScore: number;
    challanAnomalyCount: number;
    cashVarianceInr: number;
    stampDiscrepancyCount: number;
    pendingReconciliations: number;
    slaBreachCount: number;
    accountabilityScore: number;
    trend: string;
    lastAuditDate: string;
    flagged: boolean;
  }>;
  sroAccountabilitySummary: Array<{
    sroCode: string;
    officeName: string;
    avgScore: number;
    officerCount: number;
    flaggedCount: number;
    totalVariance: number;
  }>;
}

// ─── KPI Card Component ──────────────────────────────────────────────────────

function KPICard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  const bgMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-100",
    red: "bg-red-50 border-red-100",
    amber: "bg-amber-50 border-amber-100",
    purple: "bg-purple-50 border-purple-100",
    emerald: "bg-emerald-50 border-emerald-100",
    indigo: "bg-indigo-50 border-indigo-100",
    slate: "bg-slate-50 border-slate-100",
    green: "bg-green-50 border-green-100",
  };

  return (
    <div className={`rounded-lg border p-3 ${bgMap[accent] || "bg-slate-50 border-slate-100"}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-xl font-bold text-slate-800">{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

// ─── Achievement color helper ────────────────────────────────────────────────

function achievementColor(pct: number): string {
  if (pct >= 100) return "text-emerald-600";
  if (pct >= 90) return "text-amber-600";
  return "text-red-600";
}

function achievementBadgeVariant(pct: number): "default" | "secondary" | "destructive" | "outline" {
  if (pct >= 100) return "default";
  if (pct >= 90) return "secondary";
  return "destructive";
}

// ─── Tab Content Components ──────────────────────────────────────────────────

function RevenueGrowthTab({ data }: { data: RevenueGrowthData }) {
  const { summary, monthlyRevenue } = data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
          label="Current Month"
          value={formatINR(summary.currentMonthRevenue, true)}
          sub="Dec 2024 revenue"
          accent="blue"
        />
        <KPICard
          icon={<BarChart3 className="w-4 h-4 text-indigo-600" />}
          label="Previous Month"
          value={formatINR(summary.previousMonthRevenue, true)}
          sub="Nov 2024 revenue"
          accent="indigo"
        />
        <KPICard
          icon={<Activity className="w-4 h-4 text-emerald-600" />}
          label="MoM Growth"
          value={`${summary.momGrowth >= 0 ? "+" : ""}${summary.momGrowth}%`}
          sub="Month-over-month"
          accent="emerald"
        />
        <KPICard
          icon={<Building2 className="w-4 h-4 text-purple-600" />}
          label="YTD Revenue"
          value={formatINR(summary.ytdRevenue, true)}
          sub="Year to date total"
          accent="purple"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Monthly Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Stamp Duty</TableHead>
                <TableHead className="text-right">Transfer Duty</TableHead>
                <TableHead className="text-right">Reg. Fee</TableHead>
                <TableHead className="text-right">DSD</TableHead>
                <TableHead className="text-right">Other</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Growth %</TableHead>
                <TableHead className="text-right">Doc Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyRevenue.map((row) => (
                <TableRow key={row.month}>
                  <TableCell className="font-medium">{row.month}</TableCell>
                  <TableCell className="text-right">{formatINR(row.stampDuty, true)}</TableCell>
                  <TableCell className="text-right">{formatINR(row.transferDuty, true)}</TableCell>
                  <TableCell className="text-right">{formatINR(row.registrationFee, true)}</TableCell>
                  <TableCell className="text-right">{formatINR(row.dsd, true)}</TableCell>
                  <TableCell className="text-right">{formatINR(row.other, true)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatINR(row.total, true)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      row.growthPercent > 0
                        ? "text-emerald-600"
                        : row.growthPercent < 0
                          ? "text-red-600"
                          : "text-slate-500"
                    }`}
                  >
                    {row.growthPercent > 0 ? "+" : ""}
                    {row.growthPercent.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {row.docCount.toLocaleString("en-IN")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function DistrictRankingTab({ data }: { data: DistrictRankingData }) {
  const { rankings } = data;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">District-wise Revenue Ranking</CardTitle>
          <p className="text-xs text-muted-foreground">
            Ranked by revenue across {data.metadata.totalDistricts} districts and{" "}
            {data.metadata.totalSROs} SROs
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>District</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Achievement %</TableHead>
                <TableHead className="text-right">Growth %</TableHead>
                <TableHead className="text-right">Doc Count</TableHead>
                <TableHead className="text-right">Avg MV</TableHead>
                <TableHead>Zone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings.map((row) => (
                <TableRow key={row.districtCode}>
                  <TableCell className="font-bold text-slate-500">{row.rank}</TableCell>
                  <TableCell className="font-medium">{row.districtName}</TableCell>
                  <TableCell className="text-right">{formatINR(row.revenue, true)}</TableCell>
                  <TableCell className="text-right text-slate-500">
                    {formatINR(row.target, true)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={achievementBadgeVariant(row.achievementPercent)}>
                      {row.achievementPercent.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      row.growthPercent >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {row.growthPercent >= 0 ? "+" : ""}
                    {row.growthPercent.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {row.docCount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right">{formatINR(row.avgMV, true)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {row.zone}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function LowPerformingTab({ data }: { data: LowPerformersData }) {
  const { districts } = data;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Underperforming Districts</CardTitle>
          <p className="text-xs text-muted-foreground">
            Districts below target with root-cause analysis and recommended actions
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>District</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Achievement %</TableHead>
                <TableHead className="text-right">Growth %</TableHead>
                <TableHead className="text-right">Doc vs Prev</TableHead>
                <TableHead className="text-right">MV vs State</TableHead>
                <TableHead className="text-right">Exempt Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {districts.map((row) => (
                <TableRow key={row.districtCode}>
                  <TableCell className="font-bold text-slate-500">{row.rank}</TableCell>
                  <TableCell className="font-medium">{row.districtName}</TableCell>
                  <TableCell className="text-right">{formatINR(row.revenue, true)}</TableCell>
                  <TableCell className="text-right text-slate-500">
                    {formatINR(row.target, true)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={achievementColor(row.achievement)}>
                      {row.achievement.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      row.growth >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {row.growth >= 0 ? "+" : ""}
                    {row.growth.toFixed(1)}%
                  </TableCell>
                  <TableCell
                    className={`text-right ${
                      row.keyMetrics.docCountVsPrev >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {row.keyMetrics.docCountVsPrev >= 0 ? "+" : ""}
                    {row.keyMetrics.docCountVsPrev.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {row.keyMetrics.avgMVVsState.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {row.keyMetrics.exemptionRate.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Recommendations per District */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {districts.map((district) => (
          <Card key={district.districtCode} className="border-l-4 border-l-red-400">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{district.districtName}</CardTitle>
                <Badge variant="destructive">{district.achievement.toFixed(1)}%</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Rank #{district.rank} | Vacant SROs: {district.keyMetrics.vacantSROCount}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">Root Causes</p>
                <ul className="space-y-1">
                  {district.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">Recommended Actions</p>
                <ul className="space-y-1">
                  {district.suggestedActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <Activity className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ClassificationTab({ data }: { data: ClassificationData }) {
  const { classifications, districtClassificationMatrix, conversionCases } = data;

  return (
    <div className="space-y-4">
      {/* Classification Breakdown Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Property Classification Breakdown</CardTitle>
          <p className="text-xs text-muted-foreground">
            Revenue and registration distribution by property type
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Doc Count</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Share %</TableHead>
                <TableHead className="text-right">Avg MV</TableHead>
                <TableHead className="text-right">Growth %</TableHead>
                <TableHead>Top District</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classifications.map((row) => (
                <TableRow key={row.type}>
                  <TableCell className="font-medium">{row.type}</TableCell>
                  <TableCell className="text-right">
                    {row.docCount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatINR(row.revenue, true)}
                  </TableCell>
                  <TableCell className="text-right">{row.sharePercent.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{formatINR(row.avgMV, true)}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      row.growthPercent >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    +{row.growthPercent.toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {row.topDistrict}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* District Classification Matrix */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">District-wise Classification Matrix</CardTitle>
          <p className="text-xs text-muted-foreground">Revenue by property type per district</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>District</TableHead>
                <TableHead className="text-right">Residential</TableHead>
                <TableHead className="text-right">Commercial</TableHead>
                <TableHead className="text-right">Agricultural</TableHead>
                <TableHead className="text-right">Industrial</TableHead>
                <TableHead className="text-right">Mixed</TableHead>
                <TableHead className="text-right">Govt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {districtClassificationMatrix.map((row) => (
                <TableRow key={row.district}>
                  <TableCell className="font-medium">{row.district}</TableCell>
                  <TableCell className="text-right">{formatINR(row.residential, true)}</TableCell>
                  <TableCell className="text-right">{formatINR(row.commercial, true)}</TableCell>
                  <TableCell className="text-right">{formatINR(row.agricultural, true)}</TableCell>
                  <TableCell className="text-right">{formatINR(row.industrial, true)}</TableCell>
                  <TableCell className="text-right">{formatINR(row.mixed, true)}</TableCell>
                  <TableCell className="text-right">{formatINR(row.govt, true)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Commercial-to-Residential Conversion Tracking */}
      {conversionCases && (
        <>
          <Card className="border-l-4 border-l-amber-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Classification Conversion Tracking</CardTitle>
              <p className="text-xs text-muted-foreground">
                Tracks commercial to residential and other classification conversions that may reduce stamp duty
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                <div className="bg-amber-50 rounded-lg border border-amber-100 p-3">
                  <p className="text-[10px] text-slate-500 uppercase">Total Conversions</p>
                  <p className="text-xl font-bold text-amber-700">{conversionCases.summary.totalConversions}</p>
                </div>
                <div className="bg-red-50 rounded-lg border border-red-100 p-3">
                  <p className="text-[10px] text-slate-500 uppercase">Commercial → Residential</p>
                  <p className="text-xl font-bold text-red-700">{conversionCases.summary.commercialToResidential}</p>
                </div>
                <div className="bg-orange-50 rounded-lg border border-orange-100 p-3">
                  <p className="text-[10px] text-slate-500 uppercase">Agri → Commercial</p>
                  <p className="text-xl font-bold text-orange-700">{conversionCases.summary.agriculturalToCommercial}</p>
                </div>
                <div className="bg-slate-50 rounded-lg border border-slate-100 p-3">
                  <p className="text-[10px] text-slate-500 uppercase">Other</p>
                  <p className="text-xl font-bold text-slate-700">{conversionCases.summary.otherConversions}</p>
                </div>
                <div className="bg-purple-50 rounded-lg border border-purple-100 p-3">
                  <p className="text-[10px] text-slate-500 uppercase">Revenue Impact</p>
                  <p className="text-xl font-bold text-purple-700">{formatINR(conversionCases.summary.estimatedRevenueImpact, true)}</p>
                </div>
                <div className="bg-red-50 rounded-lg border border-red-100 p-3">
                  <p className="text-[10px] text-slate-500 uppercase">Flagged Cases</p>
                  <p className="text-xl font-bold text-red-700">{conversionCases.summary.flaggedCases}</p>
                </div>
              </div>

              {/* Monthly Conversion Trend */}
              <p className="text-xs font-semibold text-slate-700 mb-2">Monthly Conversion Trend</p>
              <div className="flex items-end gap-1 h-24 mb-4">
                {conversionCases.monthlyTrend.map((m) => {
                  const maxConv = Math.max(...conversionCases.monthlyTrend.map((t) => t.conversions), 1);
                  const heightPct = (m.conversions / maxConv) * 100;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                      <span className="text-[9px] text-slate-500">{m.conversions}</span>
                      <div className="w-full relative">
                        <div
                          className="w-full bg-amber-400 rounded-t"
                          style={{ height: `${heightPct * 0.8}px` }}
                          title={`${m.month}: ${m.conversions} conversions, ${m.flagged} flagged`}
                        />
                        {m.flagged > 0 && (
                          <div
                            className="w-full bg-red-400 rounded-t absolute bottom-0"
                            style={{ height: `${(m.flagged / maxConv) * 80}px` }}
                          />
                        )}
                      </div>
                      <span className="text-[8px] text-slate-400">{m.month.slice(5)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Conversion Cases Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case ID</TableHead>
                    <TableHead>Office</TableHead>
                    <TableHead>Conversion Type</TableHead>
                    <TableHead>Webland</TableHead>
                    <TableHead>Form 1</TableHead>
                    <TableHead>Form 2</TableHead>
                    <TableHead>Declared</TableHead>
                    <TableHead className="text-right">MV Declared</TableHead>
                    <TableHead className="text-right">MV Expected</TableHead>
                    <TableHead className="text-right">Impact</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversionCases.cases.map((c) => (
                    <TableRow key={c.caseId}>
                      <TableCell className="font-mono text-xs">{c.caseId}</TableCell>
                      <TableCell className="text-xs">{c.officeName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">{c.conversionType}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{c.weblandClassification}</TableCell>
                      <TableCell className="text-xs">{c.form1Classification}</TableCell>
                      <TableCell className="text-xs">{c.form2Classification}</TableCell>
                      <TableCell className="text-xs font-medium">{c.declaredClassification}</TableCell>
                      <TableCell className="text-right text-xs">{formatINR(c.mvDeclared, true)}</TableCell>
                      <TableCell className="text-right text-xs">{formatINR(c.mvExpected, true)}</TableCell>
                      <TableCell className="text-right font-bold text-red-700 text-xs">{formatINR(c.revenueImpact, true)}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            c.status === "Confirmed" ? "destructive"
                              : c.status === "Flagged" ? "secondary"
                              : c.status === "Cleared" ? "default"
                              : "outline"
                          }
                          className="text-[10px]"
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ProhibitedPropertyTab({ data }: { data: ProhibitedPropertyData }) {
  const { summary, registry, categoryDistribution } = data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          icon={<Shield className="w-4 h-4 text-red-600" />}
          label="Total Notifications"
          value={summary.totalNotifications.toString()}
          sub={`${summary.activePPCount} currently active`}
          accent="red"
        />
        <KPICard
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          label="Active Properties"
          value={summary.activePPCount.toString()}
          sub="Prohibited properties"
          accent="amber"
        />
        <KPICard
          icon={<Activity className="w-4 h-4 text-emerald-600" />}
          label="Denotifications"
          value={summary.totalDenotifications.toString()}
          sub="Restrictions lifted"
          accent="emerald"
        />
        <KPICard
          icon={<Building2 className="w-4 h-4 text-purple-600" />}
          label="Reg. Blocked"
          value={summary.registrationBlocks.toString()}
          sub="Documents blocked"
          accent="purple"
        />
      </div>

      {/* Category Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Category Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categoryDistribution.map((cat) => {
              const maxPct = Math.max(...categoryDistribution.map((c) => c.percent), 1);
              return (
                <div key={cat.category} className="flex items-center gap-3 text-xs">
                  <span className="w-36 text-right text-slate-600 truncate">{cat.category}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded transition-all"
                      style={{ width: `${(cat.percent / maxPct) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-medium">{cat.count}</span>
                  <span className="w-12 text-right text-slate-500">{cat.percent}%</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Registry Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Prohibited Property Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Notification No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Blocked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registry.map((row) => (
                <TableRow key={row.notificationNo}>
                  <TableCell className="font-mono text-xs">{row.notificationNo}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(row.date).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {row.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.district}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-slate-600">
                    {row.location}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={row.status === "Active" ? "destructive" : "secondary"}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.documentsBlocked}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function AnywhereRegistrationTab({ data }: { data: AnywhereRegistrationData }) {
  const { summary, flows, monthlyTrend } = data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          icon={<MapPin className="w-4 h-4 text-blue-600" />}
          label="Total Anywhere Regs"
          value={summary.totalAnywhereRegs.toLocaleString("en-IN")}
          sub={`${summary.percentOfTotal}% of all registrations`}
          accent="blue"
        />
        <KPICard
          icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
          label="% of Total"
          value={`${summary.percentOfTotal}%`}
          sub="Cross-district share"
          accent="emerald"
        />
        <KPICard
          icon={<Building2 className="w-4 h-4 text-indigo-600" />}
          label="Top Destination SRO"
          value={summary.topDestinationSRO}
          sub="Highest volume"
          accent="indigo"
        />
        <KPICard
          icon={<Users className="w-4 h-4 text-purple-600" />}
          label="Top Source District"
          value={summary.topSourceDistrict}
          sub="Most cross-registrations"
          accent="purple"
        />
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Monthly Anywhere Registration Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1" style={{ height: 128 }}>
            {monthlyTrend.map((m) => {
              const maxCount = Math.max(...monthlyTrend.map((t) => t.count), 1);
              const barHeight = Math.max(4, (m.count / maxCount) * 100);
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-[9px] text-slate-500 mb-1">{m.count}</span>
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all"
                    style={{ height: `${barHeight}px` }}
                    title={`${m.month}: ${m.count} (${m.percent}%)`}
                  />
                  <span className="text-[8px] text-slate-400 mt-1">{m.month.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Flows Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Cross-District Registration Flows</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property Location</TableHead>
                <TableHead>Registered At</TableHead>
                <TableHead className="text-right">Doc Count</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg MV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flows.map((row, i) => (
                <TableRow key={`${row.propertyLocation}-${row.registeredAt}-${i}`}>
                  <TableCell className="font-medium">{row.propertyLocation}</TableCell>
                  <TableCell>{row.registeredAt}</TableCell>
                  <TableCell className="text-right">
                    {row.docCount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right">{formatINR(row.revenue, true)}</TableCell>
                  <TableCell className="text-right">{formatINR(row.avgMV, true)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SLAMonitoringTab({ data }: { data: SLAMonitoringData }) {
  const { summary, ageingBuckets, officeSLA, pendingByDocType } = data;
  const sortedOfficeSLA = [...officeSLA].sort(
    (a, b) => a.compliancePercent - b.compliancePercent
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          icon={<Clock className="w-4 h-4 text-blue-600" />}
          label="Avg Processing"
          value={`${summary.avgProcessingDays} days`}
          sub={`Oldest: ${summary.oldestPendingDays} days`}
          accent="blue"
        />
        <KPICard
          icon={<Activity className="w-4 h-4 text-emerald-600" />}
          label="SLA Compliance"
          value={`${summary.compliancePercent}%`}
          sub={`${summary.withinSLA} within SLA`}
          accent="emerald"
        />
        <KPICard
          icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
          label="SLA Breached"
          value={summary.slaBreached.toString()}
          sub={`of ${summary.totalPending} pending`}
          accent="red"
        />
        <KPICard
          icon={<BarChart3 className="w-4 h-4 text-amber-600" />}
          label="Total Pending"
          value={summary.totalPending.toString()}
          sub="Awaiting completion"
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ageing Buckets */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ageing Buckets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ageingBuckets.map((bucket) => {
                const maxCount = Math.max(...ageingBuckets.map((b) => b.count), 1);
                return (
                  <div key={bucket.bucket} className="flex items-center gap-3 text-xs">
                    <span className="w-12 text-right text-slate-600 font-medium">
                      {bucket.bucket}
                    </span>
                    <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all flex items-center justify-end px-2"
                        style={{
                          width: `${(bucket.count / maxCount) * 100}%`,
                          backgroundColor: bucket.color,
                        }}
                      >
                        <span className="text-white text-[10px] font-medium">{bucket.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Pending by Doc Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending by Document Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingByDocType.map((dt) => {
                const maxPct = Math.max(...pendingByDocType.map((d) => d.percent), 1);
                return (
                  <div key={dt.docType} className="flex items-center gap-3 text-xs">
                    <span className="w-20 text-right text-slate-600">{dt.docType}</span>
                    <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded transition-all"
                        style={{ width: `${(dt.percent / maxPct) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium">{dt.count}</span>
                    <span className="w-12 text-right text-slate-500">{dt.percent}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SRO Performance Table sorted by compliance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">SRO-wise SLA Performance</CardTitle>
          <p className="text-xs text-muted-foreground">
            Sorted by compliance percentage (ascending) to highlight underperformers
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Office Code</TableHead>
                <TableHead>Office Name</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Within SLA</TableHead>
                <TableHead className="text-right">Breached</TableHead>
                <TableHead className="text-right">Avg Days</TableHead>
                <TableHead className="text-right">Oldest (days)</TableHead>
                <TableHead className="text-right">Compliance %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOfficeSLA.map((row) => (
                <TableRow key={row.officeCode}>
                  <TableCell className="font-mono text-xs">{row.officeCode}</TableCell>
                  <TableCell className="font-medium">{row.officeName}</TableCell>
                  <TableCell className="text-right">{row.total}</TableCell>
                  <TableCell className="text-right text-emerald-600">{row.withinSLA}</TableCell>
                  <TableCell className="text-right text-red-600">{row.breached}</TableCell>
                  <TableCell className="text-right">{row.avgDays}</TableCell>
                  <TableCell className="text-right text-slate-500">{row.oldestDays}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        row.compliancePercent >= 80
                          ? "default"
                          : row.compliancePercent >= 70
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {row.compliancePercent.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function DemographicsTab({ data }: { data: DemographicsData }) {
  const { gender, topParties, departments } = data;

  return (
    <div className="space-y-4">
      {/* Gender Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          icon={<Users className="w-4 h-4 text-blue-600" />}
          label="Total Registrations"
          value={gender.distribution
            .reduce((sum, d) => sum + d.count, 0)
            .toLocaleString("en-IN")}
          sub={`${gender.distribution.length} categories`}
          accent="blue"
        />
        <KPICard
          icon={<Users className="w-4 h-4 text-purple-600" />}
          label="Female Buyers"
          value={`${gender.femaleBuyerPercent}%`}
          sub={`Avg MV: ${formatINR(gender.avgMVFemale, true)}`}
          accent="purple"
        />
        <KPICard
          icon={<Users className="w-4 h-4 text-emerald-600" />}
          label="Joint Registrations"
          value={`${gender.jointRegistrationPercent}%`}
          sub="Trend increasing"
          accent="emerald"
        />
        <KPICard
          icon={<BarChart3 className="w-4 h-4 text-indigo-600" />}
          label="Male Avg MV"
          value={formatINR(gender.avgMVMale, true)}
          sub="Vs Female Avg MV"
          accent="indigo"
        />
      </div>

      {/* Gender Distribution Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Gender-wise Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gender</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gender.distribution.map((row) => (
                <TableRow key={row.gender}>
                  <TableCell className="font-medium">{row.gender}</TableCell>
                  <TableCell className="text-right">
                    {row.count.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right">{row.percent}%</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatINR(row.revenue, true)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PAN/Aadhaar Cross-Verification */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">PAN/Aadhaar Cross-Verification</CardTitle>
          <p className="text-xs text-muted-foreground">
            Party identity verification — flags government party selections where PAN/Aadhaar indicates private entity
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Party Name</TableHead>
                <TableHead>PAN</TableHead>
                <TableHead>Aadhaar</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Declared As</TableHead>
                <TableHead className="text-center">Verification</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Registrations</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead>Districts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topParties.map((row) => (
                <TableRow key={row.pan} className={row.verificationStatus === "Mismatch" ? "bg-red-50/50" : ""}>
                  <TableCell className="font-medium">{row.partyName}</TableCell>
                  <TableCell className="font-mono text-xs">{row.pan}</TableCell>
                  <TableCell className="font-mono text-xs">{row.aadhaar}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {row.entityType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.declaredAs === "Government" && row.entityType !== "Government" ? "destructive" : "outline"}
                      className="text-[10px]"
                    >
                      {row.declaredAs}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        row.verificationStatus === "Mismatch" ? "destructive"
                          : row.verificationStatus === "Pending" ? "secondary"
                          : row.verificationStatus === "Not Available" ? "outline"
                          : "default"
                      }
                      className="text-[10px]"
                    >
                      {row.verificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {row.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{row.registrations}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatINR(row.totalValue, true)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                    {row.districts.join(", ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mismatch Details */}
      {topParties.filter(p => p.verificationRemark).length > 0 && (
        <Card className="border-l-4 border-l-red-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Verification Alerts</CardTitle>
            <p className="text-xs text-muted-foreground">
              Parties with identity verification issues requiring investigation
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topParties.filter(p => p.verificationRemark).map((p) => (
                <div key={p.pan} className="flex items-start gap-2 text-xs border rounded-lg p-2 bg-red-50/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700">{p.partyName}</span>
                    <span className="text-slate-400 mx-1">({p.pan})</span>
                    <span className="text-slate-600">{p.verificationRemark}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department-wise Registrations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Government Department Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Doc Count</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Exemptions</TableHead>
                <TableHead className="text-right">Exempt Amount</TableHead>
                <TableHead className="text-right">Net Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((row) => (
                <TableRow key={row.department}>
                  <TableCell className="font-medium">{row.department}</TableCell>
                  <TableCell className="text-right">
                    {row.docCount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right">{formatINR(row.revenue, true)}</TableCell>
                  <TableCell className="text-right text-amber-600">
                    {row.exemptionsClaimed}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {formatINR(row.exemptAmount, true)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatINR(row.netRevenue, true)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function OfficerAccountabilityTab({ data }: { data: OfficerAccountabilityData }) {
  const { summary, officers, sroAccountabilitySummary } = data;
  const sortedOfficers = [...officers].sort((a, b) => a.accountabilityScore - b.accountabilityScore);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          icon={<Users className="w-4 h-4 text-blue-600" />}
          label="Total Officers"
          value={summary.totalOfficers.toString()}
          sub={`Across ${data.metadata.totalSROs} SROs`}
          accent="blue"
        />
        <KPICard
          icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
          label="Flagged Officers"
          value={summary.flaggedOfficers.toString()}
          sub={`${summary.highRiskOfficers} high risk`}
          accent="red"
        />
        <KPICard
          icon={<Activity className="w-4 h-4 text-emerald-600" />}
          label="Avg Score"
          value={summary.avgAccountabilityScore.toFixed(1)}
          sub="Accountability index"
          accent="emerald"
        />
        <KPICard
          icon={<BarChart3 className="w-4 h-4 text-amber-600" />}
          label="High Risk"
          value={summary.highRiskOfficers.toString()}
          sub="Score below 50"
          accent="amber"
        />
        <KPICard
          icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
          label="Cash Variance"
          value={formatINR(summary.totalCashVariance, true)}
          sub="Total unreconciled"
          accent="purple"
        />
        <KPICard
          icon={<Clock className="w-4 h-4 text-indigo-600" />}
          label="Pending Recon"
          value={summary.pendingReconciliations.toString()}
          sub="Awaiting reconciliation"
          accent="indigo"
        />
      </div>

      {/* SRO Accountability Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">SRO Accountability Summary</CardTitle>
          <p className="text-xs text-muted-foreground">
            Average accountability score by office — lower scores indicate higher risk
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {sroAccountabilitySummary.map((sro) => {
              const bg = sro.avgScore < 50 ? "bg-red-100 border-red-200" : sro.avgScore < 65 ? "bg-amber-100 border-amber-200" : sro.avgScore < 80 ? "bg-blue-100 border-blue-200" : "bg-green-100 border-green-200";
              const textColor = sro.avgScore < 50 ? "text-red-800" : sro.avgScore < 65 ? "text-amber-800" : sro.avgScore < 80 ? "text-blue-800" : "text-green-800";
              return (
                <div key={sro.sroCode} className={`rounded-lg border p-3 ${bg}`}>
                  <p className="text-xs font-semibold text-slate-600">{sro.officeName}</p>
                  <p className={`text-2xl font-bold mt-1 ${textColor}`}>{sro.avgScore}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-500">{sro.officerCount} officers</span>
                    {sro.flaggedCount > 0 && (
                      <Badge variant="destructive" className="text-[9px] px-1">{sro.flaggedCount} flagged</Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Variance: {formatINR(sro.totalVariance, true)}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Officers Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Officer Accountability Index</CardTitle>
          <p className="text-xs text-muted-foreground">
            Individual officer metrics — sorted by accountability score (ascending) to highlight underperformers
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Officer</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Office</TableHead>
                <TableHead className="text-right">Cash Risk</TableHead>
                <TableHead className="text-right">Challan Anomalies</TableHead>
                <TableHead className="text-right">Cash Variance</TableHead>
                <TableHead className="text-right">Stamp Issues</TableHead>
                <TableHead className="text-right">SLA Breaches</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Trend</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOfficers.map((officer) => (
                <TableRow key={officer.officerId} className={officer.flagged ? "bg-red-50/50" : ""}>
                  <TableCell className="font-medium text-sm">{officer.officerName}</TableCell>
                  <TableCell className="text-xs text-slate-500">{officer.designation}</TableCell>
                  <TableCell className="text-xs">{officer.officeName}</TableCell>
                  <TableCell className="text-right">
                    <span className={officer.dailyCashRiskScore >= 70 ? "text-red-600 font-semibold" : officer.dailyCashRiskScore >= 50 ? "text-amber-600" : "text-slate-600"}>
                      {officer.dailyCashRiskScore}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={officer.challanAnomalyCount >= 5 ? "text-red-600 font-semibold" : ""}>{officer.challanAnomalyCount}</span>
                  </TableCell>
                  <TableCell className="text-right">{formatINR(officer.cashVarianceInr, true)}</TableCell>
                  <TableCell className="text-right">{officer.stampDiscrepancyCount}</TableCell>
                  <TableCell className="text-right">{officer.slaBreachCount}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        officer.accountabilityScore < 50 ? "destructive"
                          : officer.accountabilityScore < 70 ? "secondary"
                          : "default"
                      }
                    >
                      {officer.accountabilityScore}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs ${officer.trend === "declining" ? "text-red-600" : officer.trend === "improving" ? "text-emerald-600" : "text-slate-500"}`}>
                      {officer.trend === "declining" ? "↓" : officer.trend === "improving" ? "↑" : "→"} {officer.trend}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {officer.flagged ? (
                      <Badge variant="destructive" className="text-[10px]">Flagged</Badge>
                    ) : (
                      <span className="text-xs text-slate-400">--</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function GovernanceDashboardsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("revenue-growth");
  const { data, loading, error, refetch, dataTab } = useIGRSGovernance(activeTab);

  // ─── Loading skeleton ───────────────────────────────────────────────────────
  if (loading && dataTab !== activeTab) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="flex gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded w-28" />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────────────────────────
  if (error && !data) {
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
  }

  // ─── Render tab content ─────────────────────────────────────────────────────
  function renderTabContent() {
    if (!data || dataTab !== activeTab) return null;

    switch (activeTab) {
      case "revenue-growth":
        return <RevenueGrowthTab data={data as RevenueGrowthData} />;
      case "district-ranking":
        return <DistrictRankingTab data={data as DistrictRankingData} />;
      case "low-performing":
        return <LowPerformingTab data={data as LowPerformersData} />;
      case "classification":
        return <ClassificationTab data={data as ClassificationData} />;
      case "prohibited-property":
        return <ProhibitedPropertyTab data={data as ProhibitedPropertyData} />;
      case "anywhere-registration":
        return <AnywhereRegistrationTab data={data as AnywhereRegistrationData} />;
      case "sla-monitoring":
        return <SLAMonitoringTab data={data as SLAMonitoringData} />;
      case "demographics":
        return <DemographicsTab data={data as DemographicsData} />;
      case "officer-accountability":
        return <OfficerAccountabilityTab data={data as OfficerAccountabilityData} />;
      default:
        return null;
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Governance Dashboards</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive governance analytics across revenue, districts, SLA, and demographics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-50 rounded-lg p-1">
        {tabs.map((tab) => (
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

      {/* Loading overlay for tab switches */}
      {loading && !!data && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Updating...
        </div>
      )}

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}
