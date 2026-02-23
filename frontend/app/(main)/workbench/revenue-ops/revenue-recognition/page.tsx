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
  Calculator,
  DollarSign,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  RefreshCw,
  FilePenLine,
  Download,
} from "lucide-react";
import Breadcrumb from "@/components/layout/breadcrumb";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RevenueContractRecord {
  id: string;
  customerName: string;
  contractName: string;
  totalValue: number;
  recognizedRevenue: number;
  deferredRevenue: number;
  recognitionMethod:
    | "Percentage of Completion"
    | "Straight Line"
    | "Milestone Based";
  stage: "Draft" | "Active" | "Nearing Completion" | "Completed";
  startDate: string;
  endDate: string;
  completionPct: number;
  performanceObligations: number;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_CONTRACTS: RevenueContractRecord[] = [
  {
    id: "RRC-001",
    customerName: "Acme Corporation",
    contractName: "Enterprise Platform License FY26",
    totalValue: 1850000,
    recognizedRevenue: 1295000,
    deferredRevenue: 555000,
    recognitionMethod: "Percentage of Completion",
    stage: "Active",
    startDate: "2025-04-01",
    endDate: "2026-09-30",
    completionPct: 70,
    performanceObligations: 4,
  },
  {
    id: "RRC-002",
    customerName: "Globex Industries",
    contractName: "SaaS Annual Subscription",
    totalValue: 420000,
    recognizedRevenue: 315000,
    deferredRevenue: 105000,
    recognitionMethod: "Straight Line",
    stage: "Active",
    startDate: "2025-06-01",
    endDate: "2026-05-31",
    completionPct: 75,
    performanceObligations: 2,
  },
  {
    id: "RRC-003",
    customerName: "Stark Technologies",
    contractName: "Custom Integration Build-Out",
    totalValue: 2000000,
    recognizedRevenue: 1600000,
    deferredRevenue: 400000,
    recognitionMethod: "Milestone Based",
    stage: "Nearing Completion",
    startDate: "2025-01-15",
    endDate: "2026-04-15",
    completionPct: 85,
    performanceObligations: 6,
  },
  {
    id: "RRC-004",
    customerName: "Wayne Enterprises",
    contractName: "Data Analytics Suite License",
    totalValue: 750000,
    recognizedRevenue: 750000,
    deferredRevenue: 0,
    recognitionMethod: "Straight Line",
    stage: "Completed",
    startDate: "2024-10-01",
    endDate: "2025-09-30",
    completionPct: 100,
    performanceObligations: 3,
  },
  {
    id: "RRC-005",
    customerName: "Oscorp International",
    contractName: "Managed Services Agreement",
    totalValue: 560000,
    recognizedRevenue: 186000,
    deferredRevenue: 374000,
    recognitionMethod: "Percentage of Completion",
    stage: "Active",
    startDate: "2025-09-01",
    endDate: "2026-08-31",
    completionPct: 33,
    performanceObligations: 5,
  },
  {
    id: "RRC-006",
    customerName: "Umbrella Corp",
    contractName: "Cloud Migration Phase II",
    totalValue: 1200000,
    recognizedRevenue: 0,
    deferredRevenue: 1200000,
    recognitionMethod: "Milestone Based",
    stage: "Draft",
    startDate: "2026-03-01",
    endDate: "2027-02-28",
    completionPct: 0,
    performanceObligations: 4,
  },
  {
    id: "RRC-007",
    customerName: "Initech Solutions",
    contractName: "Annual Support & Maintenance",
    totalValue: 95000,
    recognizedRevenue: 71250,
    deferredRevenue: 23750,
    recognitionMethod: "Straight Line",
    stage: "Active",
    startDate: "2025-05-01",
    endDate: "2026-04-30",
    completionPct: 75,
    performanceObligations: 1,
  },
  {
    id: "RRC-008",
    customerName: "Cyberdyne Systems",
    contractName: "AI Platform Deployment",
    totalValue: 1650000,
    recognizedRevenue: 1485000,
    deferredRevenue: 165000,
    recognitionMethod: "Percentage of Completion",
    stage: "Nearing Completion",
    startDate: "2025-02-01",
    endDate: "2026-03-31",
    completionPct: 90,
    performanceObligations: 5,
  },
  {
    id: "RRC-009",
    customerName: "Soylent Corp",
    contractName: "ERP Integration Services",
    totalValue: 320000,
    recognizedRevenue: 0,
    deferredRevenue: 320000,
    recognitionMethod: "Milestone Based",
    stage: "Draft",
    startDate: "2026-04-01",
    endDate: "2026-12-31",
    completionPct: 0,
    performanceObligations: 3,
  },
  {
    id: "RRC-010",
    customerName: "Massive Dynamic",
    contractName: "Predictive Analytics License",
    totalValue: 50000,
    recognizedRevenue: 50000,
    deferredRevenue: 0,
    recognitionMethod: "Straight Line",
    stage: "Completed",
    startDate: "2025-03-01",
    endDate: "2026-02-28",
    completionPct: 100,
    performanceObligations: 1,
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmtCurrency = (v: number) => "$" + v.toLocaleString();

const getMethodBadge = (method: RevenueContractRecord["recognitionMethod"]) => {
  switch (method) {
    case "Percentage of Completion":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          Pct of Completion
        </Badge>
      );
    case "Straight Line":
      return (
        <Badge className="bg-purple-50 text-purple-700 border-purple-200">
          Straight Line
        </Badge>
      );
    case "Milestone Based":
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200">
          Milestone Based
        </Badge>
      );
    default:
      return <Badge variant="outline">{method}</Badge>;
  }
};

const getStageBadge = (stage: RevenueContractRecord["stage"]) => {
  switch (stage) {
    case "Draft":
      return (
        <Badge className="bg-gray-50 text-gray-500 border-gray-200">
          Draft
        </Badge>
      );
    case "Active":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          Active
        </Badge>
      );
    case "Nearing Completion":
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200">
          Nearing Completion
        </Badge>
      );
    case "Completed":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Completed
        </Badge>
      );
    default:
      return <Badge variant="outline">{stage}</Badge>;
  }
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RevenueRecognitionWorkbenchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [selectedContract, setSelectedContract] =
    useState<RevenueContractRecord | null>(null);

  /* Filtered list */
  const filtered = useMemo(() => {
    return MOCK_CONTRACTS.filter((c) => {
      const matchSearch =
        c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contractName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMethod =
        methodFilter === "all" || c.recognitionMethod === methodFilter;
      const matchStage = stageFilter === "all" || c.stage === stageFilter;
      return matchSearch && matchMethod && matchStage;
    });
  }, [searchQuery, methodFilter, stageFilter]);

  /* KPIs */
  const kpis = useMemo(() => {
    const totalContractValue = MOCK_CONTRACTS.reduce(
      (sum, c) => sum + c.totalValue,
      0
    );
    const recognizedYTD = MOCK_CONTRACTS.reduce(
      (sum, c) => sum + c.recognizedRevenue,
      0
    );
    const deferredBalance = MOCK_CONTRACTS.reduce(
      (sum, c) => sum + c.deferredRevenue,
      0
    );
    const activeContracts = MOCK_CONTRACTS.filter(
      (c) => c.stage === "Active" || c.stage === "Nearing Completion"
    ).length;
    return { totalContractValue, recognizedYTD, deferredBalance, activeContracts };
  }, []);

  return (
    <div
      className="flex flex-col bg-white"
      style={{ height: "100%", minHeight: 0 }}
    >
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb
          activeRoute="workbench/revenue-ops/revenue-recognition"
          className="mb-1.5"
        />
        <div className="flex items-center gap-3 mb-1">
          <Calculator className="h-6 w-6 text-slate-700" />
          <h1 className="text-2xl font-bold text-[#000000] mt-2">
            Revenue Recognition
          </h1>
        </div>
        <p className="text-sm text-[#606060]">
          Manage revenue recognition and contract compliance
        </p>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-[1363px] mx-auto px-6 py-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 stagger-children">
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Contract Value
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {fmtCurrency(kpis.totalContractValue)}
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
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recognized YTD
                    </p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                      {fmtCurrency(kpis.recognizedYTD)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deferred Balance
                    </p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">
                      {fmtCurrency(kpis.deferredBalance)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active Contracts
                    </p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {kpis.activeContracts}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
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
                placeholder="Search customer or contract..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="Percentage of Completion">
                  Pct of Completion
                </SelectItem>
                <SelectItem value="Straight Line">Straight Line</SelectItem>
                <SelectItem value="Milestone Based">Milestone Based</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Nearing Completion">
                  Nearing Completion
                </SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contract Name</TableHead>
                  <TableHead className="text-right">Total Value($)</TableHead>
                  <TableHead className="text-right">Recognized($)</TableHead>
                  <TableHead className="text-right">Deferred($)</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Completion%</TableHead>
                  <TableHead className="text-center">Obligations</TableHead>
                  <TableHead>End Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedContract(c)}
                  >
                    <TableCell className="font-medium text-gray-900">
                      {c.id}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {c.customerName}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 max-w-[200px] truncate">
                      {c.contractName}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-gray-900">
                      {fmtCurrency(c.totalValue)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-emerald-700">
                      {fmtCurrency(c.recognizedRevenue)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-amber-700">
                      {fmtCurrency(c.deferredRevenue)}
                    </TableCell>
                    <TableCell>{getMethodBadge(c.recognitionMethod)}</TableCell>
                    <TableCell>{getStageBadge(c.stage)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${c.completionPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {c.completionPct}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-700">
                      {c.performanceObligations}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {c.endDate}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center py-10 text-gray-400"
                    >
                      No contracts match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* Detail Drawer */}
      <Sheet
        open={!!selectedContract}
        onOpenChange={() => setSelectedContract(null)}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedContract && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg font-bold text-gray-900">
                  {selectedContract.contractName}
                </SheetTitle>
                <p className="text-sm text-gray-500">
                  {selectedContract.customerName}
                </p>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Badges */}
                <div className="flex items-center gap-2">
                  {getMethodBadge(selectedContract.recognitionMethod)}
                  {getStageBadge(selectedContract.stage)}
                </div>

                {/* Summary grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedContract.customerName}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Contract</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedContract.contractName}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Total Value</p>
                    <p className="text-sm font-medium mt-1">
                      {fmtCurrency(selectedContract.totalValue)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Recognized Revenue</p>
                    <p className="text-sm font-medium mt-1 text-emerald-700">
                      {fmtCurrency(selectedContract.recognizedRevenue)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Deferred Revenue</p>
                    <p className="text-sm font-medium mt-1 text-amber-700">
                      {fmtCurrency(selectedContract.deferredRevenue)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Method</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedContract.recognitionMethod}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Stage</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedContract.stage}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedContract.startDate}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">End Date</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedContract.endDate}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">
                      Performance Obligations
                    </p>
                    <p className="text-sm font-medium mt-1">
                      {selectedContract.performanceObligations}
                    </p>
                  </div>
                </div>

                {/* Progress section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Completion Progress
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{
                          width: `${selectedContract.completionPct}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 min-w-[40px] text-right">
                      {selectedContract.completionPct}%
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button className="flex-1 bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Update Progress
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <FilePenLine className="w-4 h-4 mr-2" />
                    Amend Contract
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
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
