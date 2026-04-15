export interface SuggestedPrompt {
  label: string;
  prompt: string;
}

export const WORKBENCH_PROMPTS: Record<string, SuggestedPrompt[]> = {
  uberflux: [
    { label: "What are the most significant exceptions this week?", prompt: "What are the most significant exceptions this week?" },
    { label: "3 exceptions ranked by significance", prompt: "Show me the top 3 exceptions ranked by revenue significance" },
    { label: "What should we watch before Tuesday?", prompt: "What should we watch before Tuesday?" },
    { label: "Explain Southeast revenue decline", prompt: "Explain the Southeast revenue decline and its drivers" },
    { label: "Which segments are trending off-plan?", prompt: "Which segments are trending off-plan for the current period?" },
    { label: "Supply constraint impact analysis", prompt: "Analyze the supply constraint impact on current quarter revenue" },
    { label: "Compare vs prior year performance", prompt: "Compare this week's performance against prior year same period" },
    { label: "What signals support the Midwest trend?", prompt: "What predictive signals support the Midwest trend?" },
  ],
  "form-factor": [
    { label: "What's driving margin compression?", prompt: "What is driving margin compression this period?" },
    { label: "Show forecast vs actual trend", prompt: "Show the forecast vs actual trend for the last 8 weeks" },
    { label: "Top 3 cost drivers by impact", prompt: "Identify the top 3 cost drivers by revenue impact" },
    { label: "Which segment has highest variance?", prompt: "Which segment has the highest variance vs plan?" },
    { label: "Explain the APAC performance shift", prompt: "Explain the APAC performance shift this quarter" },
    { label: "Driver confidence analysis", prompt: "Show driver attribution with confidence levels" },
    { label: "Proxy cost data quality check", prompt: "Flag any metrics using proxy cost data with low confidence" },
    { label: "Forward view risk assessment", prompt: "What does the forward view tell us about next quarter risk?" },
  ],
  "close-workbench": [
    { label: "What tasks are blocking the close?", prompt: "What tasks are blocking the close?" },
    { label: "Show critical path to Day 5 close", prompt: "Show the critical path to achieving a Day 5 close" },
    { label: "Which entities have overdue tasks?", prompt: "Which entities have the most overdue tasks?" },
    { label: "Summarize close readiness by phase", prompt: "Summarize close readiness by phase — Pre-Close, Core, Post-Close" },
    { label: "Reconciliations needing review", prompt: "What reconciliations need review before close?" },
    { label: "Task completion trend vs prior period", prompt: "Show task completion trend compared to prior period close" },
    { label: "Flag SLA breaches today", prompt: "Flag any SLA breaches as of today" },
    { label: "Estimated close date at current pace", prompt: "What is the estimated close date based on current pace?" },
  ],
  reconciliations: [
    { label: "Show unreconciled items over $100K", prompt: "Show unreconciled items over $100K" },
    { label: "What's the auto-match rate?", prompt: "What is the auto-match rate this period?" },
    { label: "Exceptions by entity and type", prompt: "List exceptions grouped by entity and type" },
    { label: "Reconciliations past SLA", prompt: "Which reconciliations are past SLA?" },
    { label: "Unmatched items aging over 30 days", prompt: "Show unmatched items aging over 30 days" },
    { label: "Total unreconciled exposure", prompt: "What is the total unreconciled exposure?" },
    { label: "Match rates vs prior month", prompt: "Compare match rates against prior month" },
    { label: "High-risk reconciliations for review", prompt: "Flag high-risk reconciliations that need immediate review" },
  ],
  "flux-analysis": [
    { label: "What's driving the revenue variance?", prompt: "What is driving the revenue variance this period?" },
    { label: "Top 5 accounts by absolute change", prompt: "Show top 5 accounts by absolute dollar change" },
    { label: "Material variances requiring review", prompt: "Which variances exceed materiality threshold and need review?" },
    { label: "Show variance by driver type", prompt: "Break down the variance by driver type — volume, price, mix, FX" },
    { label: "Explain operating expense movement", prompt: "Explain the operating expense movement vs prior period" },
    { label: "One-time items impacting results", prompt: "Identify any one-time items impacting this period's results" },
    { label: "Balance sheet flux summary", prompt: "Show the balance sheet flux summary — working capital focus" },
    { label: "AI-generated variance narrative", prompt: "Generate a board-ready variance narrative for this period" },
  ],
  "standard-flux": [
    { label: "Explain top variance drivers", prompt: "Explain the top variance drivers for this period" },
    { label: "Which accounts need investigation?", prompt: "Which accounts have variances that need investigation?" },
    { label: "Show sensitivity analysis", prompt: "Run sensitivity analysis on the top 3 variance drivers" },
    { label: "Compare IS vs BS variance patterns", prompt: "Compare income statement vs balance sheet variance patterns" },
    { label: "Flag unreviewed material items", prompt: "Flag all unreviewed items above materiality threshold" },
    { label: "Generate audit-ready explanation", prompt: "Generate an audit-ready explanation for the largest variance" },
    { label: "Cash flow bridge analysis", prompt: "Show cash flow bridge analysis with key drivers" },
    { label: "Trend analysis on recurring variances", prompt: "Run trend analysis on recurring variance patterns" },
  ],
  dashboard: [
    { label: "What are the key risks this period?", prompt: "What are the key risks for the current close period?" },
    { label: "Summarize close status", prompt: "Give me a summary of the current close status across all areas" },
    { label: "Any critical exceptions?", prompt: "Are there any critical exceptions that need my attention today?" },
    { label: "Show top variances", prompt: "What are the top 5 variances by dollar impact this period?" },
    { label: "Reconciliation health check", prompt: "Show me the reconciliation health check — any exceptions or past SLA?" },
    { label: "What should I focus on today?", prompt: "Based on the current close status, what should I focus on today?" },
  ],
  general: [
    { label: "Show AR aging summary", prompt: "Show me AR aging summary for all customers" },
    { label: "Open invoices over $100K", prompt: "List all open invoices over $100,000" },
    { label: "Payment history last 30 days", prompt: "Give me payment history for the last 30 days" },
    { label: "Top 10 customers by outstanding", prompt: "Show top 10 customers by outstanding balance" },
    { label: "Overdue invoices over 60 days", prompt: "What invoices are overdue by more than 60 days?" },
    { label: "AR balance by business unit", prompt: "Break down AR balance by business unit" },
    { label: "Cash application status", prompt: "Show cash application status and auto-match rate" },
    { label: "DSO trend by entity", prompt: "Show DSO trend by entity for the last 6 months" },
  ],
};

/** Get prompts for a given workbench context, falling back to general */
export function getPromptsForContext(context: string): SuggestedPrompt[] {
  return WORKBENCH_PROMPTS[context] || WORKBENCH_PROMPTS.general;
}
