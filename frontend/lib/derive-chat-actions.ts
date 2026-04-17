import type { WorkbenchAction } from "@/components/shared/workbench-action-strip";

/**
 * Structured AI response payload.
 * Prefer this over plain strings so adaptive UI gets precise actions.
 */
export interface AiResponsePayload {
  text: string;
  actions?: WorkbenchAction[];
}

export function normalizeAiResponse(
  r: string | AiResponsePayload | null | undefined,
): AiResponsePayload {
  if (!r) return { text: "" };
  if (typeof r === "string") return { text: r };
  return r;
}

/**
 * Resolve actions for a response: prefer explicit `actions` on the payload,
 * otherwise fall back to keyword-based derivation.
 */
export function resolveChatActions(
  payload: AiResponsePayload,
  context: { pageTitle?: string; region?: string; owner?: string } = {},
): WorkbenchAction[] {
  if (payload.actions && payload.actions.length > 0) {
    return payload.actions.slice(0, 4);
  }
  if (!payload.text) return [];
  return deriveChatActions(payload.text, context);
}

/**
 * Derive adaptive-UI action cards from an AI chat response.
 *
 * Keyword-based heuristics — fallback when the AI response doesn't
 * carry structured actions. Prefer emitting `actions` directly in
 * the response payload for precise card selection.
 */
export function deriveChatActions(
  responseText: string,
  context: { pageTitle?: string; region?: string; owner?: string } = {},
): WorkbenchAction[] {
  const actions: WorkbenchAction[] = [];
  const text = (responseText || "").toLowerCase();
  const stripped = (responseText || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const snippet = stripped.length > 140 ? stripped.slice(0, 140) + "…" : stripped;

  const hasAny = (keys: string[]) => keys.some((k) => text.includes(k));

  // Escalate to CFO / exec
  if (hasAny(["cfo", "executive", "earnings", "materiality", "escalat", "margin", "guidance"])) {
    actions.push({
      kind: "email",
      label: "Email CFO summary",
      recipient: "CFO",
      body: snippet,
      contextual: true,
    });
  }

  // Slack an ops / regional lead
  if (hasAny(["staffing", "labor", "ops", "overtime", "shift", "wage"])) {
    actions.push({
      kind: "slack",
      label: context.region ? `Slack ${context.region} ops lead` : "Slack ops lead",
      recipient: context.region ? `${context.region} Ops` : "Ops Lead",
      body: snippet,
      contextual: true,
    });
  }

  // Commodity / hedging flags
  if (hasAny(["hedge", "commodity", "fx", "spot price", "natural gas", "unhedged"])) {
    actions.push({
      kind: "slack",
      label: "Slack treasury",
      recipient: "Treasury",
      body: snippet,
      contextual: true,
    });
  }

  // Exceptions / anomalies → chase owners
  if (hasAny(["exception", "anomaly", "flagged", "unreconciled", "missing"])) {
    actions.push({
      kind: "reminder",
      label: "Chase exception owners",
      contextual: true,
    });
  }

  // Forecast / watch items → reminder
  if (hasAny(["before thursday", "next week", "watch", "forecast", "projected"])) {
    actions.push({
      kind: "reminder",
      label: "Remind me before next run",
      contextual: true,
    });
  }

  // IM a teammate for context
  if (hasAny(["ask", "explain", "coordinat", "review", "reviewer"])) {
    actions.push({
      kind: "im",
      label: "IM teammate for context",
      body: snippet,
      contextual: true,
    });
  }

  // Always offer a pin so user can save the insight
  actions.push({
    kind: "pin",
    label: context.pageTitle ? `Pin to ${context.pageTitle}` : "Pin this insight",
    body: snippet,
    contextual: true,
  });

  // Cap at 4 to keep the strip readable
  return dedupeByKind(actions).slice(0, 4);
}

function dedupeByKind(actions: WorkbenchAction[]): WorkbenchAction[] {
  const seen = new Set<string>();
  const out: WorkbenchAction[] = [];
  for (const a of actions) {
    const key = `${a.kind}:${a.label}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(a);
    }
  }
  return out;
}
