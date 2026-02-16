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
  GitBranch,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  ArrowRight,
  Users,
  Zap,
  Settings,
} from "lucide-react";

interface WorkflowStep {
  id: string;
  name: string;
  type: "trigger" | "action" | "condition" | "approval" | "notification";
  status: "active" | "inactive";
  description: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  category: "Finance" | "Operations" | "Compliance" | "Custom";
  status: "Active" | "Draft" | "Paused";
  trigger: string;
  steps: WorkflowStep[];
  runsToday: number;
  runsTotal: number;
  successRate: number;
  lastRun: string;
  createdBy: string;
  createdDate: string;
  approvers: string[];
}

const MOCK_WORKFLOWS: Workflow[] = [
  {
    id: "WF-001",
    name: "Invoice Approval Routing",
    description: "Auto-route vendor invoices to appropriate approver based on amount threshold and cost center",
    category: "Finance",
    status: "Active",
    trigger: "New invoice uploaded via OCR",
    steps: [
      { id: "s1", name: "OCR Extraction", type: "trigger", status: "active", description: "Extract invoice data from uploaded document" },
      { id: "s2", name: "Vendor Validation", type: "action", status: "active", description: "Match vendor against master data" },
      { id: "s3", name: "Amount Check", type: "condition", status: "active", description: "Route based on invoice amount threshold" },
      { id: "s4", name: "Manager Approval", type: "approval", status: "active", description: "Send to cost center manager for approval (< $10K)" },
      { id: "s5", name: "VP Approval", type: "approval", status: "active", description: "Escalate to VP for amounts ≥ $10K" },
      { id: "s6", name: "Post to AP", type: "action", status: "active", description: "Create AP voucher in subledger" },
      { id: "s7", name: "Notify Requester", type: "notification", status: "active", description: "Send approval confirmation email" },
    ],
    runsToday: 23,
    runsTotal: 4521,
    successRate: 98.2,
    lastRun: "2026-02-16 02:45 PM",
    createdBy: "AP Manager",
    createdDate: "2025-10-15",
    approvers: ["Cost Center Manager", "VP Finance"],
  },
  {
    id: "WF-002",
    name: "Month-End Close Orchestration",
    description: "Orchestrate the full month-end close process with dependencies, validations, and checkpoints",
    category: "Finance",
    status: "Active",
    trigger: "Calendar trigger: Last business day of month",
    steps: [
      { id: "s1", name: "Pre-Close Checks", type: "action", status: "active", description: "Validate all subledgers are current" },
      { id: "s2", name: "Subledger Close", type: "action", status: "active", description: "Close AR, AP, and FA subledgers" },
      { id: "s3", name: "Accrual Generation", type: "action", status: "active", description: "Generate automated accrual entries" },
      { id: "s4", name: "IC Elimination", type: "action", status: "active", description: "Run intercompany eliminations" },
      { id: "s5", name: "Controller Review", type: "approval", status: "active", description: "Controller reviews TB and variance report" },
      { id: "s6", name: "CFO Sign-off", type: "approval", status: "active", description: "CFO final sign-off on close package" },
      { id: "s7", name: "Period Lock", type: "action", status: "active", description: "Lock period in GL" },
    ],
    runsToday: 0,
    runsTotal: 14,
    successRate: 100,
    lastRun: "2026-01-31 11:58 PM",
    createdBy: "Controller",
    createdDate: "2025-09-01",
    approvers: ["Controller", "CFO"],
  },
  {
    id: "WF-003",
    name: "Cash Application Exception Handler",
    description: "Automatically handle cash application exceptions based on predefined rules and AI suggestions",
    category: "Operations",
    status: "Active",
    trigger: "New unmatched payment detected",
    steps: [
      { id: "s1", name: "AI Match Attempt", type: "action", status: "active", description: "Run AI matching against open invoices" },
      { id: "s2", name: "Confidence Check", type: "condition", status: "active", description: "Check AI confidence score ≥ 95%" },
      { id: "s3", name: "Auto-Apply", type: "action", status: "active", description: "Automatically apply if high confidence" },
      { id: "s4", name: "Route to Analyst", type: "action", status: "active", description: "Send to AR analyst for manual review" },
      { id: "s5", name: "Notify Customer", type: "notification", status: "active", description: "Request remittance details from customer" },
    ],
    runsToday: 156,
    runsTotal: 28340,
    successRate: 94.7,
    lastRun: "2026-02-16 03:12 PM",
    createdBy: "AR Manager",
    createdDate: "2025-11-20",
    approvers: ["AR Manager"],
  },
  {
    id: "WF-004",
    name: "SOX Compliance Validation",
    description: "Automated SOX control testing for key financial processes",
    category: "Compliance",
    status: "Active",
    trigger: "Weekly schedule (Fridays at 6 PM)",
    steps: [
      { id: "s1", name: "Extract Control Data", type: "action", status: "active", description: "Pull control execution evidence" },
      { id: "s2", name: "Test Controls", type: "action", status: "active", description: "Run automated control tests" },
      { id: "s3", name: "Exception Detection", type: "condition", status: "active", description: "Flag any control failures" },
      { id: "s4", name: "Generate Report", type: "action", status: "active", description: "Create compliance status report" },
      { id: "s5", name: "Audit Committee Alert", type: "notification", status: "active", description: "Notify audit committee of any exceptions" },
    ],
    runsToday: 0,
    runsTotal: 52,
    successRate: 100,
    lastRun: "2026-02-14 06:00 PM",
    createdBy: "Internal Audit",
    createdDate: "2025-08-15",
    approvers: ["Internal Audit Director"],
  },
  {
    id: "WF-005",
    name: "Revenue Recognition Automation",
    description: "Automate ASC 606 revenue recognition for new contracts and modifications",
    category: "Finance",
    status: "Draft",
    trigger: "New contract or modification in CRM",
    steps: [
      { id: "s1", name: "Contract Extraction", type: "trigger", status: "active", description: "Pull contract terms from CRM" },
      { id: "s2", name: "Performance Obligations", type: "action", status: "active", description: "Identify and allocate performance obligations" },
      { id: "s3", name: "Rev Schedule", type: "action", status: "inactive", description: "Generate revenue recognition schedule" },
      { id: "s4", name: "Journal Entries", type: "action", status: "inactive", description: "Create automated JE for recognition" },
    ],
    runsToday: 0,
    runsTotal: 0,
    successRate: 0,
    lastRun: "Never",
    createdBy: "Revenue Analyst",
    createdDate: "2026-02-10",
    approvers: ["Revenue Manager", "Controller"],
  },
  {
    id: "WF-006",
    name: "Vendor Onboarding",
    description: "End-to-end vendor onboarding with compliance checks and master data setup",
    category: "Operations",
    status: "Paused",
    trigger: "New vendor request submitted",
    steps: [
      { id: "s1", name: "Request Intake", type: "trigger", status: "active", description: "Capture vendor details from request form" },
      { id: "s2", name: "Compliance Check", type: "action", status: "active", description: "Run OFAC, sanctions, and credit checks" },
      { id: "s3", name: "Tax Validation", type: "action", status: "active", description: "Validate W-9 / W-8BEN tax forms" },
      { id: "s4", name: "Procurement Approval", type: "approval", status: "active", description: "Procurement manager approval" },
      { id: "s5", name: "Master Data Setup", type: "action", status: "inactive", description: "Create vendor in ERP master data" },
    ],
    runsToday: 0,
    runsTotal: 87,
    successRate: 91.5,
    lastRun: "2026-02-10 10:30 AM",
    createdBy: "Procurement Lead",
    createdDate: "2025-12-05",
    approvers: ["Procurement Manager"],
  },
];

export default function WorkflowPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const filtered = MOCK_WORKFLOWS.filter((w) => {
    const matchSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === "all" || w.category === categoryFilter;
    const matchStatus = statusFilter === "all" || w.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const activeCount = MOCK_WORKFLOWS.filter((w) => w.status === "Active").length;
  const totalRunsToday = MOCK_WORKFLOWS.reduce((sum, w) => sum + w.runsToday, 0);
  const avgSuccess = MOCK_WORKFLOWS.filter((w) => w.runsTotal > 0).reduce((sum, w) => sum + w.successRate, 0) / MOCK_WORKFLOWS.filter((w) => w.runsTotal > 0).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>;
      case "Draft":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Draft</Badge>;
      case "Paused":
        return <Badge className="bg-gray-50 text-gray-500 border-gray-200">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStepTypeColor = (type: string) => {
    switch (type) {
      case "trigger":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "action":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "condition":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "approval":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "notification":
        return "bg-pink-100 text-pink-700 border-pink-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow</h1>
          <p className="text-sm text-gray-500 mt-1">Design and manage automation workflows with visual builder</p>
        </div>
        <Button className="bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Workflow
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 stagger-children">
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Workflows</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{MOCK_WORKFLOWS.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Runs Today</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{totalRunsToday}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Success Rate</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{avgSuccess.toFixed(1)}%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Operations">Operations</SelectItem>
            <SelectItem value="Compliance">Compliance</SelectItem>
            <SelectItem value="Custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((w) => (
          <Card
            key={w.id}
            className="card-interactive cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedWorkflow(w)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{w.name}</h3>
                    {getStatusBadge(w.status)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{w.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
                {w.steps.slice(0, 5).map((step, i) => (
                  <React.Fragment key={step.id}>
                    <div className={`px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap border ${getStepTypeColor(step.type)}`}>
                      {step.name}
                    </div>
                    {i < Math.min(w.steps.length, 5) - 1 && (
                      <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                    )}
                  </React.Fragment>
                ))}
                {w.steps.length > 5 && (
                  <span className="text-xs text-gray-400 ml-1">+{w.steps.length - 5} more</span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Play className="w-3.5 h-3.5" />
                    {w.runsToday} today
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    {w.runsTotal.toLocaleString()} total
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">{w.category}</Badge>
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={!!selectedWorkflow} onOpenChange={() => setSelectedWorkflow(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedWorkflow && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-blue-600" />
                  {selectedWorkflow.name}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedWorkflow.status)}
                  <Badge variant="outline">{selectedWorkflow.category}</Badge>
                </div>

                <p className="text-sm text-gray-600">{selectedWorkflow.description}</p>

                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium">Trigger</p>
                  <p className="text-sm text-blue-800 mt-1">{selectedWorkflow.trigger}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Runs Today</p>
                    <p className="text-sm font-medium mt-1">{selectedWorkflow.runsToday}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Total Runs</p>
                    <p className="text-sm font-medium mt-1">{selectedWorkflow.runsTotal.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Success Rate</p>
                    <p className="text-sm font-medium mt-1">{selectedWorkflow.successRate}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Last Run</p>
                    <p className="text-sm font-medium mt-1">{selectedWorkflow.lastRun}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Workflow Steps</h3>
                  <div className="space-y-2">
                    {selectedWorkflow.steps.map((step, i) => (
                      <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500 flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{step.name}</span>
                            <Badge className={`text-[10px] ${getStepTypeColor(step.type)}`}>{step.type}</Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Approvers</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkflow.approvers.map((a) => (
                      <Badge key={a} variant="outline" className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-gray-50 text-sm text-gray-600">
                  <p>Created by <span className="font-medium">{selectedWorkflow.createdBy}</span> on {selectedWorkflow.createdDate}</p>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Workflow
                  </Button>
                  <Button variant="outline" className="flex-1">
                    {selectedWorkflow.status === "Active" ? (
                      <><Pause className="w-4 h-4 mr-2" />Pause</>
                    ) : (
                      <><Play className="w-4 h-4 mr-2" />Activate</>
                    )}
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
