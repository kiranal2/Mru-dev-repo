import { SEVERITY_BADGE_COLORS } from "../constants";

interface SeverityBadgeProps {
  severity: "HIGH" | "MEDIUM" | "LOW" | "high" | "low";
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const normalizedSeverity = severity.toUpperCase() as "HIGH" | "MEDIUM" | "LOW";
  const colors = SEVERITY_BADGE_COLORS[normalizedSeverity];

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {normalizedSeverity}
    </span>
  );
}
