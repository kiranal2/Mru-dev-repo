/**
 * Flux Analysis Domain Types
 *
 * Types used by the Flux Analysis page and its extracted components.
 */

export interface FluxRaw {
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

export type FluxStatus = "Open" | "In Review" | "Closed";
export type PeriodType = "QoQ" | "YoY" | "Other";
export type MaterialityMode = "default" | "tight" | "loose";

export interface FluxRow {
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

export interface BsRollRow {
  acct: string;
  open: number;
  activity: number;
  close: number;
  notes: string;
}

export interface DriverRow {
  driver: string;
  impact: number;
  confidence: "High" | "Med";
}

export interface CfRow {
  label: string;
  val: number;
}

export interface AiExplanationRow {
  acct: string;
  delta: number;
  driver: string;
  conf: "High" | "Med";
  owner: string;
  evidence: boolean;
  status: FluxStatus;
}

export interface FluxPageData {
  is: FluxRow[];
  bs: FluxRow[];
  bsRoll: BsRollRow[];
  drivers: DriverRow[];
  cf: CfRow[];
  aiExplanations: AiExplanationRow[];
}

export interface AiResponse {
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

export interface PromptSuggestion {
  prompt: string;
}
