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
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
} from "lucide-react";
import Breadcrumb from "@/components/layout/breadcrumb";

interface APExceptionRecord {
  id: string;
  vendorName: string;
  invoiceNumber: string;
  amount: number;
  exceptionType:
    | "PO Mismatch"
    | "Duplicate Invoice"
    | "Price Variance"
    | "Quantity Mismatch"
    | "Missing Receipt"
    | "Tax Error";
  status: "Open" | "In Progress" | "Resolved" | "Auto-Cleared";
  severity: "Critical" | "High" | "Medium" | "Low";
  detectedDate: string;
  poNumber: string;
  assignee: string;
}

const MOCK_EXCEPTIONS: APExceptionRecord[] = [
  {
    id: "APX-001",
    vendorName: "Acme Industrial Supply",
    invoiceNumber: "INV-2026-4401",
    amount: 78500,
    exceptionType: "PO Mismatch",
    status: "Open",
    severity: "Critical",
    detectedDate: "2026-02-20",
    poNumber: "PO-88210",
    assignee: "Sarah Chen",
  },
  {
    id: "APX-002",
    vendorName: "GlobalTech Solutions",
    invoiceNumber: "GT-90122",
    amount: 34250,
    exceptionType: "Duplicate Invoice",
    status: "In Progress",
    severity: "High",
    detectedDate: "2026-02-19",
    poNumber: "PO-87455",
    assignee: "David Park",
  },
  {
    id: "APX-003",
    vendorName: "Meridian Logistics",
    invoiceNumber: "ML-2026-0087",
    amount: 12800,
    exceptionType: "Price Variance",
    status: "Resolved",
    severity: "Medium",
    detectedDate: "2026-02-18",
    poNumber: "PO-86932",
    assignee: "Lisa Wang",
  },
  {
    id: "APX-004",
    vendorName: "Summit Office Products",
    invoiceNumber: "SOP-44210",
    amount: 2150,
    exceptionType: "Quantity Mismatch",
    status: "Auto-Cleared",
    severity: "Low",
    detectedDate: "2026-02-17",
    poNumber: "PO-86801",
    assignee: "Mike Johnson",
  },
  {
    id: "APX-005",
    vendorName: "Pinnacle Raw Materials",
    invoiceNumber: "PRM-66789",
    amount: 56300,
    exceptionType: "Missing Receipt",
    status: "Open",
    severity: "High",
    detectedDate: "2026-02-16",
    poNumber: "PO-85994",
    assignee: "Sarah Chen",
  },
  {
    id: "APX-006",
    vendorName: "Vertex Cloud Services",
    invoiceNumber: "VCS-2026-0321",
    amount: 9750,
    exceptionType: "Tax Error",
    status: "In Progress",
    severity: "Medium",
    detectedDate: "2026-02-15",
    poNumber: "PO-85670",
    assignee: "Emily Roberts",
  },
  {
    id: "APX-007",
    vendorName: "Atlas Manufacturing Co.",
    invoiceNumber: "AMC-10045",
    amount: 41600,
    exceptionType: "PO Mismatch",
    status: "Open",
    severity: "Critical",
    detectedDate: "2026-02-14",
    poNumber: "PO-85322",
    assignee: "David Park",
  },
  {
    id: "APX-008",
    vendorName: "Crestview Packaging",
    invoiceNumber: "CP-7788",
    amount: 500,
    exceptionType: "Duplicate Invoice",
    status: "Auto-Cleared",
    severity: "Low",
    detectedDate: "2026-02-13",
    poNumber: "PO-84910",
    assignee: "Lisa Wang",
  },
  {
    id: "APX-009",
    vendorName: "NovaPharma Distributors",
    invoiceNumber: "NPD-2026-1190",
    amount: 67200,
    exceptionType: "Price Variance",
    status: "In Progress",
    severity: "High",
    detectedDate: "2026-02-12",
    poNumber: "PO-84503",
    assignee: "Mike Johnson",
  },
  {
    id: "APX-010",
    vendorName: "Horizon IT Consulting",
    invoiceNumber: "HIT-55432",
    amount: 18900,
    exceptionType: "Missing Receipt",
    status: "Resolved",
    severity: "Medium",
    detectedDate: "2026-02-11",
    poNumber: "PO-84100",
    assignee: "Emily Roberts",
  },
];

const EXCEPTION_DESCRIPTIONS: Record<string, string> = {
  "PO Mismatch":
    "The invoice amount or line items do not match the corresponding purchase order. This requires verification of the PO terms, contract pricing, and any approved change orders before the invoice can be processed for payment.",
  "Duplicate Invoice":
    "A potential duplicate submission has been detected based on invoice number, amount, and vendor matching. The system flagged this entry to prevent double payment. Review prior payment history to confirm duplication.",
  "Price Variance":
    "The unit price on the invoice differs from the agreed price on the purchase order beyond the acceptable tolerance threshold. Contact the vendor or procurement team to resolve the pricing discrepancy.",
  "Quantity Mismatch":
    "The quantity invoiced does not match the quantity received as recorded in the goods receipt. Verify the receiving report and confirm actual quantities delivered before approving payment.",
  "Missing Receipt":
    "No goods receipt or service confirmation has been recorded for this invoice. The three-way match cannot be completed until the receiving department confirms delivery of goods or services.",
  "Tax Error":
    "The tax calculation on the invoice does not match expected rates based on the vendor location, ship-to address, and applicable tax jurisdiction rules. Review tax codes and rates before processing.",
};

export default function APExceptionsWorkbenchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<APExceptionRecord | null>(null);

  const filtered = useMemo(() => {
    return MOCK_EXCEPTIONS.filter((e) => {
      const matchSearch =
        e.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      const matchSeverity = severityFilter === "all" || e.severity === severityFilter;
      const matchType = typeFilter === "all" || e.exceptionType === typeFilter;
      return matchSearch && matchStatus && matchSeverity && matchType;
    });
  }, [searchQuery, statusFilter, severityFilter, typeFilter]);

  const totalCount = useMemo(() => MOCK_EXCEPTIONS.length, []);
  const criticalCount = useMemo(
    () => MOCK_EXCEPTIONS.filter((e) => e.severity === "Critical").length,
    []
  );
  const avgResolutionTime = "4.2 days";
  const autoClearRate = useMemo(() => {
    const autoClearedCount = MOCK_EXCEPTIONS.filter((e) => e.status === "Auto-Cleared").length;
    return `${((autoClearedCount / MOCK_EXCEPTIONS.length) * 100).toFixed(0)}%`;
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Open</Badge>;
      case "In Progress":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">In Progress</Badge>;
      case "Resolved":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Resolved</Badge>;
      case "Auto-Cleared":
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200">Auto-Cleared</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical":
        return <Badge className="bg-red-50 text-red-700 border-red-200">Critical</Badge>;
      case "High":
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200">High</Badge>;
      case "Medium":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Medium</Badge>;
      case "Low":
        return <Badge className="bg-gray-50 text-gray-500 border-gray-200">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "PO Mismatch":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200">PO Mismatch</Badge>;
      case "Duplicate Invoice":
        return <Badge className="bg-violet-50 text-violet-700 border-violet-200">Duplicate Invoice</Badge>;
      case "Price Variance":
        return <Badge className="bg-sky-50 text-sky-700 border-sky-200">Price Variance</Badge>;
      case "Quantity Mismatch":
        return <Badge className="bg-teal-50 text-teal-700 border-teal-200">Quantity Mismatch</Badge>;
      case "Missing Receipt":
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Missing Receipt</Badge>;
      case "Tax Error":
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">Tax Error</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="workbench/procure-to-pay/ap-exceptions" className="mb-1.5" />
        <div className="flex items-center gap-3 mb-1">
          <Shield className="h-6 w-6 text-slate-700" />
          <h1 className="text-2xl font-bold text-[#000000] mt-2">AP Exceptions</h1>
        </div>
        <p className="text-sm text-[#606060]">Manage accounts payable exceptions</p>
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
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Exceptions</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Critical Count</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{criticalCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Resolution Time</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{avgResolutionTime}</p>
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
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Auto-Clear Rate</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{autoClearRate}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
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
                placeholder="Search vendor or invoice..."
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
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Auto-Cleared">Auto-Cleared</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Exception Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PO Mismatch">PO Mismatch</SelectItem>
                <SelectItem value="Duplicate Invoice">Duplicate Invoice</SelectItem>
                <SelectItem value="Price Variance">Price Variance</SelectItem>
                <SelectItem value="Quantity Mismatch">Quantity Mismatch</SelectItem>
                <SelectItem value="Missing Receipt">Missing Receipt</SelectItem>
                <SelectItem value="Tax Error">Tax Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount ($)</TableHead>
                  <TableHead>PO #</TableHead>
                  <TableHead>Exception Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Assignee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedRecord(e)}
                  >
                    <TableCell className="font-medium text-gray-900">{e.id}</TableCell>
                    <TableCell className="text-sm text-gray-700">{e.vendorName}</TableCell>
                    <TableCell className="text-sm text-gray-600">{e.invoiceNumber}</TableCell>
                    <TableCell className="text-sm font-medium text-gray-900">
                      ${e.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{e.poNumber}</TableCell>
                    <TableCell>{getTypeBadge(e.exceptionType)}</TableCell>
                    <TableCell>{getStatusBadge(e.status)}</TableCell>
                    <TableCell>{getSeverityBadge(e.severity)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{e.assignee}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                      No exceptions match the current filters.
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
                  <div className="w-10 h-10 rounded-lg bg-[#1B2A41] text-white flex items-center justify-center font-medium text-sm">
                    {selectedRecord.id.split("-")[1]}
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{selectedRecord.id}</p>
                    <p className="text-sm font-normal text-gray-500">{selectedRecord.vendorName}</p>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(selectedRecord.status)}
                  {getSeverityBadge(selectedRecord.severity)}
                  {getTypeBadge(selectedRecord.exceptionType)}
                </div>

                {/* Summary grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Invoice</p>
                    <p className="text-sm font-medium mt-1">{selectedRecord.invoiceNumber}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-sm font-medium mt-1">${selectedRecord.amount.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">PO Number</p>
                    <p className="text-sm font-medium mt-1">{selectedRecord.poNumber}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Exception Type</p>
                    <p className="text-sm font-medium mt-1">{selectedRecord.exceptionType}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Severity</p>
                    <p className="text-sm font-medium mt-1">{selectedRecord.severity}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-sm font-medium mt-1">{selectedRecord.status}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Detected Date</p>
                    <p className="text-sm font-medium mt-1">{selectedRecord.detectedDate}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Assignee</p>
                    <p className="text-sm font-medium mt-1">{selectedRecord.assignee}</p>
                  </div>
                </div>

                {/* Exception Details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Exception Details</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {EXCEPTION_DESCRIPTIONS[selectedRecord.exceptionType]}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button className="flex-1 bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Resolve
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Override
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Reassign
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
