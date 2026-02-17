"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  UserPlus,
  AlertTriangle,
  Pin,
  Download,
  MessageSquare,
  ListTodo,
} from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PromptResponseData } from "@/lib/data/types/igrs";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ConversationMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  data?: PromptResponseData;
  timestamp: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TEAM_MEMBERS = [
  { id: "venkat", name: "Venkata Rao", role: "IGRS Analyst" },
  { id: "lakshmi", name: "Lakshmi Reddy", role: "Tax Manager" },
  { id: "srinivas", name: "Srinivas Naidu", role: "Revenue Auditor" },
  { id: "padma", name: "Padmavathi Chowdary", role: "Compliance Officer" },
  { id: "rajesh", name: "Rajesh Varma", role: "District Inspector" },
];

const ESCALATION_TARGETS = [
  "District Registrar",
  "Joint Inspector General",
  "Additional Inspector General",
  "Inspector General of Registration & Stamps",
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
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit() {
    if (!target) return;
    toast.success(`Escalated to ${target}`);
    setTarget("");
    setReason("");
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
                {ESCALATION_TARGETS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

  const taskDefaultTitle =
    msg.data?.keyInsight || msg.content.slice(0, 60) + (msg.content.length > 60 ? "..." : "");

  const actions = [
    {
      label: "Drill Down",
      icon: Search,
      onClick: () => router.push("/igrs/revenue-assurance/cases"),
    },
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
      label: "Pin",
      icon: Pin,
      onClick: () => toast.success("Pinned to workspace"),
    },
    {
      label: "Export",
      icon: Download,
      onClick: () => {
        exportResponseAsCSV(msg);
        toast.success("CSV exported");
      },
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
      <div className="mb-3 pb-2 border-b border-slate-100 flex flex-wrap gap-1">
        {actions.map((action) => (
          <Tooltip key={action.label} delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                onClick={action.onClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-slate-500 hover:text-violet-700 hover:bg-violet-50 transition-colors"
              >
                <action.icon className="w-3.5 h-3.5" />
                <span>{action.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{action.label}</TooltipContent>
          </Tooltip>
        ))}
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
