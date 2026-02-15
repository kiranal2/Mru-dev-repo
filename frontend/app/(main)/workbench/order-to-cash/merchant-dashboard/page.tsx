"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Download,
  TrendingUp,
  TrendingDown,
  CreditCard,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  X,
  Store,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Breadcrumb from "@/components/layout/breadcrumb";

// ── Types ───────────────────────────────────────────────────────────────
interface MerchantRecord {
  id: number;
  merchantId: string;
  merchantName: string;
  industry: string;
  gateway: string;
  status: "active" | "under_review" | "suspended" | "onboarding";
  totalTransactions: number;
  totalVolume: number;
  settlementRate: number;
  avgSettlementDays: number;
  chargebackRate: number;
  chargebackCount: number;
  refundRate: number;
  gatewayFees: number;
  netRevenue: number;
  riskScore: "low" | "medium" | "high" | "critical";
  lastSettlement: string;
  paymentMethods: string[];
  region: string;
}

// ── Seed data ───────────────────────────────────────────────────────────
const INDUSTRIES = [
  "Retail",
  "SaaS",
  "E-Commerce",
  "Food & Beverage",
  "Healthcare",
  "Travel",
  "Financial Services",
  "Education",
];
const GATEWAYS = ["Stripe", "Square", "Adyen", "PayPal", "Braintree", "Worldpay"];
const REGIONS = ["North America", "Europe", "APAC", "LATAM", "Middle East"];
const PAYMENT_METHODS = ["Credit Card", "Debit Card", "ACH", "Wire", "Digital Wallet", "BNPL"];

const MERCHANT_NAMES = [
  "Acme Retail Corp",
  "Northwind SaaS",
  "Globex Health",
  "Initech Systems",
  "Umbrella Labs",
  "Stark Components",
  "Wayne Logistics",
  "Oscorp Devices",
  "Wonka Foods Inc",
  "Tyrell Robotics",
  "BlueSun Freight",
  "Hooli Cloud",
  "Massive Dynamic",
  "Soylent Corp",
  "Pied Piper",
  "Cyberdyne AI",
  "Aperture Labs",
  "Weyland Industries",
  "Nexus Commerce",
  "Zenith Payments",
  "Summit Electronics",
  "Cascade Digital",
  "Pinnacle Health",
  "Vector Finance",
  "Atlas Logistics",
];

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[rand(0, arr.length - 1)];
const pickN = <T,>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

const riskFromChargeback = (rate: number): MerchantRecord["riskScore"] => {
  if (rate >= 1.5) return "critical";
  if (rate >= 1.0) return "high";
  if (rate >= 0.5) return "medium";
  return "low";
};

const generateMerchants = (): MerchantRecord[] => {
  return MERCHANT_NAMES.map((name, i) => {
    const totalTx = rand(500, 50000);
    const totalVol = totalTx * rand(25, 350);
    const chargebackRate = Math.round((Math.random() * 2.5) * 100) / 100;
    const chargebackCount = Math.round(totalTx * chargebackRate / 100);
    const refundRate = Math.round((Math.random() * 5) * 100) / 100;
    const settlementRate = rand(92, 100);
    const gatewayFees = Math.round(totalVol * (rand(15, 35) / 1000));
    const netRevenue = totalVol - gatewayFees;
    const statuses: MerchantRecord["status"][] = ["active", "active", "active", "active", "under_review", "suspended", "onboarding"];

    return {
      id: i + 1,
      merchantId: `MER-${String(1000 + i).padStart(5, "0")}`,
      merchantName: name,
      industry: pick(INDUSTRIES),
      gateway: pick(GATEWAYS),
      status: pick(statuses),
      totalTransactions: totalTx,
      totalVolume: totalVol,
      settlementRate,
      avgSettlementDays: rand(1, 5),
      chargebackRate,
      chargebackCount,
      refundRate,
      gatewayFees,
      netRevenue,
      riskScore: riskFromChargeback(chargebackRate),
      lastSettlement: new Date(Date.now() - rand(0, 7) * 86400000).toISOString().slice(0, 10),
      paymentMethods: pickN(PAYMENT_METHODS, rand(2, 4)),
      region: pick(REGIONS),
    };
  });
};

// ── Component ───────────────────────────────────────────────────────────
export default function MerchantDashboardPage() {
  const [merchants] = useState<MerchantRecord[]>(() => generateMerchants());
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [gatewayFilter, setGatewayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // ── KPIs ──────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const activeMerchants = merchants.filter((m) => m.status === "active").length;
    const totalVolume = merchants.reduce((s, m) => s + m.totalVolume, 0);
    const totalTx = merchants.reduce((s, m) => s + m.totalTransactions, 0);
    const avgSettlement = merchants.reduce((s, m) => s + m.avgSettlementDays, 0) / merchants.length;
    const totalChargebacks = merchants.reduce((s, m) => s + m.chargebackCount, 0);
    const avgChargebackRate =
      merchants.reduce((s, m) => s + m.chargebackRate, 0) / merchants.length;
    const totalFees = merchants.reduce((s, m) => s + m.gatewayFees, 0);
    const highRisk = merchants.filter(
      (m) => m.riskScore === "high" || m.riskScore === "critical"
    ).length;

    return {
      activeMerchants,
      totalVolume,
      totalTx,
      avgSettlement: Math.round(avgSettlement * 10) / 10,
      totalChargebacks,
      avgChargebackRate: Math.round(avgChargebackRate * 100) / 100,
      totalFees,
      highRisk,
    };
  }, [merchants]);

  // ── Filtering ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return merchants.filter(
      (m) =>
        (industryFilter === "all" || m.industry === industryFilter) &&
        (gatewayFilter === "all" || m.gateway === gatewayFilter) &&
        (statusFilter === "all" || m.status === statusFilter) &&
        (riskFilter === "all" || m.riskScore === riskFilter) &&
        (!q ||
          [m.merchantName, m.merchantId, m.industry, m.gateway, m.region].some((v) =>
            v.toLowerCase().includes(q)
          ))
    );
  }, [merchants, searchQuery, industryFilter, gatewayFilter, statusFilter, riskFilter]);

  // ── Helpers ───────────────────────────────────────────────────────────
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  const fmtCompact = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };

  const statusColor = (s: MerchantRecord["status"]) => {
    const map = {
      active: "bg-green-100 text-green-700 border-green-300",
      under_review: "bg-yellow-100 text-yellow-700 border-yellow-300",
      suspended: "bg-red-100 text-red-700 border-red-300",
      onboarding: "bg-blue-100 text-blue-700 border-blue-300",
    };
    return map[s];
  };

  const statusLabel = (s: MerchantRecord["status"]) => {
    const map = {
      active: "Active",
      under_review: "Under Review",
      suspended: "Suspended",
      onboarding: "Onboarding",
    };
    return map[s];
  };

  const riskColor = (r: MerchantRecord["riskScore"]) => {
    const map = {
      low: "bg-green-100 text-green-700 border-green-300",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
      high: "bg-orange-100 text-orange-700 border-orange-300",
      critical: "bg-red-100 text-red-700 border-red-300",
    };
    return map[r];
  };

  const handleExportCSV = () => {
    const header = [
      "Merchant ID",
      "Name",
      "Industry",
      "Gateway",
      "Status",
      "Transactions",
      "Volume",
      "Settlement Rate",
      "Chargeback Rate",
      "Risk",
      "Gateway Fees",
      "Net Revenue",
    ];
    const rows = filtered.map((m) => [
      m.merchantId,
      m.merchantName,
      m.industry,
      m.gateway,
      statusLabel(m.status),
      m.totalTransactions,
      m.totalVolume,
      `${m.settlementRate}%`,
      `${m.chargebackRate}%`,
      m.riskScore,
      m.gatewayFees,
      m.netRevenue,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `merchant_dashboard_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb
          activeRoute="workbench/order-to-cash/merchant-dashboard"
          className="mb-1.5"
        />
        <div className="flex items-center justify-between gap-4 mt-1">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Store className="h-6 w-6 text-slate-700" />
              <h1 className="text-2xl font-bold text-[#000000] mt-2">Merchant Dashboard</h1>
            </div>
            <p className="text-sm text-[#606060]">
              Monitor merchant performance, settlement rates, and chargeback risk
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-3 w-3 mr-1" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Refreshing merchant data...")}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
        <div className="border-b border-[#B7B7B7] mt-2" />
      </header>

      {/* KPI Cards */}
      <div className="px-6 pt-4 pb-2 flex-shrink-0">
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Active Merchants
              </p>
              <Store className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold mt-1">{kpis.activeMerchants}</p>
            <p className="text-xs text-slate-500 mt-1">
              of {merchants.length} total
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Total Volume
              </p>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold mt-1">{fmtCompact(kpis.totalVolume)}</p>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {kpis.totalTx.toLocaleString()} transactions
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Avg Settlement
              </p>
              <BarChart3 className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold mt-1">{kpis.avgSettlement} days</p>
            <p className="text-xs text-slate-500 mt-1">
              Gateway fees: {fmtCompact(kpis.totalFees)}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Chargeback Risk
              </p>
              <AlertTriangle className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold mt-1">{kpis.avgChargebackRate}%</p>
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              {kpis.highRisk} high-risk merchants
            </p>
          </Card>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="flex-1 grid grid-cols-[280px_1fr] gap-4 px-6 py-3 overflow-hidden">
        {/* Sidebar Filters */}
        <aside className="space-y-4 overflow-auto">
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Filters
            </h3>
            <div className="space-y-3">
              <Input
                placeholder="Search merchant, ID, region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="All industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All industries</SelectItem>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="All gateways" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All gateways</SelectItem>
                  {GATEWAYS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="All risk levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All risk levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Summary by Risk */}
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Risk Distribution
            </h3>
            <div className="space-y-2">
              {(["critical", "high", "medium", "low"] as const).map((risk) => {
                const count = merchants.filter((m) => m.riskScore === risk).length;
                const pct = Math.round((count / merchants.length) * 100);
                return (
                  <div key={risk} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs capitalize", riskColor(risk))}>{risk}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span>{count}</span>
                      <span className="text-xs text-slate-400">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Top by Volume */}
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Top 5 by Volume
            </h3>
            <div className="space-y-2">
              {[...merchants]
                .sort((a, b) => b.totalVolume - a.totalVolume)
                .slice(0, 5)
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-slate-50 rounded p-1 -mx-1"
                    onClick={() => {
                      setSelectedMerchant(m);
                      setIsDrawerOpen(true);
                    }}
                  >
                    <span className="text-slate-700 truncate mr-2">{m.merchantName}</span>
                    <span className="font-medium text-slate-900 whitespace-nowrap">
                      {fmtCompact(m.totalVolume)}
                    </span>
                  </div>
                ))}
            </div>
          </Card>
        </aside>

        {/* Main Table */}
        <Card className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-slate-200">
            <span className="text-sm text-slate-600">
              {filtered.length} merchants
            </span>
          </div>

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Merchant</TableHead>
                  <TableHead className="text-xs">Industry</TableHead>
                  <TableHead className="text-xs">Gateway</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Volume</TableHead>
                  <TableHead className="text-xs text-right">Transactions</TableHead>
                  <TableHead className="text-xs text-right">Settlement</TableHead>
                  <TableHead className="text-xs text-right">Chargeback %</TableHead>
                  <TableHead className="text-xs">Risk</TableHead>
                  <TableHead className="text-xs text-right">Net Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow
                    key={m.id}
                    onClick={() => {
                      setSelectedMerchant(m);
                      setIsDrawerOpen(true);
                    }}
                    className={cn(
                      "cursor-pointer",
                      selectedMerchant?.id === m.id && "bg-blue-50"
                    )}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{m.merchantName}</div>
                        <div className="text-xs text-slate-500">{m.merchantId}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{m.industry}</TableCell>
                    <TableCell className="text-sm">{m.gateway}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", statusColor(m.status))}>
                        {statusLabel(m.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {fmtCompact(m.totalVolume)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {m.totalTransactions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm">{m.settlementRate}%</TableCell>
                    <TableCell className="text-right text-sm">
                      <span
                        className={cn(
                          m.chargebackRate >= 1.0 ? "text-red-600 font-medium" : ""
                        )}
                      >
                        {m.chargebackRate}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs capitalize", riskColor(m.riskScore))}>
                        {m.riskScore}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {fmtCompact(m.netRevenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="p-3 border-t border-slate-200 text-sm text-slate-600">
            Showing {filtered.length} of {merchants.length} merchants
          </div>
        </Card>
      </div>

      {/* Detail Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="right">
        <DrawerContent className="h-full w-[480px] ml-auto">
          <DrawerHeader className="border-b border-slate-200">
            <div className="flex items-center justify-between">
              <DrawerTitle>Merchant Details</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          {selectedMerchant && (
            <div className="flex-1 overflow-auto p-6 space-y-5">
              {/* Identity */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-slate-800">Identity</h4>
                <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                  <div className="text-slate-500">Merchant ID</div>
                  <div className="font-medium">{selectedMerchant.merchantId}</div>
                  <div className="text-slate-500">Name</div>
                  <div className="font-medium">{selectedMerchant.merchantName}</div>
                  <div className="text-slate-500">Industry</div>
                  <div>{selectedMerchant.industry}</div>
                  <div className="text-slate-500">Region</div>
                  <div>{selectedMerchant.region}</div>
                  <div className="text-slate-500">Gateway</div>
                  <div>{selectedMerchant.gateway}</div>
                  <div className="text-slate-500">Status</div>
                  <div>
                    <Badge className={cn("text-xs", statusColor(selectedMerchant.status))}>
                      {statusLabel(selectedMerchant.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-slate-800">Financial Summary</h4>
                <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                  <div className="text-slate-500">Total Volume</div>
                  <div className="font-medium">{fmt(selectedMerchant.totalVolume)}</div>
                  <div className="text-slate-500">Transactions</div>
                  <div>{selectedMerchant.totalTransactions.toLocaleString()}</div>
                  <div className="text-slate-500">Gateway Fees</div>
                  <div className="text-red-600">{fmt(selectedMerchant.gatewayFees)}</div>
                  <div className="text-slate-500">Net Revenue</div>
                  <div className="font-medium text-green-700">
                    {fmt(selectedMerchant.netRevenue)}
                  </div>
                </div>
              </div>

              {/* Settlement & Risk */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-slate-800">Settlement & Risk</h4>
                <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                  <div className="text-slate-500">Settlement Rate</div>
                  <div>{selectedMerchant.settlementRate}%</div>
                  <div className="text-slate-500">Avg Settlement</div>
                  <div>{selectedMerchant.avgSettlementDays} days</div>
                  <div className="text-slate-500">Last Settlement</div>
                  <div>{selectedMerchant.lastSettlement}</div>
                  <div className="text-slate-500">Chargeback Rate</div>
                  <div
                    className={cn(
                      selectedMerchant.chargebackRate >= 1.0
                        ? "text-red-600 font-medium"
                        : ""
                    )}
                  >
                    {selectedMerchant.chargebackRate}% ({selectedMerchant.chargebackCount}{" "}
                    chargebacks)
                  </div>
                  <div className="text-slate-500">Refund Rate</div>
                  <div>{selectedMerchant.refundRate}%</div>
                  <div className="text-slate-500">Risk Score</div>
                  <div>
                    <Badge
                      className={cn(
                        "text-xs capitalize",
                        riskColor(selectedMerchant.riskScore)
                      )}
                    >
                      {selectedMerchant.riskScore}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-slate-800">Payment Methods</h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedMerchant.paymentMethods.map((pm) => (
                    <Badge
                      key={pm}
                      variant="outline"
                      className="text-xs bg-slate-50"
                    >
                      <CreditCard className="h-3 w-3 mr-1" />
                      {pm}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex gap-2 flex-wrap">
                <Button
                  className="bg-[#205375] hover:bg-[#2c7aa1]"
                  size="sm"
                  onClick={() => toast.success("Settlement report requested")}
                >
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  Request Settlement Report
                </Button>
                {selectedMerchant.riskScore === "critical" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => toast.info("Review escalation initiated")}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Escalate for Review
                  </Button>
                )}
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Footer */}
      <footer className="h-8 border-t border-slate-200 bg-white flex items-center justify-center text-xs text-slate-500">
        Confidential — &copy; 2025 Meeru AI
      </footer>
    </div>
  );
}
