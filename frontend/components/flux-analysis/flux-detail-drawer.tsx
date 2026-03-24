"use client";

import type { FluxRow } from "@/lib/data/types/flux-analysis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Clock, MessageSquare, Paperclip, Sparkles, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtPct, statusClass } from "@/app/(main)/reports/analysis/flux-analysis/helpers";
import { ACTIVITY_LOG } from "@/app/(main)/reports/analysis/flux-analysis/constants";

interface FluxDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: FluxRow | null;
  hasEvidence: boolean;
  aiAnalysis: { summary: string; headline: string; bullets: string[] } | null;
  onAddEvidence: (row: FluxRow) => void;
  onAskAi: (row: FluxRow) => void;
}

export function FluxDetailDrawer({
  open,
  onOpenChange,
  row,
  hasEvidence,
  aiAnalysis,
  onAddEvidence,
  onAskAi,
}: FluxDetailDrawerProps) {
  if (!row) return null;

  const delta = row.actual - row.base;
  const pct = row.base ? delta / row.base : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <SheetHeader className="pb-0">
            <SheetTitle className="text-lg font-bold text-slate-900">{row.name}</SheetTitle>
            <p className="text-sm text-slate-500">
              Acct {row.acct} &nbsp;|&nbsp; Owner: {row.owner}
            </p>
          </SheetHeader>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-slate-200 bg-white text-xs text-slate-700">{row.driver}</Badge>
            <Badge className={cn("border text-xs", statusClass(row.status))}>
              <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full", row.status === "Closed" ? "bg-emerald-500" : row.status === "In Review" ? "bg-amber-500" : "bg-blue-500")} />
              {row.status}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-xs", hasEvidence ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600")}
            >
              <Paperclip className="mr-1 h-3 w-3" /> {hasEvidence ? "Attached" : "Attach"}
            </Badge>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Base / Actual / Delta cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-medium text-slate-500">Base (Q2)</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{fmtMoney(row.base)}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-medium text-slate-500">Actual (Q3)</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{fmtMoney(row.actual)}</div>
            </div>
            <div className={cn("rounded-lg border p-3", delta >= 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50")}>
              <div className="text-[11px] font-medium text-slate-500">Delta</div>
              <div className={cn("mt-1 text-xl font-bold", delta >= 0 ? "text-emerald-700" : "text-red-700")}>
                {delta >= 0 ? "+" : ""}{fmtMoney(delta)}
              </div>
              <div className={cn("text-xs", delta >= 0 ? "text-emerald-600" : "text-red-600")}>
                {fmtPct(pct)}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Timeline</h4>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" /> Last changed: <strong>4d ago</strong>
              </span>
              <span>Owner assigned: <strong>4d ago</strong></span>
              <span>Created: <strong>6d ago</strong></span>
            </div>
          </div>

          {/* Evidence Files */}
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Evidence Files ({hasEvidence ? 1 : 0})
              </h4>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onAddEvidence(row)}
              >
                <Upload className="mr-1.5 h-3 w-3" /> Add Evidence
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {hasEvidence
                ? "Evidence is attached for this account. You can add more supporting documents."
                : "No files attached yet. Upload supporting documentation to improve close readiness."}
            </p>
          </div>

          {/* Recent Activity */}
          <div className="rounded-lg border border-slate-200 p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Recent Activity</h4>
            <div className="space-y-3">
              {ACTIVITY_LOG.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  <div>
                    <div className="text-xs font-semibold text-slate-700">{a.title}</div>
                    <div className="text-xs text-slate-500">{a.detail}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{a.actor} &middot; {a.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis */}
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">AI Analysis</h4>
            </div>
            {aiAnalysis ? (
              <>
                <p className="text-xs leading-5 text-slate-700">{aiAnalysis.summary}</p>
                <Badge className="mt-2 border border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
                  {aiAnalysis.headline}
                </Badge>
                <ul className="mt-3 space-y-1.5">
                  {aiAnalysis.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                      {b}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-xs text-slate-500">
                {row.name} ({row.acct}) moved {delta >= 0 ? "up" : "down"} {fmtMoney(delta)} ({fmtPct(pct)}) driven by {row.driver.toLowerCase()}. Owner {row.owner} should validate support and evidence.
              </p>
            )}
          </div>

          {/* Ask AI CTA */}
          <Button
            variant="outline"
            className="w-full justify-center gap-2 text-sm"
            onClick={() => onAskAi(row)}
          >
            <MessageSquare className="h-4 w-4" />
            Ask AI about {row.name}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
