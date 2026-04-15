import type { Persona } from "@/lib/persona-context";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  bullets?: string[];
  icon: "welcome" | "sidebar" | "decision" | "close" | "workbench" | "ai" | "theme" | "ready";
  /** data-tour-id of the DOM element to highlight. null = centered modal (no spotlight) */
  targetId: string | null;
  /** Preferred tooltip position relative to the highlighted element */
  position: "center" | "right" | "bottom" | "left" | "bottom-right";
  /** Optional route to navigate to */
  highlightRoute?: string;
  highlightLabel?: string;
}

// ─── Step definitions ────────────────────────────────────────────

const WELCOME: TourStep = {
  id: "welcome",
  title: "Welcome to MeeruAI",
  description: "MeeruAI is a decision intelligence platform for finance. AI-powered analysis, automated commentary, and close workflow orchestration — in one system.",
  bullets: [
    "AI understands your financial data and explains variances",
    "Every insight is grounded in GL evidence — not hallucinated",
    "Human-in-the-loop: AI drafts, you review and approve",
  ],
  icon: "welcome",
  targetId: null,
  position: "center",
};

const SIDEBAR: TourStep = {
  id: "sidebar",
  title: "Sidebar Navigation",
  description: "This is your main navigation. Each icon opens a category with its modules. The two most important are Decision Intelligence and Close Intelligence.",
  icon: "sidebar",
  targetId: "sidebar",
  position: "right",
};

const DI_RAIL: TourStep = {
  id: "decision-rail",
  title: "Decision Intelligence",
  description: "Performance analysis across regions, products, and time periods. AI decomposes variances into price, volume, mix, and FX drivers.",
  bullets: [
    "FluxPlus — regional performance intelligence with weekly variance tracking",
    "Form Factor — margin bridge analysis with driver decomposition",
    "Variance Drivers — root cause attribution for budget variances",
  ],
  icon: "decision",
  targetId: "rail-decision-intelligence",
  position: "right",
  highlightRoute: "/workbench/custom-workbench/uberflux",
  highlightLabel: "Open FluxPlus",
};

const CI_RAIL: TourStep = {
  id: "close-rail",
  title: "Close Intelligence",
  description: "Period-end close analysis. AI-drafted commentary with human-in-the-loop approval, close task orchestration, and reconciliation workflows.",
  bullets: [
    "Standard Flux — AI generates commentary, you review and approve",
    "Close Workbench — task dependencies across close phases",
    "Reconciliations — GL-to-subledger matching, auto-match, certify",
  ],
  icon: "close",
  targetId: "rail-close-intelligence",
  position: "right",
  highlightRoute: "/workbench/record-to-report/standard-flux",
  highlightLabel: "Open Standard Flux",
};

const THEME: TourStep = {
  id: "theme",
  title: "Light & Dark Mode",
  description: "Toggle between light and dark themes. The entire platform adapts — workbenches, charts, navigation, everything.",
  icon: "theme",
  targetId: "theme-toggle",
  position: "bottom",
};

const AI_STEP: TourStep = {
  id: "ai",
  title: "AI Command Center",
  description: "Every workbench has an embedded AI assistant. Ask questions in plain language — it reads your data, explains variances, and drafts structured commentary.",
  bullets: [
    "\"What are the top movers this period?\"",
    "\"Explain the AR increase and cash impact\"",
    "All responses cite source data — never fabricated",
  ],
  icon: "ai",
  targetId: null,
  position: "center",
};

const COMMENTARY_DEEP_DIVE: TourStep = {
  id: "commentary",
  title: "AI Commentary — Human-in-the-Loop",
  description: "The flagship feature. For every material variance, AI drafts structured commentary grounded in GL evidence. You review, edit, and approve — full control.",
  bullets: [
    "Variance statement — auto-generated from GL data",
    "Driver attribution — decomposed by sub-account, ranked by impact",
    "Expectedness — Expected, Seasonal, Anomalous, or One-time",
    "Evidence package — linked GL transactions, subledger, JE support",
  ],
  icon: "workbench",
  targetId: null,
  position: "center",
  highlightRoute: "/workbench/record-to-report/standard-flux",
  highlightLabel: "Try Commentary",
};

const READY: TourStep = {
  id: "ready",
  title: "You're All Set",
  description: "Your dashboard shows the KPIs, alerts, and workbench shortcuts most relevant to your role. Click any card to dive deeper.",
  icon: "ready",
  targetId: null,
  position: "center",
};

// ─── Assemble per persona ────────────────────────────────────────

export function getTourSteps(persona: Persona): TourStep[] {
  switch (persona) {
    case "cfo":
      return [WELCOME, SIDEBAR, DI_RAIL, CI_RAIL, AI_STEP, THEME, READY];
    case "cao":
      return [WELCOME, SIDEBAR, CI_RAIL, DI_RAIL, AI_STEP, THEME, READY];
    case "cao-controller":
      return [WELCOME, SIDEBAR, CI_RAIL, COMMENTARY_DEEP_DIVE, DI_RAIL, THEME, READY];
  }
}
