"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useIGRSEscalations } from "@/hooks/data";
import { useIGRSRole } from "@/lib/ai-chat-intelligence/role-context";
import { JurisdictionBadge } from "@/components/igrs/jurisdiction-badge";
import type {
  EscalationRecord,
  EscalationStatus,
  EscalationPriority,
} from "@/lib/data/types/igrs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquare,
  Search,
  Shield,
  XCircle,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function slaCountdown(deadline: string): { label: string; overdue: boolean; days: number } {
  const now = new Date();
  const dl = new Date(deadline);
  const diffMs = dl.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, overdue: true, days };
  if (days === 0) return { label: "Due today", overdue: false, days: 0 };
  return { label: `${days}d left`, overdue: false, days };
}

function statusBadge(status: EscalationStatus) {
  const map: Record<EscalationStatus, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
    Open: { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
    Responded: { variant: "secondary", className: "bg-amber-50 text-amber-700 border-amber-200" },
    Accepted: { variant: "default", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    Rejected: { variant: "destructive", className: "bg-red-50 text-red-700 border-red-200" },
    Overdue: { variant: "destructive", className: "bg-red-100 text-red-800 border-red-300" },
  };
  const cfg = map[status];
  return <Badge variant={cfg.variant} className={cfg.className}>{status}</Badge>;
}

function priorityBadge(priority: EscalationPriority) {
  const map: Record<EscalationPriority, string> = {
    High: "bg-red-50 text-red-700 border-red-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Low: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return <Badge variant="outline" className={map[priority]}>{priority}</Badge>;
}

// ── Submit Response Dialog (SR / DR) ─────────────────────────────────────────

function SubmitResponseDialog({
  open,
  onOpenChange,
  escalation,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escalation: EscalationRecord | null;
  onSubmit: (id: string, explanation: string, evidence: string[]) => void;
}) {
  const [explanation, setExplanation] = useState("");
  const [evidence, setEvidence] = useState("");

  function handleSubmit() {
    if (!escalation || !explanation.trim()) return;
    const evidenceList = evidence
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    onSubmit(escalation.id, explanation, evidenceList);
    setExplanation("");
    setEvidence("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Response — {escalation?.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-500 mb-2">
              Case: <span className="font-medium text-slate-700">{escalation?.caseId}</span> — {escalation?.comment}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Explanation</label>
            <textarea
              className="w-full h-24 border border-slate-200 rounded-md p-2 text-sm mt-1"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide your explanation for the finding..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Evidence Files (comma-separated)</label>
            <Input
              className="mt-1"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="e.g. stamp-calc.pdf, receipt-copy.jpg"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!explanation.trim()}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Submit Response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Review Response Dialog (IG / DIG) ────────────────────────────────────────

function ReviewResponseDialog({
  open,
  onOpenChange,
  escalation,
  onAccept,
  onReject,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escalation: EscalationRecord | null;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (!escalation) return null;
  const latestResponse = escalation.responses[escalation.responses.length - 1];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Response — {escalation.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="text-xs text-slate-400 mb-1">Original Escalation</p>
            <p className="text-slate-700">{escalation.comment}</p>
          </div>
          {latestResponse ? (
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm">
              <p className="text-xs text-blue-400 mb-1">
                Response by {latestResponse.respondedBy.name} ({latestResponse.respondedBy.role})
              </p>
              <p className="text-slate-700">{latestResponse.explanation}</p>
              {latestResponse.evidence.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {latestResponse.evidence.map((e, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] bg-white">
                      <FileText className="w-3 h-3 mr-1" />
                      {e}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No response submitted yet.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          {latestResponse && (
            <>
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => { onReject(escalation.id); onOpenChange(false); }}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => { onAccept(escalation.id); onOpenChange(false); }}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Accept
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Page
// ═════════════════════════════════════════════════════════════════════════════

export default function EscalationTrackerPage() {
  const { escalations, isLoading, error, updateEscalation } = useIGRSEscalations();
  const { session, isInJurisdiction } = useIGRSRole();

  const [statusFilter, setStatusFilter] = useState<EscalationStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<EscalationPriority | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [respondTarget, setRespondTarget] = useState<EscalationRecord | null>(null);
  const [respondOpen, setRespondOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<EscalationRecord | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  // Filter escalations by jurisdiction + filters
  const filtered = useMemo(() => {
    let result = escalations;

    // Jurisdiction filter: show escalations relevant to user's scope
    // (We don't have case office data on the escalation directly, so we show all for now
    //  and filter by the user's role involvement — created by or assigned to)
    if (session && session.role !== "IG") {
      result = result.filter(
        (e) =>
          e.createdBy.name === session.name ||
          e.assignedTo.name === session.name ||
          e.assignedTo.email === session.email
      );
    }

    if (statusFilter !== "all") result = result.filter((e) => e.status === statusFilter);
    if (priorityFilter !== "all") result = result.filter((e) => e.priority === priorityFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.id.toLowerCase().includes(q) ||
          e.caseId.toLowerCase().includes(q) ||
          e.assignedTo.name.toLowerCase().includes(q) ||
          e.comment.toLowerCase().includes(q)
      );
    }
    return result;
  }, [escalations, session, statusFilter, priorityFilter, searchQuery]);

  // KPIs
  const kpis = useMemo(() => {
    const open = filtered.filter((e) => e.status === "Open").length;
    const responded = filtered.filter((e) => e.status === "Responded").length;
    const overdue = filtered.filter((e) => e.status === "Overdue").length;
    const withSla = filtered.filter((e) => e.status !== "Accepted" && e.status !== "Rejected");
    const avgDays =
      withSla.length > 0
        ? Math.round(
            withSla.reduce((sum, e) => {
              const dl = new Date(e.slaDeadline);
              const cr = new Date(e.createdAt);
              return sum + Math.abs(dl.getTime() - cr.getTime()) / (1000 * 60 * 60 * 24);
            }, 0) / withSla.length
          )
        : 0;
    return { open, responded, overdue, avgDays };
  }, [filtered]);

  // Actions
  function handleSubmitResponse(id: string, explanation: string, evidence: string[]) {
    if (!session) return;
    updateEscalation(id, {
      status: "Responded",
      responses: [
        ...(escalations.find((e) => e.id === id)?.responses ?? []),
        {
          respondedAt: new Date().toISOString(),
          respondedBy: { role: session.role, name: session.name },
          explanation,
          evidence,
          status: "Justified",
        },
      ],
      auditLog: [
        ...(escalations.find((e) => e.id === id)?.auditLog ?? []),
        {
          ts: new Date().toISOString(),
          actor: session.name,
          action: "ResponseSubmitted",
          detail: `Response submitted with ${evidence.length} evidence file(s)`,
        },
      ],
    });
    toast.success("Response submitted successfully");
  }

  function handleAccept(id: string) {
    if (!session) return;
    updateEscalation(id, {
      status: "Accepted",
      auditLog: [
        ...(escalations.find((e) => e.id === id)?.auditLog ?? []),
        {
          ts: new Date().toISOString(),
          actor: session.name,
          action: "Accepted",
          detail: "Response accepted",
        },
      ],
    });
    toast.success("Escalation accepted — marked as resolved");
  }

  function handleReject(id: string) {
    if (!session) return;
    updateEscalation(id, {
      status: "Open",
      auditLog: [
        ...(escalations.find((e) => e.id === id)?.auditLog ?? []),
        {
          ts: new Date().toISOString(),
          actor: session.name,
          action: "Rejected",
          detail: "Response rejected — re-opened for further action",
        },
      ],
    });
    toast.error("Response rejected — escalation re-opened");
  }

  // Role-aware action column
  function renderActions(esc: EscalationRecord) {
    const role = session?.role;
    if (!role) return null;

    // IG/DIG can review responded escalations
    if ((role === "IG" || role === "DIG") && esc.status === "Responded") {
      return (
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7"
          onClick={() => {
            setReviewTarget(esc);
            setReviewOpen(true);
          }}
        >
          Review
        </Button>
      );
    }

    // DR/SR can respond to open/overdue escalations assigned to them
    if (
      (role === "DR" || role === "SR") &&
      (esc.status === "Open" || esc.status === "Overdue") &&
      (esc.assignedTo.name === session?.name || esc.assignedTo.email === session?.email)
    ) {
      return (
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7"
          onClick={() => {
            setRespondTarget(esc);
            setRespondOpen(true);
          }}
        >
          Respond
        </Button>
      );
    }

    // IG/DIG can view open escalations
    if ((role === "IG" || role === "DIG") && (esc.status === "Open" || esc.status === "Overdue")) {
      return (
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-7 text-slate-500"
          onClick={() => {
            setReviewTarget(esc);
            setReviewOpen(true);
          }}
        >
          View
        </Button>
      );
    }

    return (
      <span className="text-xs text-slate-400">—</span>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-violet-500">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Escalations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">Error loading escalations</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Escalation Tracker</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Track, respond to, and resolve escalated findings
          </p>
        </div>
        <JurisdictionBadge />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Open</p>
                <p className="text-2xl font-bold text-blue-600">{kpis.open}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock3 className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Responded</p>
                <p className="text-2xl font-bold text-amber-600">{kpis.responded}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{kpis.overdue}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Avg SLA Window</p>
                <p className="text-2xl font-bold text-slate-700">{kpis.avgDays}d</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search by ID, case, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EscalationStatus | "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Responded">Responded</SelectItem>
            <SelectItem value="Accepted">Accepted</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as EscalationPriority | "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Case</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Escalated By</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Assigned To</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">SLA</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      No escalations found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((esc) => {
                    const sla = slaCountdown(esc.slaDeadline);
                    return (
                      <tr key={esc.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{esc.id}</td>
                        <td className="px-4 py-3 font-mono text-xs text-violet-600 font-medium">
                          {esc.caseId}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-slate-700">{esc.createdBy.name}</div>
                          <div className="text-[10px] text-slate-400">{esc.createdBy.role}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-slate-700">{esc.assignedTo.name}</div>
                          <div className="text-[10px] text-slate-400">{esc.assignedTo.role}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium ${
                              sla.overdue
                                ? "text-red-600"
                                : sla.days <= 2
                                ? "text-amber-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {sla.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">{priorityBadge(esc.priority)}</td>
                        <td className="px-4 py-3">{statusBadge(esc.status)}</td>
                        <td className="px-4 py-3">{renderActions(esc)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <SubmitResponseDialog
        open={respondOpen}
        onOpenChange={setRespondOpen}
        escalation={respondTarget}
        onSubmit={handleSubmitResponse}
      />
      <ReviewResponseDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        escalation={reviewTarget}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    </div>
  );
}
