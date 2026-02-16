"use client";

import React, { useState } from "react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ListOrdered,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowDown,
  Play,
  Loader2,
  Link2,
} from "lucide-react";

interface TaskStep {
  id: string;
  name: string;
  status: "Completed" | "Running" | "Pending" | "Failed" | "Skipped";
  duration: string;
  dependsOn: string[];
}

interface TaskFlow {
  id: string;
  name: string;
  description: string;
  status: "Completed" | "Running" | "Scheduled" | "Failed";
  priority: "High" | "Medium" | "Low";
  steps: TaskStep[];
  completedSteps: number;
  totalSteps: number;
  startTime: string;
  estimatedEnd: string;
  owner: string;
  category: string;
}

const MOCK_TASKFLOWS: TaskFlow[] = [
  {
    id: "TF-101",
    name: "February Month-End Close",
    description: "Sequential close tasks for February 2026 with dependency tracking",
    status: "Running",
    priority: "High",
    steps: [
      { id: "t1", name: "Cut-off verification", status: "Completed", duration: "15m", dependsOn: [] },
      { id: "t2", name: "Subledger reconciliation", status: "Completed", duration: "45m", dependsOn: ["t1"] },
      { id: "t3", name: "Accrual posting", status: "Completed", duration: "20m", dependsOn: ["t2"] },
      { id: "t4", name: "Intercompany matching", status: "Running", duration: "30m...", dependsOn: ["t3"] },
      { id: "t5", name: "IC eliminations", status: "Pending", duration: "-", dependsOn: ["t4"] },
      { id: "t6", name: "Trial balance review", status: "Pending", duration: "-", dependsOn: ["t5"] },
      { id: "t7", name: "Variance analysis", status: "Pending", duration: "-", dependsOn: ["t6"] },
      { id: "t8", name: "Controller sign-off", status: "Pending", duration: "-", dependsOn: ["t7"] },
    ],
    completedSteps: 3,
    totalSteps: 8,
    startTime: "2026-02-16 05:00 PM",
    estimatedEnd: "2026-02-16 09:30 PM",
    owner: "Mike Johnson",
    category: "Month-End Close",
  },
  {
    id: "TF-102",
    name: "Q4 Revenue Audit Prep",
    description: "Prepare all revenue documentation and schedules for Q4 external audit",
    status: "Running",
    priority: "High",
    steps: [
      { id: "t1", name: "Extract contract data", status: "Completed", duration: "1h", dependsOn: [] },
      { id: "t2", name: "Generate rev schedules", status: "Completed", duration: "2h", dependsOn: ["t1"] },
      { id: "t3", name: "Compile support docs", status: "Running", duration: "3h...", dependsOn: ["t1"] },
      { id: "t4", name: "Variance commentary", status: "Pending", duration: "-", dependsOn: ["t2"] },
      { id: "t5", name: "Manager review", status: "Pending", duration: "-", dependsOn: ["t3", "t4"] },
      { id: "t6", name: "Upload to audit portal", status: "Pending", duration: "-", dependsOn: ["t5"] },
    ],
    completedSteps: 2,
    totalSteps: 6,
    startTime: "2026-02-15 09:00 AM",
    estimatedEnd: "2026-02-17 05:00 PM",
    owner: "Lisa Wang",
    category: "Audit",
  },
  {
    id: "TF-103",
    name: "Daily Cash Position Report",
    description: "Collect, validate, and publish daily cash position across all bank accounts",
    status: "Completed",
    priority: "Medium",
    steps: [
      { id: "t1", name: "Pull bank balances", status: "Completed", duration: "5m", dependsOn: [] },
      { id: "t2", name: "Reconcile intraday", status: "Completed", duration: "10m", dependsOn: ["t1"] },
      { id: "t3", name: "Calculate net position", status: "Completed", duration: "2m", dependsOn: ["t2"] },
      { id: "t4", name: "Generate report", status: "Completed", duration: "3m", dependsOn: ["t3"] },
      { id: "t5", name: "Distribute to Treasury", status: "Completed", duration: "1m", dependsOn: ["t4"] },
    ],
    completedSteps: 5,
    totalSteps: 5,
    startTime: "2026-02-16 07:00 AM",
    estimatedEnd: "2026-02-16 07:21 AM",
    owner: "Treasury Team",
    category: "Treasury",
  },
  {
    id: "TF-104",
    name: "Vendor Payment Batch Processing",
    description: "Process weekly vendor payment batch with approval gates and bank submission",
    status: "Scheduled",
    priority: "Medium",
    steps: [
      { id: "t1", name: "Select eligible invoices", status: "Pending", duration: "-", dependsOn: [] },
      { id: "t2", name: "Apply payment terms", status: "Pending", duration: "-", dependsOn: ["t1"] },
      { id: "t3", name: "Duplicate check", status: "Pending", duration: "-", dependsOn: ["t2"] },
      { id: "t4", name: "Manager approval", status: "Pending", duration: "-", dependsOn: ["t3"] },
      { id: "t5", name: "Generate payment file", status: "Pending", duration: "-", dependsOn: ["t4"] },
      { id: "t6", name: "Submit to bank", status: "Pending", duration: "-", dependsOn: ["t5"] },
      { id: "t7", name: "Confirm execution", status: "Pending", duration: "-", dependsOn: ["t6"] },
    ],
    completedSteps: 0,
    totalSteps: 7,
    startTime: "2026-02-17 10:00 AM",
    estimatedEnd: "2026-02-17 02:00 PM",
    owner: "AP Team",
    category: "Accounts Payable",
  },
  {
    id: "TF-105",
    name: "Annual Budget Upload",
    description: "Import, validate, and load approved FY2027 budget into planning system",
    status: "Failed",
    priority: "Low",
    steps: [
      { id: "t1", name: "Parse Excel workbook", status: "Completed", duration: "8m", dependsOn: [] },
      { id: "t2", name: "Validate account codes", status: "Completed", duration: "12m", dependsOn: ["t1"] },
      { id: "t3", name: "Cross-check totals", status: "Failed", duration: "5m", dependsOn: ["t2"] },
      { id: "t4", name: "Load to planning", status: "Skipped", duration: "-", dependsOn: ["t3"] },
      { id: "t5", name: "Publish to reporting", status: "Skipped", duration: "-", dependsOn: ["t4"] },
    ],
    completedSteps: 2,
    totalSteps: 5,
    startTime: "2026-02-14 03:00 PM",
    estimatedEnd: "Failed",
    owner: "FP&A Team",
    category: "Planning",
  },
];

export default function TaskFlowPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTaskFlow, setSelectedTaskFlow] = useState<TaskFlow | null>(null);

  const filtered = MOCK_TASKFLOWS.filter((tf) => {
    const matchSearch =
      tf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tf.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || tf.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const runningCount = MOCK_TASKFLOWS.filter((tf) => tf.status === "Running").length;
  const completedCount = MOCK_TASKFLOWS.filter((tf) => tf.status === "Completed").length;
  const failedCount = MOCK_TASKFLOWS.filter((tf) => tf.status === "Failed").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>;
      case "Running":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Running</Badge>;
      case "Scheduled":
        return <Badge className="bg-gray-50 text-gray-500 border-gray-200">Scheduled</Badge>;
      case "Failed":
        return <Badge className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "Running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "Pending":
        return <Clock className="w-4 h-4 text-gray-300" />;
      case "Failed":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "Skipped":
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
          <p className="text-sm text-gray-500 mt-1">Sequential task chains with dependencies and progress tracking</p>
        </div>
        <Button className="bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
          <Plus className="w-4 h-4 mr-2" />
          New TaskFlow
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 stagger-children">
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Flows</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{MOCK_TASKFLOWS.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <ListOrdered className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Running</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{runningCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-blue-600" />
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
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search task flows..."
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
            <SelectItem value="Running">Running</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Scheduled">Scheduled</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filtered.map((tf) => (
          <Card
            key={tf.id}
            className="card-interactive cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedTaskFlow(tf)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-gray-400">{tf.id}</span>
                    <h3 className="font-semibold text-gray-900">{tf.name}</h3>
                    {getStatusBadge(tf.status)}
                    <Badge variant="outline" className="text-xs">{tf.priority}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{tf.description}</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{tf.owner}</p>
                  <p className="text-xs">{tf.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      tf.status === "Failed" ? "bg-red-400" : "bg-emerald-400"
                    }`}
                    style={{ width: `${(tf.completedSteps / tf.totalSteps) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {tf.completedSteps}/{tf.totalSteps}
                </span>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {tf.steps.map((step, i) => (
                  <React.Fragment key={step.id}>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {getStepIcon(step.status)}
                      <span className="text-[11px] text-gray-500 whitespace-nowrap">{step.name}</span>
                    </div>
                    {i < tf.steps.length - 1 && (
                      <ArrowDown className="w-3 h-3 text-gray-300 flex-shrink-0 rotate-[-90deg]" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={!!selectedTaskFlow} onOpenChange={() => setSelectedTaskFlow(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedTaskFlow && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-blue-600" />
                  {selectedTaskFlow.name}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedTaskFlow.status)}
                  <Badge variant="outline">{selectedTaskFlow.priority}</Badge>
                  <Badge variant="outline">{selectedTaskFlow.category}</Badge>
                </div>

                <p className="text-sm text-gray-600">{selectedTaskFlow.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Owner</p>
                    <p className="text-sm font-medium mt-1">{selectedTaskFlow.owner}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Progress</p>
                    <p className="text-sm font-medium mt-1">{selectedTaskFlow.completedSteps} / {selectedTaskFlow.totalSteps} steps</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Started</p>
                    <p className="text-sm font-medium mt-1">{selectedTaskFlow.startTime}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Est. Completion</p>
                    <p className="text-sm font-medium mt-1">{selectedTaskFlow.estimatedEnd}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Task Steps</h3>
                  <div className="space-y-1">
                    {selectedTaskFlow.steps.map((step, i) => (
                      <div key={step.id}>
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            {getStepIcon(step.status)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{step.name}</p>
                              {step.dependsOn.length > 0 && (
                                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                  <Link2 className="w-3 h-3" />
                                  Depends on: {step.dependsOn.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono text-gray-500">{step.duration}</span>
                            <p className="text-[10px] text-gray-400">{step.status}</p>
                          </div>
                        </div>
                        {i < selectedTaskFlow.steps.length - 1 && (
                          <div className="flex justify-center py-0.5">
                            <ArrowDown className="w-3.5 h-3.5 text-gray-300" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {selectedTaskFlow.status === "Failed" ? (
                    <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                      <Play className="w-4 h-4 mr-2" />
                      Retry Failed Step
                    </Button>
                  ) : selectedTaskFlow.status === "Running" ? (
                    <Button className="flex-1 bg-[#1B2A41] hover:bg-[#2d4a6f] text-white" disabled>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running...
                    </Button>
                  ) : selectedTaskFlow.status === "Scheduled" ? (
                    <Button className="flex-1 bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
                      <Play className="w-4 h-4 mr-2" />
                      Run Now
                    </Button>
                  ) : (
                    <Button className="flex-1" variant="outline">
                      <Play className="w-4 h-4 mr-2" />
                      Re-run
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
