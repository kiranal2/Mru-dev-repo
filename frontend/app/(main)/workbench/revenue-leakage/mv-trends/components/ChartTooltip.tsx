"use client";

import type { TooltipState } from "../types";

export function ChartTooltip({ tooltip }: { tooltip: TooltipState | null }) {
  if (!tooltip) return null;
  return (
    <div
      className="absolute z-50 pointer-events-none px-2.5 py-1.5 rounded-md bg-slate-800 text-white text-xs shadow-lg whitespace-pre-line leading-relaxed"
      style={{
        left: tooltip.x,
        top: tooltip.y,
        transform: "translate(-50%, -100%) translateY(-8px)",
      }}
    >
      {tooltip.content}
    </div>
  );
}
