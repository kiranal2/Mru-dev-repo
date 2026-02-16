"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  SheetDescription,
} from "@/components/ui/sheet";
import { Workflow, Zap, Clock, DollarSign, ArrowRight, Search, ChevronRight, Bot, User, Sparkles } from "lucide-react";

type AutomationStatus = "manual" | "partial" | "automated";

interface ProcessStep {
  id: string;
  name: string;
  type: "manual" | "automated" | "review";
  duration: string;
  owner: string;
}

interface ProcessDefinition {
  id: string;
  name: string;
  department: string;
  frequency: string;
  avgDurationHours: number;
  automationStatus: AutomationStatus;
  currentSteps: ProcessStep[];
  suggestedSteps: ProcessStep[];
  automationScore: number;
  estimatedSavingsHours: number;
  estimatedCostSaving: number;
  complexity: "low" | "medium" | "high";
}

const MOCK_PROCESSES: ProcessDefinition[] = [
  {
    id: "PROC-001",
    name: "Invoice-to-Payment Matching",
    department: "Accounts Receivable",
    frequency: "Daily",
    avgDurationHours: 4.5,
    automationStatus: "partial",
    automationScore: 78,
    estimatedSavingsHours: 3.2,
    estimatedCostSaving: 48000,
    complexity: "medium",
    currentSteps: [
      { id: "s1", name: "Download bank statement", type: "manual", duration: "15 min", owner: "AR Analyst" },
      { id: "s2", name: "Match payments to invoices", type: "manual", duration: "120 min", owner: "AR Analyst" },
      { id: "s3", name: "Handle exceptions", type: "manual", duration: "60 min", owner: "AR Analyst" },
      { id: "s4", name: "Post matched payments", type: "manual", duration: "30 min", owner: "AR Analyst" },
      { id: "s5", name: "Supervisor review", type: "review", duration: "45 min", owner: "AR Manager" },
    ],
    suggestedSteps: [
      { id: "a1", name: "Auto-ingest bank feed", type: "automated", duration: "1 min", owner: "AI Agent" },
      { id: "a2", name: "AI-powered matching (95% auto)", type: "automated", duration: "2 min", owner: "AI Agent" },
      { id: "a3", name: "Review exceptions (5%)", type: "review", duration: "15 min", owner: "AR Analyst" },
      { id: "a4", name: "Auto-post matched payments", type: "automated", duration: "1 min", owner: "AI Agent" },
      { id: "a5", name: "Audit trail & notification", type: "automated", duration: "0 min", owner: "System" },
    ],
  },
  {
    id: "PROC-002",
    name: "Month-End Close Checklist",
    department: "Accounting",
    frequency: "Monthly",
    avgDurationHours: 40,
    automationStatus: "manual",
    automationScore: 62,
    estimatedSavingsHours: 24,
    estimatedCostSaving: 72000,
    complexity: "high",
    currentSteps: [
      { id: "s1", name: "Reconcile all bank accounts", type: "manual", duration: "4 hrs", owner: "Staff Accountant" },
      { id: "s2", name: "Review accruals and deferrals", type: "manual", duration: "6 hrs", owner: "Staff Accountant" },
      { id: "s3", name: "Post adjusting journal entries", type: "manual", duration: "3 hrs", owner: "Staff Accountant" },
      { id: "s4", name: "Intercompany elimination", type: "manual", duration: "8 hrs", owner: "Senior Accountant" },
      { id: "s5", name: "Prepare trial balance", type: "manual", duration: "4 hrs", owner: "Staff Accountant" },
      { id: "s6", name: "Manager review & sign-off", type: "review", duration: "6 hrs", owner: "Controller" },
      { id: "s7", name: "Generate financial statements", type: "manual", duration: "5 hrs", owner: "Senior Accountant" },
      { id: "s8", name: "CFO certification", type: "review", duration: "4 hrs", owner: "CFO" },
    ],
    suggestedSteps: [
      { id: "a1", name: "Auto-reconcile bank accounts", type: "automated", duration: "30 min", owner: "AI Agent" },
      { id: "a2", name: "AI-suggested accruals & deferrals", type: "automated", duration: "15 min", owner: "AI Agent" },
      { id: "a3", name: "Review AI suggestions", type: "review", duration: "1 hr", owner: "Staff Accountant" },
      { id: "a4", name: "Auto-post standard JEs", type: "automated", duration: "5 min", owner: "AI Agent" },
      { id: "a5", name: "Auto intercompany elimination", type: "automated", duration: "10 min", owner: "AI Agent" },
      { id: "a6", name: "Auto-generate trial balance", type: "automated", duration: "2 min", owner: "System" },
      { id: "a7", name: "Controller review (exceptions only)", type: "review", duration: "2 hrs", owner: "Controller" },
      { id: "a8", name: "Auto-generate financials + narrative", type: "automated", duration: "5 min", owner: "AI Agent" },
      { id: "a9", name: "CFO digital sign-off", type: "review", duration: "30 min", owner: "CFO" },
    ],
  },
  {
    id: "PROC-003",
    name: "Revenue Leakage Detection",
    department: "Revenue Operations",
    frequency: "Weekly",
    avgDurationHours: 8,
    automationStatus: "automated",
    automationScore: 92,
    estimatedSavingsHours: 7,
    estimatedCostSaving: 84000,
    complexity: "medium",
    currentSteps: [
      { id: "s1", name: "AI scans all transactions", type: "automated", duration: "5 min", owner: "AI Agent" },
      { id: "s2", name: "Pattern detection & scoring", type: "automated", duration: "2 min", owner: "AI Agent" },
      { id: "s3", name: "Auto-create cases for high-risk", type: "automated", duration: "1 min", owner: "AI Agent" },
      { id: "s4", name: "Analyst reviews flagged cases", type: "review", duration: "45 min", owner: "Revenue Analyst" },
      { id: "s5", name: "Generate weekly report", type: "automated", duration: "1 min", owner: "AI Agent" },
    ],
    suggestedSteps: [],
  },
  {
    id: "PROC-004",
    name: "Vendor Invoice Processing",
    department: "Accounts Payable",
    frequency: "Daily",
    avgDurationHours: 3,
    automationStatus: "manual",
    automationScore: 85,
    estimatedSavingsHours: 2.5,
    estimatedCostSaving: 37500,
    complexity: "low",
    currentSteps: [
      { id: "s1", name: "Receive invoice via email", type: "manual", duration: "N/A", owner: "AP Clerk" },
      { id: "s2", name: "Data entry into system", type: "manual", duration: "45 min", owner: "AP Clerk" },
      { id: "s3", name: "3-way match (PO/Receipt/Invoice)", type: "manual", duration: "60 min", owner: "AP Clerk" },
      { id: "s4", name: "Route for approval", type: "manual", duration: "30 min", owner: "AP Clerk" },
      { id: "s5", name: "Manager approval", type: "review", duration: "45 min", owner: "AP Manager" },
    ],
    suggestedSteps: [
      { id: "a1", name: "AI parses invoice from email", type: "automated", duration: "1 min", owner: "AI Agent" },
      { id: "a2", name: "Auto-extract & validate fields", type: "automated", duration: "30 sec", owner: "AI Agent" },
      { id: "a3", name: "Auto 3-way match", type: "automated", duration: "1 min", owner: "AI Agent" },
      { id: "a4", name: "Auto-route based on amount rules", type: "automated", duration: "0 min", owner: "System" },
      { id: "a5", name: "Review exceptions only", type: "review", duration: "10 min", owner: "AP Clerk" },
    ],
  },
  {
    id: "PROC-005",
    name: "SaaS Subscription Renewal Review",
    department: "Procurement",
    frequency: "Monthly",
    avgDurationHours: 6,
    automationStatus: "manual",
    automationScore: 71,
    estimatedSavingsHours: 4,
    estimatedCostSaving: 24000,
    complexity: "medium",
    currentSteps: [
      { id: "s1", name: "Pull list of upcoming renewals", type: "manual", duration: "30 min", owner: "Procurement" },
      { id: "s2", name: "Review usage vs. contract", type: "manual", duration: "120 min", owner: "Procurement" },
      { id: "s3", name: "Negotiate with vendors", type: "manual", duration: "120 min", owner: "Procurement" },
      { id: "s4", name: "Finance approval", type: "review", duration: "60 min", owner: "Finance Manager" },
      { id: "s5", name: "Process renewal/cancellation", type: "manual", duration: "30 min", owner: "Procurement" },
    ],
    suggestedSteps: [
      { id: "a1", name: "Auto-flag renewals 90 days out", type: "automated", duration: "0 min", owner: "System" },
      { id: "a2", name: "AI usage analysis & recommendation", type: "automated", duration: "2 min", owner: "AI Agent" },
      { id: "a3", name: "Review AI recommendations", type: "review", duration: "30 min", owner: "Procurement" },
      { id: "a4", name: "Auto-route for approval", type: "automated", duration: "0 min", owner: "System" },
      { id: "a5", name: "One-click renewal processing", type: "manual", duration: "5 min", owner: "Procurement" },
    ],
  },
];

function statusColor(s: AutomationStatus) {
  return s === "automated" ? "bg-green-100 text-green-800 border-green-200"
    : s === "partial" ? "bg-amber-100 text-amber-800 border-amber-200"
    : "bg-red-100 text-red-800 border-red-200";
}

function complexityBadge(c: string) {
  return c === "high" ? "destructive" as const : c === "medium" ? "secondary" as const : "outline" as const;
}

export default function ProcessToAutomationPage() {
  const [search, setSearch] = useState("");
  const [selectedProcess, setSelectedProcess] = useState<ProcessDefinition | null>(null);

  const filtered = MOCK_PROCESSES.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.department.toLowerCase().includes(search.toLowerCase())
  );

  const totalSavings = MOCK_PROCESSES.reduce((s, p) => s + p.estimatedCostSaving, 0);
  const totalHoursSaved = MOCK_PROCESSES.reduce((s, p) => s + p.estimatedSavingsHours, 0);
  const avgScore = Math.round(MOCK_PROCESSES.reduce((s, p) => s + p.automationScore, 0) / MOCK_PROCESSES.length);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Process-to-Automation</h1>
          <p className="text-sm text-muted-foreground mt-1">Convert manual processes into AI-automated workflows</p>
        </div>
        <Button><Workflow className="w-4 h-4 mr-2" /> Add Process</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 stagger-children">
        <Card className="card-interactive">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50"><Workflow className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{MOCK_PROCESSES.length}</p>
                <p className="text-xs text-muted-foreground">Total Processes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50"><Zap className="w-5 h-5 text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold">{avgScore}%</p>
                <p className="text-xs text-muted-foreground">Avg Automation Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50"><Clock className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{totalHoursSaved.toFixed(0)}h</p>
                <p className="text-xs text-muted-foreground">Hours Saved / Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
              <div>
                <p className="text-2xl font-bold">${(totalSavings / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Annual Savings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search processes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Process Table */}
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Process</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Automation Score</TableHead>
                <TableHead>Complexity</TableHead>
                <TableHead>Savings</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelectedProcess(p)}>
                  <TableCell>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.currentSteps.length} steps &middot; ~{p.avgDurationHours}h avg</p>
                  </TableCell>
                  <TableCell className="text-sm">{p.department}</TableCell>
                  <TableCell className="text-sm">{p.frequency}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor(p.automationStatus)}`}>
                      {p.automationStatus}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p.automationScore >= 80 ? "bg-green-500" : p.automationScore >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${p.automationScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{p.automationScore}%</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={complexityBadge(p.complexity)}>{p.complexity}</Badge></TableCell>
                  <TableCell className="text-sm font-medium text-green-700">${(p.estimatedCostSaving / 1000).toFixed(0)}K/yr</TableCell>
                  <TableCell><ChevronRight className="w-4 h-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Process Detail Sheet */}
      <Sheet open={!!selectedProcess} onOpenChange={(open) => !open && setSelectedProcess(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          {selectedProcess && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${statusColor(selectedProcess.automationStatus)}`}>
                    {selectedProcess.automationStatus}
                  </span>
                  <Badge variant={complexityBadge(selectedProcess.complexity)}>{selectedProcess.complexity} complexity</Badge>
                </div>
                <SheetTitle>{selectedProcess.name}</SheetTitle>
                <SheetDescription>{selectedProcess.department} &middot; {selectedProcess.frequency} &middot; ~{selectedProcess.avgDurationHours}h per cycle</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Savings Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-blue-700">{selectedProcess.automationScore}%</p>
                    <p className="text-xs text-blue-600">Automation Score</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-green-700">{selectedProcess.estimatedSavingsHours}h</p>
                    <p className="text-xs text-green-600">Hours Saved/Cycle</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-emerald-700">${(selectedProcess.estimatedCostSaving / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-emerald-600">Annual Savings</p>
                  </div>
                </div>

                {/* Side by side: Current vs Suggested */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" /> Current (Manual)
                    </h3>
                    <div className="space-y-2">
                      {selectedProcess.currentSteps.map((step, i) => (
                        <div key={step.id} className="flex items-start gap-2 text-sm">
                          <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">{i + 1}</span>
                          <div>
                            <p className="font-medium">{step.name}</p>
                            <p className="text-xs text-muted-foreground">{step.duration} &middot; {step.owner}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-purple-600" /> AI-Automated
                    </h3>
                    {selectedProcess.suggestedSteps.length > 0 ? (
                      <div className="space-y-2">
                        {selectedProcess.suggestedSteps.map((step, i) => (
                          <div key={step.id} className="flex items-start gap-2 text-sm">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium shrink-0 mt-0.5 ${step.type === "automated" ? "bg-purple-100 text-purple-700" : step.type === "review" ? "bg-amber-100 text-amber-700" : "bg-gray-200 text-gray-600"}`}>
                              {i + 1}
                            </span>
                            <div>
                              <p className="font-medium">{step.name}</p>
                              <p className="text-xs text-muted-foreground">{step.duration} &middot; {step.owner}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-green-600 bg-green-50 rounded-lg p-3">
                        This process is already fully automated.
                      </div>
                    )}
                  </div>
                </div>

                {/* Action */}
                {selectedProcess.automationStatus !== "automated" && (
                  <Button className="w-full">
                    <Sparkles className="w-4 h-4 mr-2" /> Automate This Process
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
