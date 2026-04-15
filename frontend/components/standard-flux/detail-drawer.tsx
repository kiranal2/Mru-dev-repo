"use client";

import { useState, useEffect } from "react";
import type { FluxRow, CommentaryStatus } from "@/lib/data/types/flux-analysis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Clock, FileText, MessageSquare, Paperclip, Save, Sparkles, Upload, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtPct, statusClass, expectednessClass, commentaryStatusClass } from "@/app/(main)/reports/analysis/flux-analysis/helpers";
import { ACTIVITY_LOG } from "@/app/(main)/reports/analysis/flux-analysis/constants";
import { toast } from "sonner";

interface StandardFluxDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: FluxRow | null;
  hasEvidence: boolean;
  aiAnalysis: { summary: string; headline: string; bullets: string[] } | null;
  onAddEvidence: (row: FluxRow) => void;
  onAskAi: (row: FluxRow) => void;
  ownerOptions: string[];
  onUpdateOwner: (rowId: string, owner: string) => void;
  onUpdateStatus: (rowId: string, status: string) => void;
  // Commentary props
  commentaryIsGenerating?: boolean;
  commentaryThinkingSteps?: string[];
  onGenerateCommentary?: (row: FluxRow) => void;
  onUpdateCommentary?: (rowId: string, text: string) => void;
  onSubmitCommentary?: (rowId: string) => void;
  onApproveCommentary?: (rowId: string, approverName: string) => void;
}

export function StandardFluxDrawer({
  open,
  onOpenChange,
  row,
  hasEvidence,
  aiAnalysis,
  onAddEvidence,
  onAskAi,
  ownerOptions,
  onUpdateOwner,
  onUpdateStatus,
  commentaryIsGenerating = false,
  commentaryThinkingSteps = [],
  onGenerateCommentary,
  onUpdateCommentary,
  onSubmitCommentary,
  onApproveCommentary,
}: StandardFluxDrawerProps) {
  const [localOwner, setLocalOwner] = useState("");
  const [localStatus, setLocalStatus] = useState("");
  const [localCommentary, setLocalCommentary] = useState("");

  // Sync local state when row changes
  useEffect(() => {
    if (row) {
      setLocalOwner(row.owner);
      setLocalStatus(row.status);
      setLocalCommentary(row.commentary || "");
    }
  }, [row]);

  // Sync commentary when AI generates it
  useEffect(() => {
    if (row?.commentary) {
      setLocalCommentary(row.commentary);
    }
  }, [row?.commentary]);

  if (!row) return null;

  const delta = row.actual - row.base;
  const pct = row.base ? delta / row.base : 0;
  const cmtStatus: CommentaryStatus = row.commentaryStatus || "none";
  const exp = row.expectedness || "Expected";

  const handleSaveWorkflow = () => {
    if (localOwner !== row.owner) {
      onUpdateOwner(row.id, localOwner);
    }
    if (localStatus !== row.status) {
      onUpdateStatus(row.id, localStatus);
    }
    if (localOwner === row.owner && localStatus === row.status) {
      toast.info("No changes to save");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg p-0">
        {/* Header */}
        <div className="border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-4 sm:py-5">
          <SheetHeader className="pb-0">
            <SheetTitle className="text-lg font-bold text-slate-900">{row.name}</SheetTitle>
            <p className="text-sm text-slate-500">
              Acct {row.acct} &nbsp;|&nbsp; {row.currentPeriod} {row.periodType}
            </p>
          </SheetHeader>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-slate-200 bg-white text-xs text-slate-700">{row.driver}</Badge>
            <Badge className={cn("border text-xs", statusClass(row.status))}>
              <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full", row.status === "Closed" ? "bg-emerald-500" : row.status === "In Review" ? "bg-amber-500" : "bg-blue-500")} />
              {row.status}
            </Badge>
            <Badge className={cn("border text-xs", expectednessClass(exp))}>
              {exp}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-xs", hasEvidence ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}
            >
              <Paperclip className="mr-1 h-3 w-3" /> {hasEvidence ? "Evidence Attached" : "No Evidence"}
            </Badge>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-5">
          {/* Section 1: Variance Summary */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">1</span>
              Variance Summary
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-medium text-slate-500">Base ({row.priorPeriod})</div>
                <div className="mt-1 text-xl font-bold text-slate-900">{fmtMoney(row.base)}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-medium text-slate-500">Actual ({row.currentPeriod})</div>
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
          </div>

          {/* Section 2: Commentary Composer (FLAGSHIP) */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>
              <FileText className="h-3.5 w-3.5 text-primary" />
              Commentary
              {cmtStatus !== "none" && (
                <Badge className={cn("ml-auto border text-[10px]", commentaryStatusClass(cmtStatus))}>
                  {cmtStatus === "draft" ? "Draft" : cmtStatus === "submitted" ? "Submitted" : cmtStatus === "approved" ? `Approved${row.approvedBy ? ` · ${row.approvedBy}` : ""}` : "—"}
                </Badge>
              )}
            </h4>
            <div className="rounded-lg border border-slate-200 p-4 space-y-3">
              {/* AI Generate button */}
              {cmtStatus === "none" && !commentaryIsGenerating && (
                <div className="flex flex-col items-center py-4 text-center">
                  <div className="mb-2 rounded-full bg-primary/10 p-2.5">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs text-slate-500 mb-3">No commentary yet. Let AI draft it for you.</p>
                  <Button
                    size="sm"
                    className="gap-2 bg-primary text-xs text-white hover:bg-primary/90"
                    onClick={() => onGenerateCommentary?.(row)}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate AI Draft
                  </Button>
                </div>
              )}

              {/* Thinking animation */}
              {commentaryIsGenerating && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">AI is composing commentary</p>
                  {commentaryThinkingSteps.map((step, idx) => {
                    const isLatest = idx === commentaryThinkingSteps.length - 1;
                    return (
                      <div key={`${step}-${idx}`} className={cn("text-xs", isLatest ? "font-medium text-slate-700" : "text-slate-500")}>
                        {step}
                        {isLatest && (
                          <span className="ml-1.5 inline-flex items-center gap-1 align-middle">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: "0.2s" }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: "0.4s" }} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Commentary textarea (visible when draft/submitted/approved) */}
              {cmtStatus !== "none" && !commentaryIsGenerating && (
                <>
                  <Textarea
                    value={localCommentary}
                    onChange={(e) => {
                      setLocalCommentary(e.target.value);
                      onUpdateCommentary?.(row.id, e.target.value);
                    }}
                    disabled={cmtStatus === "approved"}
                    className="min-h-[160px] resize-none text-xs leading-5 border-slate-200"
                    placeholder="Write or edit commentary..."
                  />

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {cmtStatus === "draft" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => onGenerateCommentary?.(row)}
                        >
                          <Sparkles className="h-3 w-3" />
                          Regenerate
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5 bg-primary text-xs text-white hover:bg-primary/90 ml-auto"
                          onClick={() => onSubmitCommentary?.(row.id)}
                        >
                          Submit for Review
                        </Button>
                      </>
                    )}
                    {cmtStatus === "submitted" && (
                      <>
                        <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Pending controller review
                        </span>
                        <Button
                          size="sm"
                          className="gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700 ml-auto"
                          onClick={() => onApproveCommentary?.(row.id, "S. Chen")}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Approve
                        </Button>
                      </>
                    )}
                    {cmtStatus === "approved" && (
                      <div className="flex items-center gap-2 text-xs text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Approved by {row.approvedBy}{row.approvedAt ? ` · ${new Date(row.approvedAt).toLocaleDateString()}` : ""}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 3: AI Explanation */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">3</span>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI Explanation
            </h4>
            <div className="rounded-lg border border-slate-200 p-4">
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
                  {row.name} ({row.acct}) moved {delta >= 0 ? "up" : "down"} {fmtMoney(Math.abs(delta))} ({fmtPct(pct)}) driven by {row.driver.toLowerCase()}. Owner {row.owner} should validate support and evidence.
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full justify-center gap-2 text-xs"
                onClick={() => onAskAi(row)}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Ask AI for deeper analysis
              </Button>
            </div>
          </div>

          {/* Section 4: Owner + Status Workflow */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">4</span>
              <UserCircle className="h-3.5 w-3.5 text-slate-500" />
              Owner &amp; Status
            </h4>
            <div className="rounded-lg border border-slate-200 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-600">Owner</label>
                  <Select value={localOwner} onValueChange={setLocalOwner}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Assign owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {ownerOptions.map((owner) => (
                        <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-600">Status</label>
                  <Select value={localStatus} onValueChange={setLocalStatus}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Review">In Review</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                size="sm"
                className="h-8 w-full gap-2 bg-primary text-xs text-white hover:bg-primary/90"
                onClick={handleSaveWorkflow}
              >
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Section 5: Evidence */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">5</span>
              Evidence
            </h4>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  {hasEvidence ? "1 file attached" : "No files attached"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onAddEvidence(row)}
                >
                  <Upload className="mr-1.5 h-3 w-3" /> {hasEvidence ? "Add More" : "Add Evidence"}
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                {hasEvidence
                  ? "Evidence is attached. You can add more supporting documents."
                  : "Upload supporting documentation to improve close readiness."}
              </p>
            </div>
          </div>

          {/* Section 6: Activity */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">6</span>
              Activity
            </h4>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-600 mb-3 pb-3 border-b border-slate-100">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" /> Last changed: <strong>4d ago</strong>
                </span>
                <span>Owner assigned: <strong>4d ago</strong></span>
                <span>Created: <strong>6d ago</strong></span>
              </div>
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
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
