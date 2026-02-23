"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  FileText,
  Download,
  Flag,
} from "lucide-react";
import Breadcrumb from "@/components/layout/breadcrumb";

interface VarianceDriverRecord {
  id: string;
  account: string;
  category: "Revenue" | "COGS" | "Operating Expense" | "Capital Expenditure" | "Headcount";
  planAmount: number;
  actualAmount: number;
  varianceAmount: number;
  variancePct: number;
  driver: "Volume Change" | "Price Change" | "Mix Shift" | "Timing" | "FX Impact" | "One-Time Item";
  impact: "Favorable" | "Unfavorable";
  period: string;
  businessUnit: string;
}

function buildRecord(
  id: string, account: string,
  category: VarianceDriverRecord["category"],
  planAmount: number, actualAmount: number,
  driver: VarianceDriverRecord["driver"],
  period: string, businessUnit: string
): VarianceDriverRecord {
  const varianceAmount = actualAmount - planAmount;
  const variancePct = ((actualAmount - planAmount) / planAmount) * 100;
  const isExpense = category === "COGS" || category === "Operating Expense" || category === "Capital Expenditure" || category === "Headcount";
  const impact: "Favorable" | "Unfavorable" = isExpense
    ? (varianceAmount <= 0 ? "Favorable" : "Unfavorable")
    : (varianceAmount >= 0 ? "Favorable" : "Unfavorable");
  return { id, account, category, planAmount, actualAmount, varianceAmount, variancePct: Math.round(variancePct * 100) / 100, driver, impact, period, businessUnit };
}

const MOCK_DATA: VarianceDriverRecord[] = [
  buildRecord("VD-001", "Product Revenue", "Revenue", 4200000, 4750000, "Volume Change", "Q1 2026", "North America"),
  buildRecord("VD-002", "Service Revenue", "Revenue", 1800000, 1650000, "Price Change", "Q1 2026", "EMEA"),
  buildRecord("VD-003", "Raw Materials", "COGS", 2100000, 1920000, "FX Impact", "Q1 2026", "APAC"),
  buildRecord("VD-004", "Direct Labor", "COGS", 950000, 1080000, "Volume Change", "Q1 2026", "North America"),
  buildRecord("VD-005", "Marketing Spend", "Operating Expense", 750000, 680000, "Timing", "Q1 2026", "Global"),
  buildRecord("VD-006", "IT Infrastructure", "Capital Expenditure", 1200000, 1350000, "One-Time Item", "Q1 2026", "North America"),
  buildRecord("VD-007", "Engineering Staff", "Headcount", 3200000, 3050000, "Mix Shift", "Q1 2026", "EMEA"),
  buildRecord("VD-008", "Subscription Revenue", "Revenue", 2600000, 2850000, "Volume Change", "Q2 2026", "North America"),
  buildRecord("VD-009", "Freight & Logistics", "COGS", 480000, 550000, "FX Impact", "Q2 2026", "APAC"),
  buildRecord("VD-010", "Sales Commissions", "Operating Expense", 620000, 590000, "Mix Shift", "Q2 2026", "EMEA"),
  buildRecord("VD-011", "Office Lease", "Operating Expense", 380000, 380000, "Timing", "Q2 2026", "Global"),
  buildRecord("VD-012", "Consulting Revenue", "Revenue", 900000, 720000, "Price Change", "Q2 2026", "APAC"),
];

const DRIVER_DESCRIPTIONS: Record<string, string> = {
  "Volume Change": "Variance driven by higher or lower unit volumes compared to plan. This reflects changes in customer demand, market penetration, or production throughput.",
  "Price Change": "Variance caused by pricing deviations from plan, including negotiated discounts, market-driven price adjustments, or contractual rate changes.",
  "Mix Shift": "Variance resulting from a different product or service mix than planned. Shifts between high-margin and low-margin offerings impact overall results.",
  "Timing": "Variance attributable to timing differences between when costs or revenues were planned versus when they were actually recognized.",
  "FX Impact": "Variance driven by foreign exchange rate fluctuations between the planned rates and actual rates during the period.",
  "One-Time Item": "Variance caused by non-recurring events such as one-time charges, special projects, or extraordinary items not included in the original plan.",
};

const fmt = (n: number) => "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtSigned = (n: number) => (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function VarianceDriversWorkbenchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [impactFilter, setImpactFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<VarianceDriverRecord | null>(null);

  const distinctPeriods = useMemo(() => Array.from(new Set(MOCK_DATA.map((d) => d.period))), []);

  const filtered = useMemo(() => {
    return MOCK_DATA.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = r.account.toLowerCase().includes(q) || r.businessUnit.toLowerCase().includes(q);
      const matchCategory = categoryFilter === "all" || r.category === categoryFilter;
      const matchImpact = impactFilter === "all" || r.impact === impactFilter;
      const matchPeriod = periodFilter === "all" || r.period === periodFilter;
      return matchSearch && matchCategory && matchImpact && matchPeriod;
    });
  }, [searchQuery, categoryFilter, impactFilter, periodFilter]);

  const kpis = useMemo(() => {
    const totalVariance = filtered.reduce((s, r) => s + r.varianceAmount, 0);
    const favorableCount = filtered.filter((r) => r.impact === "Favorable").length;
    const unfavorableCount = filtered.filter((r) => r.impact === "Unfavorable").length;
    const largest = filtered.reduce((max, r) => (Math.abs(r.varianceAmount) > Math.abs(max.varianceAmount) ? r : max), filtered[0]);
    return { totalVariance, favorableCount, unfavorableCount, largestDriver: largest?.account ?? "-" };
  }, [filtered]);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "Revenue": return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Revenue</Badge>;
      case "COGS": return <Badge className="bg-purple-50 text-purple-700 border-purple-200">COGS</Badge>;
      case "Operating Expense": return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Operating Expense</Badge>;
      case "Capital Expenditure": return <Badge className="bg-orange-50 text-orange-700 border-orange-200">Capital Expenditure</Badge>;
      case "Headcount": return <Badge className="bg-teal-50 text-teal-700 border-teal-200">Headcount</Badge>;
      default: return <Badge variant="outline">{category}</Badge>;
    }
  };

  const getDriverBadge = (driver: string) => {
    switch (driver) {
      case "Volume Change": return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">Volume Change</Badge>;
      case "Price Change": return <Badge className="bg-pink-50 text-pink-700 border-pink-200">Price Change</Badge>;
      case "Mix Shift": return <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200">Mix Shift</Badge>;
      case "Timing": return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Timing</Badge>;
      case "FX Impact": return <Badge className="bg-violet-50 text-violet-700 border-violet-200">FX Impact</Badge>;
      case "One-Time Item": return <Badge className="bg-rose-50 text-rose-700 border-rose-200">One-Time Item</Badge>;
      default: return <Badge variant="outline">{driver}</Badge>;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "Favorable": return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Favorable</Badge>;
      case "Unfavorable": return <Badge className="bg-red-50 text-red-700 border-red-200">Unfavorable</Badge>;
      default: return <Badge variant="outline">{impact}</Badge>;
    }
  };

  const varianceColor = (n: number) => (n > 0 ? "text-emerald-600" : n < 0 ? "text-red-600" : "text-gray-900");

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="workbench/fpa/variance-drivers" className="mb-1.5" />
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="h-6 w-6 text-slate-700" />
          <h1 className="text-2xl font-bold text-[#000000] mt-2">Variance Drivers</h1>
        </div>
        <p className="text-sm text-[#606060]">Analyze budget variances and key drivers</p>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-[1363px] mx-auto px-6 py-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 stagger-children">
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Variance</p>
                    <p className={`text-2xl font-bold mt-1 ${kpis.totalVariance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {fmtSigned(kpis.totalVariance)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Favorable Count</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{kpis.favorableCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Unfavorable Count</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{kpis.unfavorableCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Largest Driver</p>
                    <p className="text-lg font-bold text-gray-900 mt-1 truncate max-w-[160px]" title={kpis.largestDriver}>
                      {kpis.largestDriver}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search account or business unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Revenue">Revenue</SelectItem>
                <SelectItem value="COGS">COGS</SelectItem>
                <SelectItem value="Operating Expense">Operating Expense</SelectItem>
                <SelectItem value="Capital Expenditure">Capital Expenditure</SelectItem>
                <SelectItem value="Headcount">Headcount</SelectItem>
              </SelectContent>
            </Select>
            <Select value={impactFilter} onValueChange={setImpactFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Impact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Impacts</SelectItem>
                <SelectItem value="Favorable">Favorable</SelectItem>
                <SelectItem value="Unfavorable">Unfavorable</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                {distinctPeriods.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Plan ($)</TableHead>
                  <TableHead className="text-right">Actual ($)</TableHead>
                  <TableHead className="text-right">Variance ($)</TableHead>
                  <TableHead className="text-right">Variance (%)</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Business Unit</TableHead>
                  <TableHead>Period</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedRecord(r)}
                  >
                    <TableCell className="font-medium text-gray-900">{r.account}</TableCell>
                    <TableCell>{getCategoryBadge(r.category)}</TableCell>
                    <TableCell className="text-right text-sm text-gray-700">{fmt(r.planAmount)}</TableCell>
                    <TableCell className="text-right text-sm text-gray-700">{fmt(r.actualAmount)}</TableCell>
                    <TableCell className={`text-right text-sm font-medium ${varianceColor(r.varianceAmount)}`}>
                      {fmtSigned(r.varianceAmount)}
                    </TableCell>
                    <TableCell className={`text-right text-sm font-medium ${varianceColor(r.variancePct)}`}>
                      {r.variancePct > 0 ? "+" : ""}{r.variancePct.toFixed(2)}%
                    </TableCell>
                    <TableCell>{getDriverBadge(r.driver)}</TableCell>
                    <TableCell>{getImpactBadge(r.impact)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{r.businessUnit}</TableCell>
                    <TableCell className="text-sm text-gray-600">{r.period}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      No variance records match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedRecord && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1B2A41] text-white flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  {selectedRecord.account}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-2">
                  {getCategoryBadge(selectedRecord.category)}
                  {getDriverBadge(selectedRecord.driver)}
                  {getImpactBadge(selectedRecord.impact)}
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm font-medium mt-1">{selectedRecord.category}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Business Unit</p>
                    <p className="text-sm font-medium mt-1">{selectedRecord.businessUnit}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Period</p>
                    <p className="text-sm font-medium mt-1">{selectedRecord.period}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Plan Amount</p>
                    <p className="text-sm font-medium mt-1">{fmt(selectedRecord.planAmount)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Actual Amount</p>
                    <p className="text-sm font-medium mt-1">{fmt(selectedRecord.actualAmount)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Variance Amount</p>
                    <p className={`text-sm font-medium mt-1 ${varianceColor(selectedRecord.varianceAmount)}`}>
                      {fmtSigned(selectedRecord.varianceAmount)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Variance %</p>
                    <p className={`text-sm font-medium mt-1 ${varianceColor(selectedRecord.variancePct)}`}>
                      {selectedRecord.variancePct > 0 ? "+" : ""}{selectedRecord.variancePct.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Driver</p>
                    <p className="text-sm font-medium mt-1">{selectedRecord.driver}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 col-span-2">
                    <p className="text-xs text-gray-500">Impact</p>
                    <p className={`text-sm font-medium mt-1 ${selectedRecord.impact === "Favorable" ? "text-emerald-600" : "text-red-600"}`}>
                      {selectedRecord.impact}
                    </p>
                  </div>
                </div>

                {/* Driver Analysis */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Driver Analysis</h3>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {DRIVER_DESCRIPTIONS[selectedRecord.driver] ?? "No additional analysis available for this driver type."}
                    </p>
                    <p className="text-sm text-gray-600 mt-3">
                      The <span className="font-medium">{selectedRecord.account}</span> account in{" "}
                      <span className="font-medium">{selectedRecord.businessUnit}</span> showed a{" "}
                      <span className={`font-medium ${varianceColor(selectedRecord.varianceAmount)}`}>
                        {fmtSigned(selectedRecord.varianceAmount)}
                      </span>{" "}
                      ({selectedRecord.variancePct > 0 ? "+" : ""}{selectedRecord.variancePct.toFixed(2)}%) variance against plan for{" "}
                      <span className="font-medium">{selectedRecord.period}</span>. This is classified as{" "}
                      <span className={`font-medium ${selectedRecord.impact === "Favorable" ? "text-emerald-600" : "text-red-600"}`}>
                        {selectedRecord.impact.toLowerCase()}
                      </span>{" "}
                      to the business.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button className="flex-1 bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
                    <FileText className="w-4 h-4 mr-2" />
                    Add Commentary
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" className="flex-1 text-amber-600 border-amber-200 hover:bg-amber-50">
                    <Flag className="w-4 h-4 mr-2" />
                    Flag for Review
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
