"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Link2,
  ListFilter,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCloseTasks } from "@/hooks/data";
import { LinkReconModal } from "@/components/modals/link-recon-modal";
import { QuickCreateTaskModal } from "@/components/modals/quick-create-task-modal";
import type { CloseTask, CloseTaskFilters } from "@/lib/data/types";

/* ── Constants ─────────────────────────────────────────────────── */

const PHASES = ["All", "Pre-Close", "Core Close", "Post-Close", "Reporting"] as const;

const STATUSES = [
  "All",
  "Not Started",
  "In Progress",
  "Pending Review",
  "Blocked",
  "Completed",
] as const;

const STATUS_DOT: Record<string, string> = {
  "Not Started": "bg-slate-400",
  "In Progress": "bg-blue-500",
  "Pending Review": "bg-amber-500",
  Completed: "bg-emerald-500",
  Blocked: "bg-red-500",
};

const STATUS_CLASS: Record<string, string> = {
  "Not Started": "text-slate-700 bg-slate-50 border-slate-200",
  "In Progress": "text-blue-700 bg-blue-50 border-blue-200",
  "Pending Review": "text-amber-700 bg-amber-50 border-amber-200",
  Completed: "text-emerald-700 bg-emerald-50 border-emerald-200",
  Blocked: "text-red-700 bg-red-50 border-red-200",
};

const PHASE_CLASS: Record<string, string> = {
  "Pre-Close": "text-violet-700 bg-violet-50 border-violet-200",
  "Core Close": "text-blue-700 bg-blue-50 border-blue-200",
  "Post-Close": "text-teal-700 bg-teal-50 border-teal-200",
  Reporting: "text-slate-700 bg-slate-50 border-slate-200",
};

const PRIORITY_CLASS: Record<string, string> = {
  Critical: "text-red-700 bg-red-50 border-red-200",
  High: "text-orange-700 bg-orange-50 border-orange-200",
  Medium: "text-slate-600 bg-slate-50 border-slate-200",
  Low: "text-slate-500 bg-slate-50 border-slate-200",
};

/* ── Helpers ───────────────────────────────────────────────────── */

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function daysLate(dueDate: string, status: string): number {
  if (status === "Completed") return 0;
  const diff = Math.floor(
    (Date.now() - new Date(dueDate).getTime()) / 86_400_000
  );
  return diff > 0 ? diff : 0;
}

function checklistProgress(
  list?: Array<{ label: string; checked: boolean }>
): string {
  if (!list || list.length === 0) return "—";
  const done = list.filter((c) => c.checked).length;
  return `${done}/${list.length}`;
}

function fmtMinutes(m: number): string {
  if (m === 0) return "—";
  const h = Math.floor(m / 60);
  const mins = m % 60;
  return h > 0 ? `${h}h ${mins > 0 ? `${mins}m` : ""}`.trim() : `${mins}m`;
}

/* ── Page ──────────────────────────────────────────────────────── */

export default function CloseWorkbenchPage() {
  const router = useRouter();

  /* State */
  const [searchQuery, setSearchQuery] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("Consolidated");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<CloseTask | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"details" | "checklist" | "linked">("details");
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [linkReconOpen, setLinkReconOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState("");

  /* Hook filters */
  const filters: CloseTaskFilters = useMemo(() => {
    const f: CloseTaskFilters = {
      page,
      pageSize,
      search: searchQuery || undefined,
      subsidiary: entityFilter !== "Consolidated" ? entityFilter : undefined,
    };
    if (phaseFilter !== "All") f.phase = [phaseFilter];
    if (statusFilter !== "All") f.status = [statusFilter];
    if (priorityFilter !== "ALL") f.priority = [priorityFilter];
    if (assigneeFilter !== "ALL") f.assignedTo = assigneeFilter;
    return f;
  }, [page, pageSize, searchQuery, entityFilter, phaseFilter, statusFilter, priorityFilter, assigneeFilter]);

  const { data: tasks, total, loading, error, refetch, updateTask } = useCloseTasks(filters);

  /* Derived */
  const uniqueAssignees = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.assignedTo).filter(Boolean))),
    [tasks]
  );

  const kpis = useMemo(() => {
    const totalCount = tasks.length;
    if (totalCount === 0) return null;
    const completed = tasks.filter((t) => t.status === "Completed").length;
    const progressPct = Math.round((completed / totalCount) * 100);
    const open = tasks.filter(
      (t) => t.status === "Not Started" || t.status === "In Progress"
    ).length;
    const today = new Date().toISOString().split("T")[0];
    const late = tasks.filter(
      (t) => t.dueDate < today && t.status !== "Completed"
    ).length;
    const blocked = tasks.filter((t) => t.status === "Blocked").length;
    return { progressPct, completed, open, late, blocked, totalCount };
  }, [tasks]);

  const phaseCounts = useMemo(() => {
    const counts: Record<string, { total: number; done: number }> = {};
    for (const t of tasks) {
      if (!counts[t.phase]) counts[t.phase] = { total: 0, done: 0 };
      counts[t.phase].total++;
      if (t.status === "Completed") counts[t.phase].done++;
    }
    return counts;
  }, [tasks]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      counts[t.status] = (counts[t.status] || 0) + 1;
    }
    return counts;
  }, [tasks]);

  const filterCount = useMemo(() => {
    let c = 0;
    if (priorityFilter !== "ALL") c++;
    if (assigneeFilter !== "ALL") c++;
    if (entityFilter !== "Consolidated") c++;
    return c;
  }, [priorityFilter, assigneeFilter, entityFilter]);

  const totalPages = Math.ceil(total / pageSize);

  /* Handlers */
  const handleRowClick = useCallback((task: CloseTask) => {
    setSelectedTask(task);
    setDrawerTab("details");
    setDrawerOpen(true);
  }, []);

  const handleTaskAction = useCallback(
    async (taskId: string, updates: Partial<CloseTask>) => {
      try {
        const updated = await updateTask(taskId, updates);
        if (selectedTask?.id === taskId && updated) {
          setSelectedTask((prev) =>
            prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : prev
          );
        }
        toast.success(`Task updated successfully`);
      } catch {
        toast.error("Failed to update task");
      }
    },
    [updateTask, selectedTask?.id]
  );

  const handleBulkAction = useCallback(
    async (action: string) => {
      if (selectedIds.size === 0) return;
      const updates: Partial<CloseTask> =
        action === "READY"
          ? { status: "In Progress" }
          : action === "CLOSED"
            ? { status: "Completed" }
            : {};
      for (const id of Array.from(selectedIds)) {
        await handleTaskAction(id, updates);
      }
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} tasks updated`);
    },
    [selectedIds, handleTaskAction]
  );

  const handleBlock = useCallback(async () => {
    if (!selectedTask || !blockReason) return;
    await handleTaskAction(selectedTask.id, {
      status: "Blocked",
      notes: blockReason,
    });
    setBlockDialogOpen(false);
    setBlockReason("");
  }, [selectedTask, blockReason, handleTaskAction]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === tasks.length ? new Set() : new Set(tasks.map((t) => t.id))
    );
  }, [tasks]);

  /* Error state */
  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 p-6">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Error loading close tasks</h2>
        <p className="mb-4 text-sm text-slate-600">{error}</p>
        <Button onClick={refetch}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50" style={{ height: "100%", minHeight: 0 }}>
      {/* ── Title ─────────────────────────────────────────── */}
      <div className="px-5 pt-3 pb-1">
        <h1 className="text-sm font-semibold text-slate-900">Close Workbench</h1>
        <p className="text-[11px] text-slate-500">Period-end close task management</p>
      </div>

      {/* ── Toolbar ───────────────────────────────────────── */}
      <div className="space-y-2 px-5 py-2">
        {/* Row 1: Phase tabs + KPI chips */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {PHASES.map((p) => {
              const active = phaseFilter === p;
              const count =
                p === "All"
                  ? tasks.length
                  : phaseCounts[p]?.total ?? 0;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPhaseFilter(active ? "All" : p)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border bg-white text-primary shadow-sm"
                      : "text-slate-600 hover:bg-white/60"
                  )}
                >
                  {p}
                  <span className="ml-1 text-[10px] text-slate-400">{count}</span>
                </button>
              );
            })}
          </div>

          {/* KPI chips */}
          {kpis && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700">
                Progress
                <span className="font-semibold text-primary">{kpis.progressPct}%</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700">
                <Clock className="h-3 w-3 text-slate-400" />
                Open
                <span className="font-semibold">{kpis.open}</span>
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-[11px] font-medium",
                  kpis.late > 0
                    ? "border-red-200 text-red-700"
                    : "border-slate-200 text-slate-700"
                )}
              >
                <AlertCircle className="h-3 w-3" />
                Late
                <span className="font-semibold">{kpis.late}</span>
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-[11px] font-medium",
                  kpis.blocked > 0
                    ? "border-orange-200 text-orange-700"
                    : "border-slate-200 text-slate-700"
                )}
              >
                <Ban className="h-3 w-3" />
                Blocked
                <span className="font-semibold">{kpis.blocked}</span>
              </span>
            </div>
          )}
        </div>

        {/* Row 2: Status chips + Search + Filters + Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {STATUSES.map((s) => {
              const active = statusFilter === s;
              const count =
                s === "All" ? tasks.length : statusCounts[s] ?? 0;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(active ? "All" : s)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                    active
                      ? "border bg-white text-primary shadow-sm"
                      : "text-slate-500 hover:bg-white/60"
                  )}
                >
                  {s !== "All" && (
                    <span
                      className={cn(
                        "mr-1 inline-block h-1.5 w-1.5 rounded-full",
                        STATUS_DOT[s]
                      )}
                    />
                  )}
                  {s}
                  <span className="ml-1 text-[10px] text-slate-400">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search tasks..."
              className="h-8 w-52 pl-8 text-xs"
            />
          </div>

          {/* Filters Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <ListFilter className="h-3.5 w-3.5" />
                Filters
                {filterCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {filterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 space-y-3 p-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Priorities</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Assignee</Label>
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Assignees</SelectItem>
                    {uniqueAssignees.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Entity</Label>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consolidated">Consolidated</SelectItem>
                    <SelectItem value="Meeru Inc">Meeru Inc</SelectItem>
                    <SelectItem value="Meeru Europe">Meeru Europe</SelectItem>
                    <SelectItem value="Meeru APAC">Meeru APAC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    setPriorityFilter("ALL");
                    setAssigneeFilter("ALL");
                    setEntityFilter("Consolidated");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </PopoverContent>
          </Popover>

          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => {
              setQuickCreateType("");
              setQuickCreateOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Task
          </Button>

          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div className="flex-1 overflow-auto px-5 pb-5">
        {loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-slate-500">Loading close tasks...</div>
          </div>
        ) : (
          <>
            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                <span className="text-xs font-medium text-primary">
                  {selectedIds.size} selected
                </span>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleBulkAction("READY")}
                >
                  Mark In Progress
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleBulkAction("CLOSED")}
                >
                  Complete
                </Button>
                <button
                  type="button"
                  className="ml-auto text-xs text-slate-500 hover:text-slate-700"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear
                </button>
              </div>
            )}

            {/* Phase progress bars */}
            <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(["Pre-Close", "Core Close", "Post-Close", "Reporting"] as const).map(
                (phase) => {
                  const c = phaseCounts[phase] || { total: 0, done: 0 };
                  const pct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
                  return (
                    <div
                      key={phase}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700">{phase}</span>
                        <span className="text-[11px] text-slate-500">
                          {c.done}/{c.total}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            pct === 100 ? "bg-emerald-500" : "bg-primary"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Table */}
            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="w-10 px-3 py-2">
                        <Checkbox
                          checked={
                            tasks.length > 0 && selectedIds.size === tasks.length
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Task
                      </th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Phase
                      </th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Assignee
                      </th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Due
                      </th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Checklist
                      </th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Priority
                      </th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Aging
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => {
                      const late = daysLate(task.dueDate, task.status);
                      return (
                        <tr
                          key={task.id}
                          className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
                          onClick={() => handleRowClick(task)}
                        >
                          <td
                            className="px-3 py-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={selectedIds.has(task.id)}
                              onCheckedChange={() => toggleSelection(task.id)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-slate-900">
                                {task.name}
                              </span>
                              {task.linkedJournalEntryIds &&
                                task.linkedJournalEntryIds.length > 0 && (
                                  <span className="inline-flex items-center gap-0.5 rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                                    <FileText className="h-2.5 w-2.5" />
                                    {task.linkedJournalEntryIds.length} JE
                                  </span>
                                )}
                              {task.dependencies.length > 0 && (
                                <span className="text-[10px] text-slate-400">
                                  {task.dependencies.length} dep
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                "inline-flex rounded border px-2 py-0.5 text-[11px] font-medium",
                                PHASE_CLASS[task.phase] || "text-slate-600"
                              )}
                            >
                              {task.phase}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-600">
                            {task.assignedTo || "Unassigned"}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                "text-xs",
                                late > 0
                                  ? "font-medium text-red-600"
                                  : "text-slate-600"
                              )}
                            >
                              {formatDate(task.dueDate)}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium",
                                STATUS_CLASS[task.status]
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  STATUS_DOT[task.status]
                                )}
                              />
                              {task.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center text-xs text-slate-600">
                            {checklistProgress(task.checklist)}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                "inline-flex rounded border px-2 py-0.5 text-[11px] font-medium",
                                PRIORITY_CLASS[task.priority]
                              )}
                            >
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {late > 0 ? (
                              <span className="font-medium text-red-600">
                                {late}d late
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {tasks.length === 0 && !loading && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-3 py-8 text-center text-sm text-slate-400"
                        >
                          No tasks found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Showing {(page - 1) * pageSize + 1}–
                  {Math.min(page * pageSize, total)} of {total}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="px-2 text-xs text-slate-600">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Detail Drawer ─────────────────────────────────── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[560px] overflow-y-auto p-0 sm:w-[560px]">
          {selectedTask && (
            <>
              {/* Drawer header */}
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <SheetHeader className="space-y-0">
                  <SheetTitle className="text-base font-semibold text-slate-900">
                    {selectedTask.name}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium",
                      STATUS_CLASS[selectedTask.status]
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        STATUS_DOT[selectedTask.status]
                      )}
                    />
                    {selectedTask.status}
                  </span>
                  <span
                    className={cn(
                      "inline-flex rounded border px-2 py-0.5 text-[11px] font-medium",
                      PHASE_CLASS[selectedTask.phase]
                    )}
                  >
                    {selectedTask.phase}
                  </span>
                  <span
                    className={cn(
                      "inline-flex rounded border px-2 py-0.5 text-[11px] font-medium",
                      PRIORITY_CLASS[selectedTask.priority]
                    )}
                  >
                    {selectedTask.priority}
                  </span>
                </div>
              </div>

              {/* Drawer tabs */}
              <div className="flex gap-1 border-b border-slate-200 px-5 py-2">
                {(
                  [
                    ["details", "Details"],
                    ["checklist", "Checklist"],
                    ["linked", "Linked"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDrawerTab(key)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      drawerTab === key
                        ? "bg-white text-primary shadow-sm border"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Drawer content */}
              <div className="p-5">
                {drawerTab === "details" && (
                  <div className="space-y-4">
                    {selectedTask.description && (
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Description
                        </div>
                        <p className="mt-1 text-sm text-slate-700">
                          {selectedTask.description}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Assignee
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-900">
                          {selectedTask.assignedTo || "Unassigned"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Due Date
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-900">
                          {formatDate(selectedTask.dueDate)}
                          {daysLate(selectedTask.dueDate, selectedTask.status) >
                            0 && (
                            <span className="ml-2 text-xs text-red-600">
                              ({daysLate(selectedTask.dueDate, selectedTask.status)}d overdue)
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Entity
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-900">
                          {selectedTask.subsidiary || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Dependencies
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-900">
                          {selectedTask.dependencies.length > 0
                            ? selectedTask.dependencies.join(", ")
                            : "None"}
                        </div>
                      </div>
                    </div>
                    {/* Effort */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Effort
                      </div>
                      <div className="mt-1.5 flex items-center gap-6">
                        <div>
                          <span className="text-xs text-slate-500">Estimated: </span>
                          <span className="text-sm font-medium text-slate-900">
                            {fmtMinutes(selectedTask.estimatedMinutes)}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">Actual: </span>
                          <span className="text-sm font-medium text-slate-900">
                            {fmtMinutes(selectedTask.actualMinutes ?? 0)}
                          </span>
                        </div>
                        {selectedTask.estimatedMinutes > 0 && (selectedTask.actualMinutes ?? 0) > 0 && (
                          <div className="ml-auto">
                            <span
                              className={cn(
                                "text-xs font-medium",
                                (selectedTask.actualMinutes ?? 0) >
                                  selectedTask.estimatedMinutes
                                  ? "text-red-600"
                                  : "text-emerald-600"
                              )}
                            >
                              {Math.round(
                                ((selectedTask.actualMinutes ?? 0) /
                                  selectedTask.estimatedMinutes) *
                                  100
                              )}
                              % of estimate
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedTask.notes && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <div className="text-[11px] font-semibold text-red-700">
                          Blocking Reason
                        </div>
                        <p className="mt-1 text-sm text-red-600">
                          {selectedTask.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {drawerTab === "checklist" && (
                  <div className="space-y-3">
                    {selectedTask.checklist && selectedTask.checklist.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Progress
                          </span>
                          <span className="text-xs font-medium text-slate-700">
                            {checklistProgress(selectedTask.checklist)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                              width: `${
                                selectedTask.checklist.length > 0
                                  ? Math.round(
                                      (selectedTask.checklist.filter((c) => c.checked).length /
                                        selectedTask.checklist.length) *
                                        100
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <div className="space-y-2 pt-1">
                          {selectedTask.checklist.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2.5 rounded-md border border-slate-100 px-3 py-2"
                            >
                              <Checkbox checked={item.checked} disabled />
                              <span
                                className={cn(
                                  "text-sm",
                                  item.checked
                                    ? "text-slate-400 line-through"
                                    : "text-slate-700"
                                )}
                              >
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="py-4 text-center text-sm text-slate-400">
                        No checklist items
                      </p>
                    )}
                  </div>
                )}

                {drawerTab === "linked" && (
                  <div className="space-y-4">
                    {/* Linked Journal Entries */}
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Journal Entries
                      </div>
                      {selectedTask.linkedJournalEntryIds &&
                      selectedTask.linkedJournalEntryIds.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedTask.linkedJournalEntryIds.map((jeId) => (
                            <button
                              key={jeId}
                              type="button"
                              onClick={() => {
                                router.push(
                                  `/reports/financials/account-activity?je=${jeId}&from=close&taskId=${selectedTask.id}`
                                );
                                setDrawerOpen(false);
                              }}
                              className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                            >
                              <FileText className="h-3 w-3" />
                              {jeId}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-slate-400">No linked journal entries</p>
                      )}
                    </div>
                    {/* Reconciliation link */}
                    <div className="border-t border-slate-200 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Reconciliation
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setLinkReconOpen(true)}
                        >
                          <Link2 className="mr-1 h-3 w-3" />
                          Link
                        </Button>
                      </div>
                      <p className="mt-1 text-sm italic text-slate-400">
                        No reconciliation linked
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer actions */}
              <div className="border-t border-slate-200 px-5 py-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    disabled={selectedTask.status === "In Progress"}
                    onClick={() =>
                      handleTaskAction(selectedTask.id, {
                        status: "In Progress",
                      })
                    }
                  >
                    Mark In Progress
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    disabled={selectedTask.status === "Pending Review"}
                    onClick={() =>
                      handleTaskAction(selectedTask.id, {
                        status: "Pending Review",
                      })
                    }
                  >
                    Send for Review
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    disabled={selectedTask.status === "Completed"}
                    onClick={() =>
                      handleTaskAction(selectedTask.id, {
                        status: "Completed",
                      })
                    }
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-red-200 text-xs text-red-600 hover:bg-red-50"
                    disabled={selectedTask.status === "Blocked"}
                    onClick={() => setBlockDialogOpen(true)}
                  >
                    <Ban className="mr-1 h-3 w-3" />
                    Block
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Block Dialog ──────────────────────────────────── */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Block Task</DialogTitle>
            <DialogDescription>
              Provide a reason for blocking this task
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Label htmlFor="block-reason" className="text-xs font-semibold">
              Blocking Reason
            </Label>
            <Textarea
              id="block-reason"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g., Waiting for vendor invoice..."
              className="mt-1.5"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBlockDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBlock}
              disabled={!blockReason}
            >
              Block Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Link Recon Modal ──────────────────────────────── */}
      {selectedTask && (
        <LinkReconModal
          open={linkReconOpen}
          onClose={() => setLinkReconOpen(false)}
          taskId={selectedTask.id}
          currentReconId={null}
          onLinked={() => {
            refetch();
            toast.success("Reconciliation linked");
          }}
        />
      )}

      {/* ── Quick Create Task Modal ───────────────────────── */}
      <QuickCreateTaskModal
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        worklistId="default"
        suggestedType={quickCreateType}
        onCreated={() => {
          refetch();
          toast.success("Task created");
        }}
      />
    </div>
  );
}
