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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download,
  Mail,
  Phone,
  DollarSign,
  AlertTriangle,
  X,
  ExternalLink,
  Loader2,
  TrendingUp,
  CheckCircle,
  Search,
  ListFilter,
  ArrowRight,
  Eye,
  FileText,
  MessageSquare,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  Globe,
  Plus,
  List,
  LayoutList,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

type WorkbenchTab = "accounts" | "dunning" | "promises" | "correspondence" | "disputes";
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
  { value: "Check", label: "Check" },
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
// Disputes tab types, constants & mock data
// ===========================================================================

type DisputeReason = "Price Discrepancy" | "Damaged Goods" | "Service Issue" | "Billing Error" | "Warranty Claim";
type DisputeStatus = "Open" | "Under Review" | "Escalated" | "Resolved" | "Closed";
type DisputePriority = "High" | "Medium" | "Low";

interface DisputeRecord {
  id: string;
  customerName: string;
  invoiceNumber: string;
  disputeAmount: number;
  originalAmount: number;
  reason: DisputeReason;
  status: DisputeStatus;
  priority: DisputePriority;
  createdDate: string;
  dueDate: string;
  assignee: string;
  aging: number;
}

const MOCK_DISPUTES: DisputeRecord[] = [
  { id: "DSP-001", customerName: "Acme Corporation", invoiceNumber: "INV-2026-1042", disputeAmount: 45000, originalAmount: 120000, reason: "Price Discrepancy", status: "Open", priority: "High", createdDate: "2026-01-15", dueDate: "2026-02-28", assignee: "Sarah Chen", aging: 39 },
  { id: "DSP-002", customerName: "Globex Industries", invoiceNumber: "INV-2026-1078", disputeAmount: 12500, originalAmount: 38000, reason: "Damaged Goods", status: "Under Review", priority: "Medium", createdDate: "2026-02-01", dueDate: "2026-03-15", assignee: "Mike Johnson", aging: 22 },
  { id: "DSP-003", customerName: "Initech LLC", invoiceNumber: "INV-2026-0987", disputeAmount: 150000, originalAmount: 310000, reason: "Service Issue", status: "Escalated", priority: "High", createdDate: "2026-01-09", dueDate: "2026-02-20", assignee: "Lisa Wang", aging: 45 },
  { id: "DSP-004", customerName: "Wayne Enterprises", invoiceNumber: "INV-2026-1105", disputeAmount: 8700, originalAmount: 25000, reason: "Billing Error", status: "Resolved", priority: "Low", createdDate: "2026-02-10", dueDate: "2026-03-10", assignee: "David Park", aging: 13 },
  { id: "DSP-005", customerName: "Stark Solutions", invoiceNumber: "INV-2026-1120", disputeAmount: 67000, originalAmount: 185000, reason: "Warranty Claim", status: "Open", priority: "High", createdDate: "2026-02-05", dueDate: "2026-03-05", assignee: "Sarah Chen", aging: 18 },
  { id: "DSP-006", customerName: "Umbrella Corp", invoiceNumber: "INV-2026-0945", disputeAmount: 3200, originalAmount: 9500, reason: "Price Discrepancy", status: "Closed", priority: "Low", createdDate: "2026-02-18", dueDate: "2026-03-18", assignee: "Emily Roberts", aging: 5 },
  { id: "DSP-007", customerName: "Cyberdyne Systems", invoiceNumber: "INV-2026-1060", disputeAmount: 28900, originalAmount: 74000, reason: "Damaged Goods", status: "Under Review", priority: "Medium", createdDate: "2026-01-28", dueDate: "2026-03-01", assignee: "Mike Johnson", aging: 26 },
  { id: "DSP-008", customerName: "Massive Dynamic", invoiceNumber: "INV-2026-1089", disputeAmount: 95000, originalAmount: 220000, reason: "Service Issue", status: "Escalated", priority: "High", createdDate: "2026-01-20", dueDate: "2026-02-25", assignee: "Lisa Wang", aging: 34 },
  { id: "DSP-009", customerName: "Hooli Inc", invoiceNumber: "INV-2026-1130", disputeAmount: 5400, originalAmount: 16000, reason: "Billing Error", status: "Resolved", priority: "Low", createdDate: "2026-02-20", dueDate: "2026-03-20", assignee: "David Park", aging: 3 },
  { id: "DSP-010", customerName: "Oscorp Technologies", invoiceNumber: "INV-2026-1098", disputeAmount: 41500, originalAmount: 98000, reason: "Warranty Claim", status: "Open", priority: "Medium", createdDate: "2026-02-08", dueDate: "2026-03-08", assignee: "Sarah Chen", aging: 15 },
];

const MOCK_TIMELINES: Record<string, { date: string; description: string }[]> = {
  "DSP-001": [
    { date: "2026-01-15", description: "Dispute filed by Acme Corporation citing pricing mismatch on contract terms." },
    { date: "2026-01-18", description: "Assigned to Sarah Chen for initial review." },
    { date: "2026-01-25", description: "Customer provided supporting purchase order documentation." },
    { date: "2026-02-05", description: "Internal pricing audit initiated for contract INV-2026-1042." },
  ],
  "DSP-002": [
    { date: "2026-02-01", description: "Dispute raised for damaged shipment received at Globex warehouse." },
    { date: "2026-02-03", description: "Photographic evidence submitted by customer logistics team." },
    { date: "2026-02-10", description: "Carrier claim filed; under review by Mike Johnson." },
  ],
  "DSP-003": [
    { date: "2026-01-09", description: "Initech escalated SLA breach complaint covering Q4 service delivery." },
    { date: "2026-01-14", description: "Service delivery logs pulled for analysis." },
    { date: "2026-01-22", description: "Escalated to VP of Operations for resolution." },
    { date: "2026-02-01", description: "Mediation meeting scheduled with Initech leadership." },
  ],
};

const DEFAULT_TIMELINE = [
  { date: "2026-02-01", description: "Dispute created and logged in the system." },
  { date: "2026-02-05", description: "Assigned to analyst for initial review." },
  { date: "2026-02-12", description: "Supporting documentation requested from customer." },
];

const DISPUTE_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "Open", label: "Open" },
  { value: "Under Review", label: "Under Review" },
  { value: "Escalated", label: "Escalated" },
  { value: "Resolved", label: "Resolved" },
  { value: "Closed", label: "Closed" },
];

const DISPUTE_PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Priorities" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

const DISPUTE_REASON_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Reasons" },
  { value: "Price Discrepancy", label: "Price Discrepancy" },
  { value: "Damaged Goods", label: "Damaged Goods" },
  { value: "Service Issue", label: "Service Issue" },
  { value: "Billing Error", label: "Billing Error" },
  { value: "Warranty Claim", label: "Warranty Claim" },
];

const DISPUTE_STATUS_BADGE: Record<DisputeStatus, string> = {
  Open: "bg-blue-50 text-blue-700 border-blue-200",
  "Under Review": "bg-amber-50 text-amber-700 border-amber-200",
  Escalated: "bg-red-50 text-red-700 border-red-200",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Closed: "bg-slate-100 text-slate-500 border-slate-200",
};

const DISPUTE_PRIORITY_BADGE: Record<DisputePriority, string> = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-100 text-slate-500 border-slate-200",
};

const DISPUTE_REASON_BADGE: Record<DisputeReason, string> = {
  "Price Discrepancy": "bg-violet-50 text-violet-700 border-violet-200",
  "Damaged Goods": "bg-orange-50 text-orange-700 border-orange-200",
  "Service Issue": "bg-rose-50 text-rose-700 border-rose-200",
  "Billing Error": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Warranty Claim": "bg-teal-50 text-teal-700 border-teal-200",
};

const getAgingDisplay = (aging: number) => {
  if (aging > 30) return "text-red-600";
  if (aging > 15) return "text-amber-600";
  return "text-emerald-600";
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
                      <Loader2 className="h-3 w-3" />
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
  // DISPUTES TAB STATE
  // ========================================================================
  const [disputeSearch, setDisputeSearch] = useState("");
  const [disputeStatusFilter, setDisputeStatusFilter] = useState("all");
  const [disputePriorityFilter, setDisputePriorityFilter] = useState("all");
  const [disputeReasonFilter, setDisputeReasonFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<DisputeRecord | null>(null);
  const [disputeSheetOpen, setDisputeSheetOpen] = useState(false);

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

  const dunningStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { Active: 0, Paused: 0, Completed: 0, Cancelled: 0 };
    dunningSequences.forEach((s) => { counts[s.status] = (counts[s.status] || 0) + 1; });
    return counts;
  }, [dunningSequences]);

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
  // DISPUTES COMPUTED
  // ========================================================================

  const filteredDisputes = useMemo(() => {
    let result = [...MOCK_DISPUTES];
    if (disputeSearch.trim()) {
      const q = disputeSearch.toLowerCase();
      result = result.filter((d) => d.customerName.toLowerCase().includes(q) || d.invoiceNumber.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
    }
    if (disputeStatusFilter !== "all") result = result.filter((d) => d.status === disputeStatusFilter);
    if (disputePriorityFilter !== "all") result = result.filter((d) => d.priority === disputePriorityFilter);
    if (disputeReasonFilter !== "all") result = result.filter((d) => d.reason === disputeReasonFilter);
    return result;
  }, [disputeSearch, disputeStatusFilter, disputePriorityFilter, disputeReasonFilter]);

  const disputeKpis = useMemo(() => {
    const open = MOCK_DISPUTES.filter((d) => d.status === "Open" || d.status === "Under Review" || d.status === "Escalated");
    const totalDisputedAmount = MOCK_DISPUTES.reduce((s, d) => s + d.disputeAmount, 0);
    const avgAging = MOCK_DISPUTES.length > 0 ? Math.round(MOCK_DISPUTES.reduce((s, d) => s + d.aging, 0) / MOCK_DISPUTES.length) : 0;
    return { total: MOCK_DISPUTES.length, openCount: open.length, totalDisputedAmount, avgAging };
  }, []);

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
  // FILTER ACTIVE COUNT (for filter popover badge)
  // ========================================================================

  const activeFilterCount = useMemo(() => {
    if (activeTab === "accounts") {
      return [collectorFilter !== "all", severityFilter !== "all"].filter(Boolean).length;
    }
    if (activeTab === "dunning") {
      return dunningStatusFilter !== "All" ? 1 : 0;
    }
    if (activeTab === "promises") {
      return [promiseStatusFilter !== "All", promiseMethodFilter !== "All", promiseSortBy !== "dueAsc"].filter(Boolean).length;
    }
    if (activeTab === "disputes") {
      return [disputeStatusFilter !== "all", disputePriorityFilter !== "all", disputeReasonFilter !== "all"].filter(Boolean).length;
    }
    return [corrTypeFilter !== "All", corrChannelFilter !== "All", corrDirectionFilter !== "All"].filter(Boolean).length;
  }, [activeTab, collectorFilter, severityFilter, dunningStatusFilter, promiseStatusFilter, promiseMethodFilter, promiseSortBy, disputeStatusFilter, disputePriorityFilter, disputeReasonFilter, corrTypeFilter, corrChannelFilter, corrDirectionFilter]);

  // ========================================================================
  // RENDER
  // ========================================================================

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-slate-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading collections data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Aging bar segments (accounts only)
  const agingSegments = AGING_BUCKETS.map((bucket) => ({
    bucket,
    amount: agingData.buckets[bucket],
    pct: agingData.total > 0 ? (agingData.buckets[bucket] / agingData.total) * 100 : 0,
    color: AGING_COLORS[bucket],
  })).filter((s) => s.pct > 0);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="flex-1 overflow-auto">
        <div className="px-5 py-2">
          {/* ── Row 1: Tabs + Compact KPI Stats ── */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-0.5">
              {([
                { id: "accounts" as const, label: "Accounts" },
                { id: "dunning" as const, label: "Dunning" },
                { id: "promises" as const, label: "Promises" },
                { id: "correspondence" as const, label: "Correspondence" },
                { id: "disputes" as const, label: "Disputes" },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    activeTab === tab.id
                      ? "bg-white text-primary shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              {activeTab === "accounts" && (
                <>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">Outstanding</span>
                    <span className="font-semibold text-slate-900">{fmt(acctKpis.totalOutstanding)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">Past Due</span>
                    <span className="font-semibold text-red-600">{fmt(acctKpis.pastDue)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">Active</span>
                    <span className="font-semibold text-slate-900">{acctKpis.activeCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">Critical</span>
                    <span className="font-semibold text-red-600">{acctKpis.critHigh}</span>
                  </div>
                </>
              )}
              {activeTab === "dunning" && (
                <>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">Active</span>
                    <span className="font-semibold text-slate-900">{dunningKpis.activeCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">Under Dunning</span>
                    <span className="font-semibold text-red-600">{formatUsdCompact(dunningKpis.totalAmount)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">Avg Progress</span>
                    <span className="font-semibold text-slate-900">{dunningKpis.avgProgress}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">Due Today</span>
                    <span className={cn("font-semibold", dunningKpis.actionsDueToday > 0 ? "text-amber-600" : "text-slate-900")}>{dunningKpis.actionsDueToday}</span>
                  </div>
                </>
              )}
              {activeTab === "promises" && (
                <>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">Promised</span>
                    <span className="font-semibold text-slate-900">{formatUsdCompact(promiseKpis.totalPromised)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">Received</span>
                    <span className="font-semibold text-green-600">{formatUsdCompact(promiseKpis.totalReceived)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">Fulfillment</span>
                    <span className="font-semibold text-green-600">{promiseKpis.fulfillmentRate}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">At Risk</span>
                    <span className="font-semibold text-red-600">{promiseKpis.atRiskCount}</span>
                  </div>
                </>
              )}
              {activeTab === "correspondence" && (
                <>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">Total</span>
                    <span className="font-semibold text-slate-900">{corrKpis.total}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">This Week</span>
                    <span className="font-semibold text-slate-900">{corrKpis.thisWeek}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">Out / In</span>
                    <span className="font-semibold text-slate-900">{corrKpis.outbound} / {corrKpis.inbound}</span>
                  </div>
                </>
              )}
              {activeTab === "disputes" && (
                <>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">Total</span>
                    <span className="font-semibold text-slate-900">{disputeKpis.total}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">Open</span>
                    <span className="font-semibold text-amber-600">{disputeKpis.openCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">Disputed</span>
                    <span className="font-semibold text-red-600">{formatUsdCompact(disputeKpis.totalDisputedAmount)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
                    <span className="text-slate-500">Avg Aging</span>
                    <span className="font-semibold text-slate-900">{disputeKpis.avgAging}d</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Row 2: Search + Filters + Quick Views + Actions ── */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <Input
                  placeholder={activeTab === "accounts" ? "Search customers..." : activeTab === "dunning" ? "Search dunning..." : activeTab === "promises" ? "Search promises..." : activeTab === "disputes" ? "Search disputes..." : "Search correspondence..."}
                  value={activeTab === "accounts" ? acctSearch : activeTab === "dunning" ? dunningSearch : activeTab === "promises" ? promiseSearch : activeTab === "disputes" ? disputeSearch : corrSearch}
                  onChange={(e) => {
                    if (activeTab === "accounts") setAcctSearch(e.target.value);
                    else if (activeTab === "dunning") setDunningSearch(e.target.value);
                    else if (activeTab === "promises") setPromiseSearch(e.target.value);
                    else if (activeTab === "disputes") setDisputeSearch(e.target.value);
                    else setCorrSearch(e.target.value);
                  }}
                  className="pl-8 w-52 h-7 text-xs bg-white"
                />
              </div>

              {/* Filters Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-1.5 h-7 px-2.5 rounded border text-xs font-medium transition-colors",
                    activeFilterCount > 0 ? "border-blue-400 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:bg-white"
                  )}>
                    <ListFilter className="w-3.5 h-3.5" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold">{activeFilterCount}</span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-3">
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filters</div>
                    <div className="space-y-2.5">
                      {activeTab === "accounts" && (
                        <>
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">Collector</label>
                            <Select value={collectorFilter} onValueChange={setCollectorFilter}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="All collectors" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All collectors</SelectItem>
                                {collectors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">Severity</label>
                            <Select value={severityFilter} onValueChange={setSeverityFilter}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="All severities" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All severities</SelectItem>
                                <SelectItem value="Critical">Critical (90+)</SelectItem>
                                <SelectItem value="High">High (61-90)</SelectItem>
                                <SelectItem value="Medium">Medium (31-60)</SelectItem>
                                <SelectItem value="Low">Low (1-30)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      {activeTab === "dunning" && (
                        <div>
                          <label className="text-[11px] font-medium text-slate-500 mb-1 block">Status</label>
                          <Select value={dunningStatusFilter} onValueChange={setDunningStatusFilter}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {DUNNING_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {activeTab === "promises" && (
                        <>
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">Status</label>
                            <Select value={promiseStatusFilter} onValueChange={setPromiseStatusFilter}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {PROMISE_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">Method</label>
                            <Select value={promiseMethodFilter} onValueChange={setPromiseMethodFilter}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {PROMISE_METHOD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">Sort</label>
                            <Select value={promiseSortBy} onValueChange={setPromiseSortBy}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {PROMISE_SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      {activeTab === "correspondence" && (
                        <>
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">Type</label>
                            <Select value={corrTypeFilter} onValueChange={setCorrTypeFilter}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {CORR_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">Channel</label>
                            <Select value={corrChannelFilter} onValueChange={setCorrChannelFilter}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {CORR_CHANNEL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">Direction</label>
                            <Select value={corrDirectionFilter} onValueChange={setCorrDirectionFilter}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {CORR_DIRECTION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      {activeTab === "disputes" && (
                        <>
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">Status</label>
                            <Select value={disputeStatusFilter} onValueChange={setDisputeStatusFilter}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {DISPUTE_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">Priority</label>
                            <Select value={disputePriorityFilter} onValueChange={setDisputePriorityFilter}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {DISPUTE_PRIORITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">Reason</label>
                            <Select value={disputeReasonFilter} onValueChange={setDisputeReasonFilter}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {DISPUTE_REASON_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Accounts: Quick View chips */}
              {activeTab === "accounts" && (
                <div className="flex items-center gap-1">
                  {QUICK_VIEWS.map((view) => (
                    <button
                      key={view.value}
                      onClick={() => { setQuickView(view.value); setActiveSignal(null); }}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border",
                        quickView === view.value
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {view.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Correspondence: view mode toggle */}
              {activeTab === "correspondence" && (
                <div className="flex items-center rounded-md border border-slate-200 overflow-hidden">
                  <button onClick={() => setCorrViewMode("table")}
                    className={cn("flex items-center gap-1 px-2 py-1 text-[11px] font-medium transition-colors",
                      corrViewMode === "table" ? "bg-primary text-white" : "bg-white text-slate-600 hover:bg-slate-50")}>
                    <List className="h-3 w-3" /> Table
                  </button>
                  <button onClick={() => setCorrViewMode("timeline")}
                    className={cn("flex items-center gap-1 px-2 py-1 text-[11px] font-medium transition-colors",
                      corrViewMode === "timeline" ? "bg-primary text-white" : "bg-white text-slate-600 hover:bg-slate-50")}>
                    <LayoutList className="h-3 w-3" /> Timeline
                  </button>
                </div>
              )}

              {/* Correspondence: sort order */}
              {activeTab === "correspondence" && (
                <Select value={corrSortOrder} onValueChange={setCorrSortOrder}>
                  <SelectTrigger className="w-[120px] h-7 text-xs bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Right side: record count + actions */}
            <div className="flex items-center gap-2">
              {activeTab === "accounts" && (
                <>
                  <span className="text-[11px] text-slate-500">{acctTotal} records</span>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" onClick={handleExportCSV}><Download className="h-3 w-3 mr-1" /> Export</Button>
                </>
              )}
              {activeTab === "dunning" && <span className="text-[11px] text-slate-500">{filteredDunning.length} sequences</span>}
              {activeTab === "promises" && <span className="text-[11px] text-slate-500">{filteredPromises.length} of {promises.length}</span>}
              {activeTab === "disputes" && <span className="text-[11px] text-slate-500">{filteredDisputes.length} of {MOCK_DISPUTES.length}</span>}
              {activeTab === "correspondence" && (
                <>
                  <span className="text-[11px] text-slate-500">{filteredCorr.length} entries</span>
                  <Button size="sm" className="h-7 text-xs px-2.5" onClick={handleOpenLog}><Plus className="h-3 w-3 mr-1" /> Log New</Button>
                </>
              )}
            </div>
          </div>

          {/* ── Accounts: Signal filter chips ── */}
          {activeTab === "accounts" && (
            <div className="flex items-center gap-1.5 mb-2">
              {signals.map((signal) => (
                <button
                  key={signal.key}
                  onClick={() => setActiveSignal(activeSignal === signal.key ? null : signal.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors",
                    activeSignal === signal.key
                      ? "bg-blue-50 text-blue-700 border-blue-300"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: AGING_COLORS[signal.key] }} />
                  {signal.name}
                  <span className={cn("ml-0.5 px-1.5 py-0.5 rounded-full text-[10px]", getSeverityColor(signal.severity))}>
                    {signal.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* ── Accounts: Aging distribution bar (compact) ── */}
          {activeTab === "accounts" && agingData.total > 0 && (
            <div className="mb-2">
              <svg width="100%" height="6" className="rounded-full overflow-hidden">
                {(() => {
                  let x = 0;
                  return agingSegments.map((s) => {
                    const rect = (
                      <rect key={s.bucket} x={`${x}%`} y="0" width={`${s.pct}%`} height="6" fill={s.color} opacity={0.85}>
                        <title>{s.bucket}: {fmt(s.amount)} ({s.pct.toFixed(1)}%)</title>
                      </rect>
                    );
                    x += s.pct;
                    return rect;
                  });
                })()}
              </svg>
            </div>
          )}

          {/* ── Accounts: Bulk selection bar ── */}
          {activeTab === "accounts" && selection.size > 0 && (
            <Card className="mb-2 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{selection.size} selected</span>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => openModal("Dunning", selection)}>
                    <Mail className="w-3.5 h-3.5 mr-1" /> Send Dunning
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => openModal("Schedule", selection)}>
                    <Phone className="w-3.5 h-3.5 mr-1" /> Schedule Call
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => openModal("Promise", selection)}>
                    <DollarSign className="w-3.5 h-3.5 mr-1" /> Log Promise
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => openModal("Escalate", selection)}>
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Escalate
                  </Button>
                  <button onClick={() => setSelection(new Set())} className="text-[11px] text-slate-500 hover:text-red-600 ml-1">Clear</button>
                </div>
              </div>
            </Card>
          )}

          {/* ============================================================ */}
          {/*  ACCOUNTS TABLE                                              */}
          {/* ============================================================ */}
          {activeTab === "accounts" && (
            <Card>
              <div className="overflow-x-auto">
                {acctLoading ? (
                  <div className="flex items-center justify-center py-16 gap-2 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading collections...</span>
                  </div>
                ) : acctError ? (
                  <div className="flex items-center justify-center py-16 text-red-500 text-sm">{acctError}</div>
                ) : collections.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-slate-400 text-sm">No records match the current filters.</div>
                ) : (
                  <table className="w-full">
                    <thead className="border-b bg-slate-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left w-8">
                          <Checkbox
                            checked={selection.size === collections.length && collections.length > 0}
                            onCheckedChange={() => {
                              if (selection.size === collections.length) setSelection(new Set());
                              else toggleSelectAll();
                            }}
                            className="border-slate-300"
                          />
                        </th>
                        {["Customer", "Collector", "AR Balance", "Past Due", "Days", "Severity", "Dunning", "AI Recommendation"].map((header) => (
                          <th key={header} className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {collections.map((r) => (
                        <tr
                          key={r.id}
                          onClick={(e) => { if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return; setCurrentRecord(r); setIsDrawerOpen(true); }}
                          className={cn("cursor-pointer transition-colors hover:bg-slate-50", currentRecord?.id === r.id && "bg-blue-50")}
                        >
                          <td className="px-3 py-1.5">
                            <Checkbox checked={selection.has(r.id)} onCheckedChange={(checked) => toggleSelect(r.id, checked === true)} onClick={(e) => e.stopPropagation()} className="border-slate-300" />
                          </td>
                          <td className="px-3 py-1.5 text-xs font-medium text-slate-800">{r.customerName}</td>
                          <td className="px-3 py-1.5 text-xs text-slate-600">{r.assignedTo || "\u2014"}</td>
                          <td className="px-3 py-1.5 text-xs font-semibold text-slate-900 text-right whitespace-nowrap">{fmt(r.totalOutstanding)}</td>
                          <td className="px-3 py-1.5 text-xs text-right whitespace-nowrap">
                            {r.pastDueAmount > 0 ? <span className="text-red-600 font-medium">{fmt(r.pastDueAmount)}</span> : <span className="text-slate-400">{"\u2014"}</span>}
                          </td>
                          <td className="px-3 py-1.5 text-xs text-right">
                            {r.daysPastDue > 0 ? (
                              <span className={cn("font-medium", r.daysPastDue >= 90 ? "text-red-600" : r.daysPastDue >= 61 ? "text-orange-600" : r.daysPastDue >= 31 ? "text-yellow-600" : "text-slate-600")}>{r.daysPastDue}</span>
                            ) : <span className="text-slate-400">{"\u2014"}</span>}
                          </td>
                          <td className="px-3 py-1.5"><Badge className={cn("text-xs", getSeverityColor(r.severity))}>{r.severity}</Badge></td>
                          <td className="px-3 py-1.5 text-xs">
                            {r.dunningSequenceId ? <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs">Active</Badge> : <span className="text-slate-400">{"\u2014"}</span>}
                          </td>
                          <td className="px-3 py-1.5 text-xs text-slate-700 max-w-[260px] truncate">{r.recommendation || "\u2014"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          )}

          {/* ============================================================ */}
          {/*  DUNNING TABLE                                               */}
          {/* ============================================================ */}
          {activeTab === "dunning" && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left w-8" />
                      {["Customer", "Status", "Current Step", "Progress", "Amount", "Next Action", "Invoices"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredDunning.length === 0 && (
                      <tr><td colSpan={8} className="text-center text-slate-400 py-16 text-sm">No sequences match the current filters.</td></tr>
                    )}
                    {filteredDunning.map((seq) => (
                      <React.Fragment key={seq.id}>
                        <tr
                          className="cursor-pointer transition-colors hover:bg-slate-50"
                          onClick={() => setExpandedRow(expandedRow === seq.id ? null : seq.id)}
                        >
                          <td className="px-3 py-1.5">
                            {expandedRow === seq.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                          </td>
                          <td className="px-3 py-1.5 text-xs font-medium text-slate-800">{seq.customerName}</td>
                          <td className="px-3 py-1.5">
                            <Badge className={cn("text-xs", DUNNING_STATUS_BADGE[seq.status].className)}>{seq.status}</Badge>
                          </td>
                          <td className="px-3 py-1.5 text-xs text-slate-700">{seq.currentStep}</td>
                          <td className="px-3 py-1.5">
                            <StepProgressDots currentStepNumber={seq.currentStepNumber} totalSteps={seq.totalSteps} steps={seq.steps} />
                          </td>
                          <td className="px-3 py-1.5 text-xs font-semibold text-slate-900 text-right whitespace-nowrap">{formatUsd(seq.totalAmount)}</td>
                          <td className="px-3 py-1.5 text-xs text-slate-600">
                            {seq.nextActionDate ? (
                              <span className={cn(isPastOrToday(seq.nextActionDate) && seq.status === "Active" ? "text-amber-600 font-medium" : "")}>
                                {formatDate(seq.nextActionDate)}
                              </span>
                            ) : "\u2014"}
                          </td>
                          <td className="px-3 py-1.5 text-xs text-center">{seq.invoiceIds.length}</td>
                        </tr>
                        {expandedRow === seq.id && (
                          <tr>
                            <td colSpan={8} className="p-0">
                              <StepTimeline steps={seq.steps} currentStepNumber={seq.currentStepNumber} totalSteps={seq.totalSteps} templates={dunningTemplates} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ============================================================ */}
          {/*  PROMISES TABLE                                              */}
          {/* ============================================================ */}
          {activeTab === "promises" && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-slate-50 sticky top-0 z-10">
                    <tr>
                      {["Customer", "Promised", "Date", "Method", "Status", "Received", "Invoices", "Captured By"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredPromises.length === 0 && (
                      <tr><td colSpan={8} className="text-center text-slate-400 py-16 text-sm">No promises match the current filters.</td></tr>
                    )}
                    {filteredPromises.map((p) => {
                      const dateIsPast = isPast(p.promisedDate) && p.status !== "Fulfilled" && p.status !== "Cancelled";
                      return (
                        <tr key={p.id} className="cursor-pointer transition-colors hover:bg-slate-50" onClick={() => { setSelectedPromise(p); setPromiseSheetOpen(true); }}>
                          <td className="px-3 py-1.5 text-xs font-medium text-slate-800">{p.customerName}</td>
                          <td className="px-3 py-1.5 text-xs font-bold text-slate-900 text-right whitespace-nowrap">{formatUsd(p.promisedAmount)}</td>
                          <td className="px-3 py-1.5">
                            <span className={cn("text-xs", dateIsPast ? "text-red-600 font-medium" : "text-slate-700")}>{formatDate(p.promisedDate)}</span>
                          </td>
                          <td className="px-3 py-1.5">
                            {p.paymentMethod ? <Badge className={cn("text-xs", METHOD_BADGE_STYLES[p.paymentMethod] || "bg-slate-50 text-slate-600 border-slate-200")}>{p.paymentMethod}</Badge> : <span className="text-slate-400 text-xs">--</span>}
                          </td>
                          <td className="px-3 py-1.5">
                            {p.status === "Broken" ? <Badge variant="destructive" className="text-xs">{p.status}</Badge>
                              : p.status === "Cancelled" ? <Badge variant="outline" className="text-xs">{p.status}</Badge>
                              : <Badge className={cn("text-xs", PROMISE_STATUS_BADGE[p.status])}>{p.status}</Badge>}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {p.receivedAmount ? <span className="text-xs font-medium text-green-700">{formatUsd(p.receivedAmount)}</span> : <span className="text-slate-400">{"\u2014"}</span>}
                          </td>
                          <td className="px-3 py-1.5 text-xs text-center">{p.invoiceIds?.length || 0}</td>
                          <td className="px-3 py-1.5 text-xs text-slate-600">{p.capturedBy}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ============================================================ */}
          {/*  CORRESPONDENCE TABLE / TIMELINE                             */}
          {/* ============================================================ */}
          {activeTab === "correspondence" && (
            <Card>
              {filteredCorr.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-slate-400 text-sm">No correspondence found.</div>
              ) : corrViewMode === "table" ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-slate-50 sticky top-0 z-10">
                      <tr>
                        {["Date", "Customer", "Type", "Channel", "Direction", "Subject", "Sent By", ""].map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredCorr.map((entry) => (
                        <tr key={entry.id} className="cursor-pointer transition-colors hover:bg-slate-50" onClick={() => { setSelectedCorr(entry); setCorrDetailOpen(true); }}>
                          <td className="px-3 py-1.5 text-xs text-slate-600 whitespace-nowrap">{formatDateTime(entry.sentAt)}</td>
                          <td className="px-3 py-1.5">
                            <Link href={`/workbench/order-to-cash/collections/customer/${entry.customerId}`}
                              className="text-xs font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                              {entry.customerName}
                            </Link>
                          </td>
                          <td className="px-3 py-1.5"><Badge variant="outline" className={cn("text-xs", TYPE_BADGE[entry.type])}>{entry.type}</Badge></td>
                          <td className="px-3 py-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              {CORR_CHANNEL_ICON[entry.channel]} {entry.channel}
                            </div>
                          </td>
                          <td className="px-3 py-1.5">
                            <div className="flex items-center gap-1 text-xs">
                              {entry.direction === "Outbound" ? <ArrowUpRight className="h-3.5 w-3.5 text-green-600" /> : <ArrowDownLeft className="h-3.5 w-3.5 text-blue-600" />}
                              <span className={entry.direction === "Outbound" ? "text-green-700" : "text-blue-700"}>{entry.direction}</span>
                            </div>
                          </td>
                          <td className="px-3 py-1.5 text-xs text-slate-700 max-w-[200px] truncate">{entry.subject || <span className="italic text-slate-400">(No subject)</span>}</td>
                          <td className="px-3 py-1.5 text-xs text-slate-600">{entry.sentBy}</td>
                          <td className="px-3 py-1.5">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setSelectedCorr(entry); setCorrDetailOpen(true); }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
            </Card>
          )}

          {/* ============================================================ */}
          {/*  DISPUTES TABLE                                              */}
          {/* ============================================================ */}
          {activeTab === "disputes" && (
            <Card>
              <div className="overflow-x-auto">
                {filteredDisputes.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-slate-400 text-sm">No disputes match the current filters.</div>
                ) : (
                  <table className="w-full">
                    <thead className="border-b bg-slate-50 sticky top-0 z-10">
                      <tr>
                        {["ID", "Customer", "Invoice", "Disputed", "Original", "Reason", "Status", "Priority", "Aging", "Assignee"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredDisputes.map((d) => (
                        <tr key={d.id} className="cursor-pointer transition-colors hover:bg-slate-50" onClick={() => { setSelectedDispute(d); setDisputeSheetOpen(true); }}>
                          <td className="px-3 py-1.5 text-xs font-mono text-slate-500">{d.id}</td>
                          <td className="px-3 py-1.5 text-xs font-medium text-slate-800">{d.customerName}</td>
                          <td className="px-3 py-1.5 text-xs text-slate-600">{d.invoiceNumber}</td>
                          <td className="px-3 py-1.5 text-xs font-semibold text-red-600 text-right whitespace-nowrap">{formatUsd(d.disputeAmount)}</td>
                          <td className="px-3 py-1.5 text-xs text-slate-600 text-right whitespace-nowrap">{formatUsd(d.originalAmount)}</td>
                          <td className="px-3 py-1.5"><Badge variant="outline" className={cn("text-xs", DISPUTE_REASON_BADGE[d.reason])}>{d.reason}</Badge></td>
                          <td className="px-3 py-1.5"><Badge className={cn("text-xs", DISPUTE_STATUS_BADGE[d.status])}>{d.status}</Badge></td>
                          <td className="px-3 py-1.5"><Badge className={cn("text-xs", DISPUTE_PRIORITY_BADGE[d.priority])}>{d.priority}</Badge></td>
                          <td className="px-3 py-1.5">
                            <span className={cn("text-xs font-medium", getAgingDisplay(d.aging))}>{d.aging}d</span>
                          </td>
                          <td className="px-3 py-1.5 text-xs text-slate-600">{d.assignee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          )}
        </div>
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

      {/* ======= Disputes Detail Sheet ======= */}
      <Sheet open={disputeSheetOpen} onOpenChange={setDisputeSheetOpen}>
        <SheetContent className="sm:max-w-[480px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-base">Dispute Details</SheetTitle>
            <SheetDescription className="text-xs text-slate-500">Review and manage the selected dispute</SheetDescription>
          </SheetHeader>
          {selectedDispute && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn("text-xs", DISPUTE_STATUS_BADGE[selectedDispute.status])}>{selectedDispute.status}</Badge>
                <Badge className={cn("text-xs", DISPUTE_PRIORITY_BADGE[selectedDispute.priority])}>{selectedDispute.priority} Priority</Badge>
                <Badge variant="outline" className={cn("text-xs", DISPUTE_REASON_BADGE[selectedDispute.reason])}>{selectedDispute.reason}</Badge>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-2 text-sm">
                <div className="text-slate-500">Dispute ID</div><div className="font-mono">{selectedDispute.id}</div>
                <div className="text-slate-500">Customer</div><div className="font-medium">{selectedDispute.customerName}</div>
                <div className="text-slate-500">Invoice</div><div className="font-mono">{selectedDispute.invoiceNumber}</div>
                <div className="text-slate-500">Disputed Amt</div><div className="font-bold text-red-600">{formatUsd(selectedDispute.disputeAmount)}</div>
                <div className="text-slate-500">Original Amt</div><div>{formatUsd(selectedDispute.originalAmount)}</div>
                <div className="text-slate-500">% Disputed</div><div>{Math.round((selectedDispute.disputeAmount / selectedDispute.originalAmount) * 100)}%</div>
                <div className="text-slate-500">Created</div><div>{formatDate(selectedDispute.createdDate)}</div>
                <div className="text-slate-500">Due Date</div><div className={cn(isPast(selectedDispute.dueDate) ? "text-red-600 font-medium" : "")}>{formatDate(selectedDispute.dueDate)}</div>
                <div className="text-slate-500">Aging</div><div><span className={cn("font-medium", getAgingDisplay(selectedDispute.aging))}>{selectedDispute.aging} days</span></div>
                <div className="text-slate-500">Assignee</div><div>{selectedDispute.assignee}</div>
              </div>

              {/* Activity Timeline */}
              <div className="pt-2">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Activity Timeline</h4>
                <div className="relative ml-3 border-l-2 border-slate-200 space-y-3 pl-5">
                  {(MOCK_TIMELINES[selectedDispute.id] || DEFAULT_TIMELINE).map((event, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-white" />
                      <p className="text-[11px] text-slate-400 mb-0.5">{formatDate(event.date)}</p>
                      <p className="text-sm text-slate-700">{event.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 flex-wrap">
                {(selectedDispute.status === "Open" || selectedDispute.status === "Under Review") && (
                  <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { toast.success(`Dispute ${selectedDispute.id} approved for credit`); setDisputeSheetOpen(false); }}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => { toast.error(`Dispute ${selectedDispute.id} rejected`); setDisputeSheetOpen(false); }}>
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { toast.info(`Dispute ${selectedDispute.id} escalated`); setDisputeSheetOpen(false); }}>
                      <AlertCircle className="h-3 w-3 mr-1" /> Escalate
                    </Button>
                  </>
                )}
                {selectedDispute.status === "Escalated" && (
                  <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { toast.success(`Dispute ${selectedDispute.id} resolved`); setDisputeSheetOpen(false); }}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => { toast.error(`Dispute ${selectedDispute.id} rejected`); setDisputeSheetOpen(false); }}>
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
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
