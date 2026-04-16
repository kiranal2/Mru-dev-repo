import type { Persona, AnalysisType } from "@/lib/persona-context";

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

// ─── Persona-aware body text helper ──────────────────────────────
type PersonaBodyFn = (persona: Persona) => string;

function bodyFor(persona: Persona, map: Record<Persona, string>): string {
  return map[persona] || map["cfo"];
}

// ─── UBERFLUX (Performance Intelligence) steps ──────────────────
function getUberFluxSteps(persona: Persona): TourStep[] {
  return [
    {
      id: "uf-welcome",
      title: "Performance Intelligence",
      description: bodyFor(persona, {
        cfo: "Your weekly operating dashboard. AI surfaces the signals that matter — revenue shifts, margin pressure, exception patterns — so you can brief the board with confidence.",
        cao: "Performance variance analysis across regions and segments. AI decomposes weekly changes into price, volume, mix, and FX drivers.",
        "cao-controller": "Regional performance tracking. Use this to validate operating variances before they flow into the close.",
      }),
      icon: "welcome",
      targetId: null,
      position: "center",
    },
    {
      id: "uf-topbar",
      title: "Metric Toggle & Context",
      description: "Switch between Revenue and Orders views. The metric strip shows your current analysis context — which metric, time period, and comparison basis.",
      icon: "workbench",
      targetId: "uf-topbar",
      position: "bottom",
    },
    {
      id: "uf-stats",
      title: "Performance KPIs",
      description: bodyFor(persona, {
        cfo: "Four headline numbers: total variance, flagged segments, top driver, and commentary status. These are your board-ready metrics.",
        cao: "KPI strip summarizing variance magnitude, segment flags, primary driver, and AI commentary progress.",
        "cao-controller": "Quick reference for variance totals and which segments need attention before close.",
      }),
      icon: "decision",
      targetId: "uf-stats",
      position: "bottom",
    },
    {
      id: "uf-content",
      title: "Segment Analysis",
      description: "Ranked segments with tags, variance magnitude, and drill-down detail. Click any row to see the full decomposition — price, volume, mix, and FX impact.",
      bullets: [
        "Color-coded variance badges (green positive, red negative)",
        "AI-generated tags highlight the primary driver for each segment",
        "Click a row to drill into sub-segment detail",
      ],
      icon: "workbench",
      targetId: "uf-content",
      position: "right",
    },
    {
      id: "uf-chart",
      title: "Variance Chart",
      description: "Weekly trend of actual vs plan, with variance bars. Hovering reveals the per-week breakdown and any flagged anomalies.",
      icon: "decision",
      targetId: "uf-chart",
      position: "left",
    },
    {
      id: "uf-ai",
      title: "AI Assistant",
      description: bodyFor(persona, {
        cfo: "Ask questions like \"What's the headline for this week?\" or \"Which region is driving the shortfall?\" AI reads the data and responds with cited evidence.",
        cao: "Query the AI: \"Decompose the margin variance by segment\" or \"What changed versus last week?\" Every response cites source data.",
        "cao-controller": "Use AI to validate variance explanations: \"Is this consistent with prior periods?\" or \"What GL accounts are driving this?\"",
      }),
      icon: "ai",
      targetId: "uf-ai-toggle",
      position: "left",
    },
    {
      id: "uf-ready",
      title: "You're Set",
      description: "Explore the tabs — Drill-Down for segment cards, Exceptions for flagged items, Signals for ML patterns. The AI panel is always one click away.",
      icon: "ready",
      targetId: null,
      position: "center",
    },
  ];
}

// ─── FORM FACTOR (Margin Intelligence) steps ────────────────────
function getFormFactorSteps(persona: Persona): TourStep[] {
  return [
    {
      id: "ff-welcome",
      title: "Margin Intelligence",
      description: bodyFor(persona, {
        cfo: "Deep margin analysis. See exactly what's driving gross margin — price changes, volume shifts, product mix, and cost pressure — with forecast implications.",
        cao: "Margin bridge decomposition. This workbench breaks down standard margin variance by driver, segment, and time period.",
        "cao-controller": "Margin analysis for close. Validate that cost and margin variances are explained and supported by evidence.",
      }),
      icon: "welcome",
      targetId: null,
      position: "center",
    },
    {
      id: "ff-sidebar",
      title: "Navigation Pages",
      description: "Six analysis views: Executive Overview, Trends, Actual vs Forecast, Driver Analytics, Period Comparison, and Margin Forecast. Each offers a different lens on margin performance.",
      icon: "sidebar",
      targetId: "ff-sidebar",
      position: "right",
    },
    {
      id: "ff-stats",
      title: "Margin KPIs",
      description: "Four headline metrics: Standard Margin, Revenue, Standard Cost, and Forecast Gap. These update as you change segments and time periods.",
      icon: "decision",
      targetId: "ff-stats",
      position: "bottom",
    },
    {
      id: "ff-narrative",
      title: "AI Narrative",
      description: bodyFor(persona, {
        cfo: "AI-generated executive summary of margin performance. One paragraph that covers the headline, drivers, and outlook — ready for board or earnings prep.",
        cao: "AI explains the margin movement in business terms: what drove the change, whether it's recurring, and what to watch.",
        "cao-controller": "AI narrative provides the context behind the numbers. Use it as a starting point for management commentary.",
      }),
      icon: "ai",
      targetId: "ff-narrative",
      position: "bottom",
    },
    {
      id: "ff-content",
      title: "Analysis Content",
      description: "Charts, tables, and waterfall bridges that change based on your selected page. The Driver Analytics page shows the margin bridge — each bar is a decomposed driver.",
      icon: "workbench",
      targetId: "ff-content",
      position: "left",
    },
    {
      id: "ff-ready",
      title: "You're Set",
      description: "Navigate between pages using the sidebar. Toggle the AI panel for natural-language queries. All charts are interactive — hover for detail, click to drill.",
      icon: "ready",
      targetId: null,
      position: "center",
    },
  ];
}

// ─── STANDARD FLUX (Flux Intelligence) steps ────────────────────
function getStandardFluxSteps(persona: Persona): TourStep[] {
  return [
    {
      id: "sf-welcome",
      title: "Flux Intelligence",
      description: bodyFor(persona, {
        cfo: "Close analysis with AI-powered commentary. See income statement, balance sheet, and cash flow variances — each with AI-drafted explanations and evidence.",
        cao: "The flux worklist for period-end. AI generates structured commentary for every material variance. You review, edit, and approve.",
        "cao-controller": "Your primary close tool. Every flux item has AI commentary, driver attribution, expectedness classification, and linked evidence. Approve what's good, flag what needs work.",
      }),
      icon: "welcome",
      targetId: null,
      position: "center",
    },
    {
      id: "sf-toolbar",
      title: "Toolbar & Filters",
      description: "Switch between Income Statement, Balance Sheet, and Cash Flow views. Set comparison period, consolidation level, currency, and materiality threshold.",
      icon: "workbench",
      targetId: "sf-toolbar",
      position: "bottom",
    },
    {
      id: "sf-kpis",
      title: "Review KPIs",
      description: bodyFor(persona, {
        cfo: "Net variance, review progress, top drivers, and items needing attention. Click any card to expand contextual filters.",
        cao: "Track how many items are reviewed vs pending. The \"Needs Attention\" count shows unresolved anomalies.",
        "cao-controller": "Your close readiness dashboard — net variance, % reviewed, top drivers, and outstanding items. Click a KPI to filter the worklist.",
      }),
      icon: "decision",
      targetId: "sf-kpis",
      position: "bottom",
    },
    {
      id: "sf-worklist",
      title: "Flux Worklist",
      description: "Every material variance is a row. Status badges show review progress. Evidence counts indicate supporting documentation. Click any row to open the detail drawer.",
      bullets: [
        "Expectedness tags: Expected, Seasonal, Anomalous, One-time",
        "Commentary status: Draft → Submitted → Approved",
        "Evidence attachments linked from GL, subledger, JEs",
      ],
      icon: "close",
      targetId: "sf-worklist",
      position: "right",
    },
    {
      id: "sf-ai",
      title: "AI Commentary Panel",
      description: bodyFor(persona, {
        cfo: "AI drafts structured commentary for each variance — grounded in GL evidence, never hallucinated. Review, edit, and approve at your discretion.",
        cao: "The AI panel generates explanations, driver attributions, and sensitivity analysis. Ask follow-up questions in natural language.",
        "cao-controller": "AI drafts commentary with evidence citations. Use \"Generate AI Draft\" to create, then review and approve. Every explanation traces back to GL transactions.",
      }),
      icon: "ai",
      targetId: "sf-ai-panel",
      position: "left",
    },
    {
      id: "sf-ready",
      title: "You're Set",
      description: "Work through the worklist top-to-bottom. Use the AI to draft, the drawer to review evidence, and the toolbar to filter. Your close progress tracks automatically.",
      icon: "ready",
      targetId: null,
      position: "center",
    },
  ];
}

// ─── Public API ──────────────────────────────────────────────────

/** Get tour steps for the current workbench (demo mode) */
export function getWorkbenchTourSteps(
  analysisType: AnalysisType,
  persona: Persona
): TourStep[] {
  switch (analysisType) {
    case "strategic":
      return getUberFluxSteps(persona);
    case "margin":
      return getFormFactorSteps(persona);
    case "flux":
      return getStandardFluxSteps(persona);
  }
}

/** Get tour steps for the general platform tour (non-demo mode) */
export function getTourSteps(persona: Persona): TourStep[] {
  // General platform tour — sidebar-centric, used when not in demo mode
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
    description: "This is your main navigation. Each icon opens a category with its modules.",
    icon: "sidebar",
    targetId: "sidebar",
    position: "right",
  };

  const DI_RAIL: TourStep = {
    id: "decision-rail",
    title: "Decision Intelligence",
    description: "Performance analysis with AI-driven variance decomposition across regions, products, and time periods.",
    icon: "decision",
    targetId: "rail-decision-intelligence",
    position: "right",
    highlightRoute: "/workbench/custom-workbench/uberflux",
    highlightLabel: "Open FluxPlus",
  };

  const CI_RAIL: TourStep = {
    id: "close-rail",
    title: "Close Intelligence",
    description: "Period-end close analysis. AI commentary with human-in-the-loop, close tasks, and reconciliation workflows.",
    icon: "close",
    targetId: "rail-close-intelligence",
    position: "right",
    highlightRoute: "/workbench/record-to-report/standard-flux",
    highlightLabel: "Open Standard Flux",
  };

  const READY: TourStep = {
    id: "ready",
    title: "You're All Set",
    description: "Your dashboard shows KPIs, alerts, and workbench shortcuts relevant to your role. Click any card to dive deeper.",
    icon: "ready",
    targetId: null,
    position: "center",
  };

  switch (persona) {
    case "cfo":
      return [WELCOME, SIDEBAR, DI_RAIL, CI_RAIL, READY];
    case "cao":
      return [WELCOME, SIDEBAR, CI_RAIL, DI_RAIL, READY];
    case "cao-controller":
      return [WELCOME, SIDEBAR, CI_RAIL, DI_RAIL, READY];
  }
}
