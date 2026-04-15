import type {
  FluxRaw,
  FluxRow,
  FluxStatus,
  PeriodType,
  FluxPageData,
  DriverRow,
  CfRow,
  AiResponse,
  Expectedness,
  CommentaryStatus,
} from "@/lib/data/types/flux-analysis";
import { OWNER_RULES, DRIVER_RULES, FALLBACK_CF_DATA, FALLBACK_DATA } from "./constants";

/* ──────────────────────────────── MAPPING & MATH ──────────────────────────────── */

export function mapFluxStatus(rawStatus?: string): FluxStatus {
  if (!rawStatus) return "Open";
  if (rawStatus === "Reviewed" || rawStatus === "AutoClosed") return "Closed";
  if (rawStatus === "InReview") return "In Review";
  return "Open";
}

export function toMillions(n: number): number {
  return Math.round((n / 1_000_000) * 10) / 10;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function isIncomeStatement(acct: string): boolean {
  const first = acct.charAt(0);
  return first >= "4" && first <= "7";
}

export function isBalanceSheet(acct: string): boolean {
  const first = acct.charAt(0);
  return first >= "1" && first <= "3";
}

export function parseQuarterPeriod(label: string): { quarter: number; year: number } | null {
  const match = label.match(/^Q([1-4])\s+(\d{4})$/i);
  if (!match) return null;
  return { quarter: Number(match[1]), year: Number(match[2]) };
}

export function getPeriodType(currentPeriod: string, priorPeriod: string): PeriodType {
  const cur = parseQuarterPeriod(currentPeriod);
  const pri = parseQuarterPeriod(priorPeriod);
  if (!cur || !pri) return "Other";
  if (cur.year === pri.year && cur.quarter - pri.quarter === 1) return "QoQ";
  if (cur.year - pri.year === 1 && cur.quarter === pri.quarter) return "YoY";
  return "Other";
}

/* ──────────────────────────────── INFERENCE ──────────────────────────────── */

export function inferOwner(accountName: string): string {
  const rule = OWNER_RULES.find(({ pattern }) => pattern.test(accountName));
  return rule?.owner ?? "FP&A";
}

export function inferDriver(accountName: string): string {
  const rule = DRIVER_RULES.find(({ pattern }) => pattern.test(accountName));
  return rule?.driver ?? "Operational mix";
}

export function getConfidence(delta: number, pct: number): "High" | "Med" {
  if (Math.abs(delta) >= 1 || Math.abs(pct) >= 0.08) return "High";
  return "Med";
}

/* ──────────────────────────────── BADGE / TONE CLASSES ──────────────────────────────── */

export function statusClass(status: FluxStatus): string {
  if (status === "Closed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "In Review") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

export function confidenceClass(conf: "High" | "Med"): string {
  if (conf === "High") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function metricToneClass(tone: "positive" | "negative" | "neutral"): string {
  if (tone === "positive") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (tone === "negative") return "border-red-200 bg-red-50 text-red-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function expectednessClass(e: Expectedness): string {
  if (e === "Expected") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (e === "Seasonal") return "border-blue-200 bg-blue-50 text-blue-700";
  if (e === "Anomalous") return "border-red-200 bg-red-50 text-red-700";
  // One-time
  return "border-orange-200 bg-orange-50 text-orange-700";
}

export function expectednessIcon(e: Expectedness): string {
  if (e === "Expected") return "✓";
  if (e === "Seasonal") return "↻";
  if (e === "Anomalous") return "⚠";
  return "①"; // One-time
}

export function commentaryStatusClass(s: CommentaryStatus): string {
  if (s === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (s === "submitted") return "border-blue-200 bg-blue-50 text-blue-700";
  if (s === "draft") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-500";
}

/* ──────────────────────────────── CANVAS ──────────────────────────────── */

export function drawRoundedRect(
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

/* ──────────────────────────────── FORMATTING ──────────────────────────────── */

export function fmtMoney(n: number): string {
  return `$${Math.abs(n).toFixed(1)}M`;
}

export function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;
}

export function signedMoney(value: number): string {
  return `${value >= 0 ? "+" : "-"}$${Math.abs(value).toFixed(1)}M`;
}

/* ──────────────────────────────── SENSITIVITY ──────────────────────────────── */

export function calculateSensitivity(
  baseRevenue: number,
  priceSlider: number[],
  volumeSlider: number[],
  fxSlider: number[]
): number {
  return baseRevenue * ((priceSlider[0] / 100) * 0.45 + (volumeSlider[0] / 100) * 0.35 + (fxSlider[0] / 100) * -0.2);
}

/* ──────────────────────────────── buildPageData ──────────────────────────────── */

export function buildPageData(rawItems: FluxRaw[]): FluxPageData {
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

  // Build CF Bridge from actual account data
  const cfItems: CfRow[] = [];

  // Net Income from IS rows (Operating Income or largest IS subtotal)
  const opIncomeRow = isRows.find((r) => /operating income|net income|ebitda/i.test(r.name));
  if (opIncomeRow) {
    cfItems.push({ label: "Net Income", val: round1(opIncomeRow.actual - opIncomeRow.base) });
  } else {
    const totalIsDelta = isRows.reduce((s, r) => s + (r.actual - r.base), 0);
    cfItems.push({ label: "Net Income (est.)", val: round1(totalIsDelta) });
  }

  // D&A add-back
  const daRow = rows.find((r) => /depreciation|amortization/i.test(r.name));
  if (daRow) {
    cfItems.push({ label: "Depreciation & Non-cash", val: round1(Math.abs(daRow.actual)) });
  }

  // Working capital changes from BS accounts
  const wcAccounts = bsRows.filter((r) => /receivable|inventory|payable|accrued|deferred|prepaid|other current/i.test(r.name));
  wcAccounts.forEach((r) => {
    const delta = round1(r.actual - r.base);
    if (Math.abs(delta) >= 0.1) {
      // For assets, increase = cash outflow (negative); for liabilities, increase = cash inflow (positive)
      const isAsset = r.acct.charAt(0) === "1";
      const cfImpact = isAsset ? -delta : delta;
      const direction = delta >= 0 ? "Increase" : "Decrease";
      cfItems.push({ label: `${r.name} (${direction})`, val: round1(cfImpact) });
    }
  });

  const cf: CfRow[] = cfItems.length >= 3 ? cfItems : FALLBACK_CF_DATA;

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

/* ──────────────────────────────── generateAIResponse ──────────────────────────────── */

export interface AiResponseContext {
  filteredAllRows: FluxRow[];
  filteredIS: FluxRow[];
  filteredBS: FluxRow[];
  topDrivers: DriverRow[];
  kpiRevenue: FluxRow | null;
  kpiCfTotal: number;
  priceSlider: number[];
  volumeSlider: number[];
  fxSlider: number[];
}

export function generateAIResponse(
  question: string,
  ctx: AiResponseContext
): Omit<AiResponse, "id" | "q"> {
  const {
    filteredAllRows,
    filteredIS,
    filteredBS,
    topDrivers: topDriversFromCtx,
    kpiRevenue,
    kpiCfTotal,
    priceSlider,
    volumeSlider,
    fxSlider,
  } = ctx;

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
        const bullets = topDriversFromCtx.slice(0, 4).map((driver) => {
          const pct = (kpiRevenue?.base ?? 48.2) ? driver.impact / (kpiRevenue?.base ?? 48.2) : 0;
          return `${driver.driver}: ${signedMoney(driver.impact)} (${fmtPct(pct)}) with ${driver.confidence} confidence.`;
        });
        return {
          summary: `Top driver clusters computed from ${filteredAllRows.length} filtered Flux accounts. ${topDriversFromCtx.length} unique drivers identified, ranked by absolute impact.`,
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
}
