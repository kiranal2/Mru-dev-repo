const SEVERITY_BADGES: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700 border-red-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  LOW: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

interface SeverityBadgeProps {
  severity: "HIGH" | "MEDIUM" | "LOW" | "high" | "low";
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const normalizedSeverity = severity.toUpperCase() as "HIGH" | "MEDIUM" | "LOW";
  const colors = SEVERITY_BADGES[normalizedSeverity] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span className={`px-2 py-0.5 rounded border text-[11px] font-bold whitespace-nowrap ${colors}`}>
      {normalizedSeverity}
    </span>
  );
}
