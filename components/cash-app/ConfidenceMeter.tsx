"use client";

interface ConfidenceMeterProps {
  confidence: number | undefined;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function ConfidenceMeter({
  confidence,
  showLabel = true,
  size = "sm",
}: ConfidenceMeterProps) {
  if (confidence === undefined || confidence === null) {
    return (
      <div className="flex items-center gap-2">
        <div className={`${size === "sm" ? "w-16 h-1.5" : "w-20 h-2"} bg-slate-100 rounded-full`} />
        {showLabel && <span className="text-xs text-slate-400">-</span>}
      </div>
    );
  }

  const getColorClasses = (value: number) => {
    if (value >= 90) return { bar: "bg-emerald-500", text: "text-emerald-700" };
    if (value >= 70) return { bar: "bg-amber-500", text: "text-amber-700" };
    return { bar: "bg-red-500", text: "text-red-700" };
  };

  const colors = getColorClasses(confidence);
  const barHeight = size === "sm" ? "h-1.5" : "h-2";
  const barWidth = size === "sm" ? "w-16" : "w-20";

  return (
    <div className="flex items-center gap-2">
      <div className={`${barWidth} ${barHeight} bg-slate-100 rounded-full overflow-hidden`}>
        <div
          className={`h-full ${colors.bar} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(confidence, 100)}%` }}
        />
      </div>
      {showLabel && <span className={`text-xs font-medium ${colors.text}`}>{confidence}%</span>}
    </div>
  );
}
