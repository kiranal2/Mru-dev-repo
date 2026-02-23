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
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
  Search,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Breadcrumb from "@/components/layout/breadcrumb";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DisputeRecord {
  id: string;
  customerName: string;
  invoiceNumber: string;
  disputeAmount: number;
  originalAmount: number;
  reason:
    | "Price Discrepancy"
    | "Damaged Goods"
    | "Service Issue"
    | "Billing Error"
    | "Warranty Claim";
  status: "Open" | "Under Review" | "Escalated" | "Resolved" | "Closed";
  priority: "High" | "Medium" | "Low";
  createdDate: string;
  dueDate: string;
  assignee: string;
  aging: number;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_DISPUTES: DisputeRecord[] = [
  {
    id: "DSP-001",
    customerName: "Acme Corporation",
    invoiceNumber: "INV-2026-1042",
    disputeAmount: 45000,
    originalAmount: 120000,
    reason: "Price Discrepancy",
    status: "Open",
    priority: "High",
    createdDate: "2026-01-15",
    dueDate: "2026-02-28",
    assignee: "Sarah Chen",
    aging: 39,
  },
  {
    id: "DSP-002",
    customerName: "Globex Industries",
    invoiceNumber: "INV-2026-1078",
    disputeAmount: 12500,
    originalAmount: 38000,
    reason: "Damaged Goods",
    status: "Under Review",
    priority: "Medium",
    createdDate: "2026-02-01",
    dueDate: "2026-03-15",
    assignee: "Mike Johnson",
    aging: 22,
  },
  {
    id: "DSP-003",
    customerName: "Initech LLC",
    invoiceNumber: "INV-2026-0987",
    disputeAmount: 150000,
    originalAmount: 310000,
    reason: "Service Issue",
    status: "Escalated",
    priority: "High",
    createdDate: "2026-01-09",
    dueDate: "2026-02-20",
    assignee: "Lisa Wang",
    aging: 45,
  },
  {
    id: "DSP-004",
    customerName: "Wayne Enterprises",
    invoiceNumber: "INV-2026-1105",
    disputeAmount: 8700,
    originalAmount: 25000,
    reason: "Billing Error",
    status: "Resolved",
    priority: "Low",
    createdDate: "2026-02-10",
    dueDate: "2026-03-10",
    assignee: "David Park",
    aging: 13,
  },
  {
    id: "DSP-005",
    customerName: "Stark Solutions",
    invoiceNumber: "INV-2026-1120",
    disputeAmount: 67000,
    originalAmount: 185000,
    reason: "Warranty Claim",
    status: "Open",
    priority: "High",
    createdDate: "2026-02-05",
    dueDate: "2026-03-05",
    assignee: "Sarah Chen",
    aging: 18,
  },
  {
    id: "DSP-006",
    customerName: "Umbrella Corp",
    invoiceNumber: "INV-2026-0945",
    disputeAmount: 3200,
    originalAmount: 9500,
    reason: "Price Discrepancy",
    status: "Closed",
    priority: "Low",
    createdDate: "2026-02-18",
    dueDate: "2026-03-18",
    assignee: "Emily Roberts",
    aging: 5,
  },
  {
    id: "DSP-007",
    customerName: "Cyberdyne Systems",
    invoiceNumber: "INV-2026-1060",
    disputeAmount: 28900,
    originalAmount: 74000,
    reason: "Damaged Goods",
    status: "Under Review",
    priority: "Medium",
    createdDate: "2026-01-28",
    dueDate: "2026-03-01",
    assignee: "Mike Johnson",
    aging: 26,
  },
  {
    id: "DSP-008",
    customerName: "Massive Dynamic",
    invoiceNumber: "INV-2026-1089",
    disputeAmount: 95000,
    originalAmount: 220000,
    reason: "Service Issue",
    status: "Escalated",
    priority: "High",
    createdDate: "2026-01-20",
    dueDate: "2026-02-25",
    assignee: "Lisa Wang",
    aging: 34,
  },
  {
    id: "DSP-009",
    customerName: "Hooli Inc",
    invoiceNumber: "INV-2026-1130",
    disputeAmount: 5400,
    originalAmount: 16000,
    reason: "Billing Error",
    status: "Resolved",
    priority: "Low",
    createdDate: "2026-02-20",
    dueDate: "2026-03-20",
    assignee: "David Park",
    aging: 3,
  },
  {
    id: "DSP-010",
    customerName: "Oscorp Technologies",
    invoiceNumber: "INV-2026-1098",
    disputeAmount: 41500,
    originalAmount: 98000,
    reason: "Warranty Claim",
    status: "Open",
    priority: "Medium",
    createdDate: "2026-02-08",
    dueDate: "2026-03-08",
    assignee: "Sarah Chen",
    aging: 15,
  },
];

// ---------------------------------------------------------------------------
// Mock Timeline Data (keyed by dispute id)
// ---------------------------------------------------------------------------

const MOCK_TIMELINES: Record<string, { date: string; description: string }[]> = {
  "DSP-001": [
    { date: "2026-01-15", description: "Dispute filed by Acme Corporation citing pricing mismatch on contract terms." },
    { date: "2026-01-18", description: "Assigned to Sarah Chen for initial review." },
    { date: "2026-01-25", description: "Customer provided supporting purchase order documentation." },
    { date: "2026-02-05", description: "Internal pricing audit initiated for contract INV-2026-1042." },
  ],
  "DSP-002": [
    { date: "2026-02-01", description: "Dispute raised for damaged shipment received at Globex warehouse." },
    { date: "2026-02-03", description: "Photographic evidence submitted by customer logistics team." },
    { date: "2026-02-10", description: "Carrier claim filed; under review by Mike Johnson." },
  ],
  "DSP-003": [
    { date: "2026-01-09", description: "Initech escalated SLA breach complaint covering Q4 service delivery." },
    { date: "2026-01-14", description: "Service delivery logs pulled for analysis." },
    { date: "2026-01-22", description: "Escalated to VP of Operations for resolution." },
    { date: "2026-02-01", description: "Mediation meeting scheduled with Initech leadership." },
  ],
};

const DEFAULT_TIMELINE = [
  { date: "2026-02-01", description: "Dispute created and logged in the system." },
  { date: "2026-02-05", description: "Assigned to analyst for initial review." },
  { date: "2026-02-12", description: "Supporting documentation requested from customer." },
];

// ---------------------------------------------------------------------------
// Badge Helpers
// ---------------------------------------------------------------------------

function getStatusBadge(status: DisputeRecord["status"]) {
  switch (status) {
    case "Open":
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Open</Badge>;
    case "Under Review":
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Under Review</Badge>;
    case "Escalated":
      return <Badge className="bg-red-50 text-red-700 border-red-200">Escalated</Badge>;
    case "Resolved":
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Resolved</Badge>;
    case "Closed":
      return <Badge className="bg-gray-50 text-gray-500 border-gray-200">Closed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getPriorityBadge(priority: DisputeRecord["priority"]) {
  switch (priority) {
    case "High":
      return <Badge className="bg-red-50 text-red-700 border-red-200">High</Badge>;
    case "Medium":
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Medium</Badge>;
    case "Low":
      return <Badge className="bg-gray-50 text-gray-500 border-gray-200">Low</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
}

function getReasonBadge(reason: DisputeRecord["reason"]) {
  switch (reason) {
    case "Price Discrepancy":
      return <Badge className="bg-violet-50 text-violet-700 border-violet-200">Price Discrepancy</Badge>;
    case "Damaged Goods":
      return <Badge className="bg-orange-50 text-orange-700 border-orange-200">Damaged Goods</Badge>;
    case "Service Issue":
      return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Service Issue</Badge>;
    case "Billing Error":
      return <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200">Billing Error</Badge>;
    case "Warranty Claim":
      return <Badge className="bg-teal-50 text-teal-700 border-teal-200">Warranty Claim</Badge>;
    default:
      return <Badge variant="outline">{reason}</Badge>;
  }
}

function getAgingDisplay(aging: number) {
  if (aging > 30) return <span className="font-semibold text-red-600">{aging}d</span>;
  if (aging > 15) return <span className="font-semibold text-amber-600">{aging}d</span>;
  return <span className="font-semibold text-emerald-600">{aging}d</span>;
}

function formatCurrency(value: number) {
  return "$" + value.toLocaleString();
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function DisputesWorkbenchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<DisputeRecord | null>(null);

  // Filtered records
  const filtered = useMemo(() => {
    return MOCK_DISPUTES.filter((d) => {
      const matchSearch =
        d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "all" || d.status === statusFilter;
      const matchPriority = priorityFilter === "all" || d.priority === priorityFilter;
      const matchReason = reasonFilter === "all" || d.reason === reasonFilter;
      return matchSearch && matchStatus && matchPriority && matchReason;
    });
  }, [searchQuery, statusFilter, priorityFilter, reasonFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const totalDisputes = MOCK_DISPUTES.length;
    const totalAmount = MOCK_DISPUTES.reduce((sum, d) => sum + d.disputeAmount, 0);
    const avgAging = Math.round(
      MOCK_DISPUTES.reduce((sum, d) => sum + d.aging, 0) / MOCK_DISPUTES.length
    );
    const openCount = MOCK_DISPUTES.filter(
      (d) => d.status === "Open" || d.status === "Under Review"
    ).length;
    return { totalDisputes, totalAmount, avgAging, openCount };
  }, []);

  const timeline = selectedDispute
    ? MOCK_TIMELINES[selectedDispute.id] || DEFAULT_TIMELINE
    : [];

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="workbench/order-to-cash/disputes" className="mb-1.5" />
        <div className="flex items-center gap-3 mb-1">
          <FileText className="h-6 w-6 text-slate-700" />
          <h1 className="text-2xl font-bold text-[#000000] mt-2">Disputes</h1>
        </div>
        <p className="text-sm text-[#606060]">Manage and resolve customer disputes</p>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-[1363px] mx-auto px-6 py-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 stagger-children">
            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Disputes
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {kpis.totalDisputes}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Disputed Amount
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(kpis.totalAmount)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-interactive">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Resolution Time
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {kpis.avgAging} days
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
                      Open Disputes
                    </p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{kpis.openCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
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
                placeholder="Search by customer or invoice..."
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
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Escalated">Escalated</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                <SelectItem value="Price Discrepancy">Price Discrepancy</SelectItem>
                <SelectItem value="Damaged Goods">Damaged Goods</SelectItem>
                <SelectItem value="Service Issue">Service Issue</SelectItem>
                <SelectItem value="Billing Error">Billing Error</SelectItem>
                <SelectItem value="Warranty Claim">Warranty Claim</SelectItem>
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
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Amount ($)</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-center">Aging</TableHead>
                  <TableHead>Assignee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-gray-400">
                      No disputes match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((d) => (
                    <TableRow
                      key={d.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedDispute(d)}
                    >
                      <TableCell className="font-medium text-gray-900">{d.id}</TableCell>
                      <TableCell className="text-sm text-gray-700">{d.customerName}</TableCell>
                      <TableCell className="text-sm text-gray-600">{d.invoiceNumber}</TableCell>
                      <TableCell className="text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(d.disputeAmount)}
                      </TableCell>
                      <TableCell>{getReasonBadge(d.reason)}</TableCell>
                      <TableCell>{getStatusBadge(d.status)}</TableCell>
                      <TableCell>{getPriorityBadge(d.priority)}</TableCell>
                      <TableCell className="text-center">{getAgingDisplay(d.aging)}</TableCell>
                      <TableCell className="text-sm text-gray-600">{d.assignee}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedDispute && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="block">{selectedDispute.id}</span>
                    <span className="block text-sm font-normal text-gray-500">
                      {selectedDispute.customerName}
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status Badges Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(selectedDispute.status)}
                  {getPriorityBadge(selectedDispute.priority)}
                  {getReasonBadge(selectedDispute.reason)}
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Original Amount</p>
                    <p className="text-sm font-medium mt-1">
                      {formatCurrency(selectedDispute.originalAmount)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Disputed Amount</p>
                    <p className="text-sm font-medium mt-1 text-red-600">
                      {formatCurrency(selectedDispute.disputeAmount)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Reason</p>
                    <p className="text-sm font-medium mt-1">{selectedDispute.reason}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Priority</p>
                    <p className="text-sm font-medium mt-1">{selectedDispute.priority}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-sm font-medium mt-1">{selectedDispute.status}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Created Date</p>
                    <p className="text-sm font-medium mt-1">{selectedDispute.createdDate}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Due Date</p>
                    <p className="text-sm font-medium mt-1">{selectedDispute.dueDate}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Assignee</p>
                    <p className="text-sm font-medium mt-1">{selectedDispute.assignee}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Activity Timeline</h3>
                  <div className="relative pl-6 space-y-4">
                    {/* Vertical line */}
                    <div className="absolute left-[9px] top-1 bottom-1 w-px bg-gray-200" />
                    {timeline.map((entry, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-6 top-1 w-[18px] h-[18px] rounded-full border-2 border-blue-400 bg-white flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                        </div>
                        <p className="text-xs font-medium text-gray-500">{entry.date}</p>
                        <p className="text-sm text-gray-700 mt-0.5">{entry.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                  >
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Escalate
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
