import { SUPPLIER_ACTION_COLOR_MAP } from "../constants";

interface SupplierActionBadgeProps {
  action: string | null;
}

export function SupplierActionBadge({ action }: SupplierActionBadgeProps) {
  if (!action) return <span className="text-slate-400">-</span>;

  const normalizedAction = action.toUpperCase();

  const colors = SUPPLIER_ACTION_COLOR_MAP[normalizedAction] || {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded border text-[11px] font-medium whitespace-nowrap ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {action}
    </span>
  );
}
