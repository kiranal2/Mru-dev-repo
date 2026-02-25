"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Breadcrumb from "@/components/layout/breadcrumb";
import { useFluxAnalysis } from "@/hooks/data";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  MessageSquare,
  Minus,
  Paperclip,
  Plus,
  RotateCcw,
  Eye,
  Bell,
  Mail,
  Search,
  Send,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
  X,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

/* ──────────────────────────────────────── TYPES ──────────────────────────────────────── */

interface FluxRaw {
  id: string;
  accountNumber: string;
  accountName: string;
  currentPeriod: string;
  priorPeriod: string;
  currentValue: number;
  priorValue: number;
  varianceAmount?: number;
  variancePercent?: number;
  variancePct?: number;
  threshold?: number;
  isSignificant?: boolean;
  status?: string;
  aiExplanation?: string | null;
  reviewedBy?: string | null;
}

type FluxStatus = "Open" | "In Review" | "Closed";
type PeriodType = "QoQ" | "YoY" | "Other";

interface FluxRow {
  id: string;
  acct: string;
  name: string;
  base: number;
  actual: number;
  driver: string;
  owner: string;
  evidence: boolean;
  status: FluxStatus;
  currentPeriod: string;
  priorPeriod: string;
  periodType: PeriodType;
  thresholdPct: number;
  significant: boolean;
  aiExplanation: string | null;
}

interface BsRollRow {
  acct: string;
  open: number;
  activity: number;
  close: number;
  notes: string;
}

interface DriverRow {
  driver: string;
  impact: number;
  confidence: "High" | "Med";
}

interface CfRow {
  label: string;
  val: number;
}

interface AiExplanationRow {
  acct: string;
  delta: number;
  driver: string;
  conf: "High" | "Med";
  owner: string;
  evidence: boolean;
  status: FluxStatus;
}

interface FluxPageData {
  is: FluxRow[];
  bs: FluxRow[];
  bsRoll: BsRollRow[];
  drivers: DriverRow[];
  cf: CfRow[];
  aiExplanations: AiExplanationRow[];
}

interface AiResponse {
  id: string;
  q: string;
  summary: string;
  bullets: string[];
  metrics: Array<{
    label: string;
    value: string;
    tone: "positive" | "negative" | "neutral";
  }>;
  matchedPrompt: string | null;
}

interface PromptSuggestion {
  prompt: string;
}

type MaterialityMode = "default" | "tight" | "loose";

/* ──────────────────────────────────── CONSTANTS ──────────────────────────────────── */

const MATERIALITY_OPTIONS: Array<{ value: MaterialityMode; label: string }> = [
  { value: "default", label: ">$100k or >5%" },
  { value: "tight", label: ">$250k or >3%" },
  { value: "loose", label: ">$50k or >8%" },
];

const CONSOLIDATION_OPTIONS = ["Consolidated", "Parent", "Subsidiary"];
const CURRENCY_OPTIONS = ["USD", "EUR", "INR"];
const AI_PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  { prompt: "Show revenue bridge from Q2 to Q3" },
  { prompt: "Show impact of losing top 3 accounts" },
  { prompt: "Show roll-forward for key BS accounts" },
  { prompt: "Show close timeline and deadlines" },
  { prompt: "What are the top 5 movers this period?" },
  { prompt: "Which accounts need attention first?" },
  { prompt: "Show expense variance breakdown" },
  { prompt: "Explain COGS increase drivers" },
  { prompt: "Compare IS vs BS variance patterns" },
  { prompt: "What is the net income impact?" },
  { prompt: "Show accounts missing evidence" },
  { prompt: "Which accounts are still open?" },
  { prompt: "Show owner workload distribution" },
  { prompt: "What are the highest risk items?" },
  { prompt: "Explain why gross margin declined" },
  { prompt: "What if FX rates were flat?" },
  { prompt: "Show aging of open review items" },
  { prompt: "Which accounts exceeded threshold?" },
  { prompt: "Summarize period close readiness" },
  { prompt: "Explain AR increase and cash impact" },
  { prompt: "Classify drivers for all accounts" },
  { prompt: "Show operating expense trend analysis" },
  { prompt: "What are the one-time items this period?" },
  { prompt: "Show variance by owner summary" },
];
const EVIDENCE_TYPE_OPTIONS = [
  { value: "journal-entry", label: "Journal Entry" },
  { value: "invoice", label: "Invoice" },
  { value: "contract", label: "Contract" },
  { value: "bank-advice", label: "Bank Advice" },
  { value: "supporting-doc", label: "Supporting Document" },
];
const QUICK_LINK_EVIDENCE_OPTIONS = ["GL Extract", "Trial Balance", "Subledger Report", "Bank Rec"];
const AI_THINKING_STEPS = [
  "Understanding your question",
  "Scanning filtered Flux accounts",
  "Calculating account deltas and drivers",
  "Drafting response",
];

const CASH_FLOW_BRIDGE_DATA: CfRow[] = [
  { label: "Net Income", val: 6.8 },
  { label: "Depreciation & Non-cash", val: 1.1 },
  { label: "AR (Increase)", val: -0.8 },
  { label: "Inventory (Decrease)", val: 0.6 },
  { label: "AP (Increase)", val: 0.8 },
  { label: "Other WC", val: 0.9 },
];

const KPI_SNAPSHOT = {
  revenue: { value: 52.9, pct: 9.8 },
  grossMargin: { value: 20.3, pct: 14.0 },
  operatingCashFlow: { value: 9.4, pct: 11.2 },
  workingCapital: {
    value: 1.0,
    components: ["AR +$0.8M", "Inv -$0.6M", "AP +$0.8M"],
  },
} as const;

/* ──────────────────────────────────── MOCK DATA ──────────────────────────────────── */

function makeIsRow(
  id: string,
  acct: string,
  name: string,
  base: number,
  actual: number,
  driver: string,
  owner: string,
  evidence: boolean,
  status: FluxStatus
): FluxRow {
  return {
    id,
    acct,
    name,
    base,
    actual,
    driver,
    owner,
    evidence,
    status,
    currentPeriod: "Q3 2025",
    priorPeriod: "Q2 2025",
    periodType: "QoQ",
    thresholdPct: 0.05,
    significant: true,
    aiExplanation: null,
  };
}

const FALLBACK_DATA: FluxPageData = {
  is: [
    makeIsRow("is-4000", "4000", "Revenue", 48.2, 52.9, "Price/Volume/Mix", "Sales Ops", false, "Open"),
    makeIsRow("is-4100", "4100", "Product Revenue", 38.6, 42.8, "Volume/Price", "Sales Ops", true, "In Review"),
    makeIsRow("is-4200", "4200", "Services Revenue", 7.1, 7.4, "Utilization", "PS Lead", false, "Closed"),
    makeIsRow("is-4300", "4300", "Subscription Revenue", 2.5, 2.7, "Renewals", "RevOps", false, "Open"),
    makeIsRow("is-5000", "5000", "COGS", 30.4, 32.6, "Input costs/Volume", "Supply Chain", true, "In Review"),
    makeIsRow("is-5100", "5100", "Direct Materials", 18.2, 19.6, "Commodity Prices", "Procurement", false, "Open"),
    makeIsRow("is-5150", "5150", "Direct Labor", 7.8, 8.1, "Headcount/Overtime", "Ops Finance", true, "Closed"),
    makeIsRow("is-5180", "5180", "Manufacturing OH", 4.4, 4.9, "Allocation Rate", "Cost Accounting", false, "In Review"),
    makeIsRow("is-5200", "5200", "Gross Margin", 17.8, 20.3, "Price > COGS", "FP&A", true, "Closed"),
    makeIsRow("is-6100", "6100", "R&D", 6.2, 6.8, "Headcount Rate", "FP&A", false, "Open"),
    makeIsRow("is-6200", "6200", "Sales & Marketing", 4.8, 5.2, "Programs/Campaigns", "Marketing", true, "In Review"),
    makeIsRow("is-6300", "6300", "G&A", 3.1, 3.0, "One-time/Timing", "Controller", true, "Closed"),
    makeIsRow("is-6400", "6400", "Depreciation", 1.8, 1.9, "Asset Base", "Controller", true, "Closed"),
    makeIsRow("is-6500", "6500", "Amortization", 0.9, 1.0, "Intangibles", "Controller", false, "Open"),
    makeIsRow("is-6600", "6600", "Stock Compensation", 2.1, 2.3, "Headcount/Grants", "HR Finance", false, "Open"),
    makeIsRow("is-6700", "6700", "Interest Expense", 0.4, 0.3, "Debt Paydown", "Treasury", true, "Closed"),
    makeIsRow("is-6800", "6800", "Other Income", 0.2, 0.5, "FX / Gains", "Treasury", false, "Open"),
    makeIsRow("is-7000", "7000", "Tax Provision", 1.6, 1.8, "Effective Rate", "Tax", true, "In Review"),
    makeIsRow("is-7100", "7100", "Operating Income", 5.9, 7.1, "Revenue - OpEx", "FP&A", false, "Open"),
    makeIsRow("is-7200", "7200", "EBITDA", 8.6, 10.0, "Op Leverage", "FP&A", true, "Closed"),
    makeIsRow("is-4400", "4400", "License Revenue", 1.8, 2.0, "New Logos", "Sales Ops", false, "Open"),
    makeIsRow("is-4500", "4500", "Maintenance Revenue", 3.2, 3.1, "Churn", "RevOps", true, "In Review"),
    makeIsRow("is-5250", "5250", "Freight & Logistics", 2.1, 2.4, "Volume/Rates", "Supply Chain", false, "Open"),
    makeIsRow("is-5300", "5300", "Warranty Reserve", 0.8, 0.9, "Claims Rate", "Ops Finance", false, "Open"),
    makeIsRow("is-6150", "6150", "Engineering Contractors", 1.4, 1.6, "Project Spend", "Engineering", false, "In Review"),
    makeIsRow("is-6250", "6250", "Customer Success", 1.2, 1.3, "Headcount", "CS Lead", true, "Closed"),
    makeIsRow("is-6350", "6350", "Facilities", 0.6, 0.6, "Lease terms", "Controller", true, "Closed"),
    makeIsRow("is-6450", "6450", "Professional Fees", 0.5, 0.7, "Audit/Legal", "Controller", false, "Open"),
  ],
  bs: [
    {
      id: "bs-1100",
      acct: "1100",
      name: "Cash & Equivalents",
      base: 14.0,
      actual: 15.1,
      driver: "Operating Cash Flow",
      owner: "Treasury",
      evidence: true,
      status: "Closed",
      currentPeriod: "Q3 2025",
      priorPeriod: "Q2 2025",
      periodType: "QoQ",
      thresholdPct: 0.05,
      significant: true,
      aiExplanation: null,
    },
    {
      id: "bs-1200",
      acct: "1200",
      name: "Accounts Receivable",
      base: 18.4,
      actual: 19.2,
      driver: "Collections/DSO",
      owner: "AR Lead",
      evidence: false,
      status: "Open",
      currentPeriod: "Q3 2025",
      priorPeriod: "Q2 2025",
      periodType: "QoQ",
      thresholdPct: 0.05,
      significant: true,
      aiExplanation: null,
    },
    {
      id: "bs-1400",
      acct: "1400",
      name: "Inventory",
      base: 9.8,
      actual: 9.2,
      driver: "Usage/Reserves",
      owner: "Ops Finance",
      evidence: false,
      status: "Open",
      currentPeriod: "Q3 2025",
      priorPeriod: "Q2 2025",
      periodType: "QoQ",
      thresholdPct: 0.05,
      significant: true,
      aiExplanation: null,
    },
    {
      id: "bs-2000",
      acct: "2000",
      name: "Accounts Payable",
      base: 12.1,
      actual: 12.9,
      driver: "Payment Terms",
      owner: "AP Lead",
      evidence: true,
      status: "In Review",
      currentPeriod: "Q3 2025",
      priorPeriod: "Q2 2025",
      periodType: "QoQ",
      thresholdPct: 0.05,
      significant: true,
      aiExplanation: null,
    },
    {
      id: "bs-2400",
      acct: "2400",
      name: "Deferred Revenue",
      base: 11.3,
      actual: 12.1,
      driver: "Billings > Rev",
      owner: "RevOps",
      evidence: false,
      status: "Open",
      currentPeriod: "Q3 2025",
      priorPeriod: "Q2 2025",
      periodType: "QoQ",
      thresholdPct: 0.05,
      significant: true,
      aiExplanation: null,
    },
  ],
  bsRoll: [
    { acct: "1200 AR", open: 18.4, activity: 0.8, close: 19.2, notes: "Collections slower; DSO 43 -> 45" },
    { acct: "1400 Inventory", open: 9.8, activity: -0.6, close: 9.2, notes: "Scrap improved; DOH down 4d" },
    { acct: "2000 AP", open: 12.1, activity: 0.8, close: 12.9, notes: "Terms extended by 5d" },
    { acct: "2400 Deferred Rev", open: 11.3, activity: 0.8, close: 12.1, notes: "Strong billings; recognition lag" },
  ],
  drivers: [
    { driver: "Price", impact: 2.1, confidence: "High" },
    { driver: "Volume", impact: 1.8, confidence: "High" },
    { driver: "Mix", impact: 1.4, confidence: "Med" },
    { driver: "FX", impact: -0.6, confidence: "Med" },
    { driver: "New Logos", impact: 0.9, confidence: "Med" },
    { driver: "Churn", impact: -0.9, confidence: "High" },
    { driver: "Timing (AP)", impact: 0.8, confidence: "High" },
    { driver: "Inventory Usage", impact: -0.6, confidence: "Med" },
  ],
  cf: CASH_FLOW_BRIDGE_DATA,
  aiExplanations: [
    { acct: "4000 Revenue", delta: 4.7, driver: "Price ↑ / Volume ↑", conf: "High", owner: "Sales Ops", evidence: true, status: "Open" },
    { acct: "1200 AR", delta: 0.8, driver: "Collections timing", conf: "Med", owner: "AR Lead", evidence: false, status: "Open" },
    { acct: "2400 Deferred Rev", delta: 0.8, driver: "Billings > Rev", conf: "High", owner: "RevOps", evidence: false, status: "Open" },
    { acct: "1400 Inventory", delta: -0.6, driver: "Usage/Obsolescence", conf: "Med", owner: "Ops Finance", evidence: true, status: "Open" },
  ],
};

/* ──────────────────────────────── AI DETAIL DATA ──────────────────────────────── */

const AI_ANALYSIS_MAP: Record<string, { summary: string; headline: string; bullets: string[] }> = {
  "4000": {
    summary: "Revenue grew +$4.7M (+9.8%) QoQ, driven by a combination of pricing power, volume expansion, and favorable mix shift.",
    headline: "Revenue: +$4.7M (+9.8%)",
    bullets: [
      "Price realization contributed +$2.1M (45% of uplift)",
      "Volume growth added +$1.8M from existing accounts",
      "Mix shift to higher-margin SKUs added +$1.4M",
      "Partially offset by FX headwind of -$0.6M and churn of -$0.9M",
    ],
  },
  "4100": {
    summary: "Product Revenue increased +$4.2M (+10.9%) driven by strong enterprise deal flow and pricing optimization.",
    headline: "Product Revenue: +$4.2M (+10.9%)",
    bullets: [
      "Enterprise segment contributed +$2.8M from new logos",
      "Mid-market upsells added +$1.1M",
      "Price increases across catalog contributed +$0.8M",
      "Offset by -$0.5M from delayed renewals",
    ],
  },
  "5000": {
    summary: "COGS rose +$2.2M (+7.2%) primarily from input cost inflation and volume-driven material consumption.",
    headline: "COGS: +$2.2M (+7.2%)",
    bullets: [
      "Raw material prices up +$1.1M due to commodity inflation",
      "Volume-related consumption added +$0.8M",
      "Freight surcharges contributed +$0.3M",
      "No material one-time items this period",
    ],
  },
  "5200": {
    summary: "Gross Margin expanded +$2.5M (+14.0%) reflecting positive operating leverage from revenue growth exceeding cost increases.",
    headline: "Gross Margin: +$2.5M (+14.0%)",
    bullets: [
      "Revenue growth (+$4.7M) exceeded COGS growth (+$2.2M)",
      "Margin rate improved from 36.9% to 38.4%",
      "Mix shift to higher-margin products contributed +$0.8M",
      "Operating efficiency gains added +$0.3M",
    ],
  },
};

const ACTIVITY_LOG: Array<{ type: string; title: string; detail: string; actor: string; date: string }> = [
  { type: "assign", title: "Owner assigned", detail: "Sales Ops assigned as owner for account 4000.", actor: "Controller", date: "Feb 20, 10:30 AM" },
  { type: "create", title: "Record created", detail: "Revenue opened for the Q3 close variance review.", actor: "Close automation", date: "Feb 18, 10:30 PM" },
];

/* ──────────────────────────────── HELPER FUNCTIONS ──────────────────────────────── */

function mapFluxStatus(rawStatus?: string): FluxStatus {
  if (!rawStatus) return "Open";
  if (rawStatus === "Reviewed" || rawStatus === "AutoClosed") return "Closed";
  if (rawStatus === "InReview") return "In Review";
  return "Open";
}

function toMillions(n: number): number {
  return Math.round((n / 1_000_000) * 10) / 10;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function isIncomeStatement(acct: string): boolean {
  const first = acct.charAt(0);
  return first >= "4" && first <= "7";
}

function isBalanceSheet(acct: string): boolean {
  const first = acct.charAt(0);
  return first >= "1" && first <= "3";
}

function parseQuarterPeriod(label: string): { quarter: number; year: number } | null {
  const match = label.match(/^Q([1-4])\s+(\d{4})$/i);
  if (!match) return null;
  return { quarter: Number(match[1]), year: Number(match[2]) };
}

function getPeriodType(currentPeriod: string, priorPeriod: string): PeriodType {
  const cur = parseQuarterPeriod(currentPeriod);
  const pri = parseQuarterPeriod(priorPeriod);
  if (!cur || !pri) return "Other";
  if (cur.year === pri.year && cur.quarter - pri.quarter === 1) return "QoQ";
  if (cur.year - pri.year === 1 && cur.quarter === pri.quarter) return "YoY";
  return "Other";
}

const OWNER_RULES: Array<{ pattern: RegExp; owner: string }> = [
  { pattern: /revenue|sales|subscription|rev/i, owner: "Sales Ops" },
  { pattern: /receivable|ar/i, owner: "AR Lead" },
  { pattern: /payable|ap/i, owner: "AP Lead" },
  { pattern: /inventory/i, owner: "Ops Finance" },
  { pattern: /cash|treasury|investment/i, owner: "Treasury" },
  { pattern: /marketing|g&a|administrative/i, owner: "Controller" },
  { pattern: /cogs|cost|material|supply/i, owner: "Supply Chain" },
];

const DRIVER_RULES: Array<{ pattern: RegExp; driver: string }> = [
  { pattern: /revenue|sales|subscription/i, driver: "Price/Volume/Mix" },
  { pattern: /receivable|ar/i, driver: "Collections timing" },
  { pattern: /inventory/i, driver: "Usage/Obsolescence" },
  { pattern: /payable|ap/i, driver: "Terms and timing" },
  { pattern: /deferred/i, driver: "Billings > Rev" },
  { pattern: /cash|investment/i, driver: "Cash deployment" },
  { pattern: /r&d|research|development/i, driver: "Headcount rate" },
  { pattern: /marketing|g&a/i, driver: "Programs / one-time" },
];

function inferOwner(accountName: string): string {
  const rule = OWNER_RULES.find(({ pattern }) => pattern.test(accountName));
  return rule?.owner ?? "FP&A";
}

function inferDriver(accountName: string): string {
  const rule = DRIVER_RULES.find(({ pattern }) => pattern.test(accountName));
  return rule?.driver ?? "Operational mix";
}

function getConfidence(delta: number, pct: number): "High" | "Med" {
  if (Math.abs(delta) >= 1 || Math.abs(pct) >= 0.08) return "High";
  return "Med";
}

function buildPageData(rawItems: FluxRaw[]): FluxPageData {
  const mapRow = (item: FluxRaw): FluxRow => {
    const base = toMillions(item.priorValue);
    const actual = toMillions(item.currentValue);
    const currentPeriod = item.currentPeriod || "Q3 2025";
    const priorPeriod = item.priorPeriod || "Q2 2025";

    return {
      id: item.id,
      acct: item.accountNumber,
      name: item.accountName,
      base,
      actual,
      driver: inferDriver(item.accountName),
      owner: inferOwner(item.accountName),
      evidence: Boolean(item.reviewedBy),
      status: mapFluxStatus(item.status),
      currentPeriod,
      priorPeriod,
      periodType: getPeriodType(currentPeriod, priorPeriod),
      thresholdPct: typeof item.threshold === "number" ? item.threshold / 100 : 0.05,
      significant:
        typeof item.isSignificant === "boolean"
          ? item.isSignificant
          : Math.abs(base ? (actual - base) / base : 0) >= 0.05,
      aiExplanation: item.aiExplanation ?? null,
    };
  };

  const rows = rawItems.map(mapRow);
  const isRows = rows.filter((row) => isIncomeStatement(row.acct));
  const bsRows = rows.filter((row) => isBalanceSheet(row.acct));

  const bsRoll = bsRows
    .filter((row) => Math.abs(row.actual - row.base) >= 0.3)
    .map((row) => {
      const delta = row.actual - row.base;
      const pct = row.base ? (delta / row.base) * 100 : 0;
      return {
        acct: `${row.acct} ${row.name}`,
        open: row.base,
        activity: round1(delta),
        close: row.actual,
        notes: `Delta ${delta >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
      };
    });

  const driverBuckets = new Map<string, { impact: number; flagged: number; total: number }>();
  rows.forEach((row) => {
    const delta = row.actual - row.base;
    const pct = row.base ? delta / row.base : 0;
    const bucket = driverBuckets.get(row.driver) ?? { impact: 0, flagged: 0, total: 0 };
    bucket.impact += delta;
    bucket.total += 1;
    if (Math.abs(delta) >= 0.5 || Math.abs(pct) >= 0.08) bucket.flagged += 1;
    driverBuckets.set(row.driver, bucket);
  });

  const drivers: DriverRow[] = Array.from(driverBuckets.entries())
    .map(([driver, value]) => ({
      driver,
      impact: round1(value.impact),
      confidence:
        value.flagged / Math.max(1, value.total) > 0.4
          ? ("High" as const)
          : ("Med" as const),
    }))
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 8);

  const cf: CfRow[] = CASH_FLOW_BRIDGE_DATA.map((row) => ({ ...row }));

  const aiExplanations = rows
    .filter((row) => row.significant || row.aiExplanation)
    .sort((a, b) => Math.abs(b.actual - b.base) - Math.abs(a.actual - a.base))
    .slice(0, 6)
    .map((row) => {
      const delta = row.actual - row.base;
      const pct = row.base ? delta / row.base : 0;
      return {
        acct: `${row.acct} ${row.name}`,
        delta: round1(delta),
        driver: row.aiExplanation ? `${row.aiExplanation.slice(0, 52)}...` : row.driver,
        conf: getConfidence(delta, pct),
        owner: row.owner,
        evidence: row.evidence,
        status: row.status,
      };
    });

  return {
    is: isRows.length ? isRows : FALLBACK_DATA.is,
    bs: bsRows.length ? bsRows : FALLBACK_DATA.bs,
    bsRoll: bsRoll.length ? bsRoll : FALLBACK_DATA.bsRoll,
    drivers: drivers.length ? drivers : FALLBACK_DATA.drivers,
    cf: cf.length ? cf : FALLBACK_DATA.cf,
    aiExplanations: aiExplanations.length ? aiExplanations : FALLBACK_DATA.aiExplanations,
  };
}

function statusClass(status: FluxStatus): string {
  if (status === "Closed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "In Review") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-orange-200 bg-orange-50 text-orange-700";
}

function confidenceClass(conf: "High" | "Med"): string {
  if (conf === "High") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function metricToneClass(tone: "positive" | "negative" | "neutral"): string {
  if (tone === "positive") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (tone === "negative") return "border-red-200 bg-red-50 text-red-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/* ──────────────────────────────── PAGE COMPONENT ──────────────────────────────── */

export default function FluxAnalysisPage() {
  const { data: fluxRaw, loading: fluxLoading, error: fluxError } = useFluxAnalysis();

  const data = useMemo(() => {
    if (!fluxRaw.length) return FALLBACK_DATA;
    const rawItems = fluxRaw as unknown as FluxRaw[];
    return buildPageData(rawItems);
  }, [fluxRaw]);

  const [materiality, setMateriality] = useState<MaterialityMode>("default");
  const [excludeNoise, setExcludeNoise] = useState(false);
  const [activeView, setActiveView] = useState<"is" | "bs" | "cf">("is");

  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [consolidation, setConsolidation] = useState("Consolidated");
  const [currency, setCurrency] = useState("USD");
  const [page, setPage] = useState(1);
  const [selectedRowId, setSelectedRowId] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponses, setAiResponses] = useState<AiResponse[]>([]);
  const [aiIsThinking, setAiIsThinking] = useState(false);
  const [aiPendingQuestion, setAiPendingQuestion] = useState("");
  const [aiThinkingSteps, setAiThinkingSteps] = useState<string[]>([]);
  const [priceSlider, setPriceSlider] = useState([1]);
  const [volumeSlider, setVolumeSlider] = useState([2]);
  const [fxSlider, setFxSlider] = useState([0]);
  const [watchDialogOpen, setWatchDialogOpen] = useState(false);
  const [watchName, setWatchName] = useState("Flux Watch — Q3 2025");
  const [watchThresholdType, setWatchThresholdType] = useState<"variance_pct" | "variance_amount">("variance_pct");
  const [watchThresholdValue, setWatchThresholdValue] = useState("5");
  const [watchFrequency, setWatchFrequency] = useState("daily");
  const [watchNotifyVia, setWatchNotifyVia] = useState("email");
  const [watchSelectedIds, setWatchSelectedIds] = useState<string[]>([]);
  const [watchRecipients, setWatchRecipients] = useState<string[]>([]);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [evidenceTargetRow, setEvidenceTargetRow] = useState<FluxRow | null>(null);
  const [evidenceType, setEvidenceType] = useState("journal-entry");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [evidenceFileName, setEvidenceFileName] = useState("");
  const [evidenceQuickLinks, setEvidenceQuickLinks] = useState<string[]>([]);
  const [evidenceOverrides, setEvidenceOverrides] = useState<Record<string, boolean>>({});

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aiThinkingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiResponseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const evidenceFileInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 10;

  const allRows = useMemo(() => [...data.is, ...data.bs], [data.is, data.bs]);
  const watchIsRows = useMemo(
    () => [...data.is].sort((a, b) => a.acct.localeCompare(b.acct, undefined, { numeric: true })),
    [data.is]
  );
  const watchBsRows = useMemo(
    () => [...data.bs].sort((a, b) => a.acct.localeCompare(b.acct, undefined, { numeric: true })),
    [data.bs]
  );
  const watchAllRows = useMemo(() => [...watchIsRows, ...watchBsRows], [watchIsRows, watchBsRows]);

  const ownerOptions = useMemo(() => {
    const unique = new Set(allRows.map((row) => row.owner));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [allRows]);
  const watchRecipientOptions = useMemo(() => {
    const unique = new Set(["Controller", "FP&A", ...ownerOptions]);
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [ownerOptions]);
  const defaultWatchRecipients = useMemo(() => {
    const preferred = ["Controller", "FP&A"].filter((person) =>
      watchRecipientOptions.includes(person)
    );
    return preferred.length ? preferred : watchRecipientOptions.slice(0, 2);
  }, [watchRecipientOptions]);
  const watchDefaultSelectedIds = useMemo(
    () => watchAllRows.filter((row) => row.status !== "Closed").map((row) => row.id),
    [watchAllRows]
  );
  const watchSelectedSet = useMemo(() => new Set(watchSelectedIds), [watchSelectedIds]);
  const evidenceQuickLinkSet = useMemo(() => new Set(evidenceQuickLinks), [evidenceQuickLinks]);

  const statusOptions = useMemo(() => {
    const unique = new Set(allRows.map((row) => row.status));
    return Array.from(unique);
  }, [allRows]);

  const fmtMoney = (n: number) => `$${Math.abs(n).toFixed(1)}M`;
  const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;

  const materialityThreshold = useMemo(() => {
    if (materiality === "tight") return { amt: 0.25, pct: 0.03 };
    if (materiality === "loose") return { amt: 0.05, pct: 0.08 };
    return { amt: 0.1, pct: 0.05 };
  }, [materiality]);

  const filterRows = useCallback(
    (rows: FluxRow[]) => {
      const { amt, pct } = materialityThreshold;
      return rows
        .filter((row) => {
          const delta = row.actual - row.base;
          const deltaPct = row.base ? delta / row.base : 0;
          const isNoise = Math.abs(delta) < amt && Math.abs(deltaPct) < pct;
          if (excludeNoise && isNoise) return false;
          if (ownerFilter !== "all" && row.owner !== ownerFilter) return false;
          if (statusFilter !== "all" && row.status !== statusFilter) return false;
          return true;
        })
        .sort((a, b) => Math.abs(b.actual - b.base) - Math.abs(a.actual - a.base));
    },
    [excludeNoise, materialityThreshold, ownerFilter, statusFilter]
  );

  const filteredIS = useMemo(() => filterRows(data.is), [data.is, filterRows]);
  const filteredBS = useMemo(() => filterRows(data.bs), [data.bs, filterRows]);
  const filteredAllRows = useMemo(() => [...filteredIS, ...filteredBS], [filteredIS, filteredBS]);

  const activeRows = useMemo(() => {
    if (activeView === "is") return filteredIS;
    if (activeView === "bs") return filteredBS;
    return [] as FluxRow[];
  }, [activeView, filteredIS, filteredBS]);

  const totalPages = Math.max(1, Math.ceil(activeRows.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pagedRows = activeRows.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setPage(1);
  }, [activeView, materiality, excludeNoise, ownerFilter, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const detailRow = useMemo(
    () => allRows.find((row) => row.id === selectedRowId) ?? null,
    [allRows, selectedRowId]
  );

  const kpiRevenue = useMemo(() => {
    const revenueRows = filteredAllRows.filter(
      (row) => /revenue/i.test(row.name) && !/cost|deferred/i.test(row.name)
    );
    return revenueRows.sort((a, b) => b.actual - a.actual)[0] ?? null;
  }, [filteredAllRows]);

  const kpiCfTotal = useMemo(() => data.cf.reduce((sum, row) => sum + row.val, 0), [data.cf]);

  const topDrivers = useMemo(() => {
    if (!filteredAllRows.length) return data.drivers;

    const buckets = new Map<string, { impact: number; count: number; flagged: number }>();
    filteredAllRows.forEach((row) => {
      const delta = row.actual - row.base;
      const pct = row.base ? delta / row.base : 0;
      const bucket = buckets.get(row.driver) ?? { impact: 0, count: 0, flagged: 0 };
      bucket.impact += delta;
      bucket.count += 1;
      if (Math.abs(delta) >= 0.5 || Math.abs(pct) >= 0.08) bucket.flagged += 1;
      buckets.set(row.driver, bucket);
    });

    const mapped = Array.from(buckets.entries()).map(([driver, value]) => ({
      driver,
      impact: round1(value.impact),
      confidence: value.flagged / Math.max(1, value.count) > 0.4 ? ("High" as const) : ("Med" as const),
    }));

    return mapped.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 8);
  }, [filteredAllRows, data.drivers]);

  const explanationCards = useMemo(() => {
    const fromRows = filteredAllRows
      .filter((row) => row.aiExplanation || Math.abs(row.actual - row.base) >= 0.3)
      .sort((a, b) => Math.abs(b.actual - b.base) - Math.abs(a.actual - a.base))
      .slice(0, 4)
      .map((row) => {
        const delta = row.actual - row.base;
        const pct = row.base ? delta / row.base : 0;
        return {
          acct: `${row.acct} ${row.name}`,
          delta,
          driver: row.aiExplanation ? `${row.aiExplanation.slice(0, 80)}...` : row.driver,
          conf: getConfidence(delta, pct),
          owner: row.owner,
          evidence: row.evidence,
          status: row.status,
        };
      });
    return fromRows.length ? fromRows : data.aiExplanations;
  }, [filteredAllRows, data.aiExplanations]);

  const promptSuggestions = useMemo(() => {
    if (!detailRow) return AI_PROMPT_SUGGESTIONS;
    return [
      {
        prompt: `Explain ${detailRow.name} variance and next actions`,
      },
      ...AI_PROMPT_SUGGESTIONS,
    ];
  }, [detailRow]);
  const aiAutocompleteSuggestions = useMemo(() => {
    const query = aiPrompt.trim().toLowerCase();
    if (!query) return [] as PromptSuggestion[];

    const words = query.split(/\s+/).filter(Boolean);
    const scored = promptSuggestions.map((suggestion, index) => {
      const text = suggestion.prompt.toLowerCase();
      let score = 0;
      if (text.includes(query)) score += 10;
      if (words.length) {
        score += words.filter((word) => text.includes(word)).length;
      }
      return { suggestion, score, index };
    });

    const matched = scored
      .filter((item) => item.score > 0)
      .sort((a, b) => (b.score === a.score ? a.index - b.index : b.score - a.score))
      .map((item) => item.suggestion);

    return (matched.length ? matched : promptSuggestions).slice(0, 6);
  }, [aiPrompt, promptSuggestions]);
  const showAiAutocomplete = !aiIsThinking && aiPrompt.trim().length > 0 && aiAutocompleteSuggestions.length > 0;

  const signedMoney = (value: number) =>
    `${value >= 0 ? "+" : "-"}$${Math.abs(value).toFixed(1)}M`;

  const generateAIResponse = (question: string): Omit<AiResponse, "id" | "q"> => {
    const prompt = question.toLowerCase();
    const openItems = filteredAllRows.filter((row) => row.status !== "Closed").length;
    const closedItems = filteredAllRows.length - openItems;
    const inReviewItems = filteredAllRows.filter((row) => row.status === "In Review").length;
    const netIsDelta = filteredIS.reduce((sum, row) => sum + (row.actual - row.base), 0);
    const netBsDelta = filteredBS.reduce((sum, row) => sum + (row.actual - row.base), 0);
    const topMovers = [...filteredAllRows]
      .sort((a, b) => Math.abs(b.actual - b.base) - Math.abs(a.actual - a.base))
      .slice(0, 5);
    const isTopMovers = [...filteredIS]
      .sort((a, b) => Math.abs(b.actual - b.base) - Math.abs(a.actual - a.base))
      .slice(0, 3);
    const bsTopMovers = [...filteredBS]
      .sort((a, b) => Math.abs(b.actual - b.base) - Math.abs(a.actual - a.base))
      .slice(0, 3);
    const noEvidenceRows = filteredAllRows.filter((row) => !row.evidence && row.status !== "Closed");
    const thresholdBreaches = filteredAllRows.filter((row) => {
      const delta = row.actual - row.base;
      const pct = row.base ? Math.abs(delta / row.base) : 0;
      return Math.abs(delta) >= 0.5 || pct >= 0.1;
    });
    const ownerMap = new Map<string, { count: number; openCount: number; totalDelta: number }>();
    filteredAllRows.forEach((row) => {
      const prev = ownerMap.get(row.owner) ?? { count: 0, openCount: 0, totalDelta: 0 };
      prev.count += 1;
      if (row.status !== "Closed") prev.openCount += 1;
      prev.totalDelta += Math.abs(row.actual - row.base);
      ownerMap.set(row.owner, prev);
    });
    const arRow = filteredBS.find((row) => /receivable/i.test(row.name));
    const invRow = filteredBS.find((row) => /inventory/i.test(row.name));
    const apRow = filteredBS.find((row) => /payable/i.test(row.name));
    const arDelta = arRow ? arRow.actual - arRow.base : 0;
    const invDelta = invRow ? invRow.actual - invRow.base : 0;
    const apDelta = apRow ? apRow.actual - apRow.base : 0;
    const expenseRows = filteredIS.filter((row) => !/revenue|income/i.test(row.name));
    const totalExpenseDelta = expenseRows.reduce((s, r) => s + (r.actual - r.base), 0);
    const cogsRows = filteredIS.filter((row) => /cost of (goods|sales)|cogs/i.test(row.name));
    const cogsDelta = cogsRows.reduce((s, r) => s + (r.actual - r.base), 0);
    const revenueRows = filteredIS.filter((row) => /revenue/i.test(row.name) && !/cost|deferred/i.test(row.name));
    const totalRevenue = revenueRows.reduce((s, r) => s + r.actual, 0);
    const baseRevenue = revenueRows.reduce((s, r) => s + r.base, 0);
    const grossMarginCurrent = totalRevenue > 0 ? (totalRevenue - cogsRows.reduce((s, r) => s + r.actual, 0)) / totalRevenue : 0;
    const grossMarginPrior = baseRevenue > 0 ? (baseRevenue - cogsRows.reduce((s, r) => s + r.base, 0)) / baseRevenue : 0;
    const projectedRevenue = (kpiRevenue?.base ?? 48.2) * ((priceSlider[0] / 100) * 0.45 + (volumeSlider[0] / 100) * 0.35 + (fxSlider[0] / 100) * -0.2);

    const baseMetrics: AiResponse["metrics"] = [
      { label: "Net IS Delta", value: signedMoney(netIsDelta), tone: netIsDelta >= 0 ? "positive" : "negative" },
      { label: "Operating CF", value: signedMoney(kpiCfTotal), tone: kpiCfTotal >= 0 ? "positive" : "negative" },
      { label: "Open Items", value: `${openItems}`, tone: openItems === 0 ? "positive" : "neutral" },
    ];

    // ── Pattern definitions (ordered from most specific to least) ──
    type PromptPattern = {
      test: (p: string) => boolean;
      generate: () => Omit<AiResponse, "id" | "q">;
    };

    const patterns: PromptPattern[] = [
      // 1. Top movers
      {
        test: (p) => /top.*(movers?|biggest|largest)|biggest.*changes?|largest.*variances?/.test(p),
        generate: () => ({
          summary: `Top ${Math.min(5, topMovers.length)} movers by absolute variance in the current filtered period. These accounts drive the bulk of IS and BS movement.`,
          metrics: [
            { label: "Top Mover", value: topMovers[0] ? `$${Math.abs(topMovers[0].actual - topMovers[0].base).toFixed(1)}M` : "N/A", tone: "neutral" },
            { label: "Accounts Analyzed", value: `${filteredAllRows.length}`, tone: "neutral" },
            { label: "Open Items", value: `${openItems}`, tone: openItems === 0 ? "positive" : "neutral" },
          ],
          bullets: topMovers.slice(0, 5).map((row, i) => {
            const delta = row.actual - row.base;
            const pct = row.base ? delta / row.base : 0;
            return `#${i + 1} ${row.name} (${row.acct}): ${signedMoney(delta)} (${fmtPct(pct)}), driver: ${row.driver}, owner: ${row.owner}.`;
          }),
          matchedPrompt: "What are the top 5 movers this period?",
        }),
      },
      // 2. Accounts needing attention / priority
      {
        test: (p) => /need.*attention|priorit|urgent|focus|critical|action.*required/.test(p),
        generate: () => {
          const urgent = filteredAllRows
            .filter((row) => row.status === "Open" && !row.evidence)
            .sort((a, b) => Math.abs(b.actual - b.base) - Math.abs(a.actual - a.base))
            .slice(0, 4);
          return {
            summary: `${urgent.length} accounts flagged for immediate attention — Open status with no supporting evidence attached. Prioritized by absolute variance.`,
            metrics: [
              { label: "No Evidence", value: `${noEvidenceRows.length}`, tone: "negative" },
              { label: "Open & High ∆", value: `${urgent.length}`, tone: "negative" },
              { label: "In Review", value: `${inReviewItems}`, tone: "neutral" },
            ],
            bullets: urgent.length
              ? urgent.map((row) => {
                  const delta = row.actual - row.base;
                  return `${row.name} (${row.acct}): ${signedMoney(delta)}, owner ${row.owner} — no evidence, status Open.`;
                })
              : ["All accounts either have evidence or are already Closed. No critical items found."],
            matchedPrompt: "Which accounts need attention first?",
          };
        },
      },
      // 3. Expense variance breakdown
      {
        test: (p) => /expense.*variance|expense.*breakdown|opex|operating.*expense(?!.*trend)/.test(p),
        generate: () => ({
          summary: `Operating expense variance breakdown across ${expenseRows.length} expense accounts. Net expense delta is ${signedMoney(totalExpenseDelta)} period over period.`,
          metrics: [
            { label: "Net Expense ∆", value: signedMoney(totalExpenseDelta), tone: totalExpenseDelta <= 0 ? "positive" : "negative" },
            { label: "Expense Lines", value: `${expenseRows.length}`, tone: "neutral" },
            { label: "COGS ∆", value: signedMoney(cogsDelta), tone: cogsDelta <= 0 ? "positive" : "negative" },
          ],
          bullets: expenseRows
            .sort((a, b) => Math.abs(b.actual - b.base) - Math.abs(a.actual - a.base))
            .slice(0, 4)
            .map((row) => {
              const delta = row.actual - row.base;
              const pct = row.base ? delta / row.base : 0;
              return `${row.name}: ${signedMoney(delta)} (${fmtPct(pct)}), driven by ${row.driver.toLowerCase()}.`;
            }),
          matchedPrompt: "Show expense variance breakdown",
        }),
      },
      // 4. COGS drivers
      {
        test: (p) => /cogs|cost of (goods|sales)|direct cost/.test(p),
        generate: () => ({
          summary: `Cost of Goods Sold analysis across ${cogsRows.length} COGS accounts. Total COGS delta is ${signedMoney(cogsDelta)}, ${cogsDelta > 0 ? "increasing" : "decreasing"} period over period.`,
          metrics: [
            { label: "COGS ∆", value: signedMoney(cogsDelta), tone: cogsDelta <= 0 ? "positive" : "negative" },
            { label: "Gross Margin", value: `${(grossMarginCurrent * 100).toFixed(1)}%`, tone: grossMarginCurrent >= grossMarginPrior ? "positive" : "negative" },
            { label: "COGS Lines", value: `${cogsRows.length}`, tone: "neutral" },
          ],
          bullets: cogsRows.length
            ? cogsRows.map((row) => {
                const delta = row.actual - row.base;
                const pct = row.base ? delta / row.base : 0;
                return `${row.name}: ${signedMoney(delta)} (${fmtPct(pct)}), owner ${row.owner}, driver: ${row.driver.toLowerCase()}.`;
              })
            : ["No COGS line items found in current filter scope. Try including all IS accounts."],
          matchedPrompt: "Explain COGS increase drivers",
        }),
      },
      // 5. IS vs BS comparison
      {
        test: (p) => /is.*vs.*bs|bs.*vs.*is|income.*vs.*balance|compare.*is.*bs|compare.*statement/.test(p),
        generate: () => ({
          summary: `Income Statement net delta is ${signedMoney(netIsDelta)} across ${filteredIS.length} lines. Balance Sheet net delta is ${signedMoney(netBsDelta)} across ${filteredBS.length} lines.`,
          metrics: [
            { label: "IS Net ∆", value: signedMoney(netIsDelta), tone: netIsDelta >= 0 ? "positive" : "negative" },
            { label: "BS Net ∆", value: signedMoney(netBsDelta), tone: "neutral" },
            { label: "Total Lines", value: `${filteredAllRows.length}`, tone: "neutral" },
          ],
          bullets: [
            `IS top mover: ${isTopMovers[0] ? `${isTopMovers[0].name} at ${signedMoney(isTopMovers[0].actual - isTopMovers[0].base)}` : "N/A"}.`,
            `BS top mover: ${bsTopMovers[0] ? `${bsTopMovers[0].name} at ${signedMoney(bsTopMovers[0].actual - bsTopMovers[0].base)}` : "N/A"}.`,
            `IS has ${filteredIS.filter((r) => r.status !== "Closed").length} open items, BS has ${filteredBS.filter((r) => r.status !== "Closed").length} open items.`,
            `${isTopMovers.length > 1 ? `Second IS mover: ${isTopMovers[1].name} at ${signedMoney(isTopMovers[1].actual - isTopMovers[1].base)}.` : "Only one IS line in scope."}`,
          ],
          matchedPrompt: "Compare IS vs BS variance patterns",
        }),
      },
      // 6. Net income impact
      {
        test: (p) => /net income|bottom line|profit impact|earnings/.test(p),
        generate: () => {
          const revDelta = revenueRows.reduce((s, r) => s + (r.actual - r.base), 0);
          return {
            summary: `Net income impact analysis: Revenue moved ${signedMoney(revDelta)}, expenses moved ${signedMoney(totalExpenseDelta)}. The combined bottom-line impact is ${signedMoney(revDelta - totalExpenseDelta)}.`,
            metrics: [
              { label: "Revenue ∆", value: signedMoney(revDelta), tone: revDelta >= 0 ? "positive" : "negative" },
              { label: "Expense ∆", value: signedMoney(totalExpenseDelta), tone: totalExpenseDelta <= 0 ? "positive" : "negative" },
              { label: "Net Impact", value: signedMoney(revDelta - totalExpenseDelta), tone: (revDelta - totalExpenseDelta) >= 0 ? "positive" : "negative" },
            ],
            bullets: [
              `Revenue lines contributed ${signedMoney(revDelta)} from ${revenueRows.length} accounts.`,
              `Expense lines contributed ${signedMoney(totalExpenseDelta)} from ${expenseRows.length} accounts.`,
              `Largest favorable move: ${topMovers.find((r) => (r.actual - r.base) > 0) ? `${topMovers.find((r) => (r.actual - r.base) > 0)!.name} at ${signedMoney(topMovers.find((r) => (r.actual - r.base) > 0)!.actual - topMovers.find((r) => (r.actual - r.base) > 0)!.base)}` : "None"}.`,
              `Largest adverse move: ${topMovers.find((r) => (r.actual - r.base) < 0) ? `${topMovers.find((r) => (r.actual - r.base) < 0)!.name} at ${signedMoney(topMovers.find((r) => (r.actual - r.base) < 0)!.actual - topMovers.find((r) => (r.actual - r.base) < 0)!.base)}` : "None"}.`,
            ],
            matchedPrompt: "What is the net income impact?",
          };
        },
      },
      // 7. Missing evidence
      {
        test: (p) => /missing.*evidence|no.*evidence|evidence.*gap|without.*support|attach/.test(p),
        generate: () => ({
          summary: `${noEvidenceRows.length} accounts currently lack supporting evidence. These need documentation before close certification.`,
          metrics: [
            { label: "No Evidence", value: `${noEvidenceRows.length}`, tone: noEvidenceRows.length > 0 ? "negative" : "positive" },
            { label: "With Evidence", value: `${filteredAllRows.length - noEvidenceRows.length}`, tone: "positive" },
            { label: "Evidence Rate", value: `${filteredAllRows.length ? ((1 - noEvidenceRows.length / filteredAllRows.length) * 100).toFixed(0) : 0}%`, tone: noEvidenceRows.length === 0 ? "positive" : "neutral" },
          ],
          bullets: noEvidenceRows.length
            ? noEvidenceRows.slice(0, 4).map((row) => {
                const delta = row.actual - row.base;
                return `${row.name} (${row.acct}): ${signedMoney(delta)}, owner ${row.owner}, status ${row.status} — evidence required.`;
              })
            : ["All accounts in the current filter scope have evidence attached."],
          matchedPrompt: "Show accounts missing evidence",
        }),
      },
      // 8. Open accounts
      {
        test: (p) => /still open|open account|status.*open|not.*closed|pending.*review/.test(p),
        generate: () => {
          const openRows = filteredAllRows.filter((row) => row.status !== "Closed");
          return {
            summary: `${openRows.length} accounts remain open out of ${filteredAllRows.length} total. ${inReviewItems} are In Review and ${openRows.length - inReviewItems} are in Open status.`,
            metrics: [
              { label: "Open", value: `${openRows.length - inReviewItems}`, tone: "neutral" },
              { label: "In Review", value: `${inReviewItems}`, tone: "neutral" },
              { label: "Closed", value: `${closedItems}`, tone: "positive" },
            ],
            bullets: openRows.slice(0, 4).map((row) => {
              const delta = row.actual - row.base;
              return `${row.name} (${row.acct}): ${signedMoney(delta)}, status ${row.status}, owner ${row.owner}${row.evidence ? "" : " — no evidence"}.`;
            }),
            matchedPrompt: "Which accounts are still open?",
          };
        },
      },
      // 9. Owner workload
      {
        test: (p) => /owner.*workload|workload|owner.*distribution|who.*has.*most|team.*allocation/.test(p),
        generate: () => {
          const owners = Array.from(ownerMap.entries())
            .sort((a, b) => b[1].totalDelta - a[1].totalDelta)
            .slice(0, 5);
          return {
            summary: `Owner workload distribution across ${ownerMap.size} team members. Ranked by total absolute variance they are responsible for reviewing.`,
            metrics: [
              { label: "Team Size", value: `${ownerMap.size}`, tone: "neutral" },
              { label: "Total Open", value: `${openItems}`, tone: openItems === 0 ? "positive" : "neutral" },
              { label: "Busiest", value: owners[0]?.[0] ?? "N/A", tone: "neutral" },
            ],
            bullets: owners.map(([owner, stats]) =>
              `${owner}: ${stats.count} accounts (${stats.openCount} open), $${stats.totalDelta.toFixed(1)}M total absolute variance.`
            ),
            matchedPrompt: "Show owner workload distribution",
          };
        },
      },
      // 10. Highest risk items
      {
        test: (p) => /highest.*risk|risk.*items?|high.*risk|risk.*score|risky/.test(p),
        generate: () => {
          const riskItems = filteredAllRows
            .filter((row) => {
              const pct = row.base ? Math.abs((row.actual - row.base) / row.base) : 0;
              return row.status !== "Closed" && (Math.abs(row.actual - row.base) >= 0.5 || pct >= 0.1) && !row.evidence;
            })
            .sort((a, b) => Math.abs(b.actual - b.base) - Math.abs(a.actual - a.base))
            .slice(0, 4);
          return {
            summary: `${riskItems.length} high-risk items identified — large variance, no evidence, and not yet closed. These represent the greatest close risk.`,
            metrics: [
              { label: "High Risk", value: `${riskItems.length}`, tone: riskItems.length > 0 ? "negative" : "positive" },
              { label: "Threshold ∆", value: ">$0.5M or >10%", tone: "neutral" },
              { label: "Open Total", value: `${openItems}`, tone: "neutral" },
            ],
            bullets: riskItems.length
              ? riskItems.map((row) => {
                  const delta = row.actual - row.base;
                  const pct = row.base ? delta / row.base : 0;
                  return `${row.name}: ${signedMoney(delta)} (${fmtPct(pct)}), ${row.driver} — owner ${row.owner}, no evidence.`;
                })
              : ["No high-risk items found. All large-variance accounts are either closed or have evidence."],
            matchedPrompt: "What are the highest risk items?",
          };
        },
      },
      // 11. Gross margin decline
      {
        test: (p) => /gross.*margin|margin.*declin|margin.*drop|margin.*change/.test(p),
        generate: () => ({
          summary: `Gross margin moved from ${(grossMarginPrior * 100).toFixed(1)}% to ${(grossMarginCurrent * 100).toFixed(1)}%, a ${((grossMarginCurrent - grossMarginPrior) * 100).toFixed(1)}pp change. COGS delta is ${signedMoney(cogsDelta)}.`,
          metrics: [
            { label: "Current GM", value: `${(grossMarginCurrent * 100).toFixed(1)}%`, tone: grossMarginCurrent >= grossMarginPrior ? "positive" : "negative" },
            { label: "Prior GM", value: `${(grossMarginPrior * 100).toFixed(1)}%`, tone: "neutral" },
            { label: "GM ∆", value: `${((grossMarginCurrent - grossMarginPrior) * 100).toFixed(1)}pp`, tone: grossMarginCurrent >= grossMarginPrior ? "positive" : "negative" },
          ],
          bullets: [
            `Revenue base moved from $${baseRevenue.toFixed(1)}M to $${totalRevenue.toFixed(1)}M (${signedMoney(totalRevenue - baseRevenue)}).`,
            `COGS moved ${signedMoney(cogsDelta)}, ${cogsDelta > 0 ? "compressing" : "expanding"} the margin.`,
            cogsRows.length > 0 ? `Largest COGS mover: ${cogsRows.sort((a, b) => Math.abs(b.actual - b.base) - Math.abs(a.actual - a.base))[0].name} at ${signedMoney(cogsRows[0].actual - cogsRows[0].base)}.` : "No COGS lines in current scope.",
            "Review pricing, volume mix, and input cost changes for root cause identification.",
          ],
          matchedPrompt: "Explain why gross margin declined",
        }),
      },
      // 12. FX scenario
      {
        test: (p) => /fx.*flat|fx.*rate|currency.*impact|foreign.*exchange|what if.*fx/.test(p),
        generate: () => {
          const fxImpact = (kpiRevenue?.base ?? 48.2) * (fxSlider[0] / 100) * -0.2;
          const flatFxRevenue = projectedRevenue - fxImpact;
          return {
            summary: `If FX rates were held flat (0% movement), the projected revenue delta would shift by ${signedMoney(-fxImpact)} to ${signedMoney(flatFxRevenue)}.`,
            metrics: [
              { label: "FX Impact", value: signedMoney(fxImpact), tone: fxImpact >= 0 ? "positive" : "negative" },
              { label: "Flat FX Rev ∆", value: signedMoney(flatFxRevenue), tone: flatFxRevenue >= 0 ? "positive" : "negative" },
              { label: "FX Slider", value: `${fxSlider[0]}%`, tone: "neutral" },
            ],
            bullets: [
              `Current FX slider is set to ${fxSlider[0]}%, contributing ${signedMoney(fxImpact)} to revenue sensitivity.`,
              `Removing FX effect would ${fxImpact < 0 ? "improve" : "reduce"} the projected outcome by $${Math.abs(fxImpact).toFixed(1)}M.`,
              "Adjust the FX slider to 0% to simulate flat exchange rates in the sensitivity chart.",
              "Consider hedging strategies for accounts with significant FX exposure.",
            ],
            matchedPrompt: "What if FX rates were flat?",
          };
        },
      },
      // 13. Aging of open review items
      {
        test: (p) => /aging.*open|review.*aging|how.*long.*open|stale.*items|old.*open/.test(p),
        generate: () => {
          const openRows = filteredAllRows.filter((row) => row.status !== "Closed");
          const withEvidence = openRows.filter((row) => row.evidence).length;
          const withoutEvidence = openRows.length - withEvidence;
          return {
            summary: `${openRows.length} items remain open. ${withEvidence} have evidence attached, ${withoutEvidence} still need documentation. Recommend prioritizing high-delta items without evidence.`,
            metrics: [
              { label: "Open Total", value: `${openRows.length}`, tone: openRows.length === 0 ? "positive" : "neutral" },
              { label: "Has Evidence", value: `${withEvidence}`, tone: "positive" },
              { label: "Needs Evidence", value: `${withoutEvidence}`, tone: withoutEvidence > 0 ? "negative" : "positive" },
            ],
            bullets: [
              `${openRows.length - inReviewItems} items are in Open status (not yet reviewed).`,
              `${inReviewItems} items are In Review (pending approval).`,
              `${withoutEvidence} open items lack supporting evidence — these should be prioritized.`,
              "Route In Review items to the controller for final approval to accelerate close.",
            ],
            matchedPrompt: "Show aging of open review items",
          };
        },
      },
      // 14. Threshold breaches
      {
        test: (p) => /exceed.*threshold|threshold.*breach|above.*threshold|material.*breach|significant.*variance/.test(p),
        generate: () => ({
          summary: `${thresholdBreaches.length} accounts exceeded materiality thresholds (>$0.5M or >10%). These require mandatory explanation before close certification.`,
          metrics: [
            { label: "Breaches", value: `${thresholdBreaches.length}`, tone: thresholdBreaches.length > 0 ? "negative" : "positive" },
            { label: "Total Accounts", value: `${filteredAllRows.length}`, tone: "neutral" },
            { label: "Breach Rate", value: `${filteredAllRows.length ? ((thresholdBreaches.length / filteredAllRows.length) * 100).toFixed(0) : 0}%`, tone: "neutral" },
          ],
          bullets: thresholdBreaches.slice(0, 4).map((row) => {
            const delta = row.actual - row.base;
            const pct = row.base ? delta / row.base : 0;
            return `${row.name}: ${signedMoney(delta)} (${fmtPct(pct)}), status ${row.status}, owner ${row.owner}.`;
          }),
          matchedPrompt: "Which accounts exceeded threshold?",
        }),
      },
      // 15. Period close readiness
      {
        test: (p) => /close.*readiness|ready.*close|period.*close.*status|close.*summary|close.*progress/.test(p),
        generate: () => {
          const closePct = filteredAllRows.length ? (closedItems / filteredAllRows.length) * 100 : 0;
          const evidenceRate = filteredAllRows.length ? ((filteredAllRows.length - noEvidenceRows.length) / filteredAllRows.length) * 100 : 0;
          return {
            summary: `Close readiness: ${closePct.toFixed(0)}% of accounts are Closed, ${evidenceRate.toFixed(0)}% have evidence. ${thresholdBreaches.filter((r) => r.status !== "Closed").length} material breaches remain open.`,
            metrics: [
              { label: "Close %", value: `${closePct.toFixed(0)}%`, tone: closePct >= 80 ? "positive" : closePct >= 50 ? "neutral" : "negative" },
              { label: "Evidence %", value: `${evidenceRate.toFixed(0)}%`, tone: evidenceRate >= 90 ? "positive" : "neutral" },
              { label: "Open Breaches", value: `${thresholdBreaches.filter((r) => r.status !== "Closed").length}`, tone: thresholdBreaches.filter((r) => r.status !== "Closed").length === 0 ? "positive" : "negative" },
            ],
            bullets: [
              `${closedItems} of ${filteredAllRows.length} accounts are Closed (${closePct.toFixed(0)}%).`,
              `${noEvidenceRows.length} accounts still need evidence attached.`,
              `${inReviewItems} accounts are In Review — pending controller approval.`,
              `${thresholdBreaches.filter((r) => r.status !== "Closed").length} material threshold breaches need resolution before sign-off.`,
            ],
            matchedPrompt: "Summarize period close readiness",
          };
        },
      },
      // 16. AR increase and cash impact
      {
        test: (p) => /ar.*increase.*cash|ar.*cash.*impact|receivable.*cash|ar.*impact|cash.*ar/.test(p),
        generate: () => ({
          summary: `Accounts Receivable moved ${signedMoney(arDelta)} period over period. ${arDelta > 0 ? "This increase" : "This decrease"} directly impacts operating cash flow, which stands at ${signedMoney(kpiCfTotal)}.`,
          metrics: [
            { label: "AR ∆", value: signedMoney(arDelta), tone: arDelta <= 0 ? "positive" : "negative" },
            { label: "Operating CF", value: signedMoney(kpiCfTotal), tone: kpiCfTotal >= 0 ? "positive" : "negative" },
            { label: "AP ∆ (Offset)", value: signedMoney(apDelta), tone: apDelta >= 0 ? "positive" : "neutral" },
          ],
          bullets: [
            `AR ${arDelta > 0 ? "increased" : "decreased"} by $${Math.abs(arDelta).toFixed(1)}M${arRow ? ` (${arRow.name})` : ""}.`,
            `${arDelta > 0 ? "Rising AR consumes cash — review collection efforts and aging buckets." : "Declining AR releases cash — positive for working capital."}`,
            `AP offset: ${signedMoney(apDelta)}. Net working capital change from AR+AP is ${signedMoney(arDelta + apDelta)}.`,
            `Inventory contribution: ${signedMoney(invDelta)}. Combined WC movement is ${signedMoney(arDelta + invDelta + apDelta)}.`,
          ],
          matchedPrompt: "Explain AR increase and cash impact",
        }),
      },
      // 17. Operating expense trend
      {
        test: (p) => /operating.*expense.*trend|opex.*trend|expense.*trend|spending.*trend/.test(p),
        generate: () => {
          const sortedExpenses = [...expenseRows].sort((a, b) => (b.actual - b.base) - (a.actual - a.base));
          const increasing = sortedExpenses.filter((r) => r.actual > r.base);
          const decreasing = sortedExpenses.filter((r) => r.actual < r.base);
          return {
            summary: `Operating expense trend: ${increasing.length} expense lines increased, ${decreasing.length} decreased. Net movement is ${signedMoney(totalExpenseDelta)}.`,
            metrics: [
              { label: "Increasing", value: `${increasing.length}`, tone: "negative" },
              { label: "Decreasing", value: `${decreasing.length}`, tone: "positive" },
              { label: "Net Expense ∆", value: signedMoney(totalExpenseDelta), tone: totalExpenseDelta <= 0 ? "positive" : "negative" },
            ],
            bullets: [
              ...increasing.slice(0, 2).map((r) => `↑ ${r.name}: ${signedMoney(r.actual - r.base)}, driven by ${r.driver.toLowerCase()}.`),
              ...decreasing.slice(0, 2).map((r) => `↓ ${r.name}: ${signedMoney(r.actual - r.base)}, driven by ${r.driver.toLowerCase()}.`),
            ],
            matchedPrompt: "Show operating expense trend analysis",
          };
        },
      },
      // 18. One-time items
      {
        test: (p) => /one[- ]?time|non[- ]?recurring|unusual|extraordinary|special.*item/.test(p),
        generate: () => {
          const oneTime = filteredAllRows.filter((row) => /one-time|non-recurring|restructuring|impairment|write-off|settlement/i.test(row.driver));
          const otherLarge = filteredAllRows
            .filter((row) => {
              const pct = row.base ? Math.abs((row.actual - row.base) / row.base) : 0;
              return pct >= 0.25 && !oneTime.includes(row);
            })
            .slice(0, 2);
          return {
            summary: `${oneTime.length} accounts have explicitly tagged one-time/non-recurring drivers. ${otherLarge.length} additional accounts show >25% variance that may warrant investigation.`,
            metrics: [
              { label: "Tagged One-Time", value: `${oneTime.length}`, tone: "neutral" },
              { label: "Suspect (>25%)", value: `${otherLarge.length}`, tone: otherLarge.length > 0 ? "neutral" : "positive" },
              { label: "Total ∆", value: signedMoney(oneTime.reduce((s, r) => s + (r.actual - r.base), 0)), tone: "neutral" },
            ],
            bullets: [
              ...oneTime.slice(0, 3).map((row) => `${row.name}: ${signedMoney(row.actual - row.base)}, driver: ${row.driver}.`),
              ...otherLarge.map((row) => {
                const pct = row.base ? (row.actual - row.base) / row.base : 0;
                return `${row.name}: ${fmtPct(pct)} variance (${signedMoney(row.actual - row.base)}) — review if one-time.`;
              }),
              oneTime.length === 0 && otherLarge.length === 0 ? "No one-time or unusually large items detected in current filter scope." : "",
            ].filter(Boolean),
            matchedPrompt: "What are the one-time items this period?",
          };
        },
      },
      // 19. Variance by owner
      {
        test: (p) => /variance.*by.*owner|owner.*variance|owner.*summary|by.*owner/.test(p),
        generate: () => {
          const owners = Array.from(ownerMap.entries()).sort((a, b) => b[1].totalDelta - a[1].totalDelta);
          return {
            summary: `Variance distribution across ${owners.length} account owners. Concentration of large deltas may indicate resource bottlenecks for close.`,
            metrics: [
              { label: "Owners", value: `${owners.length}`, tone: "neutral" },
              { label: "Avg ∆/Owner", value: `$${owners.length ? (owners.reduce((s, [, v]) => s + v.totalDelta, 0) / owners.length).toFixed(1) : 0}M`, tone: "neutral" },
              { label: "Most Open", value: owners.sort((a, b) => b[1].openCount - a[1].openCount)[0]?.[0] ?? "N/A", tone: "neutral" },
            ],
            bullets: owners.slice(0, 5).map(([owner, stats]) =>
              `${owner}: ${stats.count} accounts, ${stats.openCount} open, $${stats.totalDelta.toFixed(1)}M total |∆|.`
            ),
            matchedPrompt: "Show variance by owner summary",
          };
        },
      },
      // 20. Classify drivers
      {
        test: (p) => /classify|driver.*cluster|driver.*breakdown|categorize.*driver/.test(p),
        generate: () => {
          const bullets = topDrivers.slice(0, 4).map((driver) => {
            const pct = (kpiRevenue?.base ?? 48.2) ? driver.impact / (kpiRevenue?.base ?? 48.2) : 0;
            return `${driver.driver}: ${signedMoney(driver.impact)} (${fmtPct(pct)}) with ${driver.confidence} confidence.`;
          });
          return {
            summary: `Top driver clusters computed from ${filteredAllRows.length} filtered Flux accounts. ${topDrivers.length} unique drivers identified, ranked by absolute impact.`,
            metrics: baseMetrics,
            bullets,
            matchedPrompt: "Classify drivers for all accounts",
          };
        },
      },
      // 21. Revenue bridge
      {
        test: (p) => /revenue.*bridge|bridge.*q[0-9]|price.*volume.*mix|revenue.*waterfall/.test(p),
        generate: () => ({
          summary: "Revenue bridge generated from current period deltas. You can tune Price/Volume/FX sliders to simulate alternate outcomes.",
          metrics: [
            ...baseMetrics.slice(0, 2),
            { label: "Projected Rev ∆", value: signedMoney(projectedRevenue), tone: projectedRevenue >= 0 ? "positive" : "negative" },
          ],
          bullets: [
            `Revenue sensitivity based on current sliders is ${signedMoney(projectedRevenue)}.`,
            ...topMovers.filter((r) => /revenue/i.test(r.name)).slice(0, 2).map((row) => {
              const delta = row.actual - row.base;
              const pct = row.base ? delta / row.base : 0;
              return `${row.name}: ${signedMoney(delta)} (${fmtPct(pct)}), owner ${row.owner}.`;
            }),
            `Price slider: ${priceSlider[0]}%, Volume slider: ${volumeSlider[0]}%, FX slider: ${fxSlider[0]}%.`,
          ],
          matchedPrompt: "Show revenue bridge from Q2 to Q3",
        }),
      },
      // 22. Impact / scenario / sensitivity / losing accounts
      {
        test: (p) => /impact.*losing|sensitivity|what if(?!.*fx)|stress.*test|scenario/.test(p),
        generate: () => {
          const stressImpact = -Math.abs((kpiRevenue?.actual ?? 0) * 0.12);
          return {
            summary: "Scenario response generated from current Flux profile with a stressed revenue assumption. Top accounts by delta represent the highest concentration risk.",
            metrics: [
              { label: "Stress Case", value: signedMoney(stressImpact), tone: "negative" },
              { label: "Projected Rev ∆", value: signedMoney(projectedRevenue), tone: projectedRevenue >= 0 ? "positive" : "negative" },
              { label: "In Review", value: `${inReviewItems}`, tone: "neutral" },
            ],
            bullets: [
              "Loss concentration risk is highest in top revenue-bearing accounts currently marked Open or In Review.",
              ...topMovers.slice(0, 2).map((r) => `${r.name}: ${signedMoney(r.actual - r.base)}, status ${r.status}.`),
              "Use watchlist to track the stressed cohort through period close.",
            ],
            matchedPrompt: "Show impact of losing top 3 accounts",
          };
        },
      },
      // 23. Working capital / roll-forward / BS accounts
      {
        test: (p) => /working capital|wc|roll[- ]?forward|balance sheet(?!.*vs)|key.*bs/.test(p),
        generate: () => ({
          summary: "Working capital and roll-forward view generated from Balance Sheet accounts in the current filter context.",
          metrics: [
            { label: "AR ∆", value: signedMoney(arDelta), tone: arDelta <= 0 ? "positive" : "negative" },
            { label: "Inventory ∆", value: signedMoney(invDelta), tone: invDelta <= 0 ? "positive" : "negative" },
            { label: "AP ∆", value: signedMoney(apDelta), tone: apDelta >= 0 ? "positive" : "neutral" },
          ],
          bullets: [
            `Collections driver: ${arRow ? `${arRow.name} is ${signedMoney(arDelta)}.` : "No AR line in current scope."}`,
            `Inventory driver: ${invRow ? `${invRow.name} is ${signedMoney(invDelta)}.` : "No inventory line in current scope."}`,
            `Payables driver: ${apRow ? `${apRow.name} is ${signedMoney(apDelta)}.` : "No AP line in current scope."}`,
            `Net WC movement: ${signedMoney(arDelta + invDelta + apDelta)}.`,
          ],
          matchedPrompt: "Show roll-forward for key BS accounts",
        }),
      },
      // 24. Close timeline / deadlines
      {
        test: (p) => /close.*timeline|deadline|period.*end|close.*schedule/.test(p),
        generate: () => ({
          summary: "Close timeline summary generated from current review statuses and recent activity.",
          metrics: [
            { label: "Open", value: `${openItems - inReviewItems}`, tone: "neutral" },
            { label: "In Review", value: `${inReviewItems}`, tone: "neutral" },
            { label: "Closed", value: `${closedItems}`, tone: "positive" },
          ],
          bullets: [
            "Review open accounts older than 3 days first and attach evidence before closure.",
            "Route In Review items to owners with highest absolute delta to reduce close risk.",
            "Use AI Proposed Explanations as draft narratives for controller approval.",
            `${noEvidenceRows.length} accounts still need evidence — this is the primary blocker.`,
          ],
          matchedPrompt: "Show close timeline and deadlines",
        }),
      },
    ];

    // ── Match: try each pattern in order ──
    for (const pattern of patterns) {
      if (pattern.test(prompt)) {
        return pattern.generate();
      }
    }

    // ── Fallback: data-driven summary for unmatched queries ──
    const fallbackBullets = topMovers.length
      ? topMovers.slice(0, 3).map((row) => {
          const delta = row.actual - row.base;
          const pct = row.base ? delta / row.base : 0;
          return `${row.name}: ${signedMoney(delta)} (${fmtPct(pct)}), owner ${row.owner}, status ${row.status}.`;
        })
      : ["No matching rows in current filters. Expand filters or include noise to generate deeper insights."];

    return {
      summary: `No exact saved prompt matched "${question}". Generated a data-driven summary from current Flux accounts (${filteredAllRows.length} accounts, ${openItems} open).`,
      metrics: baseMetrics,
      bullets: fallbackBullets,
      matchedPrompt: null,
    };
  };

  const clearAiSimulationTimers = useCallback(() => {
    if (aiThinkingIntervalRef.current) {
      clearInterval(aiThinkingIntervalRef.current);
      aiThinkingIntervalRef.current = null;
    }
    if (aiResponseTimeoutRef.current) {
      clearTimeout(aiResponseTimeoutRef.current);
      aiResponseTimeoutRef.current = null;
    }
  }, []);

  const resetAiSimulation = useCallback(() => {
    clearAiSimulationTimers();
    setAiIsThinking(false);
    setAiPendingQuestion("");
    setAiThinkingSteps([]);
  }, [clearAiSimulationTimers]);

  useEffect(() => {
    return () => {
      clearAiSimulationTimers();
    };
  }, [clearAiSimulationTimers]);

  const handleAsk = (rawPrompt?: string) => {
    if (aiIsThinking) return;
    const nextPrompt = (rawPrompt ?? aiPrompt).trim();
    if (!nextPrompt) return;

    const response = generateAIResponse(nextPrompt);
    const responseId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setAiPrompt("");
    setAiIsThinking(true);
    setAiPendingQuestion(nextPrompt);
    setAiThinkingSteps(AI_THINKING_STEPS.length ? [AI_THINKING_STEPS[0]] : []);

    clearAiSimulationTimers();

    let stepIndex = 1;
    aiThinkingIntervalRef.current = setInterval(() => {
      if (stepIndex >= AI_THINKING_STEPS.length) {
        if (aiThinkingIntervalRef.current) {
          clearInterval(aiThinkingIntervalRef.current);
          aiThinkingIntervalRef.current = null;
        }
        return;
      }
      const nextStep = AI_THINKING_STEPS[stepIndex];
      stepIndex += 1;
      setAiThinkingSteps((prev) => [...prev, nextStep]);
    }, 360);

    const thinkingDurationMs = Math.max(1200, AI_THINKING_STEPS.length * 360 + 420);
    aiResponseTimeoutRef.current = setTimeout(() => {
      clearAiSimulationTimers();
      setAiResponses((prev) => [
        {
          id: responseId,
          q: nextPrompt,
          ...response,
        },
        ...prev,
      ].slice(0, 8));
      setAiIsThinking(false);
      setAiPendingQuestion("");
      setAiThinkingSteps([]);
    }, thinkingDurationMs);
  };

  const handleSelectPromptSuggestion = (suggestionPrompt: string) => {
    if (aiIsThinking) return;
    setAiPrompt(suggestionPrompt);
  };

  const handleNewChat = () => {
    resetAiSimulation();
    setAiResponses([]);
    setAiPrompt("");
    toast.success("Started a new AI chat session");
  };

  const toggleWatchAccount = (id: string, shouldInclude: boolean) => {
    setWatchSelectedIds((prev) => {
      if (shouldInclude) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((value) => value !== id);
    });
  };

  const toggleWatchRecipient = (recipient: string) => {
    setWatchRecipients((prev) =>
      prev.includes(recipient)
        ? prev.filter((value) => value !== recipient)
        : [...prev, recipient]
    );
  };

  const handleOpenWatchDialog = () => {
    const periodLabel = data.is[0]?.currentPeriod ?? "Q3 2025";
    setWatchName(`Flux Watch — ${periodLabel}`);
    setWatchThresholdType("variance_pct");
    setWatchThresholdValue("5");
    setWatchFrequency("daily");
    setWatchNotifyVia("email");
    setWatchSelectedIds(watchDefaultSelectedIds);
    setWatchRecipients(defaultWatchRecipients);
    setWatchDialogOpen(true);
  };

  const handleCreateWatch = () => {
    if (!watchName.trim()) {
      toast.error("Watch name is required");
      return;
    }
    if (!watchSelectedIds.length) {
      toast.error("Select at least one account to monitor");
      return;
    }
    if (!watchRecipients.length) {
      toast.error("Select at least one recipient");
      return;
    }
    toast.success(`Watch "${watchName}" created for ${watchSelectedIds.length} accounts`);
    setWatchDialogOpen(false);
  };

  const hasEvidence = useCallback(
    (row: Pick<FluxRow, "id" | "evidence">) => evidenceOverrides[row.id] ?? row.evidence,
    [evidenceOverrides]
  );

  const handleOpenEvidenceDialog = (row: FluxRow) => {
    setEvidenceTargetRow(row);
    setEvidenceType("journal-entry");
    setEvidenceNotes("");
    setEvidenceFileName("");
    setEvidenceQuickLinks([]);
    setEvidenceDialogOpen(true);
  };

  const handleEvidenceFileSelection = (file?: File | null) => {
    if (!file) return;
    setEvidenceFileName(file.name);
  };

  const handleEvidenceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleEvidenceFileSelection(event.target.files?.[0]);
    event.currentTarget.value = "";
  };

  const toggleEvidenceQuickLink = (quickLink: string) => {
    setEvidenceQuickLinks((prev) =>
      prev.includes(quickLink) ? prev.filter((item) => item !== quickLink) : [...prev, quickLink]
    );
  };

  const handleAttachEvidence = () => {
    if (!evidenceTargetRow) return;
    if (!evidenceFileName && evidenceQuickLinks.length === 0) {
      toast.error("Add a file or quick-link before attaching evidence");
      return;
    }
    setEvidenceOverrides((prev) => ({ ...prev, [evidenceTargetRow.id]: true }));
    setEvidenceDialogOpen(false);
    toast.success(`Evidence attached for ${evidenceTargetRow.name} (${evidenceTargetRow.acct})`);
  };

  const calculateSensitivity = () => {
    const base = kpiRevenue?.base ?? 48.2;
    return base * ((priceSlider[0] / 100) * 0.45 + (volumeSlider[0] / 100) * 0.35 + (fxSlider[0] / 100) * -0.2);
  };

  const drawCFBridge = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const steps = data.cf;
    const pad = 20;
    const barW = ((rect.width - pad * 2) / steps.length) * 0.7;
    const gap = (rect.width - pad * 2) / steps.length - barW;

    let min = 0;
    let max = 0;
    let cumulative = 0;

    steps.forEach((step) => {
      cumulative += step.val;
      min = Math.min(min, cumulative, step.val < 0 ? cumulative - step.val : cumulative);
      max = Math.max(max, cumulative);
    });

    const range = max - min || 1;
    const y = (value: number) => rect.height - 40 - ((value - min) / range) * (rect.height - 80);

    for (let i = 0; i < 4; i += 1) {
      const gy = 20 + ((rect.height - 80) / 3) * i;
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(16, gy);
      ctx.lineTo(rect.width - 16, gy);
      ctx.stroke();
    }

    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, y(0));
    ctx.lineTo(rect.width - 16, y(0));
    ctx.stroke();

    cumulative = 0;
    let x = pad;
    const formatBridgeValue = (value: number) =>
      `${value >= 0 ? "+" : ""}$${Math.abs(value).toFixed(1)}M`;

    steps.forEach((step, idx) => {
      const from = cumulative;
      const to = cumulative + step.val;
      const top = Math.min(y(from), y(to));
      const height = Math.abs(y(from) - y(to));

      ctx.fillStyle = step.val >= 0 ? "#0f766e" : "#dc2626";
      drawRoundedRect(ctx, x, top, barW, height, 6);
      ctx.fill();

      const valueLabelY = step.val >= 0 ? top - 8 : top + height + 16;
      ctx.fillStyle = "#334155";
      ctx.font = "600 11px ui-sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(formatBridgeValue(step.val), x + barW / 2, valueLabelY);

      ctx.fillStyle = "#475569";
      ctx.font = "11px ui-sans-serif";
      ctx.fillText(step.label, x + barW / 2, rect.height - 16);

      if (idx < steps.length - 1) {
        const nextX = x + barW + gap;
        const connectorY = y(to);
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(x + barW + 2, connectorY);
        ctx.lineTo(nextX - 2, connectorY);
        ctx.stroke();
        ctx.restore();
      }

      cumulative = to;
      x += barW + gap;
    });
  }, [data.cf]);

  useEffect(() => {
    if (activeView !== "cf") return;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => drawCFBridge());
    });
    return () => cancelAnimationFrame(raf);
  }, [activeView, drawCFBridge]);

  const handleRowClick = (row: FluxRow) => {
    setSelectedRowId(row.id);
    setDetailOpen(true);
  };

  if (fluxLoading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-white">
        <p className="text-sm text-muted-foreground">Loading flux analysis...</p>
      </div>
    );
  }

  if (fluxError) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-white">
        <p className="text-sm text-red-600">Error loading flux analysis: {fluxError}</p>
      </div>
    );
  }

  const tableStart = activeRows.length === 0 ? 0 : pageStart + 1;
  const tableEnd = Math.min(pageStart + pageSize, activeRows.length);

  const detailDelta = detailRow ? detailRow.actual - detailRow.base : 0;
  const detailPct = detailRow && detailRow.base ? detailDelta / detailRow.base : 0;
  const detailAi = detailRow ? AI_ANALYSIS_MAP[detailRow.acct] : null;
  const detailHasEvidence = detailRow ? hasEvidence(detailRow) : false;
  const hasAiConversation = aiResponses.length > 0 || aiIsThinking;

  /* ─── Table row renderer (reused for IS and BS tabs) ─── */
  const renderTableRows = (rows: FluxRow[]) => {
    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={10} className="py-10 text-center text-sm text-slate-500">
            No rows match your current filters.
          </TableCell>
        </TableRow>
      );
    }
    return rows.map((row) => {
      const delta = row.actual - row.base;
      const pct = row.base ? delta / row.base : 0;
      const rowHasEvidence = hasEvidence(row);
      return (
        <TableRow
          key={row.id}
          className="cursor-pointer transition-colors hover:bg-blue-50/40"
          onClick={() => handleRowClick(row)}
        >
          <TableCell className="text-xs font-medium">{row.acct}</TableCell>
          <TableCell className="text-xs">{row.name}</TableCell>
          <TableCell className="text-xs">{fmtMoney(row.base)}</TableCell>
          <TableCell className="text-xs font-semibold">{fmtMoney(row.actual)}</TableCell>
          <TableCell className={cn("text-xs font-semibold", delta >= 0 ? "text-emerald-600" : "text-red-600")}>
            <span className="inline-flex items-center gap-1">
              {delta > 0 ? <TrendingUp className="h-3 w-3" /> : delta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {delta >= 0 ? "+" : ""}{fmtMoney(delta)}
            </span>
          </TableCell>
          <TableCell className={cn("text-xs font-semibold", pct >= 0 ? "text-emerald-600" : "text-red-600")}>
            {fmtPct(pct)}
          </TableCell>
          <TableCell className="text-xs">{row.driver}</TableCell>
          <TableCell className="text-xs">{row.owner}</TableCell>
          <TableCell className="text-xs">
            {rowHasEvidence ? (
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700">
                <Paperclip className="mr-1 h-3 w-3" /> Attached
              </Badge>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-slate-500"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEvidenceDialog(row);
                }}
              >
                <Paperclip className="mr-1 h-3 w-3" /> Add Evidence
              </Button>
            )}
          </TableCell>
          <TableCell className="min-w-[118px] text-xs">
            <Badge className={cn("whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-semibold", statusClass(row.status))}>
              {row.status === "Open" && <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />}
              {row.status === "In Review" && <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />}
              {row.status === "Closed" && <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />}
              {row.status}
            </Badge>
          </TableCell>
        </TableRow>
      );
    });
  };

  /* ─── Pagination Component ─── */
  const renderPagination = () => (
    <div className="flex items-center justify-between p-3 border-t border-slate-200 bg-slate-50/70">
      <span className="text-xs text-slate-500">
        Showing {tableStart}–{tableEnd} of {activeRows.length}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
          Prev
        </Button>
        <span className="text-xs text-slate-600">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );

  /* ──────────────────────────────── RENDER ──────────────────────────────── */

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-10 flex-shrink-0 border-b border-slate-200 bg-white px-6 py-2">
        <Breadcrumb activeRoute="reports/analysis/flux-analysis" className="mb-1.5" />
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary p-1.5">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Flux Analysis</h1>
              <p className="text-xs text-slate-500">Period variance analysis & AI-driven driver decomposition</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 ml-2">
              <Badge className="border border-blue-200 bg-blue-50 text-slate-800 text-[11px]">
                <FileText className="mr-1 h-3 w-3" /> Q2 2025 → Q3 2025
              </Badge>
              <Badge variant="outline" className="text-[11px]">
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" /> Consolidated
              </Badge>
              <Badge variant="outline" className="text-[11px]">{currency}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
            <Button
              size="sm"
              className="bg-primary text-white hover:bg-primary/90"
              onClick={handleOpenWatchDialog}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Create Watch
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
        <div className="space-y-4 px-6 py-4">
          {/* ─── Filter Bar ─── */}
          <div className="flex flex-wrap items-center gap-2">
            <Select defaultValue="q3-current">
              <SelectTrigger className="h-9 w-[170px] text-xs">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="q3-current">Q3 2025 (Current)</SelectItem>
                <SelectItem value="q2">Q2 2025</SelectItem>
              </SelectContent>
            </Select>

            <Select value={consolidation} onValueChange={setConsolidation}>
              <SelectTrigger className="h-9 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONSOLIDATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-9 w-[90px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((curr) => (
                  <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={materiality} onValueChange={(v) => setMateriality(v as MaterialityMode)}>
              <SelectTrigger className="h-9 w-[160px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATERIALITY_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="h-9 w-[130px] text-xs">
                <SelectValue placeholder="All Owners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                {ownerOptions.map((owner) => (
                  <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[120px] text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Checkbox
                id="exclude-noise"
                checked={excludeNoise}
                onCheckedChange={(checked) => setExcludeNoise(Boolean(checked))}
              />
              <Label htmlFor="exclude-noise" className="text-xs text-slate-600">
                Exclude noise
              </Label>
            </div>
          </div>

          {/* ─── KPI Cards ─── */}
          <Card className="p-4">
            <div className="grid grid-cols-4 divide-x divide-slate-200">
              <div className="px-4 first:pl-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-[11px] font-medium text-slate-500">Revenue</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">
                    ${KPI_SNAPSHOT.revenue.value.toFixed(1)}M
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-0.5 text-[11px] font-medium text-emerald-600">
                  <TrendingUp className="h-3 w-3" />
                  +{KPI_SNAPSHOT.revenue.pct.toFixed(1)}% vs prior
                </div>
              </div>

              <div className="px-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[11px] font-medium text-slate-500">Gross Margin</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">
                    ${KPI_SNAPSHOT.grossMargin.value.toFixed(1)}M
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-0.5 text-[11px] font-medium text-emerald-600">
                  <TrendingUp className="h-3 w-3" />
                  +{KPI_SNAPSHOT.grossMargin.pct.toFixed(1)}% vs prior
                </div>
              </div>

              <div className="px-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-teal-500" />
                  <span className="text-[11px] font-medium text-slate-500">Operating Cash Flow</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">${KPI_SNAPSHOT.operatingCashFlow.value.toFixed(1)}M</span>
                </div>
                <div className="mt-0.5 flex items-center gap-0.5 text-[11px] font-medium text-emerald-600">
                  <TrendingUp className="h-3 w-3" />
                  +{KPI_SNAPSHOT.operatingCashFlow.pct.toFixed(1)}% vs prior
                </div>
              </div>

              <div className="px-4 last:pr-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="text-[11px] font-medium text-slate-500">Working Capital &Delta;</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">
                    +${KPI_SNAPSHOT.workingCapital.value.toFixed(1)}M
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {KPI_SNAPSHOT.workingCapital.components.join(" \u2022 ")}
                </div>
              </div>
            </div>
          </Card>

          {/* ─── Main Grid: Table + AI Sidebar ─── */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_500px]">
            {/* ─── LEFT: Tables & Drivers ─── */}
            <div className="min-w-0 space-y-4">
              {/* ─── Tab Tables ─── */}
              <Card className="border-slate-200 shadow-sm">
                <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "is" | "bs" | "cf")}>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 pt-3 pb-0">
                    <TabsList className="bg-transparent p-0">
                      <TabsTrigger value="is" className="rounded-none border-b-2 border-transparent px-4 pb-2 text-xs data-[state=active]:border-slate-800 data-[state=active]:text-slate-800 data-[state=active]:shadow-none">
                        Income Statement
                      </TabsTrigger>
                      <TabsTrigger value="bs" className="rounded-none border-b-2 border-transparent px-4 pb-2 text-xs data-[state=active]:border-slate-800 data-[state=active]:text-slate-800 data-[state=active]:shadow-none">
                        Balance Sheet
                      </TabsTrigger>
                      <TabsTrigger value="cf" className="rounded-none border-b-2 border-transparent px-4 pb-2 text-xs data-[state=active]:border-slate-800 data-[state=active]:text-slate-800 data-[state=active]:shadow-none">
                        Cash Flow Bridge
                      </TabsTrigger>
                    </TabsList>
                    <span className="pb-2 text-xs text-slate-400">Click any row to view details</span>
                  </div>

                  <div className="p-4">
                    <TabsContent value="is" className="mt-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">Income Statement Coverage</h3>
                        <span className="text-xs text-slate-500">{filteredIS.length} accounts</span>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <div className="min-w-[920px]">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50 border-b-2 border-slate-200">
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Acct</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Base</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Actual</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">&Delta;</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">&Delta;%</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Driver</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Owner</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Evidence</TableHead>
                                <TableHead className="min-w-[118px] text-xs font-medium text-slate-500 uppercase tracking-wide">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>{renderTableRows(pagedRows)}</TableBody>
                          </Table>
                        </div>
                      </div>
                      {renderPagination()}
                    </TabsContent>

                    <TabsContent value="bs" className="mt-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">Balance Sheet Coverage</h3>
                        <span className="text-xs text-slate-500">{filteredBS.length} accounts</span>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <div className="min-w-[920px]">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50 border-b-2 border-slate-200">
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Acct</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Base</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Actual</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">&Delta;</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">&Delta;%</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Driver</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Owner</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Evidence</TableHead>
                                <TableHead className="min-w-[118px] text-xs font-medium text-slate-500 uppercase tracking-wide">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>{renderTableRows(pagedRows)}</TableBody>
                          </Table>
                        </div>
                      </div>
                      {renderPagination()}

                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-slate-800">Balance Sheet Roll-forward</h4>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <div className="min-w-[700px]">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-50 border-b-2 border-slate-200">
                                  <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Account</TableHead>
                                  <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Opening</TableHead>
                                  <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Activity</TableHead>
                                  <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Closing</TableHead>
                                  <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notes</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {data.bsRoll.map((row) => (
                                  <TableRow key={row.acct}>
                                    <TableCell className="text-xs">{row.acct}</TableCell>
                                    <TableCell className="text-xs">{fmtMoney(row.open)}</TableCell>
                                    <TableCell className={cn("text-xs font-semibold", row.activity >= 0 ? "text-emerald-600" : "text-red-600")}>
                                      {row.activity >= 0 ? "+" : ""}{fmtMoney(row.activity)}
                                    </TableCell>
                                    <TableCell className="text-xs">{fmtMoney(row.close)}</TableCell>
                                    <TableCell className="text-xs text-slate-600">{row.notes}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="cf" className="mt-0 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-800">Operating Cash Flow Bridge</h3>
                        <span className="rounded-md border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-900">
                          Operating CF: {signedMoney(kpiCfTotal)}
                        </span>
                      </div>
                      <canvas
                        ref={canvasRef}
                        className="h-[300px] w-full rounded-lg border border-dashed border-slate-300 bg-gradient-to-b from-white to-slate-50"
                      />
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <div className="min-w-[500px]">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50 border-b-2 border-slate-200">
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Component</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Impact</TableHead>
                                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Narrative</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.cf.map((row) => (
                                <TableRow key={row.label}>
                                  <TableCell className="text-xs">{row.label}</TableCell>
                                  <TableCell className={cn("text-xs font-semibold", row.val >= 0 ? "text-emerald-600" : "text-red-600")}>
                                    {row.val >= 0 ? "+" : ""}{fmtMoney(row.val)}
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-600">
                                    {row.val >= 0 ? "Positive contribution" : "Cash drag"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </Card>

              {/* ─── Top Drivers Table ─── */}
              <Card className="border-slate-200 p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Top Drivers (All Accounts)</h3>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[11px] font-normal">Rate &times; Volume</Badge>
                    <Badge variant="outline" className="text-[11px] font-normal">Price &times; Volume &times; Mix &times; FX</Badge>
                    <Badge variant="outline" className="text-[11px] font-normal">Timing / One-time</Badge>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <div className="min-w-[620px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 border-b-2 border-slate-200">
                          <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Driver</TableHead>
                          <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Impact ($)</TableHead>
                          <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Impact (%)</TableHead>
                          <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Confidence</TableHead>
                          <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Trend</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topDrivers.map((row) => {
                          const baseRevenue = Math.max(1, kpiRevenue?.base ?? 48.2);
                          const pct = row.impact / baseRevenue;
                          return (
                            <TableRow key={row.driver}>
                              <TableCell className="text-xs font-medium">{row.driver}</TableCell>
                              <TableCell className={cn("text-xs font-semibold", row.impact >= 0 ? "text-emerald-600" : "text-red-600")}>
                                {row.impact >= 0 ? "+" : ""}{fmtMoney(row.impact)}
                              </TableCell>
                              <TableCell className={cn("text-xs font-semibold", pct >= 0 ? "text-emerald-600" : "text-red-600")}>
                                {fmtPct(pct)}
                              </TableCell>
                              <TableCell className="text-xs">
                                <Badge className={cn("border text-[11px]", confidenceClass(row.confidence))}>
                                  {row.confidence}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className={cn("h-full rounded-full", pct >= 0 ? "bg-slate-800" : "bg-red-400")}
                                      style={{ width: `${Math.min(100, Math.abs(pct) * 260)}%` }}
                                    />
                                  </div>
                                  <span className={cn("h-2 w-2 rounded-full", pct >= 0 ? "bg-slate-800" : "bg-red-400")} />
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </Card>
            </div>

            {/* ─── RIGHT: AI Sidebar ─── */}
            <aside className="min-w-0 space-y-4">
              {/* AI Analysis Chat */}
              <Card className="overflow-hidden border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <h3 className="text-sm font-semibold">AI Analysis</h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleNewChat}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 transition-colors hover:text-white"
                    >
                      <RotateCcw className="h-4 w-4" />
                      New Chat
                    </button>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  {!hasAiConversation ? (
                    <div className="flex flex-col items-center py-6 text-center">
                      <div className="mb-3 rounded-full bg-slate-100 p-3">
                        <Sparkles className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-500">Ask a question or try a suggestion below</p>
                    </div>
                  ) : (
                    <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                      {aiIsThinking ? (
                        <div className="animate-fade-slide-up rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                              Q
                            </div>
                            <div className="flex-1 text-sm font-semibold text-slate-800">
                              {aiPendingQuestion}
                            </div>
                          </div>
                          <div className="mt-2 flex items-start gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-white">
                              <Sparkles className="h-3.5 w-3.5" />
                            </div>
                            <div
                              className="flex-1 space-y-1.5 rounded-lg border border-slate-200 bg-white p-2.5"
                              aria-live="polite"
                              aria-busy="true"
                            >
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                AI is analyzing
                              </p>
                              {aiThinkingSteps.map((step, idx) => {
                                const isLatest = idx === aiThinkingSteps.length - 1;
                                return (
                                  <div
                                    key={`${step}-${idx}`}
                                    className={cn(
                                      "text-xs",
                                      isLatest ? "font-medium text-slate-700" : "text-slate-500"
                                    )}
                                  >
                                    {step}
                                    {isLatest ? (
                                      <span className="ml-1.5 inline-flex items-center gap-1 align-middle">
                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 typing-dot-1" />
                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 typing-dot-2" />
                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 typing-dot-3" />
                                      </span>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {aiResponses.map((response) => (
                        <div key={response.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                              Q
                            </div>
                            <div className="flex-1 text-sm font-semibold text-slate-800">{response.q}</div>
                          </div>
                          <div className="mt-2 flex items-start gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-white">
                              <Sparkles className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <p className="text-sm leading-6 text-slate-700">{response.summary}</p>
                              {response.matchedPrompt ? (
                                <p className="text-[11px] text-slate-500">
                                  Matched saved prompt: {response.matchedPrompt}
                                </p>
                              ) : null}
                              <div className="flex flex-wrap gap-1.5">
                                {response.metrics.map((metric) => (
                                  <Badge
                                    key={`${response.id}-${metric.label}`}
                                    className={cn("border text-[11px] font-semibold", metricToneClass(metric.tone))}
                                  >
                                    {metric.label}: {metric.value}
                                  </Badge>
                                ))}
                              </div>
                              <ul className="space-y-1">
                                {response.bullets.map((bullet, index) => (
                                  <li key={`${response.id}-${index}`} className="text-xs text-slate-700">
                                    • {bullet}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={aiIsThinking ? "AI is analyzing your request..." : "Ask: Explain AR increase and cash impact"}
                      disabled={aiIsThinking}
                      className="min-h-[90px] resize-none border-2 border-slate-200 text-sm focus-visible:ring-slate-800"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAsk();
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90"
                      onClick={() => handleAsk()}
                      disabled={aiIsThinking || !aiPrompt.trim()}
                    >
                      {aiIsThinking ? (
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-white typing-dot-1" />
                          <span className="h-1.5 w-1.5 rounded-full bg-white typing-dot-2" />
                          <span className="h-1.5 w-1.5 rounded-full bg-white typing-dot-3" />
                        </div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {showAiAutocomplete ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Suggestions
                      </div>
                      {aiAutocompleteSuggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.prompt}
                          type="button"
                          onClick={() => handleSelectPromptSuggestion(suggestion.prompt)}
                          className={cn(
                            "flex w-full items-center px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50",
                            index > 0 && "border-t border-slate-100"
                          )}
                        >
                          {suggestion.prompt}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Card>

              {/* AI Proposed Explanations */}
              <Card className="border-slate-200 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-slate-900">AI Proposed Explanations</h3>
                </div>
                <div className="space-y-2.5">
                  {explanationCards.map((row, i) => (
                    <div key={`${row.acct}-${i}`} className="rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{row.acct}</div>
                          <div className="mt-0.5 text-xs text-slate-500">{row.driver}</div>
                        </div>
                        <div className={cn("text-sm font-bold whitespace-nowrap", row.delta >= 0 ? "text-emerald-600" : "text-red-600")}>
                          {row.delta >= 0 ? "+" : ""}{fmtMoney(row.delta)}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <Badge className={cn("border text-[10px]", confidenceClass(row.conf))}>{row.conf}</Badge>
                        <span className="text-[10px] text-slate-400">|</span>
                        <span className="text-[10px] text-slate-600">{row.owner}</span>
                        <span className="text-[10px] text-slate-400">|</span>
                        <Badge className={cn("border text-[10px]", row.evidence ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500")}>
                          <Paperclip className="mr-0.5 h-2.5 w-2.5" /> {row.evidence ? "Attached" : "Attach"}
                        </Badge>
                        <span className="text-[10px] text-slate-400">|</span>
                        <Badge className={cn("border text-[10px]", statusClass(row.status))}>
                          <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full", row.status === "Closed" ? "bg-emerald-500" : row.status === "In Review" ? "bg-amber-500" : "bg-orange-500")} />
                          {row.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Sensitivity Analysis */}
              <Card className="border-slate-200 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <h3 className="text-sm font-semibold text-slate-900">Sensitivity Analysis</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <Label className="text-xs text-slate-600">Price</Label>
                      <span className="text-xs font-semibold text-slate-700">{priceSlider[0] >= 0 ? "+" : ""}{priceSlider[0].toFixed(1)}%</span>
                    </div>
                    <Slider value={priceSlider} onValueChange={setPriceSlider} min={-5} max={5} step={0.5} />
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <Label className="text-xs text-slate-600">Volume</Label>
                      <span className="text-xs font-semibold text-slate-700">{volumeSlider[0] >= 0 ? "+" : ""}{volumeSlider[0]}%</span>
                    </div>
                    <Slider value={volumeSlider} onValueChange={setVolumeSlider} min={-10} max={10} step={1} />
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <Label className="text-xs text-slate-600">FX</Label>
                      <span className="text-xs font-semibold text-slate-700">{fxSlider[0] >= 0 ? "+" : ""}{fxSlider[0].toFixed(1)}%</span>
                    </div>
                    <Slider value={fxSlider} onValueChange={setFxSlider} min={-3} max={3} step={0.5} />
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    <span className="text-xs text-slate-600">Projected &Delta; Revenue</span>
                    <span className={cn("text-sm font-bold", calculateSensitivity() >= 0 ? "text-emerald-600" : "text-red-600")}>
                      {calculateSensitivity() >= 0 ? "+" : ""}${calculateSensitivity().toFixed(1)}M
                    </span>
                  </div>
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </div>

      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent className="max-h-[88vh] gap-3 overflow-y-auto p-4 sm:max-w-[560px]">
          <DialogHeader className="space-y-2 pr-8">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Paperclip className="h-4.5 w-4.5 text-sky-700" />
              Attach Evidence
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Upload supporting documentation for{" "}
              {evidenceTargetRow ? `${evidenceTargetRow.name} (${evidenceTargetRow.acct})` : "the selected account"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Evidence Type</Label>
              <Select value={evidenceType} onValueChange={setEvidenceType}>
                <SelectTrigger className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVIDENCE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Upload File</Label>
              <input
                ref={evidenceFileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg,.webp"
                onChange={handleEvidenceFileChange}
              />
              <button
                type="button"
                className={cn(
                  "w-full rounded-lg border border-dashed p-5 text-center transition-colors",
                  evidenceFileName ? "border-emerald-200 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"
                )}
                onClick={() => evidenceFileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleEvidenceFileSelection(event.dataTransfer.files?.[0]);
                }}
              >
                {evidenceFileName ? (
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">{evidenceFileName}</p>
                    <p className="text-xs text-emerald-600">Selected file. Click to replace.</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto mb-1.5 h-7 w-7 text-slate-300" />
                    <p className="text-base font-medium text-slate-700">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-400">PDF, Excel, CSV, Word, Images (max 25MB)</p>
                  </div>
                )}
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Notes (optional)</Label>
              <Textarea
                value={evidenceNotes}
                onChange={(event) => setEvidenceNotes(event.target.value)}
                className="min-h-[84px] rounded-lg border-slate-200 text-sm"
                placeholder="Add context, reference numbers, or reviewer instructions..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Or quick-link existing</Label>
              <div className="flex flex-wrap gap-2">
                {QUICK_LINK_EVIDENCE_OPTIONS.map((option) => {
                  const selected = evidenceQuickLinkSet.has(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleEvidenceQuickLink(option)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                        selected
                          ? "border-sky-200 bg-sky-50 text-sky-800"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
            <Button
              variant="outline"
              className="h-9 px-4 text-sm"
              onClick={() => setEvidenceDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="h-9 bg-sky-800 px-4 text-sm text-white hover:bg-sky-700"
              onClick={handleAttachEvidence}
            >
              <Paperclip className="mr-2 h-4 w-4" />
              Attach Evidence
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={watchDialogOpen} onOpenChange={setWatchDialogOpen}>
        <DialogContent className="max-h-[88vh] gap-3 overflow-y-auto p-4 sm:max-w-[700px]">
          <DialogHeader className="space-y-1 pr-8">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Eye className="h-4.5 w-4.5 text-slate-700" />
              Create Watch
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Monitor accounts for variance changes and get notified when thresholds are breached.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">Watch Name</Label>
              <Input
                value={watchName}
                onChange={(e) => setWatchName(e.target.value)}
                className="h-9 text-sm"
                placeholder="Flux Watch — Q3 2025"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-xs font-semibold text-slate-800">Accounts to Monitor</Label>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                  <button
                    type="button"
                    className="hover:text-slate-900"
                    onClick={() => setWatchSelectedIds(watchAllRows.map((row) => row.id))}
                  >
                    Select all
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    className="hover:text-slate-900"
                    onClick={() =>
                      setWatchSelectedIds(
                        watchAllRows
                          .filter((row) => row.status !== "Closed")
                          .map((row) => row.id)
                      )
                    }
                  >
                    Open only
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    className="hover:text-slate-900"
                    onClick={() => setWatchSelectedIds([])}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="max-h-[220px] overflow-y-auto">
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold tracking-wide text-slate-500">
                    INCOME STATEMENT
                  </div>
                  {watchIsRows.map((row) => {
                    const isSelected = watchSelectedSet.has(row.id);
                    return (
                      <div
                        key={row.id}
                        className="flex cursor-pointer items-center gap-2.5 border-b border-slate-100 px-3 py-2 hover:bg-slate-50"
                        onClick={() => toggleWatchAccount(row.id, !isSelected)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            toggleWatchAccount(row.id, Boolean(checked))
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="w-14 font-mono text-xs text-slate-400">{row.acct}</span>
                        <span className="text-xs text-slate-800">{row.name}</span>
                        <Badge
                          className={cn(
                            "ml-auto border text-[10px]",
                            statusClass(row.status)
                          )}
                        >
                          {row.status}
                        </Badge>
                      </div>
                    );
                  })}

                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold tracking-wide text-slate-500">
                    BALANCE SHEET
                  </div>
                  {watchBsRows.map((row) => {
                    const isSelected = watchSelectedSet.has(row.id);
                    return (
                      <div
                        key={row.id}
                        className="flex cursor-pointer items-center gap-2.5 border-b border-slate-100 px-3 py-2 hover:bg-slate-50"
                        onClick={() => toggleWatchAccount(row.id, !isSelected)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            toggleWatchAccount(row.id, Boolean(checked))
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="w-14 font-mono text-xs text-slate-400">{row.acct}</span>
                        <span className="text-xs text-slate-800">{row.name}</span>
                        <Badge
                          className={cn(
                            "ml-auto border text-[10px]",
                            statusClass(row.status)
                          )}
                        >
                          {row.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-slate-500">
                {watchSelectedIds.length} of {watchAllRows.length} accounts selected
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-800">Alert Threshold</Label>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <Select value={watchThresholdType} onValueChange={(value) => setWatchThresholdType(value as "variance_pct" | "variance_amount")}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="variance_pct">Variance %</SelectItem>
                    <SelectItem value="variance_amount">Variance Amount</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Input
                    type="number"
                    value={watchThresholdValue}
                    onChange={(e) => setWatchThresholdValue(e.target.value)}
                    className="h-9 pr-10 text-sm"
                    min="0"
                    step={watchThresholdType === "variance_pct" ? "0.1" : "0.1"}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    {watchThresholdType === "variance_pct" ? "%" : "M"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Alert when any monitored account variance exceeds {watchThresholdValue || "0"}
                {watchThresholdType === "variance_pct" ? "%" : "M"}.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-800">Check Frequency</Label>
                <Select value={watchFrequency} onValueChange={setWatchFrequency}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-800">Notify Via</Label>
                <Select value={watchNotifyVia} onValueChange={setWatchNotifyVia}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </span>
                    </SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="teams">Teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-800">Recipients</Label>
              <div className="flex flex-wrap gap-2">
                {watchRecipientOptions.map((recipient) => {
                  const selected = watchRecipients.includes(recipient);
                  return (
                    <button
                      type="button"
                      key={recipient}
                      onClick={() => toggleWatchRecipient(recipient)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        selected
                          ? "border-sky-200 bg-sky-50 text-sky-800"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      )}
                    >
                      {recipient}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4">
              <Button
                variant="outline"
                className="h-9 px-5 text-sm"
                onClick={() => setWatchDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="h-9 bg-primary px-5 text-sm text-white hover:bg-primary/90"
                onClick={handleCreateWatch}
              >
                <Bell className="mr-2 h-4 w-4" />
                Create Watch ({watchSelectedIds.length} accounts)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Detail Drawer ─── */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg p-0">
          {detailRow && (
            <>
              {/* Dark gradient header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5">
                <SheetHeader className="pb-0">
                  <SheetTitle className="text-lg font-bold text-white">{detailRow.name}</SheetTitle>
                  <p className="text-sm text-slate-300">
                    Acct {detailRow.acct} &nbsp;|&nbsp; Owner: {detailRow.owner}
                  </p>
                </SheetHeader>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-slate-500 text-xs text-slate-200">{detailRow.driver}</Badge>
                  <Badge className={cn("border text-xs", statusClass(detailRow.status))}>
                    <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full", detailRow.status === "Closed" ? "bg-emerald-500" : detailRow.status === "In Review" ? "bg-amber-500" : "bg-orange-500")} />
                    {detailRow.status}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", detailHasEvidence ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-500 text-slate-200")}
                  >
                    <Paperclip className="mr-1 h-3 w-3" /> {detailHasEvidence ? "Attached" : "Attach"}
                  </Badge>
                </div>
              </div>

              <div className="px-6 py-5 space-y-5">
              {/* Base / Actual / Delta cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-medium text-slate-500">Base (Q2)</div>
                  <div className="mt-1 text-xl font-bold text-slate-900">{fmtMoney(detailRow.base)}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-medium text-slate-500">Actual (Q3)</div>
                  <div className="mt-1 text-xl font-bold text-slate-900">{fmtMoney(detailRow.actual)}</div>
                </div>
                <div className={cn("rounded-lg border p-3", detailDelta >= 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50")}>
                  <div className="text-[11px] font-medium text-slate-500">Delta</div>
                  <div className={cn("mt-1 text-xl font-bold", detailDelta >= 0 ? "text-emerald-700" : "text-red-700")}>
                    {detailDelta >= 0 ? "+" : ""}{fmtMoney(detailDelta)}
                  </div>
                  <div className={cn("text-xs", detailDelta >= 0 ? "text-emerald-600" : "text-red-600")}>
                    {fmtPct(detailPct)}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Timeline</h4>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" /> Last changed: <strong>4d ago</strong>
                  </span>
                  <span>Owner assigned: <strong>4d ago</strong></span>
                  <span>Created: <strong>6d ago</strong></span>
                </div>
              </div>

              {/* Evidence Files */}
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Evidence Files ({detailHasEvidence ? 1 : 0})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleOpenEvidenceDialog(detailRow)}
                  >
                    <Upload className="mr-1.5 h-3 w-3" /> Add Evidence
                  </Button>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {detailHasEvidence
                    ? "Evidence is attached for this account. You can add more supporting documents."
                    : "No files attached yet. Upload supporting documentation to improve close readiness."}
                </p>
              </div>

              {/* Recent Activity */}
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Recent Activity</h4>
                <div className="space-y-3">
                  {ACTIVITY_LOG.map((a, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      <div>
                        <div className="text-xs font-semibold text-slate-700">{a.title}</div>
                        <div className="text-xs text-slate-500">{a.detail}</div>
                        <div className="mt-0.5 text-[11px] text-slate-400">{a.actor} &middot; {a.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Analysis */}
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-slate-800" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">AI Analysis</h4>
                </div>
                {detailAi ? (
                  <>
                    <p className="text-xs leading-5 text-slate-700">{detailAi.summary}</p>
                    <Badge className="mt-2 border border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
                      {detailAi.headline}
                    </Badge>
                    <ul className="mt-3 space-y-1.5">
                      {detailAi.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">
                    {detailRow.name} ({detailRow.acct}) moved {detailDelta >= 0 ? "up" : "down"} {fmtMoney(detailDelta)} ({fmtPct(detailPct)}) driven by {detailRow.driver.toLowerCase()}. Owner {detailRow.owner} should validate support and evidence.
                  </p>
                )}
              </div>

              {/* Ask AI CTA */}
              <Button
                variant="outline"
                className="w-full justify-center gap-2 text-sm"
                onClick={() => {
                  setDetailOpen(false);
                  setAiPrompt(`Explain ${detailRow.name} variance`);
                  handleAsk(`Explain ${detailRow.name} variance`);
                }}
              >
                <MessageSquare className="h-4 w-4" />
                Ask AI about {detailRow.name}
              </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
