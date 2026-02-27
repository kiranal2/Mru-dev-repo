"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download,
  Mail,
  Phone,
  DollarSign,
  AlertTriangle,
  X,
  Wallet,
  ExternalLink,
  Loader2,
  TrendingUp,
  Users,
  Clock,
  HandCoins,
  CheckCircle,
  CalendarClock,
  Search,
  ArrowRight,
  Eye,
  FileText,
  MessageSquare,
  Pause,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  Globe,
  Plus,
  CreditCard,
  List,
  LayoutList,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Breadcrumb from "@/components/layout/breadcrumb";
import {
  useCollections,
  usePromisesToPay,
  useDunningSequences,
  useDunningTemplates,
  useCorrespondence,
  useCorrespondenceMutation,
} from "@/hooks/data";
import type {
  CollectionRecord,
  CollectionFilters,
  DunningSequence,
  DunningTemplate,
  DunningStepConfig,
  DunningStatus,
  DunningStep,
  PromiseToPay,
  PromiseStatus,
  Correspondence,
  CorrespondenceType,
  CorrespondenceChannel,
} from "@/lib/data/types";

// ===========================================================================
// Types
// ===========================================================================

type WorkbenchTab = "accounts" | "dunning" | "promises" | "correspondence";
type QuickView = "all" | "active" | "in-progress" | "resolved";

// ===========================================================================
// Shared helpers
// ===========================================================================

const fmt = (n: number) => `$${n.toLocaleString()}`;

function formatUsd(value: number): string {
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatUsdCompact(value: number): string {
  if (value >= 1_000_000) return "$" + (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return "$" + (value / 1_000).toFixed(0) + "K";
  return "$" + value.toLocaleString();
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const datePart = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timePart = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${datePart} ${timePart}`;
}

function formatShortDate(dateStr: string | undefined): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isPastOrToday(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d <= today;
}

function isPast(dateStr: string): boolean {
  const d = new Date(dateStr);
  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function getDaysOverdue(dateStr: string): number {
  const d = new Date(dateStr);
  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function getRelativeDateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (dDate >= today) return "Today";
  if (dDate >= yesterday) return "Yesterday";
  if (dDate >= weekAgo) return "This Week";
  return "Older";
}

// ===========================================================================
// Accounts tab constants
// ===========================================================================

const QUICK_VIEWS: { label: string; value: QuickView }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "In Progress", value: "in-progress" },
  { label: "Resolved", value: "resolved" },
];

const AGING_BUCKETS = ["Current", "1-30", "31-60", "61-90", "90+"] as const;

const AGING_COLORS: Record<string, string> = {
  Current: "#3b82f6",
  "1-30": "#22c55e",
  "31-60": "#eab308",
  "61-90": "#f97316",
  "90+": "#ef4444",
};

const AGING_SIGNAL_META: Record<string, { name: string; severity: string; meta: string }> = {
  "90+": { name: "90+ days late", severity: "Critical", meta: "Severe delinquency" },
  "61-90": { name: "61-90 days late", severity: "High", meta: "High delinquency" },
  "31-60": { name: "31-60 days late", severity: "Medium", meta: "Needs contact plan" },
  "1-30": { name: "1-30 days late", severity: "Low", meta: "Auto dunning prepared" },
  Current: { name: "Current", severity: "Low", meta: "On-time" },
};

const getSeverityColor = (severity: string) => {
  const map: Record<string, string> = {
    Critical: "bg-red-50 text-red-700 border-red-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Low: "bg-green-50 text-green-700 border-green-200",
  };
  return map[severity] || "bg-slate-50 text-slate-600 border-slate-200";
};

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    Active: "bg-blue-50 text-blue-700 border-blue-200",
    "In Progress": "bg-indigo-50 text-indigo-700 border-indigo-200",
    Escalated: "bg-red-50 text-red-700 border-red-200",
    Resolved: "bg-green-50 text-green-700 border-green-200",
    "Written Off": "bg-slate-50 text-slate-600 border-slate-200",
    "On Hold": "bg-amber-50 text-amber-700 border-amber-200",
  };
  return map[status] || "bg-slate-50 text-slate-600 border-slate-200";
};

const getRiskColor = (score: number) => {
  if (score >= 80) return "bg-red-500";
  if (score >= 60) return "bg-orange-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-green-500";
};

// ===========================================================================
// Dunning tab constants
// ===========================================================================

const DUNNING_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "All", label: "All Statuses" },
  { value: "Active", label: "Active" },
  { value: "Paused", label: "Paused" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

const DUNNING_STATUS_BADGE: Record<DunningStatus, { className: string }> = {
  Active: { className: "bg-blue-50 text-blue-700 border-blue-200" },
  Paused: { className: "bg-amber-50 text-amber-700 border-amber-200" },
  Completed: { className: "bg-green-50 text-green-700 border-green-200" },
  Cancelled: { className: "bg-slate-100 text-slate-500 border-slate-200" },
};

const STEP_NAMES: DunningStep[] = [
  "Friendly Reminder",
  "Second Notice",
  "Urgent Notice",
  "Pre-Collection",
  "Final Notice",
];

const DUNNING_CHANNEL_ICON: Record<string, React.ReactNode> = {
  Email: <Mail className="h-3.5 w-3.5" />,
  Phone: <Phone className="h-3.5 w-3.5" />,
  Letter: <FileText className="h-3.5 w-3.5" />,
  SMS: <MessageSquare className="h-3.5 w-3.5" />,
  Portal: <Eye className="h-3.5 w-3.5" />,
};

// ===========================================================================
// Promises tab constants
// ===========================================================================

const PROMISE_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "All", label: "All Statuses" },
  { value: "Active", label: "Active" },
  { value: "Due Today", label: "Due Today" },
  { value: "Overdue", label: "Overdue" },
  { value: "Fulfilled", label: "Fulfilled" },
  { value: "Broken", label: "Broken" },
  { value: "Cancelled", label: "Cancelled" },
];

const PROMISE_METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: "All", label: "All Methods" },
  { value: "ACH", label: "ACH" },
  { value: "Credit Card", label: "Credit Card" },
  { value: "Wire", label: "Wire" },
];

const PROMISE_SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "dueAsc", label: "Due Date (Asc)" },
  { value: "dueDesc", label: "Due Date (Desc)" },
  { value: "amountDesc", label: "Amount (High to Low)" },
  { value: "amountAsc", label: "Amount (Low to High)" },
];

const PROMISE_STATUS_BADGE: Record<PromiseStatus, string> = {
  Active: "bg-blue-50 text-blue-700 border-blue-200",
  "Due Today": "bg-amber-50 text-amber-700 border-amber-200",
  Overdue: "bg-red-50 text-red-700 border-red-200",
  Fulfilled: "bg-green-50 text-green-700 border-green-200",
  Broken: "",
  Cancelled: "",
};

const METHOD_BADGE_STYLES: Record<string, string> = {
  ACH: "bg-blue-50 text-blue-700 border-blue-200",
  Wire: "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Credit Card": "bg-purple-50 text-purple-700 border-purple-200",
};

// ===========================================================================
// Correspondence tab constants
// ===========================================================================

const CORR_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "All", label: "All Types" },
  { value: "Dunning", label: "Dunning" },
  { value: "Follow-up", label: "Follow-up" },
  { value: "Acknowledgement", label: "Acknowledgement" },
  { value: "Escalation", label: "Escalation" },
  { value: "Resolution", label: "Resolution" },
  { value: "General", label: "General" },
];

const CORR_CHANNEL_OPTIONS: { value: string; label: string }[] = [
  { value: "All", label: "All Channels" },
  { value: "Email", label: "Email" },
  { value: "Phone", label: "Phone" },
  { value: "Letter", label: "Letter" },
  { value: "SMS", label: "SMS" },
  { value: "Portal", label: "Portal" },
];

const CORR_DIRECTION_OPTIONS: { value: string; label: string }[] = [
  { value: "All", label: "All Directions" },
  { value: "Outbound", label: "Outbound" },
  { value: "Inbound", label: "Inbound" },
];

const TYPE_BADGE: Record<CorrespondenceType, string> = {
  Dunning: "bg-purple-50 text-purple-700 border-purple-200",
  "Follow-up": "bg-blue-50 text-blue-700 border-blue-200",
  Acknowledgement: "bg-green-50 text-green-700 border-green-200",
  Escalation: "bg-red-50 text-red-700 border-red-200",
  Resolution: "bg-teal-50 text-teal-700 border-teal-200",
  General: "bg-slate-100 text-slate-600 border-slate-200",
};

const CORR_CHANNEL_ICON: Record<CorrespondenceChannel, React.ReactNode> = {
  Email: <Mail className="h-3.5 w-3.5" />,
  Phone: <Phone className="h-3.5 w-3.5" />,
  Letter: <FileText className="h-3.5 w-3.5" />,
  SMS: <Smartphone className="h-3.5 w-3.5" />,
  Portal: <Globe className="h-3.5 w-3.5" />,
};

const CHANNEL_COLORS: Record<CorrespondenceChannel, string> = {
  Email: "#3b82f6",
  Phone: "#22c55e",
  Letter: "#f59e0b",
  SMS: "#a855f7",
  Portal: "#6366f1",
};

// ===========================================================================
// Helper component: StepProgressDots
// ===========================================================================

function StepProgressDots({
  currentStepNumber,
  totalSteps,
  steps,
}: {
  currentStepNumber: number;
  totalSteps: number;
  steps: DunningStepConfig[];
}) {
  const allSteps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-0.5">
      {allSteps.map((stepNum) => {
        const stepConfig = steps.find((s) => s.stepNumber === stepNum);
        const isCompleted = stepConfig?.completed === true;
        const isCurrent = stepNum === currentStepNumber && !isCompleted;
        let bg = "bg-slate-200";
        if (isCompleted) bg = "bg-green-500";
        if (isCurrent) bg = "bg-blue-500";
        return (
          <React.Fragment key={stepNum}>
            {stepNum > 1 && (
              <div
                className={cn(
                  "w-3 h-0.5",
                  isCompleted || (isCurrent && stepNum <= currentStepNumber)
                    ? "bg-green-300"
                    : "bg-slate-200"
                )}
              />
            )}
            <div
              className={cn(
                "w-3 h-3 rounded-full flex-shrink-0",
                bg,
                isCurrent && "ring-2 ring-blue-200"
              )}
              title={
                STEP_NAMES[stepNum - 1] +
                (isCompleted ? " (Completed)" : isCurrent ? " (Current)" : " (Pending)")
              }
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ===========================================================================
// Helper component: StepTimeline (expanded dunning row)
// ===========================================================================

function StepTimeline({
  steps,
  currentStepNumber,
  totalSteps,
  templates,
}: {
  steps: DunningStepConfig[];
  currentStepNumber: number;
  totalSteps: number;
  templates: DunningTemplate[];
}) {
  const allSteps = Array.from({ length: totalSteps }, (_, i) => {
    const config = steps.find((s) => s.stepNumber === i + 1);
    return (
      config || {
        stepNumber: i + 1,
        name: STEP_NAMES[i],
        daysAfterDue: [3, 10, 21, 35, 50][i],
        templateId: `TPL-00${i + 1}`,
        channel: (["Email", "Email", "Phone", "Letter", "Letter"] as const)[i],
        completed: false,
      }
    );
  });

  return (
    <div className="px-4 py-4 bg-slate-50 border-t border-slate-100">
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {allSteps.map((step, idx) => {
          const isCurrent = step.stepNumber === currentStepNumber && !step.completed;
          const template = templates.find((t) => t.id === step.templateId);
          return (
            <React.Fragment key={step.stepNumber}>
              {idx > 0 && (
                <div className="flex items-center pt-6 flex-shrink-0">
                  <div className={cn("w-8 h-0.5", step.completed || isCurrent ? "bg-green-300" : "bg-slate-200")} />
                  <ArrowRight className={cn("h-3.5 w-3.5 -ml-1", step.completed || isCurrent ? "text-green-400" : "text-slate-300")} />
                </div>
              )}
              <div
                className={cn(
                  "flex-shrink-0 w-44 rounded-lg border p-3",
                  step.completed
                    ? "bg-green-50 border-green-200"
                    : isCurrent
                      ? "bg-blue-50 border-blue-300 ring-1 ring-blue-200"
                      : "bg-white border-slate-200"
                )}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                      step.completed
                        ? "bg-green-500 text-white"
                        : isCurrent
                          ? "bg-blue-500 text-white"
                          : "bg-slate-200 text-slate-500"
                    )}
                  >
                    {step.completed ? <CheckCircle2 className="h-3 w-3" /> : step.stepNumber}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 truncate">{step.name}</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center gap-1 text-slate-500">
                    {DUNNING_CHANNEL_ICON[step.channel]}
                    <span>{step.channel}</span>
                  </div>
                  <div className="text-slate-400">Day +{step.daysAfterDue}</div>
                  {template && (
                    <div className="text-slate-400 truncate" title={template.name}>{template.name}</div>
                  )}
                  {step.completed && step.executedDate && (
                    <div className="flex items-center gap-1 text-green-600 font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      {formatShortDate(step.executedDate)}
                    </div>
                  )}
                  {isCurrent && (
                    <div className="flex items-center gap-1 text-blue-600 font-medium">
                      <Clock className="h-3 w-3" />
                      In Progress
                    </div>
                  )}
                  {!step.completed && !isCurrent && (
                    <div className="text-slate-400 italic">Pending</div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================================================
// Main Component
// ===========================================================================

export default function CollectionsWorkbenchPage() {
  // ---- Tab state ----
  const [activeTab, setActiveTab] = useState<WorkbenchTab>("accounts");

  // ========================================================================
  // ACCOUNTS TAB STATE
  // ========================================================================
  const [quickView, setQuickView] = useState<QuickView>("all");
  const [acctSearch, setAcctSearch] = useState("");
  const [collectorFilter, setCollectorFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [activeSignal, setActiveSignal] = useState<string | null>(null);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [currentRecord, setCurrentRecord] = useState<CollectionRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [modalState, setModalState] = useState<{
    open: boolean;
    type: "Dunning" | "Schedule" | "Promise" | "Escalate" | null;
    ids: Set<string>;
  }>({ open: false, type: null, ids: new Set() });
  const [modalData, setModalData] = useState({
    message: "",
    when: "",
    notes: "",
    date: "",
    amount: "",
  });

  // ========================================================================
  // DUNNING TAB STATE
  // ========================================================================
  const [dunningSearch, setDunningSearch] = useState("");
  const [dunningStatusFilter, setDunningStatusFilter] = useState("All");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // ========================================================================
  // PROMISES TAB STATE
  // ========================================================================
  const [promiseSearch, setPromiseSearch] = useState("");
  const [promiseStatusFilter, setPromiseStatusFilter] = useState("All");
  const [promiseMethodFilter, setPromiseMethodFilter] = useState("All");
  const [promiseSortBy, setPromiseSortBy] = useState("dueAsc");
  const [selectedPromise, setSelectedPromise] = useState<PromiseToPay | null>(null);
  const [promiseSheetOpen, setPromiseSheetOpen] = useState(false);

  // ========================================================================
  // CORRESPONDENCE TAB STATE
  // ========================================================================
  const [corrSearch, setCorrSearch] = useState("");
  const [corrTypeFilter, setCorrTypeFilter] = useState("All");
  const [corrChannelFilter, setCorrChannelFilter] = useState("All");
  const [corrDirectionFilter, setCorrDirectionFilter] = useState("All");
  const [corrSortOrder, setCorrSortOrder] = useState("newest");
  const [corrViewMode, setCorrViewMode] = useState<"table" | "timeline">("table");
  const [selectedCorr, setSelectedCorr] = useState<Correspondence | null>(null);
  const [corrDetailOpen, setCorrDetailOpen] = useState(false);
  const [corrLogOpen, setCorrLogOpen] = useState(false);
  const [formCustomer, setFormCustomer] = useState("");
  const [formType, setFormType] = useState<CorrespondenceType>("General");
  const [formChannel, setFormChannel] = useState<CorrespondenceChannel>("Email");
  const [formDirection, setFormDirection] = useState<"Outbound" | "Inbound">("Outbound");
  const [formSubject, setFormSubject] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formOutcome, setFormOutcome] = useState("");
  const [formDuration, setFormDuration] = useState("");

  // ========================================================================
  // DATA HOOKS
  // ========================================================================

  // Accounts
  const acctFilters = useMemo<CollectionFilters>(() => {
    const f: CollectionFilters = { pageSize: 500 };
    if (acctSearch.trim()) f.search = acctSearch.trim();
    if (collectorFilter !== "all") f.collector = collectorFilter;
    if (severityFilter !== "all") f.severity = [severityFilter];
    if (quickView === "active") f.status = ["Active"];
    else if (quickView === "in-progress") f.status = ["In Progress", "Escalated"];
    else if (quickView === "resolved") f.status = ["Resolved", "Written Off"];
    if (activeSignal) f.bucket = [activeSignal];
    return f;
  }, [acctSearch, collectorFilter, severityFilter, quickView, activeSignal]);

  const { data: collections, total: acctTotal, loading: acctLoading, error: acctError, refetch: acctRefetch } = useCollections(acctFilters);

  const kpiFilters = useMemo<CollectionFilters>(() => {
    const f: CollectionFilters = { pageSize: 500 };
    if (quickView === "active") f.status = ["Active"];
    else if (quickView === "in-progress") f.status = ["In Progress", "Escalated"];
    else if (quickView === "resolved") f.status = ["Resolved", "Written Off"];
    return f;
  }, [quickView]);
  const { data: allRecords } = useCollections(kpiFilters);

  // Dunning
  const { data: dunningSequences, loading: dunningLoading } = useDunningSequences();
  const { data: dunningTemplates } = useDunningTemplates();

  // Promises
  const { data: promises, loading: promisesLoading } = usePromisesToPay();

  // Correspondence
  const { data: correspondence, total: corrTotal, loading: corrLoading, refetch: corrRefetch } = useCorrespondence();
  const { createCorrespondence } = useCorrespondenceMutation();

  const isLoading = acctLoading || dunningLoading || promisesLoading || corrLoading;

  // ========================================================================
  // ACCOUNTS COMPUTED
  // ========================================================================

  const collectors = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach((r) => { if (r.assignedTo) set.add(r.assignedTo); });
    return Array.from(set).sort();
  }, [allRecords]);

  const acctKpis = useMemo(() => {
    const totalOutstanding = allRecords.reduce((sum, r) => sum + r.totalOutstanding, 0);
    const pastDue = allRecords.reduce((sum, r) => sum + r.pastDueAmount, 0);
    const activeCount = allRecords.filter((r) => r.status !== "Resolved" && r.status !== "Written Off").length;
    const critHigh = allRecords.filter((r) => r.severity === "Critical" || r.severity === "High").length;
    return { totalOutstanding, pastDue, activeCount, critHigh };
  }, [allRecords]);

  const agingData = useMemo(() => {
    const buckets: Record<string, number> = { Current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    allRecords.forEach((r) => { buckets[r.agingBucket] = (buckets[r.agingBucket] || 0) + r.totalOutstanding; });
    const agingTotal = Object.values(buckets).reduce((a, b) => a + b, 0);
    return { buckets, total: agingTotal };
  }, [allRecords]);

  const signals = useMemo(() => {
    const byBucket: Record<string, number> = {};
    allRecords.forEach((r) => { byBucket[r.agingBucket] = (byBucket[r.agingBucket] || 0) + 1; });
    return (["90+", "61-90", "31-60", "1-30", "Current"] as const).map((key) => ({
      ...AGING_SIGNAL_META[key],
      key,
      count: byBucket[key] || 0,
    }));
  }, [allRecords]);

  // ========================================================================
  // DUNNING COMPUTED
  // ========================================================================

  const dunningKpis = useMemo(() => {
    const active = dunningSequences.filter((s) => s.status === "Active");
    const activeCount = active.length;
    const totalAmount = active.reduce((sum, s) => sum + s.totalAmount, 0);
    const avgProgress = activeCount > 0
      ? Math.round(active.reduce((sum, s) => sum + (s.currentStepNumber / s.totalSteps) * 100, 0) / activeCount)
      : 0;
    const actionsDueToday = active.filter((s) => isPastOrToday(s.nextActionDate)).length;
    return { activeCount, totalAmount, avgProgress, actionsDueToday };
  }, [dunningSequences]);

  const filteredDunning = useMemo(() => {
    let result = [...dunningSequences];
    if (dunningStatusFilter !== "All") result = result.filter((s) => s.status === dunningStatusFilter);
    if (dunningSearch.trim()) {
      const q = dunningSearch.toLowerCase();
      result = result.filter((s) => s.customerName.toLowerCase().includes(q));
    }
    return result;
  }, [dunningSequences, dunningStatusFilter, dunningSearch]);

  // ========================================================================
  // PROMISES COMPUTED
  // ========================================================================

  const promiseKpis = useMemo(() => {
    if (!promises.length) return { totalPromised: 0, totalReceived: 0, fulfillmentRate: 0, atRiskCount: 0, atRiskAmount: 0 };
    const activeStatuses: PromiseStatus[] = ["Active", "Due Today", "Overdue"];
    const totalPromised = promises.filter((p) => activeStatuses.includes(p.status)).reduce((s, p) => s + p.promisedAmount, 0);
    const fulfilled = promises.filter((p) => p.status === "Fulfilled");
    const totalReceived = fulfilled.reduce((s, p) => s + (p.receivedAmount || 0), 0);
    const brokenCount = promises.filter((p) => p.status === "Broken").length;
    const fulfillmentRate = fulfilled.length + brokenCount > 0 ? Math.round((fulfilled.length / (fulfilled.length + brokenCount)) * 100) : 0;
    const atRisk = promises.filter((p) => p.status === "Overdue" || p.status === "Broken");
    return { totalPromised, totalReceived, fulfillmentRate, atRiskCount: atRisk.length, atRiskAmount: atRisk.reduce((s, p) => s + p.promisedAmount, 0) };
  }, [promises]);

  const filteredPromises = useMemo(() => {
    let result = [...promises];
    if (promiseSearch.trim()) {
      const q = promiseSearch.toLowerCase();
      result = result.filter((p) => p.customerName.toLowerCase().includes(q));
    }
    if (promiseStatusFilter !== "All") result = result.filter((p) => p.status === promiseStatusFilter);
    if (promiseMethodFilter !== "All") result = result.filter((p) => p.paymentMethod === promiseMethodFilter);
    switch (promiseSortBy) {
      case "dueAsc": result.sort((a, b) => new Date(a.promisedDate).getTime() - new Date(b.promisedDate).getTime()); break;
      case "dueDesc": result.sort((a, b) => new Date(b.promisedDate).getTime() - new Date(a.promisedDate).getTime()); break;
      case "amountDesc": result.sort((a, b) => b.promisedAmount - a.promisedAmount); break;
      case "amountAsc": result.sort((a, b) => a.promisedAmount - b.promisedAmount); break;
    }
    return result;
  }, [promises, promiseSearch, promiseStatusFilter, promiseMethodFilter, promiseSortBy]);

  const relatedCollection: CollectionRecord | undefined = useMemo(() => {
    if (!selectedPromise) return undefined;
    return allRecords.find((c) => c.promiseToPayId === selectedPromise.id);
  }, [selectedPromise, allRecords]);

  // ========================================================================
  // CORRESPONDENCE COMPUTED
  // ========================================================================

  const corrKpis = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const thisWeek = correspondence.filter((c) => new Date(c.sentAt) >= weekAgo).length;
    const outbound = correspondence.filter((c) => c.direction === "Outbound").length;
    const inbound = correspondence.filter((c) => c.direction === "Inbound").length;
    return { total: correspondence.length, thisWeek, outbound, inbound };
  }, [correspondence]);

  const filteredCorr = useMemo(() => {
    let items = [...correspondence];
    if (corrSearch) {
      const q = corrSearch.toLowerCase();
      items = items.filter((c) => c.customerName.toLowerCase().includes(q) || (c.subject && c.subject.toLowerCase().includes(q)));
    }
    if (corrTypeFilter !== "All") items = items.filter((c) => c.type === corrTypeFilter);
    if (corrChannelFilter !== "All") items = items.filter((c) => c.channel === corrChannelFilter);
    if (corrDirectionFilter !== "All") items = items.filter((c) => c.direction === corrDirectionFilter);
    items.sort((a, b) => {
      const da = new Date(a.sentAt).getTime();
      const db = new Date(b.sentAt).getTime();
      return corrSortOrder === "newest" ? db - da : da - db;
    });
    return items;
  }, [correspondence, corrSearch, corrTypeFilter, corrChannelFilter, corrDirectionFilter, corrSortOrder]);

  const corrTimelineGroups = useMemo(() => {
    const groups: { label: string; items: Correspondence[] }[] = [];
    const groupOrder = ["Today", "Yesterday", "This Week", "Older"];
    const map = new Map<string, Correspondence[]>();
    for (const entry of filteredCorr) {
      const group = getRelativeDateGroup(entry.sentAt);
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(entry);
    }
    for (const label of groupOrder) {
      const items = map.get(label);
      if (items && items.length > 0) groups.push({ label, items });
    }
    return groups;
  }, [filteredCorr]);

  const uniqueCustomers = useMemo(() => {
    const names = Array.from(new Set(correspondence.map((c) => c.customerName)));
    const collectionNames = allRecords.map((c) => c.customerName);
    const all = Array.from(new Set([...names, ...collectionNames]));
    all.sort();
    return all;
  }, [correspondence, allRecords]);

  // ========================================================================
  // ACCOUNTS CALLBACKS
  // ========================================================================

  const openModal = useCallback(
    (type: typeof modalState.type, ids: Set<string>) => {
      let defaultMessage = "";
      if (type === "Dunning") defaultMessage = `Subject: Friendly reminder on past-due balance\n\nDear Accounts Payable,\n\nOur records show an outstanding balance that is past due.\n\nPlease advise on payment status.\n\nThank you,\n[Collector]`;
      else if (type === "Schedule") defaultMessage = "Discuss payment status and confirm remittance date.";
      else if (type === "Escalate") defaultMessage = "Customer unresponsive; request leadership outreach.";
      setModalData({ message: defaultMessage, when: "", notes: defaultMessage, date: "", amount: "" });
      setModalState({ open: true, type, ids });
    },
    []
  );

  const closeModal = useCallback(() => {
    setModalState({ open: false, type: null, ids: new Set() });
    setModalData({ message: "", when: "", notes: "", date: "", amount: "" });
  }, []);

  const applyAction = useCallback(() => {
    const { type, ids } = modalState;
    if (!type) return;
    setSelection(new Set());
    closeModal();
    toast.success(`${type} action applied to ${ids.size} record(s)`);
    acctRefetch();
  }, [modalState, closeModal, acctRefetch]);

  const handleExportCSV = useCallback(() => {
    const header = ["Customer", "Collector", "AR Balance", "Past Due", "Days Past Due", "Severity", "Dunning", "Recommendation"];
    const rows = collections.map((r) => [
      r.customerName, r.assignedTo || "\u2014", fmt(r.totalOutstanding), fmt(r.pastDueAmount),
      r.daysPastDue, r.severity, r.dunningSequenceId ? "Active" : "\u2014", r.recommendation || "\u2014",
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
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
  }, [collections]);

  const toggleSelectAll = useCallback(() => {
    setSelection(new Set(collections.map((r) => r.id)));
  }, [collections]);

  const toggleSelect = useCallback(
    (id: string, checked: boolean) => {
      const next = new Set(selection);
      if (checked) next.add(id); else next.delete(id);
      setSelection(next);
    },
    [selection]
  );

  // ========================================================================
  // CORRESPONDENCE CALLBACKS
  // ========================================================================

  const handleOpenLog = () => {
    setFormCustomer("");
    setFormType("General");
    setFormChannel("Email");
    setFormDirection("Outbound");
    setFormSubject("");
    setFormContent("");
    setFormContact("");
    setFormOutcome("");
    setFormDuration("");
    setCorrLogOpen(true);
  };

  const handleSubmitLog = async () => {
    if (!formCustomer || !formContent) return;
    const customerRecord = allRecords.find((c) => c.customerName === formCustomer);
    await createCorrespondence({
      customerId: customerRecord?.customerId ?? "unknown",
      customerName: formCustomer,
      type: formType,
      channel: formChannel,
      direction: formDirection,
      subject: formSubject || undefined,
      content: formContent,
      contactPerson: formContact || undefined,
      outcome: formOutcome || undefined,
      durationMinutes: formChannel === "Phone" && formDuration ? parseInt(formDuration, 10) : undefined,
      sentBy: "Current User",
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    setCorrLogOpen(false);
    corrRefetch();
  };

  // ========================================================================
  // KPI RENDERING (per tab)
  // ========================================================================

  const renderKpis = () => {
    if (activeTab === "accounts") {
      return (
        <div className="grid grid-cols-4 gap-3 mt-3">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Outstanding</div>
              <div className="text-lg font-bold text-slate-900">{fmt(acctKpis.totalOutstanding)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Past Due</div>
              <div className="text-lg font-bold text-slate-900">{fmt(acctKpis.pastDue)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Active Records</div>
              <div className="text-lg font-bold text-slate-900">{acctKpis.activeCount}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Critical / High</div>
              <div className="text-lg font-bold text-slate-900">{acctKpis.critHigh}</div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "dunning") {
      return (
        <div className="grid grid-cols-4 gap-3 mt-3">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Active Sequences</div>
              <div className="text-lg font-bold text-slate-900">{dunningKpis.activeCount}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
              <DollarSign className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Under Dunning</div>
              <div className="text-lg font-bold text-red-700">{formatUsd(dunningKpis.totalAmount)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Avg Progress</div>
              <div className="text-lg font-bold text-slate-900">{dunningKpis.avgProgress}%</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Actions Due Today</div>
              <div className={cn("text-lg font-bold", dunningKpis.actionsDueToday > 0 ? "text-amber-700" : "text-slate-900")}>{dunningKpis.actionsDueToday}</div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "promises") {
      return (
        <div className="grid grid-cols-4 gap-3 mt-3">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Promised</div>
              <div className="text-lg font-bold text-slate-900">{formatUsdCompact(promiseKpis.totalPromised)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Received</div>
              <div className="text-lg font-bold text-green-700">{formatUsdCompact(promiseKpis.totalReceived)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Fulfillment Rate</div>
              <div className="text-lg font-bold text-green-700">{promiseKpis.fulfillmentRate}%</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">At Risk</div>
              <div className="text-lg font-bold text-red-700">{promiseKpis.atRiskCount}</div>
            </div>
          </div>
        </div>
      );
    }

    // correspondence
    return (
      <div className="grid grid-cols-4 gap-3 mt-3">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
            <MessageSquare className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Correspondence</div>
            <div className="text-lg font-bold text-slate-900">{corrKpis.total}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">This Week</div>
            <div className="text-lg font-bold text-slate-900">{corrKpis.thisWeek}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Outbound / Inbound</div>
            <div className="text-lg font-bold text-slate-900">{corrKpis.outbound} <span className="text-sm font-normal text-slate-400">/</span> {corrKpis.inbound}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
            <Phone className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Channels Active</div>
            <div className="text-lg font-bold text-slate-900">5</div>
          </div>
        </div>
      </div>
    );
  };

  // ========================================================================
  // AGING WATERFALL SVG (Accounts only)
  // ========================================================================

  const renderAgingBar = () => {
    if (activeTab !== "accounts" || agingData.total === 0) return null;
    const segments = AGING_BUCKETS.map((bucket) => ({
      bucket,
      amount: agingData.buckets[bucket],
      pct: (agingData.buckets[bucket] / agingData.total) * 100,
      color: AGING_COLORS[bucket],
    })).filter((s) => s.pct > 0);

    let x = 0;
    return (
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-500">AR Aging Distribution</span>
          <div className="flex gap-3">
            {segments.map((s) => (
              <span key={s.bucket} className="flex items-center gap-1 text-[10px] text-slate-500">
                <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: s.color }} />
                {s.bucket}: {fmt(s.amount)}
              </span>
            ))}
          </div>
        </div>
        <svg width="100%" height="32" className="rounded overflow-hidden">
          {segments.map((s) => {
            const rect = (
              <rect key={s.bucket} x={`${x}%`} y="0" width={`${s.pct}%`} height="32" fill={s.color} opacity={0.85}>
                <title>{s.bucket}: {fmt(s.amount)} ({s.pct.toFixed(1)}%)</title>
              </rect>
            );
            x += s.pct;
            return rect;
          })}
        </svg>
      </div>
    );
  };

  // ========================================================================
  // SIDEBAR RENDERING (per tab)
  // ========================================================================

  const renderSidebar = () => {
    if (activeTab === "accounts") {
      return (
        <aside className="space-y-4 overflow-auto">
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Filters</h3>
            <div className="space-y-3">
              <Input placeholder="Search customer, collector..." value={acctSearch} onChange={(e) => setAcctSearch(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={collectorFilter} onValueChange={setCollectorFilter}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="All collectors" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All collectors</SelectItem>
                    {collectors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="All severities" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All severities</SelectItem>
                    <SelectItem value="Critical">Critical (90+)</SelectItem>
                    <SelectItem value="High">High (61-90)</SelectItem>
                    <SelectItem value="Medium">Medium (31-60)</SelectItem>
                    <SelectItem value="Low">Low (1-30)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Quick Views</h3>
            <div className="flex gap-2 flex-wrap">
              {QUICK_VIEWS.map((view) => (
                <Button key={view.value} variant={quickView === view.value ? "default" : "outline"} size="sm"
                  className={cn("rounded-full text-xs", quickView === view.value && "bg-primary hover:bg-primary/90")}
                  onClick={() => { setQuickView(view.value); setActiveSignal(null); }}
                >{view.label}</Button>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Signals</h3>
            <div className="space-y-2">
              {signals.map((signal) => (
                <div key={signal.key}
                  onClick={() => setActiveSignal(activeSignal === signal.key ? null : signal.key)}
                  className={cn("p-3 rounded-lg border cursor-pointer transition-colors",
                    activeSignal === signal.key ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{signal.name}</div>
                      <div className="text-xs text-slate-500">{signal.meta}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{signal.count}</Badge>
                      <Badge className={cn("text-xs", getSeverityColor(signal.severity))}>{signal.severity}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      );
    }

    if (activeTab === "dunning") {
      const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { Active: 0, Paused: 0, Completed: 0, Cancelled: 0 };
        dunningSequences.forEach((s) => { counts[s.status] = (counts[s.status] || 0) + 1; });
        return counts;
      }, [dunningSequences]);
      return (
        <aside className="space-y-4 overflow-auto">
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Search</h3>
            <Input placeholder="Search customer..." value={dunningSearch} onChange={(e) => setDunningSearch(e.target.value)} />
          </Card>
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Status</h3>
            <Select value={dunningStatusFilter} onValueChange={setDunningStatusFilter}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DUNNING_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Card>
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Summary</h3>
            <div className="space-y-2">
              {(["Active", "Paused", "Completed", "Cancelled"] as const).map((s) => (
                <div key={s} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{s}</span>
                  <Badge className={cn("text-xs", DUNNING_STATUS_BADGE[s].className)}>{statusCounts[s]}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      );
    }

    if (activeTab === "promises") {
      return (
        <aside className="space-y-4 overflow-auto">
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Search</h3>
            <Input placeholder="Search customer..." value={promiseSearch} onChange={(e) => setPromiseSearch(e.target.value)} />
          </Card>
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Filters</h3>
            <div className="space-y-3">
              <Select value={promiseStatusFilter} onValueChange={setPromiseStatusFilter}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROMISE_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={promiseMethodFilter} onValueChange={setPromiseMethodFilter}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROMISE_METHOD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={promiseSortBy} onValueChange={setPromiseSortBy}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROMISE_SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Pipeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Active</span><span className="font-medium">{promises.filter((p) => p.status === "Active").length}</span></div>
              <div className="flex justify-between"><span className="text-amber-600">Due Today</span><span className="font-medium">{promises.filter((p) => p.status === "Due Today").length}</span></div>
              <div className="flex justify-between"><span className="text-red-600">Overdue</span><span className="font-medium">{promises.filter((p) => p.status === "Overdue").length}</span></div>
              <div className="flex justify-between"><span className="text-green-600">Fulfilled</span><span className="font-medium">{promises.filter((p) => p.status === "Fulfilled").length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Broken</span><span className="font-medium">{promises.filter((p) => p.status === "Broken").length}</span></div>
            </div>
          </Card>
        </aside>
      );
    }

    // correspondence
    return (
      <aside className="space-y-4 overflow-auto">
        <Card className="p-4">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Search</h3>
          <Input placeholder="Search correspondence..." value={corrSearch} onChange={(e) => setCorrSearch(e.target.value)} />
        </Card>
        <Card className="p-4">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Filters</h3>
          <div className="space-y-3">
            <Select value={corrTypeFilter} onValueChange={setCorrTypeFilter}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CORR_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={corrChannelFilter} onValueChange={setCorrChannelFilter}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CORR_CHANNEL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={corrDirectionFilter} onValueChange={setCorrDirectionFilter}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CORR_DIRECTION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">View</h3>
          <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
            <button onClick={() => setCorrViewMode("table")}
              className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                corrViewMode === "table" ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
              <List className="h-3.5 w-3.5" /> Table
            </button>
            <button onClick={() => setCorrViewMode("timeline")}
              className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                corrViewMode === "timeline" ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
              <LayoutList className="h-3.5 w-3.5" /> Timeline
            </button>
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Channels</h3>
          <div className="space-y-2">
            {(["Email", "Phone", "Letter", "SMS", "Portal"] as const).map((ch) => {
              const count = correspondence.filter((c) => c.channel === ch).length;
              const maxCount = Math.max(...(["Email", "Phone", "Letter", "SMS", "Portal"] as CorrespondenceChannel[]).map((c) => correspondence.filter((x) => x.channel === c).length), 1);
              return (
                <div key={ch} className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 w-12 text-right">{ch}</span>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: CHANNEL_COLORS[ch], minWidth: count > 0 ? "6px" : "0px" }} />
                  </div>
                  <span className="text-xs font-medium text-slate-700 w-6">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </aside>
    );
  };

  // ========================================================================
  // MAIN TABLE RENDERING (per tab)
  // ========================================================================

  const renderMainContent = () => {
    // ------ ACCOUNTS ------
    if (activeTab === "accounts") {
      return (
        <Card className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b border-slate-200">
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>Select All</Button>
            <Button variant="outline" size="sm" disabled={selection.size === 0} onClick={() => openModal("Dunning", selection)}>
              <Mail className="h-3 w-3 mr-1" /> Send Dunning
            </Button>
            <Button variant="outline" size="sm" disabled={selection.size === 0} onClick={() => openModal("Schedule", selection)}>
              <Phone className="h-3 w-3 mr-1" /> Schedule Call
            </Button>
            <Button variant="outline" size="sm" disabled={selection.size === 0} onClick={() => openModal("Promise", selection)}>
              <DollarSign className="h-3 w-3 mr-1" /> Log Promise
            </Button>
            <Button variant="outline" size="sm" disabled={selection.size === 0} onClick={() => openModal("Escalate", selection)}>
              <AlertTriangle className="h-3 w-3 mr-1" /> Escalate
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-500">{acctTotal} records</span>
              <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="h-3 w-3 mr-1" /> Export CSV</Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {acctLoading ? (
              <div className="flex items-center justify-center h-full gap-2 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading collections...</span>
              </div>
            ) : acctError ? (
              <div className="flex items-center justify-center h-full text-red-500 text-sm">{acctError}</div>
            ) : collections.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No records match the current filters.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead className="text-xs">Customer</TableHead>
                    <TableHead className="text-xs">Collector</TableHead>
                    <TableHead className="text-xs text-right">AR Balance</TableHead>
                    <TableHead className="text-xs text-right">Past Due</TableHead>
                    <TableHead className="text-xs text-right">Days</TableHead>
                    <TableHead className="text-xs">Severity</TableHead>
                    <TableHead className="text-xs">Dunning</TableHead>
                    <TableHead className="text-xs">AI Recommendation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.map((r) => (
                    <TableRow key={r.id}
                      onClick={(e) => { if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return; setCurrentRecord(r); setIsDrawerOpen(true); }}
                      className={cn("cursor-pointer", currentRecord?.id === r.id && "bg-blue-50")}
                    >
                      <TableCell><Checkbox checked={selection.has(r.id)} onCheckedChange={(checked) => toggleSelect(r.id, checked === true)} /></TableCell>
                      <TableCell className="font-medium text-sm">{r.customerName}</TableCell>
                      <TableCell className="text-sm text-slate-600">{r.assignedTo || "\u2014"}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{fmt(r.totalOutstanding)}</TableCell>
                      <TableCell className="text-right text-sm">
                        {r.pastDueAmount > 0 ? <span className="text-red-600 font-medium">{fmt(r.pastDueAmount)}</span> : <span className="text-slate-400">\u2014</span>}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {r.daysPastDue > 0 ? (
                          <span className={cn("font-medium", r.daysPastDue >= 90 ? "text-red-600" : r.daysPastDue >= 61 ? "text-orange-600" : r.daysPastDue >= 31 ? "text-yellow-600" : "text-slate-600")}>{r.daysPastDue}</span>
                        ) : <span className="text-slate-400">\u2014</span>}
                      </TableCell>
                      <TableCell><Badge className={cn("text-xs", getSeverityColor(r.severity))}>{r.severity}</Badge></TableCell>
                      <TableCell className="text-sm">
                        {r.dunningSequenceId ? <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs">Active</Badge> : <span className="text-slate-400">\u2014</span>}
                      </TableCell>
                      <TableCell className="text-sm max-w-[260px] truncate">{r.recommendation || "\u2014"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
            <span>{selection.size} selected</span>
            {selection.size > 0 && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelection(new Set())}>Clear selection</Button>
            )}
          </div>
        </Card>
      );
    }

    // ------ DUNNING ------
    if (activeTab === "dunning") {
      return (
        <Card className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b border-slate-200">
            <span className="text-xs text-slate-500 ml-auto">{filteredDunning.length} sequence{filteredDunning.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs w-8" />
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                  <TableHead className="text-xs">Current Step</TableHead>
                  <TableHead className="text-xs text-center">Progress</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs">Next Action</TableHead>
                  <TableHead className="text-xs text-center">Invoices</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDunning.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-slate-400 py-8">No sequences match the current filters.</TableCell></TableRow>
                )}
                {filteredDunning.map((seq) => (
                  <React.Fragment key={seq.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-slate-50/50"
                      onClick={() => setExpandedRow(expandedRow === seq.id ? null : seq.id)}
                    >
                      <TableCell>
                        {expandedRow === seq.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{seq.customerName}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("text-xs", DUNNING_STATUS_BADGE[seq.status].className)}>{seq.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">{seq.currentStep}</TableCell>
                      <TableCell className="text-center">
                        <StepProgressDots currentStepNumber={seq.currentStepNumber} totalSteps={seq.totalSteps} steps={seq.steps} />
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatUsd(seq.totalAmount)}</TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {seq.nextActionDate ? (
                          <span className={cn(isPastOrToday(seq.nextActionDate) && seq.status === "Active" ? "text-amber-600 font-medium" : "")}>
                            {formatDate(seq.nextActionDate)}
                          </span>
                        ) : "\u2014"}
                      </TableCell>
                      <TableCell className="text-center text-sm">{seq.invoiceIds.length}</TableCell>
                    </TableRow>
                    {expandedRow === seq.id && (
                      <TableRow>
                        <TableCell colSpan={8} className="p-0">
                          <StepTimeline steps={seq.steps} currentStepNumber={seq.currentStepNumber} totalSteps={seq.totalSteps} templates={dunningTemplates} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      );
    }

    // ------ PROMISES ------
    if (activeTab === "promises") {
      return (
        <Card className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b border-slate-200">
            <span className="text-xs text-slate-500 ml-auto">{filteredPromises.length} of {promises.length} promises</span>
          </div>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs text-right">Promised</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs text-center">Method</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                  <TableHead className="text-xs text-right">Received</TableHead>
                  <TableHead className="text-xs text-center">Invoices</TableHead>
                  <TableHead className="text-xs">Captured By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromises.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-slate-400 py-8">No promises match the current filters.</TableCell></TableRow>
                )}
                {filteredPromises.map((p) => {
                  const dateIsPast = isPast(p.promisedDate) && p.status !== "Fulfilled" && p.status !== "Cancelled";
                  return (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-slate-50/50" onClick={() => { setSelectedPromise(p); setPromiseSheetOpen(true); }}>
                      <TableCell className="font-medium text-sm">{p.customerName}</TableCell>
                      <TableCell className="text-right font-bold text-sm">{formatUsd(p.promisedAmount)}</TableCell>
                      <TableCell>
                        <span className={cn("text-sm", dateIsPast ? "text-red-600 font-medium" : "text-slate-700")}>{formatDate(p.promisedDate)}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {p.paymentMethod ? <Badge className={METHOD_BADGE_STYLES[p.paymentMethod] || "bg-slate-50 text-slate-600 border-slate-200"}>{p.paymentMethod}</Badge> : <span className="text-slate-400 text-sm">--</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.status === "Broken" ? <Badge variant="destructive">{p.status}</Badge>
                          : p.status === "Cancelled" ? <Badge variant="outline">{p.status}</Badge>
                          : <Badge className={PROMISE_STATUS_BADGE[p.status]}>{p.status}</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.receivedAmount ? <span className="text-sm font-medium text-green-700">{formatUsd(p.receivedAmount)}</span> : <span className="text-slate-400">\u2014</span>}
                      </TableCell>
                      <TableCell className="text-center text-sm">{p.invoiceIds?.length || 0}</TableCell>
                      <TableCell className="text-sm text-slate-600">{p.capturedBy}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      );
    }

    // ------ CORRESPONDENCE ------
    return (
      <Card className="flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 p-3 border-b border-slate-200">
          <Select value={corrSortOrder} onValueChange={setCorrSortOrder}>
            <SelectTrigger className="w-[140px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-slate-500 ml-auto">{filteredCorr.length} entries</span>
          <Button size="sm" onClick={handleOpenLog}><Plus className="h-4 w-4 mr-1" /> Log New</Button>
        </div>
        <div className="flex-1 overflow-auto">
          {filteredCorr.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">No correspondence found.</div>
          ) : corrViewMode === "table" ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Channel</TableHead>
                  <TableHead className="text-xs">Direction</TableHead>
                  <TableHead className="text-xs">Subject</TableHead>
                  <TableHead className="text-xs">Sent By</TableHead>
                  <TableHead className="text-xs w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCorr.map((entry) => (
                  <TableRow key={entry.id} className="cursor-pointer hover:bg-slate-50/50" onClick={() => { setSelectedCorr(entry); setCorrDetailOpen(true); }}>
                    <TableCell className="text-xs text-slate-600 whitespace-nowrap">{formatDateTime(entry.sentAt)}</TableCell>
                    <TableCell>
                      <Link href={`/workbench/order-to-cash/collections/customer/${entry.customerId}`}
                        className="text-sm font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                        {entry.customerName}
                      </Link>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={cn("text-xs", TYPE_BADGE[entry.type])}>{entry.type}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        {CORR_CHANNEL_ICON[entry.channel]} {entry.channel}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        {entry.direction === "Outbound" ? <ArrowUpRight className="h-3.5 w-3.5 text-green-600" /> : <ArrowDownLeft className="h-3.5 w-3.5 text-blue-600" />}
                        <span className={entry.direction === "Outbound" ? "text-green-700" : "text-blue-700"}>{entry.direction}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 max-w-[200px] truncate">{entry.subject || <span className="italic text-slate-400">(No subject)</span>}</TableCell>
                    <TableCell className="text-xs text-slate-600">{entry.sentBy}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setSelectedCorr(entry); setCorrDetailOpen(true); }}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            /* Timeline View */
            <div className="p-4 space-y-6">
              {corrTimelineGroups.map((group) => (
                <div key={group.label}>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{group.label}</h3>
                  <div className="relative ml-4 border-l-2 border-slate-200 space-y-4 pl-6">
                    {group.items.map((entry) => (
                      <div key={entry.id} className="relative cursor-pointer" onClick={() => { setSelectedCorr(entry); setCorrDetailOpen(true); }}>
                        <div className="absolute -left-[31px] top-3 h-3 w-3 rounded-full border-2 border-white" style={{ backgroundColor: CHANNEL_COLORS[entry.channel] }} />
                        <Card className="p-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs text-slate-400">{formatDateTime(entry.sentAt)}</span>
                            <Badge variant="outline" className={cn("text-xs", TYPE_BADGE[entry.type])}>{entry.type}</Badge>
                            <span className="text-xs text-slate-500 flex items-center gap-1">{CORR_CHANNEL_ICON[entry.channel]} {entry.channel}</span>
                            {entry.direction === "Outbound" ? <ArrowUpRight className="h-3 w-3 text-green-600" /> : <ArrowDownLeft className="h-3 w-3 text-blue-600" />}
                          </div>
                          <Link href={`/workbench/order-to-cash/collections/customer/${entry.customerId}`}
                            className="text-sm font-semibold text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                            {entry.customerName}
                          </Link>
                          {entry.subject && <p className="text-sm text-slate-800 mt-0.5">{entry.subject}</p>}
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{entry.content}</p>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  };

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading) {
    return (
      <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
        <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
          <Breadcrumb activeRoute="workbench/order-to-cash/collections" className="mb-1.5" />
          <div className="flex items-center gap-3 mb-1">
            <Wallet className="h-6 w-6 text-slate-700" />
            <h1 className="text-2xl font-bold text-slate-900 mt-2">Collections Workbench</h1>
          </div>
          <p className="text-sm text-slate-500">Unified collections management — accounts, dunning, promises, and correspondence</p>
          <div className="border-b border-slate-200 mt-3" />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading collections data...</span>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* ---- Header ---- */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="workbench/order-to-cash/collections" className="mb-1.5" />
        <div className="flex items-center justify-between gap-4 mt-1">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Wallet className="h-6 w-6 text-slate-700" />
              <h1 className="text-2xl font-bold text-slate-900 mt-2">Collections Workbench</h1>
            </div>
            <p className="text-sm text-slate-500">Unified collections management — accounts, dunning, promises, and correspondence</p>
          </div>
        </div>

        {/* KPI Row */}
        {renderKpis()}

        {/* Aging waterfall (accounts only) */}
        {renderAgingBar()}

        {/* Tab bar */}
        <div className="flex items-center gap-1 mt-3">
          {(
            [
              { id: "accounts", label: "Accounts" },
              { id: "dunning", label: "Dunning" },
              { id: "promises", label: "Promises" },
              { id: "correspondence", label: "Correspondence" },
            ] as { id: WorkbenchTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2",
                activeTab === tab.id
                  ? "bg-primary/5 text-primary border-primary"
                  : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="border-b border-slate-200" />
      </header>

      {/* ---- Body ---- */}
      <div className="flex-1 grid grid-cols-[320px_1fr] gap-4 p-4 overflow-hidden">
        {renderSidebar()}
        {renderMainContent()}
      </div>

      {/* ======= Accounts Detail Drawer ======= */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="right">
        <DrawerContent className="h-full w-[480px] ml-auto">
          <DrawerHeader className="border-b border-slate-200">
            <div className="flex items-center justify-between">
              <DrawerTitle>Account Details</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><X className="h-4 w-4" /></Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          {currentRecord && (
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <Button variant="outline" size="sm" onClick={() => (window.location.href = `/workbench/order-to-cash/collections/customer/${currentRecord.customerId}`)}>
                <ExternalLink className="h-3 w-3 mr-1" /> View Customer 360
              </Button>
              <div className="grid grid-cols-[140px_1fr] gap-y-3 gap-x-2 text-sm">
                <div className="text-slate-500">Customer</div><div className="font-medium">{currentRecord.customerName}</div>
                <div className="text-slate-500">Status</div><div><Badge className={cn("text-xs", getStatusColor(currentRecord.status))}>{currentRecord.status}</Badge></div>
                <div className="text-slate-500">Collector</div><div>{currentRecord.assignedTo || "Unassigned"}</div>
                <div className="text-slate-500">AR Balance</div><div className="font-medium">{fmt(currentRecord.totalOutstanding)}</div>
                <div className="text-slate-500">Past Due</div><div className="font-medium text-red-600">{currentRecord.pastDueAmount > 0 ? fmt(currentRecord.pastDueAmount) : "\u2014"}</div>
                <div className="text-slate-500">Days Past Due</div><div>{currentRecord.daysPastDue > 0 ? `${currentRecord.daysPastDue} days` : "\u2014"}</div>
                <div className="text-slate-500">Open Invoices</div><div>{currentRecord.openInvoiceCount}</div>
                <div className="text-slate-500">Severity</div><div><Badge className={cn("text-xs", getSeverityColor(currentRecord.severity))}>{currentRecord.severity}</Badge></div>
                <div className="text-slate-500">Dunning</div><div>{currentRecord.dunningSequenceId ? <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs">Active ({currentRecord.dunningSequenceId})</Badge> : "\u2014"}</div>
                <div className="text-slate-500">Promise to Pay</div><div>{currentRecord.promiseToPayId || "\u2014"}</div>
                <div className="text-slate-500">Last Contact</div><div>{currentRecord.lastContactDate ? new Date(currentRecord.lastContactDate).toLocaleDateString() : "\u2014"}</div>
                <div className="text-slate-500">Next Follow-Up</div><div>{currentRecord.nextFollowUpDate ? new Date(currentRecord.nextFollowUpDate).toLocaleDateString() : "\u2014"}</div>
              </div>
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">Risk Score</span>
                  <span className="text-sm font-bold">{currentRecord.riskScore} / 100</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", getRiskColor(currentRecord.riskScore))} style={{ width: `${currentRecord.riskScore}%` }} />
                </div>
              </div>
              {currentRecord.recommendation && (
                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">AI Recommendation</h4>
                  <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800">
                    <TrendingUp className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />{currentRecord.recommendation}
                  </div>
                </div>
              )}
              {currentRecord.notes && (
                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">Notes</h4>
                  <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">{currentRecord.notes}</div>
                </div>
              )}
              <div className="pt-4 flex gap-2 flex-wrap">
                <Button className="bg-primary hover:bg-primary/90" size="sm" onClick={() => openModal("Dunning", new Set([currentRecord.id]))}><Mail className="h-3 w-3 mr-1" /> Send Dunning</Button>
                <Button variant="outline" size="sm" onClick={() => openModal("Schedule", new Set([currentRecord.id]))}><Phone className="h-3 w-3 mr-1" /> Schedule</Button>
                <Button variant="outline" size="sm" onClick={() => openModal("Promise", new Set([currentRecord.id]))}><DollarSign className="h-3 w-3 mr-1" /> Promise</Button>
                <Button variant="outline" size="sm" onClick={() => openModal("Escalate", new Set([currentRecord.id]))}><AlertTriangle className="h-3 w-3 mr-1" /> Escalate</Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* ======= Promises Detail Sheet ======= */}
      <Sheet open={promiseSheetOpen} onOpenChange={setPromiseSheetOpen}>
        <SheetContent className="sm:max-w-[480px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-base">Promise Details</SheetTitle>
            <SheetDescription className="text-xs text-slate-500">View and manage promise-to-pay commitment</SheetDescription>
          </SheetHeader>
          {selectedPromise && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-2 text-sm">
                <div className="text-slate-500">Customer</div><div className="font-medium">{selectedPromise.customerName}</div>
                <div className="text-slate-500">Status</div>
                <div>
                  {selectedPromise.status === "Broken" ? <Badge variant="destructive">{selectedPromise.status}</Badge>
                    : selectedPromise.status === "Cancelled" ? <Badge variant="outline">{selectedPromise.status}</Badge>
                    : <Badge className={PROMISE_STATUS_BADGE[selectedPromise.status]}>{selectedPromise.status}</Badge>}
                </div>
                <div className="text-slate-500">Promised</div><div className="font-bold">{formatUsd(selectedPromise.promisedAmount)}</div>
                <div className="text-slate-500">Date</div>
                <div className={cn(isPast(selectedPromise.promisedDate) && selectedPromise.status !== "Fulfilled" ? "text-red-600 font-medium" : "")}>
                  {formatDate(selectedPromise.promisedDate)}
                  {isPast(selectedPromise.promisedDate) && selectedPromise.status !== "Fulfilled" && selectedPromise.status !== "Cancelled" && (
                    <span className="ml-2 text-red-500 text-xs">({getDaysOverdue(selectedPromise.promisedDate)} days overdue)</span>
                  )}
                </div>
                <div className="text-slate-500">Method</div><div>{selectedPromise.paymentMethod || "\u2014"}</div>
                <div className="text-slate-500">Captured By</div><div>{selectedPromise.capturedBy}</div>
                {selectedPromise.receivedAmount != null && (
                  <>
                    <div className="text-slate-500">Received</div>
                    <div className="text-green-700 font-medium">{formatUsd(selectedPromise.receivedAmount)}</div>
                  </>
                )}
                {selectedPromise.invoiceIds && selectedPromise.invoiceIds.length > 0 && (
                  <>
                    <div className="text-slate-500">Invoices</div>
                    <div className="flex gap-1 flex-wrap">{selectedPromise.invoiceIds.map((inv) => <Badge key={inv} variant="outline" className="text-xs">{inv}</Badge>)}</div>
                  </>
                )}
              </div>
              {selectedPromise.notes && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">Notes</h4>
                  <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 border border-slate-200">{selectedPromise.notes}</div>
                </div>
              )}
              {relatedCollection && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">Related Account</h4>
                  <div className="bg-slate-50 rounded-lg p-3 text-sm border border-slate-200">
                    <div className="font-medium">{relatedCollection.customerName}</div>
                    <div className="text-slate-500 text-xs mt-1">AR: {fmt(relatedCollection.totalOutstanding)} | Past Due: {fmt(relatedCollection.pastDueAmount)}</div>
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {(selectedPromise.status === "Active" || selectedPromise.status === "Due Today" || selectedPromise.status === "Overdue") && (
                  <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { toast.success("Marked as Fulfilled"); setPromiseSheetOpen(false); }}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Mark Fulfilled
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => { toast.error("Marked as Broken"); setPromiseSheetOpen(false); }}>
                      Mark Broken
                    </Button>
                  </>
                )}
                {(selectedPromise.status === "Active" || selectedPromise.status === "Due Today") && (
                  <Button variant="outline" size="sm" onClick={() => { toast.info("Promise cancelled"); setPromiseSheetOpen(false); }}>Cancel</Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ======= Correspondence Detail Sheet ======= */}
      <Sheet open={corrDetailOpen} onOpenChange={setCorrDetailOpen}>
        <SheetContent className="sm:max-w-[480px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-base">Correspondence Detail</SheetTitle>
            <SheetDescription className="text-xs text-slate-500">Full details of the selected entry</SheetDescription>
          </SheetHeader>
          {selectedCorr && (
            <div className="mt-4 space-y-5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn("text-xs", TYPE_BADGE[selectedCorr.type])}>{selectedCorr.type}</Badge>
                <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
                  <span className="flex items-center gap-1">{CORR_CHANNEL_ICON[selectedCorr.channel]} {selectedCorr.channel}</span>
                </Badge>
                <Badge variant="outline" className={cn("text-xs", selectedCorr.direction === "Outbound" ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200")}>
                  {selectedCorr.direction === "Outbound" ? <span className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> Outbound</span> : <span className="flex items-center gap-1"><ArrowDownLeft className="h-3 w-3" /> Inbound</span>}
                </Badge>
              </div>
              <div><p className="text-xs font-medium text-slate-500 mb-1">Customer</p>
                <Link href={`/workbench/order-to-cash/collections/customer/${selectedCorr.customerId}`} className="text-sm font-semibold text-primary hover:underline">{selectedCorr.customerName}</Link>
              </div>
              <div><p className="text-xs font-medium text-slate-500 mb-1">Date / Time</p><p className="text-sm text-slate-800">{formatDateTime(selectedCorr.sentAt)}</p></div>
              <div><p className="text-xs font-medium text-slate-500 mb-1">Subject</p><p className="text-sm text-slate-800">{selectedCorr.subject || <span className="italic text-slate-400">(No subject)</span>}</p></div>
              <div><p className="text-xs font-medium text-slate-500 mb-1">Content</p>
                <div className="bg-slate-50 rounded-lg p-3"><p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedCorr.content}</p></div>
              </div>
              {selectedCorr.contactPerson && <div><p className="text-xs font-medium text-slate-500 mb-1">Contact Person</p><p className="text-sm text-slate-800">{selectedCorr.contactPerson}</p></div>}
              {selectedCorr.outcome && <div><p className="text-xs font-medium text-slate-500 mb-1">Outcome</p><div className="bg-green-50 rounded-lg p-3"><p className="text-sm text-green-800">{selectedCorr.outcome}</p></div></div>}
              {selectedCorr.channel === "Phone" && selectedCorr.durationMinutes != null && (
                <div><p className="text-xs font-medium text-slate-500 mb-1">Duration</p><p className="text-sm text-slate-800">{selectedCorr.durationMinutes} minutes</p></div>
              )}
              <div><p className="text-xs font-medium text-slate-500 mb-1">Sent By</p><p className="text-sm text-slate-800">{selectedCorr.sentBy}</p></div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ======= Correspondence Log New Sheet ======= */}
      <Sheet open={corrLogOpen} onOpenChange={setCorrLogOpen}>
        <SheetContent className="sm:max-w-[480px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-base">Log Correspondence</SheetTitle>
            <SheetDescription className="text-xs text-slate-500">Record a new communication entry</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div>
              <Label className="text-xs mb-1">Customer</Label>
              <Select value={formCustomer} onValueChange={setFormCustomer}>
                <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
                <SelectContent>
                  {uniqueCustomers.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs mb-1">Type</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as CorrespondenceType)}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CORR_TYPE_OPTIONS.filter((o) => o.value !== "All").map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1">Channel</Label>
                <Select value={formChannel} onValueChange={(v) => setFormChannel(v as CorrespondenceChannel)}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CORR_CHANNEL_OPTIONS.filter((o) => o.value !== "All").map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1">Direction</Label>
                <Select value={formDirection} onValueChange={(v) => setFormDirection(v as "Outbound" | "Inbound")}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Outbound">Outbound</SelectItem>
                    <SelectItem value="Inbound">Inbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1">Subject</Label>
              <Input value={formSubject} onChange={(e) => setFormSubject(e.target.value)} placeholder="Subject line..." />
            </div>
            <div>
              <Label className="text-xs mb-1">Content</Label>
              <Textarea rows={4} value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="Correspondence content..." />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs mb-1">Contact Person</Label>
                <Input value={formContact} onChange={(e) => setFormContact(e.target.value)} placeholder="Name..." />
              </div>
              <div>
                <Label className="text-xs mb-1">Outcome</Label>
                <Input value={formOutcome} onChange={(e) => setFormOutcome(e.target.value)} placeholder="Result..." />
              </div>
            </div>
            {formChannel === "Phone" && (
              <div>
                <Label className="text-xs mb-1">Duration (minutes)</Label>
                <Input type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="0" />
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button className="bg-primary hover:bg-primary/90" disabled={!formCustomer || !formContent} onClick={handleSubmitLog}>Save</Button>
              <Button variant="outline" onClick={() => setCorrLogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ======= Accounts Action Dialog ======= */}
      <Dialog open={modalState.open} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalState.type === "Dunning" && "Send Dunning Letter"}
              {modalState.type === "Schedule" && "Schedule Call"}
              {modalState.type === "Promise" && "Log Promise to Pay"}
              {modalState.type === "Escalate" && "Escalate to Finance Lead"}
            </DialogTitle>
            <DialogDescription>
              {modalState.type === "Dunning" && `Send a dunning letter to ${modalState.ids.size} record(s).`}
              {modalState.type === "Schedule" && `Schedule a call for ${modalState.ids.size} record(s).`}
              {modalState.type === "Promise" && `Log a promise to pay for ${modalState.ids.size} record(s).`}
              {modalState.type === "Escalate" && `Escalate ${modalState.ids.size} record(s) to finance lead.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {modalState.type === "Dunning" && (
              <>
                <Label>Email body (auto-prepared):</Label>
                <Textarea rows={8} value={modalData.message} onChange={(e) => setModalData({ ...modalData, message: e.target.value })} />
              </>
            )}
            {modalState.type === "Schedule" && (
              <>
                <div><Label>Proposed date/time:</Label><Input type="datetime-local" value={modalData.when} onChange={(e) => setModalData({ ...modalData, when: e.target.value })} /></div>
                <div><Label>Notes for calendar invite:</Label><Textarea rows={4} value={modalData.notes} onChange={(e) => setModalData({ ...modalData, notes: e.target.value })} /></div>
              </>
            )}
            {modalState.type === "Promise" && (
              <>
                <div><Label>Promised payment date:</Label><Input type="date" value={modalData.date} onChange={(e) => setModalData({ ...modalData, date: e.target.value })} /></div>
                <div><Label>Promised amount (USD):</Label><Input type="number" min="0" step="100" value={modalData.amount} onChange={(e) => setModalData({ ...modalData, amount: e.target.value })} /></div>
              </>
            )}
            {modalState.type === "Escalate" && (
              <>
                <Label>Context for escalation:</Label>
                <Textarea rows={4} value={modalData.message} onChange={(e) => setModalData({ ...modalData, message: e.target.value })} />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={applyAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
