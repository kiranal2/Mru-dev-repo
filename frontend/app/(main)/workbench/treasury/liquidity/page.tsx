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
  Wallet,
  Banknote,
  CreditCard,
  TrendingUp,
  Search,
  RefreshCw,
  ArrowRightLeft,
  ListOrdered,
} from "lucide-react";
import Breadcrumb from "@/components/layout/breadcrumb";

interface BankAccountRecord {
  id: string;
  bankName: string;
  accountType: "Operating" | "Savings" | "Money Market" | "Investment" | "Credit Facility";
  currency: "USD" | "EUR" | "GBP";
  currentBalance: number;
  availableBalance: number;
  dailyChange: number;
  thirtyDayForecast: number;
  creditFacility: number;
  utilization: number;
  lastSyncDate: string;
  status: "Active" | "Restricted" | "Dormant";
}

const MOCK_ACCOUNTS: BankAccountRecord[] = [
  { id: "BA-001", bankName: "JPMorgan Chase", accountType: "Operating", currency: "USD", currentBalance: 24850000, availableBalance: 23200000, dailyChange: 1250000, thirtyDayForecast: 26100000, creditFacility: 50000000, utilization: 32, lastSyncDate: "2026-02-23 09:15 AM", status: "Active" },
  { id: "BA-002", bankName: "Bank of America", accountType: "Operating", currency: "USD", currentBalance: 18400000, availableBalance: 17800000, dailyChange: -640000, thirtyDayForecast: 17200000, creditFacility: 30000000, utilization: 45, lastSyncDate: "2026-02-23 09:10 AM", status: "Active" },
  { id: "BA-003", bankName: "Citibank", accountType: "Money Market", currency: "USD", currentBalance: 12750000, availableBalance: 12750000, dailyChange: 42000, thirtyDayForecast: 12900000, creditFacility: 0, utilization: 0, lastSyncDate: "2026-02-23 08:45 AM", status: "Active" },
  { id: "BA-004", bankName: "Wells Fargo", accountType: "Savings", currency: "USD", currentBalance: 8900000, availableBalance: 8900000, dailyChange: 18500, thirtyDayForecast: 9050000, creditFacility: 0, utilization: 0, lastSyncDate: "2026-02-23 09:00 AM", status: "Active" },
  { id: "BA-005", bankName: "HSBC", accountType: "Operating", currency: "GBP", currentBalance: 6200000, availableBalance: 5800000, dailyChange: -320000, thirtyDayForecast: 5950000, creditFacility: 15000000, utilization: 58, lastSyncDate: "2026-02-23 08:30 AM", status: "Active" },
  { id: "BA-006", bankName: "Deutsche Bank", accountType: "Investment", currency: "EUR", currentBalance: 15600000, availableBalance: 10200000, dailyChange: 875000, thirtyDayForecast: 16400000, creditFacility: 0, utilization: 0, lastSyncDate: "2026-02-23 07:55 AM", status: "Active" },
  { id: "BA-007", bankName: "Barclays", accountType: "Credit Facility", currency: "GBP", currentBalance: 2100000, availableBalance: 12900000, dailyChange: -1500000, thirtyDayForecast: 3200000, creditFacility: 15000000, utilization: 86, lastSyncDate: "2026-02-23 08:20 AM", status: "Restricted" },
  { id: "BA-008", bankName: "Goldman Sachs", accountType: "Investment", currency: "USD", currentBalance: 21300000, availableBalance: 14500000, dailyChange: 2100000, thirtyDayForecast: 22800000, creditFacility: 0, utilization: 0, lastSyncDate: "2026-02-23 09:05 AM", status: "Active" },
  { id: "BA-009", bankName: "Morgan Stanley", accountType: "Money Market", currency: "USD", currentBalance: 9450000, availableBalance: 9450000, dailyChange: 31000, thirtyDayForecast: 9600000, creditFacility: 0, utilization: 0, lastSyncDate: "2026-02-22 06:00 PM", status: "Dormant" },
  { id: "BA-010", bankName: "BNP Paribas", accountType: "Savings", currency: "EUR", currentBalance: 4300000, availableBalance: 4300000, dailyChange: -95000, thirtyDayForecast: 4150000, creditFacility: 0, utilization: 0, lastSyncDate: "2026-02-23 07:40 AM", status: "Active" },
];

const fmt = (v: number) => "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtSigned = (v: number) => (v >= 0 ? "+" : "-") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function LiquidityWorkbenchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState<BankAccountRecord | null>(null);

  const filtered = useMemo(() =>
    MOCK_ACCOUNTS.filter((a) => {
      const matchSearch = a.bankName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === "all" || a.accountType === typeFilter;
      const matchCurrency = currencyFilter === "all" || a.currency === currencyFilter;
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchType && matchCurrency && matchStatus;
    }), [searchQuery, typeFilter, currencyFilter, statusFilter]);

  const kpis = useMemo(() => {
    const totalCash = MOCK_ACCOUNTS.reduce((s, a) => s + a.currentBalance, 0);
    const availableLiquidity = MOCK_ACCOUNTS.reduce((s, a) => s + a.availableBalance, 0);
    const facilityAccounts = MOCK_ACCOUNTS.filter((a) => a.creditFacility > 0);
    const avgUtilization = facilityAccounts.length > 0
      ? facilityAccounts.reduce((s, a) => s + a.utilization, 0) / facilityAccounts.length
      : 0;
    const dailyCashFlow = MOCK_ACCOUNTS.reduce((s, a) => s + a.dailyChange, 0);
    return { totalCash, availableLiquidity, avgUtilization, dailyCashFlow };
  }, []);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Operating":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Operating</Badge>;
      case "Savings":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Savings</Badge>;
      case "Money Market":
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200">Money Market</Badge>;
      case "Investment":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Investment</Badge>;
      case "Credit Facility":
        return <Badge className="bg-red-50 text-red-700 border-red-200">Credit Facility</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>;
      case "Restricted":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Restricted</Badge>;
      case "Dormant":
        return <Badge className="bg-gray-50 text-gray-500 border-gray-200">Dormant</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const genTrendData = (account: BankAccountRecord) => {
    const days: { date: string; balance: number }[] = [];
    let bal = account.currentBalance - account.dailyChange * 3;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(2026, 1, 23 - i);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const delta = Math.round((Math.random() - 0.4) * Math.abs(account.dailyChange) * 1.2);
      bal = bal + delta;
      days.push({ date: label, balance: Math.max(bal, 0) });
    }
    return days;
  };

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="workbench/treasury/liquidity" className="mb-1.5" />
        <div className="flex items-center gap-3 mb-1">
          <Wallet className="h-6 w-6 text-slate-700" />
          <h1 className="text-2xl font-bold text-[#000000] mt-2">Liquidity</h1>
        </div>
        <p className="text-sm text-[#606060]">Monitor cash positions and liquidity across all accounts</p>
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
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cash Position</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(kpis.totalCash)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Available Liquidity</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(kpis.availableLiquidity)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Utilization</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{kpis.avgUtilization.toFixed(1)}%</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Cash Flow</p>
                    <p className={`text-2xl font-bold mt-1 ${kpis.dailyCashFlow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {fmtSigned(kpis.dailyCashFlow)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
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
                placeholder="Search bank name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Account Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Operating">Operating</SelectItem>
                <SelectItem value="Savings">Savings</SelectItem>
                <SelectItem value="Money Market">Money Market</SelectItem>
                <SelectItem value="Investment">Investment</SelectItem>
                <SelectItem value="Credit Facility">Credit Facility</SelectItem>
              </SelectContent>
            </Select>
            <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Restricted">Restricted</SelectItem>
                <SelectItem value="Dormant">Dormant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Balance ($)</TableHead>
                  <TableHead className="text-right">Available ($)</TableHead>
                  <TableHead className="text-right">Daily Change</TableHead>
                  <TableHead className="text-right">30d Forecast ($)</TableHead>
                  <TableHead className="text-right">Credit Facility ($)</TableHead>
                  <TableHead>Utilization %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Sync</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedAccount(a)}
                  >
                    <TableCell className="font-medium text-gray-900">{a.bankName}</TableCell>
                    <TableCell>{getTypeBadge(a.accountType)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{a.currency}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{fmt(a.currentBalance)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{fmt(a.availableBalance)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-medium ${a.dailyChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {fmtSigned(a.dailyChange)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">{fmt(a.thirtyDayForecast)}</TableCell>
                    <TableCell className="text-right text-sm">{a.creditFacility > 0 ? fmt(a.creditFacility) : "--"}</TableCell>
                    <TableCell>
                      {a.creditFacility > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${a.utilization}%`,
                                backgroundColor: a.utilization > 80 ? "#ef4444" : a.utilization > 50 ? "#f59e0b" : "#22c55e",
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{a.utilization}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">--</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(a.status)}</TableCell>
                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">{a.lastSyncDate}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      No accounts match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!selectedAccount} onOpenChange={() => setSelectedAccount(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedAccount && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1B2A41] text-white flex items-center justify-center font-medium text-sm">
                    {selectedAccount.bankName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{selectedAccount.bankName}</p>
                    <p className="text-sm font-normal text-gray-500">{selectedAccount.accountType} Account</p>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-2">
                  {getTypeBadge(selectedAccount.accountType)}
                  {getStatusBadge(selectedAccount.status)}
                  <Badge variant="outline">{selectedAccount.currency}</Badge>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Bank</p>
                    <p className="text-sm font-medium mt-1">{selectedAccount.bankName}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Account Type</p>
                    <p className="text-sm font-medium mt-1">{selectedAccount.accountType}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Currency</p>
                    <p className="text-sm font-medium mt-1">{selectedAccount.currency}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Current Balance</p>
                    <p className="text-sm font-medium mt-1">{fmt(selectedAccount.currentBalance)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Available Balance</p>
                    <p className="text-sm font-medium mt-1">{fmt(selectedAccount.availableBalance)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Daily Change</p>
                    <p className={`text-sm font-medium mt-1 ${selectedAccount.dailyChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {fmtSigned(selectedAccount.dailyChange)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">30-Day Forecast</p>
                    <p className="text-sm font-medium mt-1">{fmt(selectedAccount.thirtyDayForecast)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Credit Facility</p>
                    <p className="text-sm font-medium mt-1">{selectedAccount.creditFacility > 0 ? fmt(selectedAccount.creditFacility) : "--"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Utilization</p>
                    {selectedAccount.creditFacility > 0 ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${selectedAccount.utilization}%`,
                              backgroundColor: selectedAccount.utilization > 80 ? "#ef4444" : selectedAccount.utilization > 50 ? "#f59e0b" : "#22c55e",
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">{selectedAccount.utilization}%</span>
                      </div>
                    ) : (
                      <p className="text-sm font-medium mt-1 text-gray-400">N/A</p>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Last Sync</p>
                    <p className="text-sm font-medium mt-1">{selectedAccount.lastSyncDate}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 col-span-2">
                    <p className="text-xs text-gray-500">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedAccount.status)}</div>
                  </div>
                </div>

                {/* 7-Day Cash Trend */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">7-Day Cash Trend</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {genTrendData(selectedAccount).map((row) => (
                          <TableRow key={row.date}>
                            <TableCell className="text-sm py-2">{row.date}</TableCell>
                            <TableCell className="text-sm text-right py-2 font-medium">{fmt(row.balance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button className="flex-1 bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Balance
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Initiate Transfer
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <ListOrdered className="w-4 h-4 mr-2" />
                    View Transactions
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
