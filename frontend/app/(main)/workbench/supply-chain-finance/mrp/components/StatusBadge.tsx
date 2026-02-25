const STATUS_BADGES: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700 border-blue-200",
  MONITORING: "bg-amber-100 text-amber-700 border-amber-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

interface StatusBadgeProps {
  status: "NEW" | "MONITORING" | "COMPLETED";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = STATUS_BADGES[status] || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`px-2 py-0.5 rounded border text-[11px] font-bold whitespace-nowrap ${colors}`}>
      {status}
    </span>
  );
}
