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
  Search,
  Send,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
  X,
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
  tag: string;
  prompt: string;
  tone: "green" | "amber" | "blue" | "cyan";
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
  { tag: "Revenue", prompt: "Show revenue bridge from Q2 to Q3", tone: "green" },
  { tag: "Sensitivity", prompt: "Show impact of losing top 3 accounts", tone: "amber" },
  { tag: "Balance Sheet", prompt: "Show roll-forward for key BS accounts", tone: "blue" },
  { tag: "Period Close", prompt: "Show close timeline and deadlines", tone: "cyan" },
];

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
  cf: [
    { label: "Net Income", val: 6.8 },
    { label: "Depreciation & Non-cash", val: 1.1 },
    { label: "AR (Increase)", val: -0.8 },
    { label: "Inventory (Decrease)", val: 0.6 },
    { label: "AP (Increase)", val: 0.8 },
    { label: "Other WC", val: 0.9 },
  ],
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

  const revenueDelta = isRows
    .filter((row) => row.acct.startsWith("4"))
    .reduce((sum, row) => sum + (row.actual - row.base), 0);
  const expenseDelta = isRows
    .filter((row) => ["5", "6", "7"].includes(row.acct.charAt(0)))
    .reduce((sum, row) => sum + (row.actual - row.base), 0);

  const arRow = bsRows.find((row) => /receivable/i.test(row.name));
  const inventoryRow = bsRows.find((row) => /inventory/i.test(row.name));
  const apRow = bsRows.find((row) => /payable/i.test(row.name));

  const arDelta = arRow ? arRow.actual - arRow.base : 0;
  const inventoryDelta = inventoryRow ? inventoryRow.actual - inventoryRow.base : 0;
  const apDelta = apRow ? apRow.actual - apRow.base : 0;
  const totalBsDelta = bsRows.reduce((sum, row) => sum + (row.actual - row.base), 0);

  const cf: CfRow[] = [
    { label: "Net Income", val: round1(revenueDelta - expenseDelta) },
    { label: "Depreciation & Non-cash", val: 1.1 },
    { label: "AR (Increase)", val: round1(-arDelta) },
    { label: "Inventory (Decrease)", val: round1(-inventoryDelta) },
    { label: "AP (Increase)", val: round1(apDelta) },
    { label: "Other WC", val: round1(totalBsDelta - arDelta - inventoryDelta - apDelta) },
  ];

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

function promptTagClass(tone: PromptSuggestion["tone"]): string {
  if (tone === "green") return "border-emerald-200 bg-emerald-100 text-emerald-700";
  if (tone === "amber") return "border-amber-200 bg-amber-100 text-amber-700";
  if (tone === "cyan") return "border-cyan-200 bg-cyan-100 text-cyan-700";
  return "border-blue-200 bg-blue-100 text-blue-700";
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
  const [priceSlider, setPriceSlider] = useState([1]);
  const [volumeSlider, setVolumeSlider] = useState([2]);
  const [fxSlider, setFxSlider] = useState([0]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageSize = 10;

  const allRows = useMemo(() => [...data.is, ...data.bs], [data.is, data.bs]);

  const ownerOptions = useMemo(() => {
    const unique = new Set(allRows.map((row) => row.owner));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [allRows]);

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

  const kpiGrossMargin = useMemo(
    () => filteredAllRows.find((row) => /gross margin/i.test(row.name)) ?? null,
    [filteredAllRows]
  );

  const kpiCfTotal = useMemo(() => data.cf.reduce((sum, row) => sum + row.val, 0), [data.cf]);

  const workingCapitalDelta = useMemo(
    () => filteredBS.reduce((sum, row) => sum + (row.actual - row.base), 0),
    [filteredBS]
  );

  const wcBreakdown = useMemo(
    () =>
      [...filteredBS]
        .sort((a, b) => Math.abs(b.actual - b.base) - Math.abs(a.actual - a.base))
        .slice(0, 3)
        .map((row) => {
          const delta = row.actual - row.base;
          const shortName = row.name.split(" ")[0];
          return `${shortName} ${delta >= 0 ? "+" : ""}$${Math.abs(delta).toFixed(1)}M`;
        }),
    [filteredBS]
  );

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

  const generateAIResponse = (question: string) => {
    const prompt = question.toLowerCase();
    if (/ar|receivable/.test(prompt)) {
      return "AR moved due to collection timing. Recommended actions: prioritize high-dollar invoices, trigger reminders, and validate credit holds for repeat late payers.";
    }
    if (/price.*flat/.test(prompt)) {
      return "Holding price flat lowers expected uplift significantly. Volume and mix still contribute, but margin expansion would compress in this scenario.";
    }
    if (/bridge|working capital/.test(prompt)) {
      return "Working capital bridge combines AR, inventory, and AP movements. AR drag is partially offset by AP timing and inventory efficiency.";
    }
    if (/classify|g&a|driver/.test(prompt)) {
      return "G&A drivers classified: Professional fees (+$0.2M) are audit-related one-time costs, facilities are flat on lease terms, and admin headcount is unchanged. Net movement is -$0.1M from timing of legal spend.";
    }
    return "Top drivers currently include price-volume mix, collections timing, and working-capital levers. Focus on open items with missing evidence first.";
  };

  const handleAsk = (rawPrompt?: string) => {
    const nextPrompt = (rawPrompt ?? aiPrompt).trim();
    if (!nextPrompt) return;
    const response = generateAIResponse(nextPrompt);
    setAiResponses((prev) => [{ q: nextPrompt, a: response }, ...prev].slice(0, 6));
    setAiPrompt("");
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

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, y(0));
    ctx.lineTo(rect.width - 16, y(0));
    ctx.stroke();

    cumulative = 0;
    let x = pad;

    steps.forEach((step) => {
      const from = cumulative;
      const to = cumulative + step.val;
      const top = Math.min(y(from), y(to));
      const height = Math.abs(y(from) - y(to));

      ctx.fillStyle = step.val >= 0 ? "#0f766e" : "#dc2626";
      drawRoundedRect(ctx, x, top, barW, height, 6);
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.font = "11px ui-sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(step.label, x + barW / 2, rect.height - 16);

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

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const detailDelta = detailRow ? detailRow.actual - detailRow.base : 0;
  const detailPct = detailRow && detailRow.base ? detailDelta / detailRow.base : 0;
  const detailAi = detailRow ? AI_ANALYSIS_MAP[detailRow.acct] : null;

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
      return (
        <TableRow
          key={row.id}
          className="cursor-pointer transition-colors hover:bg-slate-50"
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
            {row.evidence ? (
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
                  toast.success(`Evidence requested for ${row.acct}`);
                }}
              >
                <Paperclip className="mr-1 h-3 w-3" /> Attach
              </Button>
            )}
          </TableCell>
          <TableCell className="text-xs">
            <Badge className={cn("border text-[11px]", statusClass(row.status))}>
              {row.status === "Open" && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />}
              {row.status === "In Review" && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />}
              {row.status === "Closed" && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />}
              {row.status}
            </Badge>
          </TableCell>
        </TableRow>
      );
    });
  };

  /* ─── Pagination Component ─── */
  const renderPagination = () => (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs text-slate-500">
        Showing {tableStart}–{tableEnd} of {activeRows.length}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pageNumbers.map((num) => (
          <Button
            key={num}
            variant={num === page ? "default" : "outline"}
            size="icon"
            className={cn("h-8 w-8 text-xs", num === page && "bg-[#205375] text-white hover:bg-[#1b4563]")}
            onClick={() => setPage(num)}
          >
            {num}
          </Button>
        ))}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          <ChevronRight className="h-4 w-4" />
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
        <div className="mb-2 mt-1 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Flux Analysis</h1>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className="border border-blue-200 bg-blue-50 text-[#205375] text-[11px]">
                <FileText className="mr-1 h-3 w-3" /> Q2 2025 → Q3 2025
              </Badge>
              <Badge variant="outline" className="text-[11px]">
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" /> Consolidated
              </Badge>
              <Badge variant="outline" className="text-[11px]">Workspace: Q3 Close</Badge>
              <Badge variant="outline" className="text-[11px]">{currency}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
            <Button
              size="sm"
              className="bg-[#205375] text-white hover:bg-[#1b4563]"
              onClick={() => toast.success("Watch created for material variances")}
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500 border-slate-200 p-4 shadow-sm">
              <div className="mb-1 text-xs font-medium text-slate-500">Revenue</div>
              <div className="text-3xl font-bold tracking-tight text-slate-900">
                ${kpiRevenue ? kpiRevenue.actual.toFixed(1) : "--"}M
              </div>
              {kpiRevenue && (
                <div className={cn("mt-1.5 flex items-center gap-1 text-xs font-semibold", kpiRevenue.actual - kpiRevenue.base >= 0 ? "text-emerald-600" : "text-red-600")}>
                  <TrendingUp className="h-3 w-3" />
                  {fmtPct((kpiRevenue.actual - kpiRevenue.base) / Math.max(1, kpiRevenue.base))} vs prior
                </div>
              )}
            </Card>

            <Card className="border-l-4 border-l-emerald-500 border-slate-200 p-4 shadow-sm">
              <div className="mb-1 text-xs font-medium text-slate-500">Gross Margin</div>
              <div className="text-3xl font-bold tracking-tight text-slate-900">
                ${kpiGrossMargin ? kpiGrossMargin.actual.toFixed(1) : "--"}M
              </div>
              {kpiGrossMargin && (
                <div className={cn("mt-1.5 flex items-center gap-1 text-xs font-semibold", kpiGrossMargin.actual - kpiGrossMargin.base >= 0 ? "text-emerald-600" : "text-red-600")}>
                  <TrendingUp className="h-3 w-3" />
                  {fmtPct((kpiGrossMargin.actual - kpiGrossMargin.base) / Math.max(1, kpiGrossMargin.base))} vs prior
                </div>
              )}
            </Card>

            <Card className="border-l-4 border-l-teal-500 border-slate-200 p-4 shadow-sm">
              <div className="mb-1 text-xs font-medium text-slate-500">Operating Cash Flow</div>
              <div className="text-3xl font-bold tracking-tight text-slate-900">${kpiCfTotal.toFixed(1)}M</div>
              <div className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                +11.2% vs prior
              </div>
            </Card>

            <Card className="border-l-4 border-l-indigo-500 border-slate-200 p-4 shadow-sm">
              <div className="mb-1 text-xs font-medium text-slate-500">Working Capital &Delta;</div>
              <div className="text-3xl font-bold tracking-tight text-slate-900">
                {workingCapitalDelta >= 0 ? "+" : "-"}${Math.abs(workingCapitalDelta).toFixed(1)}M
              </div>
              <div className="mt-1.5 text-xs text-slate-500">
                {wcBreakdown.join(" \u2022 ") || "No material WC lines"}
              </div>
            </Card>
          </div>

          {/* ─── Main Grid: Table + AI Sidebar ─── */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
            {/* ─── LEFT: Tables & Drivers ─── */}
            <div className="min-w-0 space-y-4">
              {/* ─── Tab Tables ─── */}
              <Card className="border-slate-200 shadow-sm">
                <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "is" | "bs" | "cf")}>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 pt-3 pb-0">
                    <TabsList className="bg-transparent p-0">
                      <TabsTrigger value="is" className="rounded-none border-b-2 border-transparent px-4 pb-2 text-xs data-[state=active]:border-[#205375] data-[state=active]:text-[#205375] data-[state=active]:shadow-none">
                        Income Statement
                      </TabsTrigger>
                      <TabsTrigger value="bs" className="rounded-none border-b-2 border-transparent px-4 pb-2 text-xs data-[state=active]:border-[#205375] data-[state=active]:text-[#205375] data-[state=active]:shadow-none">
                        Balance Sheet
                      </TabsTrigger>
                      <TabsTrigger value="cf" className="rounded-none border-b-2 border-transparent px-4 pb-2 text-xs data-[state=active]:border-[#205375] data-[state=active]:text-[#205375] data-[state=active]:shadow-none">
                        Cash Flow Bridge
                      </TabsTrigger>
                    </TabsList>
                    <span className="pb-2 text-xs text-slate-400">Click any row to view details</span>
                  </div>

                  <div className="p-4">
                    <TabsContent value="is" className="mt-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[#205375]">Income Statement Coverage</h3>
                        <span className="text-xs text-slate-500">{filteredIS.length} accounts</span>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <div className="min-w-[920px]">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead className="text-xs font-medium text-slate-600">Acct</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">Name</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">Base</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">Actual</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">&Delta;</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">&Delta;%</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">Driver</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">Owner</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">Evidence</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">Status</TableHead>
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
                        <h3 className="text-sm font-semibold text-[#205375]">Balance Sheet Coverage</h3>
                        <span className="text-xs text-slate-500">{filteredBS.length} accounts</span>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <div className="min-w-[920px]">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead className="text-xs font-medium text-slate-600">Acct</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">Name</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">Base</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">Actual</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">&Delta;</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">&Delta;%</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">Driver</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">Owner</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">Evidence</TableHead>
                                <TableHead className="text-xs font-medium text-slate-600">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>{renderTableRows(pagedRows)}</TableBody>
                          </Table>
                        </div>
                      </div>
                      {renderPagination()}

                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-[#205375]">Balance Sheet Roll-forward</h4>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <div className="min-w-[700px]">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-50">
                                  <TableHead className="text-xs">Account</TableHead>
                                  <TableHead className="text-xs">Opening</TableHead>
                                  <TableHead className="text-xs">Activity</TableHead>
                                  <TableHead className="text-xs">Closing</TableHead>
                                  <TableHead className="text-xs">Notes</TableHead>
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
                      <h3 className="text-sm font-semibold text-[#205375]">Operating Cash Flow Bridge</h3>
                      <canvas
                        ref={canvasRef}
                        className="h-[300px] w-full rounded-lg border border-dashed border-slate-300 bg-gradient-to-b from-white to-slate-50"
                      />
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <div className="min-w-[500px]">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead className="text-xs">Component</TableHead>
                                <TableHead className="text-xs">Impact</TableHead>
                                <TableHead className="text-xs">Narrative</TableHead>
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
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-xs font-medium text-slate-600">Driver</TableHead>
                          <TableHead className="text-xs font-medium text-slate-600">Impact ($)</TableHead>
                          <TableHead className="text-xs font-medium text-slate-600">Impact (%)</TableHead>
                          <TableHead className="text-xs font-medium text-slate-600">Confidence</TableHead>
                          <TableHead className="text-xs font-medium text-slate-600">Trend</TableHead>
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
                                      className={cn("h-full rounded-full", pct >= 0 ? "bg-[#205375]" : "bg-red-400")}
                                      style={{ width: `${Math.min(100, Math.abs(pct) * 260)}%` }}
                                    />
                                  </div>
                                  <span className={cn("h-2 w-2 rounded-full", pct >= 0 ? "bg-[#205375]" : "bg-red-400")} />
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
                <div className="bg-[#205375] px-4 py-3">
                  <div className="flex items-center gap-2 text-white">
                    <Sparkles className="h-4 w-4" />
                    <h3 className="text-sm font-semibold">AI Analysis</h3>
                  </div>
                </div>
                <div className="p-4">
                  {aiResponses.length === 0 ? (
                    <div className="flex flex-col items-center py-6 text-center">
                      <div className="mb-3 rounded-full bg-slate-100 p-3">
                        <Sparkles className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-500">Ask a question or try a suggestion below</p>
                    </div>
                  ) : (
                    <div className="mb-3 max-h-48 space-y-2 overflow-y-auto">
                      {aiResponses.map((r, i) => (
                        <div key={`${r.q}-${i}`} className="space-y-1 border-b border-slate-100 pb-2 text-xs last:border-0">
                          <div className="font-medium text-slate-700">Q: {r.q}</div>
                          <div className="text-slate-600">{r.a}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Input
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ask: Explain AR increase and cash impact"
                      className="h-9 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAsk();
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      className="h-9 w-9 shrink-0 bg-[#205375] hover:bg-[#1b4563]"
                      onClick={() => handleAsk()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {AI_QUICK_PROMPTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleAsk(p)}
                        className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-500 transition-colors hover:border-blue-300 hover:text-[#205375]"
                      >
                        &ldquo;{p}&rdquo;
                      </button>
                    ))}
                  </div>
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

      {/* ─── Detail Drawer ─── */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {detailRow && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle className="text-2xl font-bold text-slate-900">{detailRow.name}</SheetTitle>
                <p className="text-sm text-slate-500">
                  Acct {detailRow.acct} &nbsp;|&nbsp; Owner: {detailRow.owner}
                </p>
              </SheetHeader>

              {/* Base / Actual / Delta cards */}
              <div className="mb-4 grid grid-cols-3 gap-3">
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

              {/* Tags */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">{detailRow.driver}</Badge>
                <Badge className={cn("border text-xs", statusClass(detailRow.status))}>
                  <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full", detailRow.status === "Closed" ? "bg-emerald-500" : detailRow.status === "In Review" ? "bg-amber-500" : "bg-orange-500")} />
                  {detailRow.status}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-xs", detailRow.evidence ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "")}
                >
                  <Paperclip className="mr-1 h-3 w-3" /> {detailRow.evidence ? "Attached" : "Attach"}
                </Badge>
              </div>

              {/* Timeline */}
              <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
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
              <div className="mb-5 rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Evidence Files (0)</h4>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toast.success("Upload dialog opened")}>
                    <Upload className="mr-1.5 h-3 w-3" /> Add Evidence
                  </Button>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  No files attached yet. Upload supporting documentation to improve close readiness.
                </p>
              </div>

              {/* Recent Activity */}
              <div className="mb-5 rounded-lg border border-slate-200 p-4">
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
              <div className="mb-5 rounded-lg border border-slate-200 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#205375]" />
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
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
