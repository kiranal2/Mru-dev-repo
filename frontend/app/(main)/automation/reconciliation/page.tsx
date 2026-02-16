"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { RefreshCw, CheckCircle2, AlertTriangle, Clock, Play, Settings, TrendingUp, Zap } from "lucide-react";

interface ReconConfig {
  id: string;
  name: string;
  type: "bank" | "intercompany" | "subledger" | "vendor" | "customer";
  description: string;
  schedule: "daily" | "weekly" | "monthly" | "on-demand";
  status: "active" | "paused" | "draft";
  matchingRules: string[];
  autoApproveThreshold: number;
  lastRunAt: string;
  lastRunStatus: "success" | "partial" | "failed";
  nextRunAt: string;
  autoMatchRate: number;
  avgRunDuration: string;
  totalExceptions: number;
  runHistory: { date: string; matched: number; exceptions: number; duration: string; status: string }[];
}

const MOCK_RECONS: ReconConfig[] = [
  {
    id: "RECON-001",
    name: "Bank Reconciliation — Operating",
    type: "bank",
    description: "Daily reconciliation of main operating bank account against GL cash account.",
    schedule: "daily",
    status: "active",
    matchingRules: ["Exact amount match", "Date tolerance ±2 days", "Reference number match", "Payee name fuzzy match (85%)"],
    autoApproveThreshold: 95,
    lastRunAt: "2026-02-16T06:00:00Z",
    lastRunStatus: "success",
    nextRunAt: "2026-02-17T06:00:00Z",
    autoMatchRate: 94.2,
    avgRunDuration: "3m 12s",
    totalExceptions: 7,
    runHistory: [
      { date: "2026-02-16", matched: 142, exceptions: 3, duration: "3m 08s", status: "success" },
      { date: "2026-02-15", matched: 128, exceptions: 5, duration: "2m 54s", status: "success" },
      { date: "2026-02-14", matched: 156, exceptions: 2, duration: "3m 22s", status: "success" },
      { date: "2026-02-13", matched: 134, exceptions: 8, duration: "3m 45s", status: "partial" },
      { date: "2026-02-12", matched: 119, exceptions: 4, duration: "2m 38s", status: "success" },
    ],
  },
  {
    id: "RECON-002",
    name: "Intercompany Reconciliation",
    type: "intercompany",
    description: "Monthly reconciliation of intercompany balances across all subsidiaries.",
    schedule: "monthly",
    status: "active",
    matchingRules: ["Entity pair match", "Amount match (tolerance $500)", "Currency conversion at spot rate", "Invoice reference cross-match"],
    autoApproveThreshold: 90,
    lastRunAt: "2026-02-01T08:00:00Z",
    lastRunStatus: "success",
    nextRunAt: "2026-03-01T08:00:00Z",
    autoMatchRate: 88.5,
    avgRunDuration: "12m 30s",
    totalExceptions: 14,
    runHistory: [
      { date: "2026-02-01", matched: 89, exceptions: 11, duration: "12m 10s", status: "success" },
      { date: "2026-01-01", matched: 94, exceptions: 8, duration: "11m 45s", status: "success" },
      { date: "2025-12-01", matched: 82, exceptions: 16, duration: "14m 20s", status: "partial" },
      { date: "2025-11-01", matched: 91, exceptions: 9, duration: "12m 55s", status: "success" },
    ],
  },
  {
    id: "RECON-003",
    name: "AR Subledger-to-GL",
    type: "subledger",
    description: "Weekly reconciliation of accounts receivable subledger against general ledger.",
    schedule: "weekly",
    status: "active",
    matchingRules: ["Customer account roll-up", "Aging bucket validation", "Balance comparison (tolerance $100)", "Transaction count cross-check"],
    autoApproveThreshold: 98,
    lastRunAt: "2026-02-14T07:00:00Z",
    lastRunStatus: "success",
    nextRunAt: "2026-02-21T07:00:00Z",
    autoMatchRate: 97.1,
    avgRunDuration: "5m 45s",
    totalExceptions: 3,
    runHistory: [
      { date: "2026-02-14", matched: 234, exceptions: 2, duration: "5m 30s", status: "success" },
      { date: "2026-02-07", matched: 218, exceptions: 4, duration: "5m 55s", status: "success" },
      { date: "2026-01-31", matched: 245, exceptions: 1, duration: "5m 12s", status: "success" },
    ],
  },
  {
    id: "RECON-004",
    name: "AP Subledger-to-GL",
    type: "subledger",
    description: "Weekly reconciliation of accounts payable subledger against general ledger.",
    schedule: "weekly",
    status: "active",
    matchingRules: ["Vendor account roll-up", "Aging bucket validation", "Balance comparison (tolerance $100)"],
    autoApproveThreshold: 98,
    lastRunAt: "2026-02-14T07:30:00Z",
    lastRunStatus: "partial",
    nextRunAt: "2026-02-21T07:30:00Z",
    autoMatchRate: 92.8,
    avgRunDuration: "4m 20s",
    totalExceptions: 9,
    runHistory: [
      { date: "2026-02-14", matched: 187, exceptions: 9, duration: "4m 40s", status: "partial" },
      { date: "2026-02-07", matched: 195, exceptions: 5, duration: "4m 10s", status: "success" },
      { date: "2026-01-31", matched: 201, exceptions: 3, duration: "3m 55s", status: "success" },
    ],
  },
  {
    id: "RECON-005",
    name: "Vendor Statement Reconciliation",
    type: "vendor",
    description: "Monthly reconciliation of top vendor statements against AP records.",
    schedule: "monthly",
    status: "paused",
    matchingRules: ["Invoice number match", "Amount match", "Date tolerance ±5 days"],
    autoApproveThreshold: 85,
    lastRunAt: "2026-01-15T09:00:00Z",
    lastRunStatus: "failed",
    nextRunAt: "-",
    autoMatchRate: 76.3,
    avgRunDuration: "8m 15s",
    totalExceptions: 22,
    runHistory: [
      { date: "2026-01-15", matched: 45, exceptions: 22, duration: "9m 30s", status: "failed" },
      { date: "2025-12-15", matched: 52, exceptions: 18, duration: "8m 00s", status: "partial" },
    ],
  },
  {
    id: "RECON-006",
    name: "Credit Card Reconciliation",
    type: "bank",
    description: "Daily reconciliation of corporate credit card transactions against expense reports.",
    schedule: "daily",
    status: "draft",
    matchingRules: ["Card last-4 match", "Amount exact match", "Merchant name fuzzy match (80%)"],
    autoApproveThreshold: 90,
    lastRunAt: "-",
    lastRunStatus: "success",
    nextRunAt: "-",
    autoMatchRate: 0,
    avgRunDuration: "-",
    totalExceptions: 0,
    runHistory: [],
  },
];

function typeColor(t: string) {
  const colors: Record<string, string> = {
    bank: "bg-blue-100 text-blue-800 border-blue-200",
    intercompany: "bg-purple-100 text-purple-800 border-purple-200",
    subledger: "bg-green-100 text-green-800 border-green-200",
    vendor: "bg-amber-100 text-amber-800 border-amber-200",
    customer: "bg-cyan-100 text-cyan-800 border-cyan-200",
  };
  return colors[t] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

function statusVariant(s: string): "default" | "secondary" | "outline" {
  return s === "active" ? "default" : s === "paused" ? "secondary" : "outline";
}

function runStatusIcon(s: string) {
  if (s === "success") return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
  if (s === "partial") return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
  return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
}

export default function ReconciliationPage() {
  const [selectedRecon, setSelectedRecon] = useState<ReconConfig | null>(null);

  const activeCount = MOCK_RECONS.filter((r) => r.status === "active").length;
  const avgMatchRate = MOCK_RECONS.filter((r) => r.autoMatchRate > 0).reduce((s, r) => s + r.autoMatchRate, 0) / MOCK_RECONS.filter((r) => r.autoMatchRate > 0).length;
  const totalExceptions = MOCK_RECONS.reduce((s, r) => s + r.totalExceptions, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reconciliation Automation</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure and monitor automated reconciliation processes</p>
        </div>
        <Button><RefreshCw className="w-4 h-4 mr-2" /> New Reconciliation</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 stagger-children">
        <Card className="card-interactive">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50"><RefreshCw className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{MOCK_RECONS.length}</p>
                <p className="text-xs text-muted-foreground">Total Reconciliations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50"><TrendingUp className="w-5 h-5 text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold">{avgMatchRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Avg Auto-Match Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold">{totalExceptions}</p>
                <p className="text-xs text-muted-foreground">Open Exceptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation Cards */}
      <div className="grid grid-cols-2 gap-4">
        {MOCK_RECONS.map((r) => (
          <Card key={r.id} className="card-interactive cursor-pointer" onClick={() => setSelectedRecon(r)}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{r.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                </div>
                <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${typeColor(r.type)}`}>
                  {r.type}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {r.schedule}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold">{r.autoMatchRate > 0 ? `${r.autoMatchRate}%` : "—"}</p>
                  <p className="text-[10px] text-muted-foreground">Match Rate</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{r.totalExceptions}</p>
                  <p className="text-[10px] text-muted-foreground">Exceptions</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{r.avgRunDuration}</p>
                  <p className="text-[10px] text-muted-foreground">Avg Duration</p>
                </div>
              </div>
              {r.lastRunAt !== "-" && (
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">{runStatusIcon(r.lastRunStatus)} Last run: {new Date(r.lastRunAt).toLocaleDateString()}</span>
                  {r.nextRunAt !== "-" && <span>Next: {new Date(r.nextRunAt).toLocaleDateString()}</span>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedRecon} onOpenChange={(open) => !open && setSelectedRecon(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedRecon && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${typeColor(selectedRecon.type)}`}>
                    {selectedRecon.type}
                  </span>
                  <Badge variant={statusVariant(selectedRecon.status)}>{selectedRecon.status}</Badge>
                </div>
                <SheetTitle>{selectedRecon.name}</SheetTitle>
                <SheetDescription>{selectedRecon.description}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-blue-700">{selectedRecon.autoMatchRate}%</p>
                    <p className="text-xs text-blue-600">Match Rate</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-amber-700">{selectedRecon.autoApproveThreshold}%</p>
                    <p className="text-xs text-amber-600">Auto-Approve</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-green-700">{selectedRecon.avgRunDuration}</p>
                    <p className="text-xs text-green-600">Avg Duration</p>
                  </div>
                </div>

                {/* Matching Rules */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Settings className="w-4 h-4" /> Matching Rules</h3>
                  <div className="space-y-1.5">
                    {selectedRecon.matchingRules.map((rule, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                        <span className="text-sm text-muted-foreground">{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Run History */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /> Run History</h3>
                  {selectedRecon.runHistory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Matched</TableHead>
                          <TableHead>Exceptions</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRecon.runHistory.map((run, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{run.date}</TableCell>
                            <TableCell className="text-sm font-medium">{run.matched}</TableCell>
                            <TableCell className="text-sm">{run.exceptions}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{run.duration}</TableCell>
                            <TableCell>{runStatusIcon(run.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No runs yet.</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {selectedRecon.status === "active" && (
                    <Button size="sm"><Play className="w-4 h-4 mr-1.5" /> Run Now</Button>
                  )}
                  <Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-1.5" /> Edit Rules</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
