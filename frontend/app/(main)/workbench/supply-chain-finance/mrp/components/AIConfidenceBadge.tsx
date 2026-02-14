import { Badge } from "@/components/ui/badge";

interface AIConfidenceBadgeProps {
  confidence: number | null;
  autoResolved: boolean;
}

export function AIConfidenceBadge({ confidence, autoResolved }: AIConfidenceBadgeProps) {
  if (confidence === null) {
    return <span className="text-slate-500 text-sm">-</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <Badge variant="outline" className="text-xs">
        {confidence}%
      </Badge>
      {autoResolved && (
        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500 rounded">
          AI Auto-Resolved
        </span>
      )}
    </div>
  );
}
