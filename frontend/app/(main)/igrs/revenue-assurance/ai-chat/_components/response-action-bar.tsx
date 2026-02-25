"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserPlus,
  AlertTriangle,
  Download,
  MessageSquare,
  ListTodo,
  MoreHorizontal,
  ExternalLink,
  Star,
} from "lucide-react";
import { useIGRSRole } from "@/lib/ai-chat-intelligence/role-context";
import { useIGRSEscalations } from "@/hooks/data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PromptResponseData } from "@/lib/data/types/igrs";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ConversationMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  data?: PromptResponseData;
  timestamp: string;
}

const CASE_ID_REGEX = /IGRS-\d{4}-\d+/gi;

function extractCaseIdsFromMessage(msg: ConversationMessage): string[] {
  const headers = msg.data?.inlineTable?.headers ?? [];
  const rows = msg.data?.inlineTable?.rows ?? [];
  if (!rows.length) return [];

  const candidateIndexes = headers
    .map((header, idx) =>
      String(header).toLowerCase().includes("case") ? idx : -1
    )
    .filter((idx) => idx >= 0);

  const fallbackIndexes = [0, 1];
  const indexesToCheck =
    candidateIndexes.length > 0 ? candidateIndexes : fallbackIndexes;

  const ids = new Set<string>();
  for (const row of rows) {
    for (const idx of indexesToCheck) {
      const cell = String(row[idx] ?? "");
      const matches = cell.match(CASE_ID_REGEX);
      if (!matches) continue;
      for (const match of matches) {
        ids.add(match.toUpperCase());
      }
    }
  }

  return Array.from(ids);
}

function getCasesRoute(msg: ConversationMessage): string {
  const caseIds = extractCaseIdsFromMessage(msg);
  if (caseIds.length === 0) return "/igrs/revenue-assurance/cases?from=ai-chat";
  return `/igrs/revenue-assurance/cases?caseIds=${encodeURIComponent(caseIds.join(","))}&from=ai-chat`;
}

// ── Constants ────────────────────────────────────────────────────────────────

type EscalationTarget = { id: string; label: string; name: string; email: string };
type EscalationRole = "IG" | "DIG" | "DR" | "SR";

const TEAM_MEMBERS = [
  { id: "venkat", name: "Venkata Rao", role: "IGRS Analyst" },
  { id: "lakshmi", name: "Lakshmi Reddy", role: "Tax Manager" },
  { id: "srinivas", name: "Srinivas Naidu", role: "Revenue Auditor" },
  { id: "padma", name: "Padmavathi Chowdary", role: "Compliance Officer" },
  { id: "rajesh", name: "Rajesh Varma", role: "District Inspector" },
];

const ESCALATION_TARGETS_BY_ROLE: Record<EscalationRole, EscalationTarget[]> = {
  IG: [
    { id: "dig-south", label: "DIG South Zone", name: "P. Venkata Rao", email: "dig.south@igrs.ap.gov.in" },
    { id: "dig-north", label: "DIG North Zone", name: "R. Kumar Reddy", email: "dig.north@igrs.ap.gov.in" },
    { id: "dig-central", label: "DIG Central Zone", name: "A. Srinivas", email: "dig.central@igrs.ap.gov.in" },
  ],
  DIG: [
    { id: "dr-krishna", label: "DR Krishna", name: "S. Lakshmi Devi", email: "dr.krishna@igrs.ap.gov.in" },
    { id: "dr-guntur", label: "DR Guntur", name: "V. Rambabu", email: "dr.guntur@igrs.ap.gov.in" },
    { id: "dr-chittoor", label: "DR Chittoor", name: "K. Srinivas", email: "dr.chittoor@igrs.ap.gov.in" },
  ],
  DR: [
    { id: "sr-vijayawada", label: "SR Vijayawada Central", name: "M. Suresh Kumar", email: "sr.vijayawada@igrs.ap.gov.in" },
    { id: "sr-machilipatnam", label: "SR Machilipatnam", name: "P. Rajesh", email: "sr.machilipatnam@igrs.ap.gov.in" },
  ],
  SR: [
    { id: "dr-krishna", label: "DR Krishna", name: "S. Lakshmi Devi", email: "dr.krishna@igrs.ap.gov.in" },
  ],
};

const ALL_ESCALATION_TARGETS: EscalationTarget[] = Array.from(
  new Map(
    Object.values(ESCALATION_TARGETS_BY_ROLE)
      .flat()
      .map((target) => [target.id, target] as const)
  ).values()
);

function normalizeEscalationRole(role?: string): EscalationRole | null {
  if (!role) return null;
  const normalized = role.toUpperCase();
  if (normalized === "IG" || normalized === "DIG" || normalized === "DR" || normalized === "SR") {
    return normalized;
  }
  return null;
}

function inferTargetRole(targetId: string): EscalationRole {
  if (targetId.startsWith("dig-")) return "DIG";
  if (targetId.startsWith("dr-")) return "DR";
  if (targetId.startsWith("sr-")) return "SR";
  return "IG";
}

const SLA_OPTIONS = [
  { value: "3", label: "3 days" },
  { value: "7", label: "7 days" },
  { value: "15", label: "15 days" },
];

// ── CSV Export Helper ────────────────────────────────────────────────────────

function exportResponseAsCSV(msg: ConversationMessage) {
  const lines: string[] = [];

  // Add narrative
  lines.push("Narrative");
  lines.push(`"${msg.content.replace(/"/g, '""')}"`);
  lines.push("");

  // Add table data if present
  if (msg.data?.inlineTable) {
    const { headers, rows } = msg.data.inlineTable;
    lines.push(headers.join(","));
    for (const row of rows) {
      lines.push(
        row
          .map((cell) =>
            typeof cell === "string" ? `"${cell.replace(/"/g, '""')}"` : cell
          )
          .join(",")
      );
    }
    lines.push("");
  }

  // Add key insight if present
  if (msg.data?.keyInsight) {
    lines.push("Key Insight");
    lines.push(`"${msg.data.keyInsight.replace(/"/g, '""')}"`);
  }

  const csvContent = lines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `igrs-response-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── AssignDialog ─────────────────────────────────────────────────────────────

function AssignDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [assignee, setAssignee] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit() {
    if (!assignee) return;
    const member = TEAM_MEMBERS.find((m) => m.id === assignee);
    toast.success(`Assigned to ${member?.name ?? assignee}`);
    setAssignee("");
    setNote("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Response</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Assign To
            </label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_MEMBERS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} — {m.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Note (optional)
            </label>
            <textarea
              className="w-full h-20 border border-slate-200 rounded-md p-2 text-sm mt-1"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add context for the assignee..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!assignee}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── EscalateDialog ───────────────────────────────────────────────────────────

function EscalateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { session } = useIGRSRole();
  const { addEscalation } = useIGRSEscalations();
  const router = useRouter();

  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [slaDays, setSlaDays] = useState("7");
  const [priority, setPriority] = useState("Medium");

  const roleKey = useMemo(() => normalizeEscalationRole(session?.role), [session?.role]);

  const targets = useMemo(() => {
    if (roleKey) return ESCALATION_TARGETS_BY_ROLE[roleKey];
    return ALL_ESCALATION_TARGETS;
  }, [roleKey]);

  function handleSubmit() {
    if (!target) return;
    if (!session) {
      toast.error("Role session not found. Please sign in again from the IGRS login page.");
      return;
    }
    const targetObj = targets.find((t) => t.id === target);
    if (!targetObj) return;

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + parseInt(slaDays, 10));

    const newId = `ESC-${String(Date.now()).slice(-6)}`;
    addEscalation({
      id: newId,
      caseId: `AI-CHAT-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: { role: session.role, name: session.name },
      assignedTo: { role: inferTargetRole(targetObj.id), name: targetObj.name, email: targetObj.email },
      slaDeadline: deadline.toISOString(),
      status: "Open",
      priority: priority as "High" | "Medium" | "Low",
      comment: reason || "Escalated from AI Chat finding",
      responses: [],
      auditLog: [
        {
          ts: new Date().toISOString(),
          actor: session.name,
          action: "Created",
          detail: `Escalation created and assigned to ${targetObj.name}`,
        },
      ],
    });

    toast.success(`Escalated to ${targetObj.name}`, {
      action: {
        label: "View in Escalations",
        onClick: () => router.push("/igrs/revenue-assurance/escalations"),
      },
    });
    setTarget("");
    setReason("");
    setSlaDays("7");
    setPriority("Medium");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escalate Finding</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Escalate To
            </label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {targets.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label} — {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-500 mt-1">
              {roleKey
                ? `Routing by ${roleKey} escalation hierarchy`
                : "No role session detected. Showing all configured recipients."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">SLA Deadline</label>
              <Select value={slaDays} onValueChange={setSlaDays}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SLA_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Reason</label>
            <textarea
              className="w-full h-20 border border-slate-200 rounded-md p-2 text-sm mt-1"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this needs escalation..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!target}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Escalate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── AddNoteDialog ────────────────────────────────────────────────────────────

function AddNoteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [note, setNote] = useState("");

  function handleSubmit() {
    if (!note.trim()) return;
    toast.success("Note saved");
    setNote("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Annotation
          </label>
          <textarea
            className="w-full h-28 border border-slate-200 rounded-md p-2 text-sm mt-1"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your observation or annotation..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!note.trim()}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── CreateTaskDialog ─────────────────────────────────────────────────────────

function CreateTaskDialog({
  open,
  onOpenChange,
  defaultTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTitle: string;
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [priority, setPriority] = useState("medium");
  const [assignee, setAssignee] = useState("");

  // Sync default title when dialog opens
  const [lastDefault, setLastDefault] = useState(defaultTitle);
  if (defaultTitle !== lastDefault) {
    setTitle(defaultTitle);
    setLastDefault(defaultTitle);
  }

  function handleSubmit() {
    if (!title.trim()) return;
    toast.success("Task created");
    setTitle("");
    setPriority("medium");
    setAssignee("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Title</label>
            <input
              type="text"
              className="w-full border border-slate-200 rounded-md p-2 text-sm mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Priority
            </label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Assignee
            </label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_MEMBERS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} — {m.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <ListTodo className="w-4 h-4 mr-1" />
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Action Bar ───────────────────────────────────────────────────────────────

export function ResponseActionBar({ msg }: { msg: ConversationMessage }) {
  const router = useRouter();
  const [assignOpen, setAssignOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const taskDefaultTitle =
    msg.data?.keyInsight || msg.content.slice(0, 60) + (msg.content.length > 60 ? "..." : "");

  const actionButtonClass =
    "bg-white hover:bg-[#D1ECFF] text-[#000000] px-2 py-1.5 rounded-[8px] text-sm font-normal flex items-center gap-2 transition-colors border border-[#D2D2D2]";

  const primaryActions = [
    {
      label: "View Cases",
      icon: ExternalLink,
      onClick: () => router.push(getCasesRoute(msg)),
    },
    {
      label: favorite ? "Favorited" : "Favorite",
      icon: Star,
      active: favorite,
      onClick: () => {
        setFavorite(!favorite);
        toast.success(favorite ? "Removed from favorites" : "Added to favorites");
      },
    },
    {
      label: "Download",
      icon: Download,
      onClick: () => {
        exportResponseAsCSV(msg);
        toast.success("CSV exported");
      },
    },
  ];

  const secondaryActions = [
    {
      label: "Assign",
      icon: UserPlus,
      onClick: () => setAssignOpen(true),
    },
    {
      label: "Escalate",
      icon: AlertTriangle,
      onClick: () => setEscalateOpen(true),
    },
    {
      label: "Add Note",
      icon: MessageSquare,
      onClick: () => setNoteOpen(true),
    },
    {
      label: "Create Task",
      icon: ListTodo,
      onClick: () => setTaskOpen(true),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-end mt-1">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {primaryActions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={
                actionButtonClass +
                (action.active ? " bg-[#D1ECFF] border-slate-200 text-slate-900" : "")
              }
            >
              <action.icon size={18} className="text-slate-900" />
              <span>{action.label}</span>
            </button>
          ))}

        {/* More actions dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMore(!showMore)}
            className={
              actionButtonClass +
              (showMore ? " bg-[#D1ECFF] border-slate-200 text-slate-900" : "")
            }
            aria-label="More actions"
          >
            <MoreHorizontal size={18} className="text-slate-900" />
          </button>

          {showMore && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowMore(false)} />
              <div className="absolute top-full right-0 mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[170px]">
                {secondaryActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      action.onClick();
                      setShowMore(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-slate-600 hover:bg-[#D1ECFF] hover:text-slate-900 transition-colors flex items-center gap-2"
                  >
                    <action.icon className="w-4 h-4" />
                    {action.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      </div>

      <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} />
      <EscalateDialog open={escalateOpen} onOpenChange={setEscalateOpen} />
      <AddNoteDialog open={noteOpen} onOpenChange={setNoteOpen} />
      <CreateTaskDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        defaultTitle={taskDefaultTitle}
      />
    </>
  );
}
