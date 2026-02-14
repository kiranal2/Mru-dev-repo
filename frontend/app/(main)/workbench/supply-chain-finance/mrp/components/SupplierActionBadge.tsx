import { SUPPLIER_ACTION_COLOR_MAP } from "../constants";

interface SupplierActionBadgeProps {
  action: string | null;
}

export function SupplierActionBadge({ action }: SupplierActionBadgeProps) {
  if (!action) return <span className="text-slate-500">-</span>;

  const normalizedAction = action.toUpperCase();

  const colors = SUPPLIER_ACTION_COLOR_MAP[normalizedAction] || {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {action}
    </span>
  );
}
