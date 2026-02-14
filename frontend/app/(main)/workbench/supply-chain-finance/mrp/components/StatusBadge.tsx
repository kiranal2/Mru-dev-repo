import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "NEW" | "MONITORING" | "COMPLETED";
}

const VARIANT_MAP = {
  NEW: "default" as const,
  MONITORING: "secondary" as const,
  COMPLETED: "outline" as const,
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={VARIANT_MAP[status]} className="text-xs">
      {status}
    </Badge>
  );
}
