"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Play,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Activity,
  Timer,
  Zap,
} from "lucide-react";

interface RunRecord {
  id: string;
  templateName: string;
  type: "Import" | "Export" | "Transform" | "Reconciliation" | "Workflow";
  status: "Completed" | "Failed" | "Running" | "Queued";
  startTime: string;
  duration: string;
  recordsProcessed: number;
  recordsFailed: number;
  triggeredBy: string;
  errorMessage?: string;
  steps: { name: string; status: string; duration: string }[];
}

const MOCK_RUNS: RunRecord[] = [
  {
    id: "RUN-2401",
    templateName: "Bank Statement Import",
    type: "Import",
    status: "Completed",
    startTime: "2026-02-16 06:00 AM",
    duration: "2m 34s",
    recordsProcessed: 1847,
    recordsFailed: 0,
    triggeredBy: "Scheduled",
    steps: [
      { name: "Connect to SFTP", status: "Completed", duration: "3s" },
      { name: "Download files", status: "Completed", duration: "12s" },
      { name: "Parse CSV", status: "Completed", duration: "45s" },
      { name: "Validate records", status: "Completed", duration: "38s" },
      { name: "Load to staging", status: "Completed", duration: "56s" },
    ],
  },
  {
    id: "RUN-2400",
    templateName: "GL Journal Transform",
    type: "Transform",
    status: "Completed",
    startTime: "2026-02-16 12:00 PM",
    duration: "4m 12s",
    recordsProcessed: 3421,
    recordsFailed: 3,
    triggeredBy: "Scheduled",
    steps: [
      { name: "Extract from SAP", status: "Completed", duration: "1m 2s" },
      { name: "Apply mappings", status: "Completed", duration: "1m 30s" },
      { name: "Validate output", status: "Completed", duration: "45s" },
      { name: "Load to GL", status: "Completed", duration: "55s" },
    ],
  },
  {
    id: "RUN-2399",
    templateName: "Vendor Invoice Import",
    type: "Import",
    status: "Running",
    startTime: "2026-02-16 02:30 PM",
    duration: "1m 45s...",
    recordsProcessed: 234,
    recordsFailed: 0,
    triggeredBy: "Scheduled",
    steps: [
      { name: "Fetch OCR output", status: "Completed", duration: "15s" },
      { name: "Parse JSON", status: "Completed", duration: "8s" },
      { name: "Fuzzy match vendors", status: "Running", duration: "1m 22s..." },
      { name: "Load to AP", status: "Queued", duration: "-" },
    ],
  },
  {
    id: "RUN-2398",
    templateName: "AR Subledger Reconciliation",
    type: "Reconciliation",
    status: "Completed",
    startTime: "2026-02-16 01:00 PM",
    duration: "8m 56s",
    recordsProcessed: 5612,
    recordsFailed: 0,
    triggeredBy: "Manual - John Smith",
    steps: [
      { name: "Extract subledger", status: "Completed", duration: "1m 20s" },
      { name: "Extract GL", status: "Completed", duration: "1m 15s" },
      { name: "Auto-match", status: "Completed", duration: "4m 30s" },
      { name: "Generate exceptions", status: "Completed", duration: "1m 51s" },
    ],
  },
  {
    id: "RUN-2397",
    templateName: "Revenue Recognition Export",
    type: "Export",
    status: "Failed",
    startTime: "2026-02-16 11:00 AM",
    duration: "0m 48s",
    recordsProcessed: 0,
    recordsFailed: 0,
    triggeredBy: "Manual - Sarah Chen",
    errorMessage: "Connection timeout: SEC reporting endpoint unreachable after 30s retry",
    steps: [
      { name: "Query revenue engine", status: "Completed", duration: "22s" },
      { name: "Format Excel output", status: "Completed", duration: "10s" },
      { name: "Upload to endpoint", status: "Failed", duration: "16s" },
    ],
  },
  {
    id: "RUN-2396",
    templateName: "Month-End Close Workflow",
    type: "Workflow",
    status: "Completed",
    startTime: "2026-02-15 06:00 PM",
    duration: "45m 22s",
    recordsProcessed: 12840,
    recordsFailed: 12,
    triggeredBy: "Scheduled",
    steps: [
      { name: "Pre-close validations", status: "Completed", duration: "5m 10s" },
      { name: "Subledger close", status: "Completed", duration: "12m 30s" },
      { name: "Intercompany elimination", status: "Completed", duration: "8m 45s" },
      { name: "Trial balance generation", status: "Completed", duration: "6m 20s" },
      { name: "Variance analysis", status: "Completed", duration: "12m 37s" },
    ],
  },
  {
    id: "RUN-2395",
    templateName: "Intercompany Elimination",
    type: "Transform",
    status: "Queued",
    startTime: "Pending",
    duration: "-",
    recordsProcessed: 0,
    recordsFailed: 0,
    triggeredBy: "Scheduled",
    steps: [],
  },
];

export default function AllRunsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedRun, setSelectedRun] = useState<RunRecord | null>(null);

  const filtered = MOCK_RUNS.filter((r) => {
    const matchSearch =
      r.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchType = typeFilter === "all" || r.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const completedCount = MOCK_RUNS.filter((r) => r.status === "Completed").length;
  const failedCount = MOCK_RUNS.filter((r) => r.status === "Failed").length;
  const runningCount = MOCK_RUNS.filter((r) => r.status === "Running").length;
  const totalRecords = MOCK_RUNS.reduce((sum, r) => sum + r.recordsProcessed, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "Failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "Running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "Queued":
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>;
      case "Failed":
        return <Badge className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      case "Running":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Running</Badge>;
      case "Queued":
        return <Badge className="bg-gray-50 text-gray-500 border-gray-200">Queued</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Runs</h1>
        <p className="text-sm text-gray-500 mt-1">Execution history across all automation types</p>
      </div>

      <div className="grid grid-cols-4 gap-4 stagger-children">
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Runs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{MOCK_RUNS.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</p>
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Failed</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{failedCount}</p>
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Records Processed</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{totalRecords.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search runs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
            <SelectItem value="Running">Running</SelectItem>
            <SelectItem value="Queued">Queued</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Import">Import</SelectItem>
            <SelectItem value="Export">Export</SelectItem>
            <SelectItem value="Transform">Transform</SelectItem>
            <SelectItem value="Reconciliation">Reconciliation</SelectItem>
            <SelectItem value="Workflow">Workflow</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Run ID</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Records</TableHead>
              <TableHead>Triggered By</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow
                key={r.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedRun(r)}
              >
                <TableCell className="font-mono text-sm">{r.id}</TableCell>
                <TableCell className="font-medium text-gray-900">{r.templateName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{r.type}</Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">{r.startTime}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Timer className="w-3.5 h-3.5" />
                    {r.duration}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{r.recordsProcessed.toLocaleString()}</span>
                  {r.recordsFailed > 0 && (
                    <span className="text-xs text-red-500 ml-1">({r.recordsFailed} failed)</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-500">{r.triggeredBy}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(r.status)}
                    {getStatusBadge(r.status)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedRun && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-blue-600" />
                  {selectedRun.id}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedRun.templateName}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{selectedRun.type}</Badge>
                    {getStatusBadge(selectedRun.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Started</p>
                    <p className="text-sm font-medium mt-1">{selectedRun.startTime}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-medium mt-1">{selectedRun.duration}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Records Processed</p>
                    <p className="text-sm font-medium mt-1">{selectedRun.recordsProcessed.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Triggered By</p>
                    <p className="text-sm font-medium mt-1">{selectedRun.triggeredBy}</p>
                  </div>
                </div>

                {selectedRun.errorMessage && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <p className="text-sm font-medium text-red-700">Error</p>
                    </div>
                    <p className="text-sm text-red-600 mt-1">{selectedRun.errorMessage}</p>
                  </div>
                )}

                {selectedRun.steps.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Execution Steps</h3>
                    <div className="space-y-2">
                      {selectedRun.steps.map((step, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(step.status)}
                            <span className="text-sm text-gray-700">{step.name}</span>
                          </div>
                          <span className="text-xs text-gray-500 font-mono">{step.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
