"use client";

import type { AiExplanationRow } from "@/lib/data/types/flux-analysis";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { confidenceClass, fmtMoney, statusClass } from "@/app/(main)/reports/analysis/flux-analysis/helpers";

interface FluxAiExplanationsProps {
  explanations: AiExplanationRow[];
}

export function FluxAiExplanations({ explanations }: FluxAiExplanationsProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-xs font-semibold text-slate-900">AI Proposed Explanations</h3>
      </div>
      <div className="space-y-2.5">
        {explanations.map((row, i) => (
          <div key={`${row.acct}-${i}`} className="rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-800">{row.acct}</div>
                <div className="mt-0.5 text-xs text-slate-500">{row.driver}</div>
              </div>
              <div className={cn("text-sm font-bold whitespace-nowrap", row.delta >= 0 ? "text-emerald-600" : "text-red-600")}>
                {row.delta >= 0 ? "+" : ""}{fmtMoney(row.delta)}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <Badge className={cn("border text-[10px]", confidenceClass(row.conf))}>{row.conf}</Badge>
              <span className="text-[10px] text-slate-400">|</span>
              <span className="text-[10px] text-slate-600">{row.owner}</span>
              <span className="text-[10px] text-slate-400">|</span>
              <Badge className={cn("border text-[10px]", row.evidence ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500")}>
                <Paperclip className="mr-0.5 h-2.5 w-2.5" /> {row.evidence ? "Attached" : "Attach"}
              </Badge>
              <span className="text-[10px] text-slate-400">|</span>
              <Badge className={cn("border text-[10px]", statusClass(row.status))}>
                <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full", row.status === "Closed" ? "bg-emerald-500" : row.status === "In Review" ? "bg-amber-500" : "bg-blue-500")} />
                {row.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
