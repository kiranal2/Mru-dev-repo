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
  Settings,
  Building2,
  Users,
  Target,
  DollarSign,
  Search,
} from "lucide-react";
import Breadcrumb from "@/components/layout/breadcrumb";

interface BPOVendorConfig {
  id: string;
  vendorName: string;
  processArea:
    | "Accounts Payable"
    | "Accounts Receivable"
    | "General Ledger"
    | "Payroll"
    | "Tax Compliance";
  status: "Active" | "Onboarding" | "Inactive";
  slaTarget: number;
  actualSla: number;
  staffCount: number;
  transactionsPerMonth: number;
  accuracy: number;
  contractExpiry: string;
  monthlyFee: number;
}

const MOCK_VENDORS: BPOVendorConfig[] = [
  {
    id: "BPO-001",
    vendorName: "Infosys BPO",
    processArea: "Accounts Payable",
    status: "Active",
    slaTarget: 98.5,
    actualSla: 97.8,
    staffCount: 120,
    transactionsPerMonth: 45000,
    accuracy: 99.2,
    contractExpiry: "2027-03-31",
    monthlyFee: 185000,
  },
  {
    id: "BPO-002",
    vendorName: "Wipro GBS",
    processArea: "Accounts Receivable",
    status: "Active",
    slaTarget: 97.0,
    actualSla: 97.5,
    staffCount: 85,
    transactionsPerMonth: 32000,
    accuracy: 98.7,
    contractExpiry: "2026-12-31",
    monthlyFee: 142000,
  },
  {
    id: "BPO-003",
    vendorName: "Genpact",
    processArea: "General Ledger",
    status: "Active",
    slaTarget: 99.0,
    actualSla: 99.1,
    staffCount: 65,
    transactionsPerMonth: 18000,
    accuracy: 99.5,
    contractExpiry: "2027-06-30",
    monthlyFee: 128000,
  },
  {
    id: "BPO-004",
    vendorName: "Accenture Operations",
    processArea: "Tax Compliance",
    status: "Active",
    slaTarget: 99.5,
    actualSla: 99.3,
    staffCount: 40,
    transactionsPerMonth: 8500,
    accuracy: 99.8,
    contractExpiry: "2027-09-30",
    monthlyFee: 96000,
  },
  {
    id: "BPO-005",
    vendorName: "TCS BPS",
    processArea: "Payroll",
    status: "Onboarding",
    slaTarget: 98.0,
    actualSla: 94.2,
    staffCount: 55,
    transactionsPerMonth: 22000,
    accuracy: 97.1,
    contractExpiry: "2028-01-31",
    monthlyFee: 110000,
  },
  {
    id: "BPO-006",
    vendorName: "Cognizant BPM",
    processArea: "Accounts Payable",
    status: "Active",
    slaTarget: 97.5,
    actualSla: 98.1,
    staffCount: 95,
    transactionsPerMonth: 38000,
    accuracy: 98.9,
    contractExpiry: "2026-09-30",
    monthlyFee: 156000,
  },
  {
    id: "BPO-007",
    vendorName: "HCL Technologies",
    processArea: "Accounts Receivable",
    status: "Inactive",
    slaTarget: 96.5,
    actualSla: 91.3,
    staffCount: 0,
    transactionsPerMonth: 0,
    accuracy: 95.4,
    contractExpiry: "2025-12-31",
    monthlyFee: 0,
  },
  {
    id: "BPO-008",
    vendorName: "EXL Service",
    processArea: "General Ledger",
    status: "Onboarding",
    slaTarget: 98.0,
    actualSla: 95.6,
    staffCount: 30,
    transactionsPerMonth: 12000,
    accuracy: 97.8,
    contractExpiry: "2028-03-31",
    monthlyFee: 89000,
  },
];

export default function BPOSetupPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [processFilter, setProcessFilter] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState<BPOVendorConfig | null>(null);

  const filtered = useMemo(
    () =>
      MOCK_VENDORS.filter((v) => {
        const matchSearch = v.vendorName
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchStatus = statusFilter === "all" || v.status === statusFilter;
        const matchProcess = processFilter === "all" || v.processArea === processFilter;
        return matchSearch && matchStatus && matchProcess;
      }),
    [searchQuery, statusFilter, processFilter]
  );

  const activeCount = useMemo(
    () => MOCK_VENDORS.filter((v) => v.status === "Active").length,
    []
  );

  const totalStaff = useMemo(
    () => MOCK_VENDORS.reduce((sum, v) => sum + v.staffCount, 0),
    []
  );

  const avgSla = useMemo(() => {
    const activeVendors = MOCK_VENDORS.filter((v) => v.status !== "Inactive");
    if (activeVendors.length === 0) return 0;
    return (
      activeVendors.reduce((sum, v) => sum + v.actualSla, 0) / activeVendors.length
    );
  }, []);

  const monthlyCost = useMemo(
    () => MOCK_VENDORS.reduce((sum, v) => sum + v.monthlyFee, 0),
    []
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Active
          </Badge>
        );
      case "Onboarding":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
            Onboarding
          </Badge>
        );
      case "Inactive":
        return (
          <Badge className="bg-gray-50 text-gray-500 border-gray-200">
            Inactive
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProcessBadge = (area: string) => {
    switch (area) {
      case "Accounts Payable":
        return (
          <Badge className="bg-violet-50 text-violet-700 border-violet-200">
            Accounts Payable
          </Badge>
        );
      case "Accounts Receivable":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200">
            Accounts Receivable
          </Badge>
        );
      case "General Ledger":
        return (
          <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200">
            General Ledger
          </Badge>
        );
      case "Payroll":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200">
            Payroll
          </Badge>
        );
      case "Tax Compliance":
        return (
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
            Tax Compliance
          </Badge>
        );
      default:
        return <Badge variant="outline">{area}</Badge>;
    }
  };

  const formatCurrency = (amount: number) =>
    "$" + amount.toLocaleString();

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="workbench/bpo-setup" className="mb-1.5" />
        <div className="flex items-center gap-3 mb-1">
          <Settings className="h-6 w-6 text-slate-700" />
          <h1 className="text-2xl font-bold text-[#000000] mt-2">BPO Setup</h1>
        </div>
        <p className="text-sm text-[#606060]">
          Configure BPO vendor settings and SLA targets
        </p>
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
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active Vendors
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{activeCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Staff
                    </p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {totalStaff.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg SLA Compliance
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {avgSla.toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Target className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Cost
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(monthlyCost)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-purple-600" />
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
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Onboarding">Onboarding</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={processFilter} onValueChange={setProcessFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Process Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Process Areas</SelectItem>
                <SelectItem value="Accounts Payable">Accounts Payable</SelectItem>
                <SelectItem value="Accounts Receivable">Accounts Receivable</SelectItem>
                <SelectItem value="General Ledger">General Ledger</SelectItem>
                <SelectItem value="Payroll">Payroll</SelectItem>
                <SelectItem value="Tax Compliance">Tax Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Process Area</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">SLA Target%</TableHead>
                  <TableHead className="text-right">Actual SLA%</TableHead>
                  <TableHead className="text-right">Staff</TableHead>
                  <TableHead className="text-right">Txns/Month</TableHead>
                  <TableHead className="text-right">Accuracy%</TableHead>
                  <TableHead>Contract Expiry</TableHead>
                  <TableHead className="text-right">Monthly Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow
                    key={v.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedVendor(v)}
                  >
                    <TableCell>
                      <p className="font-medium text-gray-900">{v.vendorName}</p>
                      <p className="text-xs text-gray-500">{v.id}</p>
                    </TableCell>
                    <TableCell>{getProcessBadge(v.processArea)}</TableCell>
                    <TableCell>{getStatusBadge(v.status)}</TableCell>
                    <TableCell className="text-right text-sm text-gray-700">
                      {v.slaTarget.toFixed(1)}%
                    </TableCell>
                    <TableCell
                      className={`text-right text-sm font-medium ${
                        v.actualSla < v.slaTarget ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {v.actualSla.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-700">
                      {v.staffCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-700">
                      {v.transactionsPerMonth.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-700">
                      {v.accuracy.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {v.contractExpiry}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-gray-900">
                      {formatCurrency(v.monthlyFee)}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      No vendors match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedVendor && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1B2A41] text-white flex items-center justify-center font-medium text-sm">
                    {selectedVendor.vendorName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  {selectedVendor.vendorName}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status badges */}
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedVendor.status)}
                  {getProcessBadge(selectedVendor.processArea)}
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Process Area</p>
                    <p className="text-sm font-medium mt-1">{selectedVendor.processArea}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-sm font-medium mt-1">{selectedVendor.status}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">SLA Target</p>
                    <p className="text-sm font-medium mt-1">{selectedVendor.slaTarget.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Actual SLA</p>
                    <p
                      className={`text-sm font-medium mt-1 ${
                        selectedVendor.actualSla < selectedVendor.slaTarget
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {selectedVendor.actualSla.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Staff Count</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedVendor.staffCount.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Transactions/Month</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedVendor.transactionsPerMonth.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Accuracy</p>
                    <p className="text-sm font-medium mt-1">{selectedVendor.accuracy.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Contract Expiry</p>
                    <p className="text-sm font-medium mt-1">{selectedVendor.contractExpiry}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 col-span-2">
                    <p className="text-xs text-gray-500">Monthly Fee</p>
                    <p className="text-sm font-medium mt-1">
                      {formatCurrency(selectedVendor.monthlyFee)}
                    </p>
                  </div>
                </div>

                {/* SLA Metrics Comparison */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">SLA Metrics</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Target SLA</span>
                        <span className="font-medium">{selectedVendor.slaTarget.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${selectedVendor.slaTarget}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Actual SLA</span>
                        <span
                          className={`font-medium ${
                            selectedVendor.actualSla < selectedVendor.slaTarget
                              ? "text-red-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {selectedVendor.actualSla.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            selectedVendor.actualSla < selectedVendor.slaTarget
                              ? "bg-red-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${selectedVendor.actualSla}%` }}
                        />
                      </div>
                    </div>
                    <div className="pt-1">
                      <p className="text-xs text-gray-500">
                        Variance:{" "}
                        <span
                          className={`font-medium ${
                            selectedVendor.actualSla >= selectedVendor.slaTarget
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {selectedVendor.actualSla >= selectedVendor.slaTarget ? "+" : ""}
                          {(selectedVendor.actualSla - selectedVendor.slaTarget).toFixed(1)}%
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button className="flex-1 bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
                    Edit Config
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Renew Contract
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Deactivate
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
