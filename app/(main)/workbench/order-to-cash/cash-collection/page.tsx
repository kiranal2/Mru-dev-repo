"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Mail, Phone, DollarSign, AlertTriangle, X, Wallet } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Breadcrumb from "@/components/layout/Breadcrumb";

const COLLECTORS = [
  "Alex Chen",
  "Priya Patel",
  "Jordan Lee",
  "Sam Rivera",
  "Taylor Brooks",
  "Avery Kim",
];
const CUSTOMERS = [
  "Acme Retail",
  "Northwind Outfitters",
  "Globex Health",
  "Initech Systems",
  "Umbrella Labs",
  "Stark Components",
  "Wayne Logistics",
  "Oscorp Devices",
  "Wonka Foods",
  "Tyrell Robotics",
  "BlueSun Freight",
  "Hooli Cloud",
  "Massive Dynamic",
  "Soylent Corp",
  "Pied Piper",
  "Cyberdyne AI",
  "Aperture Labs",
  "Gringotts Bank",
];

interface ARRecord {
  id: number;
  customer: string;
  account: string;
  collector: string;
  arBalance: number;
  pastDue: number;
  bucket: string;
  severity: "critical" | "high" | "medium" | "low" | "none";
  recommendation: string;
  autoPrepared: boolean;
  status: "new" | "monitor" | "completed";
  contacts: number;
  promises: number;
  history: string[];
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[rand(0, arr.length - 1)];

const bucketFromDays = (d: number) => {
  if (d >= 90) return "90+";
  if (d >= 61) return "61-90";
  if (d >= 31) return "31-60";
  if (d >= 1) return "1-30";
  return "Current";
};

const severityFromDays = (d: number): ARRecord["severity"] => {
  if (d >= 90) return "critical";
  if (d >= 61) return "high";
  if (d >= 31) return "medium";
  if (d >= 1) return "low";
  return "none";
};

const recommendation = (d: number) => {
  if (d >= 90) return "Escalate to finance lead";
  if (d >= 61) return "Schedule call with AP manager";
  if (d >= 31) return "Request promise + tracking of payment";
  if (d >= 1) return "Auto-prepare 30-day dunning letter";
  return "—";
};

const generateSyntheticData = (): ARRecord[] => {
  const records: ARRecord[] = [];
  for (let i = 0; i < 120; i++) {
    const past = rand(0, 120);
    const autoPrepared = past >= 1 && past <= 30;
    const sev = severityFromDays(past);

    records.push({
      id: i + 1,
      customer: pick(CUSTOMERS),
      account: `C-${100000 + rand(0, 899999)}`,
      collector: pick(COLLECTORS),
      arBalance: rand(3, 80) * 1000,
      pastDue: past,
      bucket: bucketFromDays(past),
      severity: sev,
      recommendation: recommendation(past),
      autoPrepared,
      status: sev === "none" ? "completed" : "new",
      contacts: 0,
      promises: 0,
      history: ["Imported A/R aging", "AI scored severity & drafted recommendation"],
    });
  }
  return records;
};

export default function CollectionsPage() {
  const [records, setRecords] = useState<ARRecord[]>(() => generateSyntheticData());
  const [currentView, setCurrentView] = useState<"new" | "monitor" | "completed">("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [collectorFilter, setCollectorFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("high");
  const [activeSignal, setActiveSignal] = useState<string | null>(null);
  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [currentRecord, setCurrentRecord] = useState<ARRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [modalState, setModalState] = useState<{
    open: boolean;
    type: "Dunning" | "Schedule" | "Promise" | "Escalate" | null;
    ids: Set<number>;
  }>({ open: false, type: null, ids: new Set() });

  const [modalData, setModalData] = useState({
    message: "",
    when: "",
    notes: "",
    date: "",
    amount: "",
  });

  const kpis = useMemo(() => {
    const auto = records.filter((r) => r.autoPrepared && r.status === "new").length;
    const crit = records.filter(
      (r) => r.severity === "critical" && r.status !== "completed"
    ).length;
    const ex = records.filter((r) => r.status !== "completed").length;
    return { auto, crit, ex };
  }, [records]);

  const baseFilterSet = useMemo(() => {
    return records.filter((r) => r.status === currentView);
  }, [records, currentView]);

  const signals = useMemo(() => {
    const byBucket: Record<string, number> = {};
    baseFilterSet.forEach((r) => {
      byBucket[r.bucket] = (byBucket[r.bucket] || 0) + 1;
    });

    if (currentView === "completed") {
      const done = baseFilterSet.filter((r) => r.status === "completed").length;
      return [
        {
          name: "Completed",
          severity: "low",
          meta: "Paid/closed",
          key: "__completed__",
          count: done,
        },
      ];
    }

    return [
      {
        name: "90+ days late",
        severity: "critical",
        meta: "Severe delinquency",
        key: "90+",
        count: byBucket["90+"] || 0,
      },
      {
        name: "61–90 days late",
        severity: "high",
        meta: "High delinquency",
        key: "61-90",
        count: byBucket["61-90"] || 0,
      },
      {
        name: "31–60 days late",
        severity: "medium",
        meta: "Needs contact plan",
        key: "31-60",
        count: byBucket["31-60"] || 0,
      },
      {
        name: "1–30 days late",
        severity: "low",
        meta: "Auto dunning prepared",
        key: "1-30",
        count: byBucket["1-30"] || 0,
      },
    ].filter((s) => s.count > 0 || currentView === "new");
  }, [baseFilterSet, currentView]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let set = baseFilterSet;

    if (activeSignal) {
      set = set.filter((r) => {
        if (activeSignal === "__completed__") return r.status === "completed";
        return r.bucket === activeSignal;
      });
    }

    return set.filter(
      (r) =>
        (collectorFilter === "all" || r.collector === collectorFilter) &&
        (severityFilter === "all" || r.severity === severityFilter) &&
        (!q ||
          [r.customer, r.account, r.collector, r.recommendation].some((v) =>
            String(v).toLowerCase().includes(q)
          ))
    );
  }, [baseFilterSet, activeSignal, collectorFilter, severityFilter, searchQuery]);

  useEffect(() => {
    setCurrentRecord(null);
    setIsDrawerOpen(false);
  }, [filtered]);

  const openModal = (type: typeof modalState.type, ids: Set<number>) => {
    let defaultMessage = "";
    if (type === "Dunning") {
      defaultMessage = `Subject: Friendly reminder on past-due balance\n\nDear Accounts Payable,\n\nOur records show an outstanding balance that is past due.\n\nPlease advise on payment status, or let us know if you need documentation.\n\nThank you,\n[Collector]`;
    } else if (type === "Schedule") {
      defaultMessage = "Discuss payment status and confirm remittance date.";
    } else if (type === "Escalate") {
      defaultMessage = "Customer unresponsive; request leadership outreach.";
    }

    setModalData({
      message: defaultMessage,
      when: "",
      notes: defaultMessage,
      date: "",
      amount: "",
    });
    setModalState({ open: true, type, ids });
  };

  const closeModal = () => {
    setModalState({ open: false, type: null, ids: new Set() });
    setModalData({ message: "", when: "", notes: "", date: "", amount: "" });
  };

  const applyAction = () => {
    const { type, ids } = modalState;
    if (!type) return;

    const updatedRecords = records.map((r) => {
      if (!ids.has(r.id)) return r;

      const copy = { ...r, history: [...r.history] };

      if (type === "Dunning") {
        copy.contacts += 1;
        copy.status = "monitor";
        copy.history.push("Dunning letter sent");
      } else if (type === "Schedule") {
        copy.status = "monitor";
        copy.history.push(`Call scheduled ${modalData.when || ""}`);
      } else if (type === "Promise") {
        copy.promises += 1;
        copy.status = "monitor";
        copy.history.push(
          `Promise to Pay logged: ${modalData.date || ""} for $${modalData.amount || ""}`
        );
      } else if (type === "Escalate") {
        copy.status = "monitor";
        copy.history.push("Escalated to finance lead");
      }

      return copy;
    });

    setRecords(updatedRecords);
    setSelection(new Set());
    closeModal();
    toast.success(`${type} action applied to ${ids.size} record(s)`);
  };

  const handleExportCSV = () => {
    const header = [
      "Customer",
      "Account",
      "Collector",
      "AR Balance",
      "Past Due",
      "Bucket",
      "Severity",
      "Recommendation",
    ];
    const rows = filtered.map((r) => [
      r.customer,
      r.account,
      r.collector,
      `$${r.arBalance.toLocaleString()}`,
      r.pastDue,
      r.bucket,
      r.severity,
      r.recommendation,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `collections_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  const getSeverityColor = (severity: string) => {
    const map = {
      critical: "bg-red-100 text-red-700 border-red-300",
      high: "bg-orange-100 text-orange-700 border-orange-300",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
      low: "bg-green-100 text-green-700 border-green-300",
      none: "bg-slate-100 text-slate-600 border-slate-300",
    };
    return map[severity as keyof typeof map] || map.none;
  };

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="workbench/order-to-cash/cash-collection" className="mb-1.5" />
        <div className="flex items-center justify-between gap-4 mt-1">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Wallet className="h-6 w-6 text-slate-700" />
              <h1 className="text-2xl font-bold text-[#000000] mt-2">Cash Collection Workbench</h1>
            </div>
            <p className="text-sm text-[#606060]">
              Track AR balances, past-due buckets, and collector actions
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Badge className="bg-green-100 text-green-700 border-green-300">
              Auto-prepared <span className="font-bold ml-1">{kpis.auto}</span>
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
              Exceptions <span className="font-bold ml-1">{kpis.ex}</span>
            </Badge>
            <Badge className="bg-red-100 text-red-700 border-red-300">
              Critical <span className="font-bold ml-1">{kpis.crit}</span>
            </Badge>
          </div>
        </div>
        <div className="border-b border-[#B7B7B7] mt-2" />
      </header>

      <div className="flex-1 grid grid-cols-[320px_1fr] gap-4 p-4 overflow-hidden">
        <aside className="space-y-4 overflow-auto">
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Filters
            </h3>
            <div className="space-y-3">
              <Input
                placeholder="Search Customer, Account, Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Select value={collectorFilter} onValueChange={setCollectorFilter}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="All collectors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All collectors</SelectItem>
                    {COLLECTORS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All severities</SelectItem>
                    <SelectItem value="critical">Critical (90+)</SelectItem>
                    <SelectItem value="high">High (61-90)</SelectItem>
                    <SelectItem value="medium">Medium (31-60)</SelectItem>
                    <SelectItem value="low">Low (1-30)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Quick Views
            </h3>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "New Exceptions", value: "new" },
                { label: "Monitoring", value: "monitor" },
                { label: "Completed", value: "completed" },
              ].map((view) => (
                <Button
                  key={view.value}
                  variant={currentView === view.value ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-full text-xs",
                    currentView === view.value && "bg-[#205375] hover:bg-[#2c7aa1]"
                  )}
                  onClick={() => {
                    setCurrentView(view.value as any);
                    setActiveSignal(null);
                  }}
                >
                  {view.label}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Signals
            </h3>
            <div className="space-y-2">
              {signals.map((signal, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveSignal(signal.key)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    activeSignal === signal.key
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{signal.name}</div>
                      <div className="text-xs text-slate-600">{signal.meta}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{signal.count}</Badge>
                      {signal.key !== "__completed__" && (
                        <Badge
                          className={cn("text-xs uppercase", getSeverityColor(signal.severity))}
                        >
                          {signal.severity}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        <Card className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allIds = new Set(filtered.map((r) => r.id));
                setSelection(allIds);
              }}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selection.size === 0}
              onClick={() => openModal("Dunning", selection)}
            >
              <Mail className="h-3 w-3 mr-1" />
              Send Dunning
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selection.size === 0}
              onClick={() => openModal("Schedule", selection)}
            >
              <Phone className="h-3 w-3 mr-1" />
              Schedule Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selection.size === 0}
              onClick={() => openModal("Promise", selection)}
            >
              <DollarSign className="h-3 w-3 mr-1" />
              Log Promise
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selection.size === 0}
              onClick={() => openModal("Escalate", selection)}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Escalate
            </Button>
            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-3 w-3 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Account</TableHead>
                  <TableHead className="text-xs">Collector</TableHead>
                  <TableHead className="text-xs text-right">AR Balance</TableHead>
                  <TableHead className="text-xs text-right">Past Due</TableHead>
                  <TableHead className="text-xs">Bucket</TableHead>
                  <TableHead className="text-xs">Severity</TableHead>
                  <TableHead className="text-xs">AI Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                      setCurrentRecord(r);
                      setIsDrawerOpen(true);
                    }}
                    className={cn("cursor-pointer", currentRecord?.id === r.id && "bg-blue-50")}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selection.has(r.id)}
                        onCheckedChange={(checked) => {
                          const newSelection = new Set(selection);
                          if (checked) {
                            newSelection.add(r.id);
                          } else {
                            newSelection.delete(r.id);
                          }
                          setSelection(newSelection);
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-sm">{r.customer}</TableCell>
                    <TableCell className="text-sm">{r.account}</TableCell>
                    <TableCell className="text-sm">{r.collector}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(r.arBalance)}</TableCell>
                    <TableCell className="text-right text-sm">{r.pastDue}</TableCell>
                    <TableCell className="text-sm">{r.bucket}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs uppercase", getSeverityColor(r.severity))}>
                        {r.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.recommendation}
                      {r.autoPrepared && r.status === "new" && (
                        <Badge className="ml-2 bg-green-100 text-green-700 border-green-300 text-xs">
                          AUTO
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="p-3 border-t border-slate-200 text-sm text-slate-600">
            {selection.size} selected
          </div>
        </Card>
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="right">
        <DrawerContent className="h-full w-[480px] ml-auto">
          <DrawerHeader className="border-b border-slate-200">
            <div className="flex items-center justify-between">
              <DrawerTitle>Account Details</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          {currentRecord && (
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                <div className="text-slate-600">Customer</div>
                <div className="font-medium">{currentRecord.customer}</div>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                <div className="text-slate-600">Account</div>
                <div className="font-medium">{currentRecord.account}</div>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                <div className="text-slate-600">Collector</div>
                <div>{currentRecord.collector}</div>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                <div className="text-slate-600">AR Balance</div>
                <div className="font-medium">{fmt(currentRecord.arBalance)}</div>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                <div className="text-slate-600">Past Due</div>
                <div>{currentRecord.pastDue} days</div>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                <div className="text-slate-600">Bucket</div>
                <div>{currentRecord.bucket}</div>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                <div className="text-slate-600">Severity</div>
                <div>
                  <Badge
                    className={cn("text-xs uppercase", getSeverityColor(currentRecord.severity))}
                  >
                    {currentRecord.severity}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                <div className="text-slate-600">Recommendation</div>
                <div>{currentRecord.recommendation}</div>
              </div>

              <div className="pt-3">
                <h4 className="font-semibold text-sm mb-2">Timeline</h4>
                <div className="space-y-2 border-l-2 border-slate-200 pl-3">
                  {currentRecord.history
                    .slice()
                    .reverse()
                    .map((item, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="text-xs text-slate-500">
                          {new Date().toLocaleDateString()}
                        </div>
                        <div>{item}</div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="pt-4 flex gap-2 flex-wrap">
                <Button
                  className="bg-[#205375] hover:bg-[#2c7aa1]"
                  size="sm"
                  onClick={() => openModal("Dunning", new Set([currentRecord.id]))}
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Send Dunning
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openModal("Schedule", new Set([currentRecord.id]))}
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Schedule
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openModal("Promise", new Set([currentRecord.id]))}
                >
                  <DollarSign className="h-3 w-3 mr-1" />
                  Promise
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openModal("Escalate", new Set([currentRecord.id]))}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Escalate
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <footer className="h-8 border-t border-slate-200 bg-white flex items-center justify-center text-xs text-slate-500">
        Confidential — © 2025 Meeru AI
      </footer>

      <Dialog open={modalState.open} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalState.type === "Dunning" && "Send Dunning Letter"}
              {modalState.type === "Schedule" && "Schedule Call"}
              {modalState.type === "Promise" && "Log Promise to Pay"}
              {modalState.type === "Escalate" && "Escalate to Finance Lead"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {modalState.type === "Dunning" && (
              <>
                <Label>Email body (auto-prepared):</Label>
                <Textarea
                  rows={8}
                  value={modalData.message}
                  onChange={(e) => setModalData({ ...modalData, message: e.target.value })}
                />
              </>
            )}

            {modalState.type === "Schedule" && (
              <>
                <div>
                  <Label>Proposed date/time:</Label>
                  <Input
                    type="datetime-local"
                    value={modalData.when}
                    onChange={(e) => setModalData({ ...modalData, when: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Notes for calendar invite:</Label>
                  <Textarea
                    rows={4}
                    value={modalData.notes}
                    onChange={(e) => setModalData({ ...modalData, notes: e.target.value })}
                  />
                </div>
              </>
            )}

            {modalState.type === "Promise" && (
              <>
                <div>
                  <Label>Promised payment date:</Label>
                  <Input
                    type="date"
                    value={modalData.date}
                    onChange={(e) => setModalData({ ...modalData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Promised amount (USD):</Label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={modalData.amount}
                    onChange={(e) => setModalData({ ...modalData, amount: e.target.value })}
                  />
                </div>
              </>
            )}

            {modalState.type === "Escalate" && (
              <>
                <Label>Context for escalation:</Label>
                <Textarea
                  rows={4}
                  value={modalData.message}
                  onChange={(e) => setModalData({ ...modalData, message: e.target.value })}
                />
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button className="bg-[#205375] hover:bg-[#2c7aa1]" onClick={applyAction}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
