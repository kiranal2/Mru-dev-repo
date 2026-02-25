"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock3,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileText,
  MessageSquare,
  History,
  Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalDetailSheetProps {
  signal: any;
  open: boolean;
  onClose: () => void;
}

const SEVERITY_BADGES: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700 border-red-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  LOW: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const STATUS_BADGES: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700 border-blue-200",
  MONITORING: "bg-amber-100 text-amber-700 border-amber-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function fmtDate(d: string | null | undefined) {
  if (!d) return "-";
  try {
    return format(new Date(d), "MMM dd, yyyy");
  } catch {
    return d;
  }
}

function daysBetween(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return null;
  try {
    const diff = new Date(b).getTime() - new Date(a).getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

export function SignalDetailSheet({ signal, open, onClose }: SignalDetailSheetProps) {
  const [counterDate, setCounterDate] = useState("");

  if (!signal) return null;

  const po = signal.po_line;
  const sup = signal.supplier;
  const severity = (signal.severity || "MEDIUM").toUpperCase();
  const status = signal.status || "NEW";
  const deltaDays = daysBetween(po.mrp_required_date, po.po_promise_date);
  const isLate = deltaDays !== null && deltaDays > 0;
  const aiConf = signal.ai_confidence != null ? Math.round(signal.ai_confidence * 100) : null;

  // Mock timeline events
  const timeline = [
    { type: "created", message: `Signal detected: ${signal.label}`, date: signal.created_at },
    { type: "ai", message: `AI classified as ${severity} severity with ${aiConf ?? "N/A"}% confidence`, date: signal.created_at },
    ...(signal.status === "MONITORING" ? [{ type: "status", message: "Status changed to MONITORING", date: signal.updated_at }] : []),
    ...(signal.status === "COMPLETED" ? [
      { type: "status", message: "Status changed to MONITORING", date: signal.created_at },
      { type: "resolved", message: "Signal resolved — commitment confirmed", date: signal.resolved_at || signal.updated_at },
    ] : []),
  ];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[720px] sm:max-w-[720px] p-0 flex flex-col">
        {/* Dark gradient header — IGRS style */}
        <SheetHeader className="px-6 pt-5 pb-4 border-b bg-gradient-to-r from-slate-800 to-slate-700 text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-base text-white font-bold tracking-tight">
                {po.po_number} · {sup?.supplier_name || "Unknown Supplier"}
              </SheetTitle>
              <p className="text-xs text-slate-300 mt-1">
                {po.item || "N/A"} — {po.item_description || "No description"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2.5 py-1 rounded text-xs font-bold border ${SEVERITY_BADGES[severity]}`}>
                {severity}
              </span>
              <span className={`px-2.5 py-1 rounded text-xs font-bold border ${STATUS_BADGES[status]}`}>
                {status}
              </span>
              {aiConf !== null && (
                <span className="px-2.5 py-1 rounded text-xs font-semibold bg-white/10 text-white border border-white/20">
                  {aiConf}% conf.
                </span>
              )}
            </div>
          </div>

          {/* Delta indicator */}
          {deltaDays !== null && (
            <div className={cn(
              "mt-3 flex items-center gap-2 px-3 py-1.5 rounded text-xs",
              isLate ? "bg-red-500/20 text-red-200" : "bg-emerald-500/20 text-emerald-200"
            )}>
              <Clock3 className="w-3.5 h-3.5" />
              <span>
                PO Promise is {Math.abs(deltaDays)}d {isLate ? "after" : "before"} MRP Required
              </span>
              <span className="ml-auto font-bold">
                {isLate ? "AT RISK" : "ON TRACK"}
              </span>
            </div>
          )}

          {/* Quick actions */}
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Accept
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowRight className="w-3.5 h-3.5 mr-1" /> Counter Date
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Truck className="w-3.5 h-3.5 mr-1" /> Tracking
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Escalate
            </Button>
          </div>
        </SheetHeader>

        {/* Tabbed content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="summary" className="w-full">
            <div className="sticky top-0 z-10 bg-white border-b px-6 pt-3">
              <TabsList className="w-full justify-start overflow-x-auto h-9 gap-0 bg-slate-100 p-0.5 rounded-lg">
                <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
                <TabsTrigger value="po-details" className="text-xs">PO Details</TabsTrigger>
                <TabsTrigger value="ai-analysis" className="text-xs">AI Analysis</TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
                <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
              </TabsList>
            </div>

            {/* SUMMARY TAB */}
            <TabsContent value="summary" className="px-6 py-4 space-y-4">
              {/* Key metrics cards */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-3 bg-blue-50 border-blue-200">
                  <p className="text-xs text-blue-700">MRP Required</p>
                  <p className="text-lg font-bold text-blue-900">{fmtDate(po.mrp_required_date)}</p>
                </Card>
                <Card className="p-3 bg-amber-50 border-amber-200">
                  <p className="text-xs text-amber-700">PO Promise</p>
                  <p className="text-lg font-bold text-amber-900">{fmtDate(po.po_promise_date)}</p>
                </Card>
                <Card className={cn("p-3", isLate ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200")}>
                  <p className={cn("text-xs", isLate ? "text-red-700" : "text-emerald-700")}>Delta</p>
                  <p className={cn("text-lg font-bold", isLate ? "text-red-900" : "text-emerald-900")}>
                    {deltaDays !== null ? `${deltaDays > 0 ? "+" : ""}${deltaDays}d` : "-"}
                  </p>
                </Card>
              </div>

              {/* Exception detail */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Exception Detail</h4>
                <Card className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">{signal.label}</span>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs text-blue-600 font-medium">AI-Generated</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{signal.rationale || "No rationale provided."}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Score: <span className="font-semibold text-slate-700">{signal.score ?? "-"}</span></span>
                    <span>Recommended: <span className="font-semibold text-slate-700">{signal.recommendation || signal.recommended || "-"}</span></span>
                  </div>
                </Card>
              </div>

              {/* Supplier info */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Supplier</h4>
                <Card className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <DetailItem label="Supplier" value={sup?.supplier_name || "-"} />
                    <DetailItem label="Code" value={sup?.code || "-"} />
                    <DetailItem label="Country" value={sup?.country || "-"} />
                    <DetailItem label="Rating" value={sup?.rating ? `${sup.rating} / 5` : "-"} />
                    <DetailItem label="Supplier Action" value={po.supplier_action || "-"} />
                    <DetailItem label="Supplier Commit" value={fmtDate(po.supplier_commit)} />
                  </div>
                </Card>
              </div>

              {/* What-if counter */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">What-If Counter</h4>
                <Card className="p-4">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 mb-1 block">Counter Date</label>
                      <input
                        type="date"
                        value={counterDate}
                        onChange={(e) => setCounterDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <Button variant="outline" size="sm" className="h-9">
                      Preview
                    </Button>
                  </div>
                  {counterDate && po.mrp_required_date && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-md text-xs text-blue-700">
                      Counter date is{" "}
                      <strong>{daysBetween(po.mrp_required_date, counterDate)}d</strong>{" "}
                      from MRP Required Date
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* PO DETAILS TAB */}
            <TabsContent value="po-details" className="px-6 py-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Purchase Order</h4>
                <Card className="p-4">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                    <DetailItem label="PO Number" value={po.po_number} />
                    <DetailItem label="PO Date" value={fmtDate(po.po_date)} />
                    <DetailItem label="Item" value={po.item || "-"} />
                    <DetailItem label="Item Description" value={po.item_description || "-"} />
                    <DetailItem label="Quantity" value={po.need_qty ? `${po.need_qty} ${po.uom || "EA"}` : "-"} />
                    <DetailItem label="Org Code" value={po.org_code || "-"} />
                    <DetailItem label="MRP Required" value={fmtDate(po.mrp_required_date)} />
                    <DetailItem label="PO Promise" value={fmtDate(po.po_promise_date)} />
                    <DetailItem label="Commit Date" value={fmtDate(po.commit_date)} />
                    <DetailItem label="Lead Date" value={fmtDate(po.lead_date)} />
                    <DetailItem label="Delta vs MRP" value={po.delta_mrp || "-"} />
                    <DetailItem label="Quarter End" value={fmtDate(po.quarter_end)} />
                  </div>
                </Card>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Supplier Details</h4>
                <Card className="p-4">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                    <DetailItem label="Supplier Name" value={sup?.supplier_name || "-"} />
                    <DetailItem label="Supplier ID" value={sup?.supplier_id || "-"} />
                    <DetailItem label="Code" value={sup?.code || "-"} />
                    <DetailItem label="Country" value={sup?.country || "-"} />
                    <DetailItem label="Rating" value={sup?.rating ? `${sup.rating} / 5` : "-"} />
                    <DetailItem label="Supplier Action" value={po.supplier_action || "-"} />
                    <DetailItem label="Supplier Commit" value={fmtDate(po.supplier_commit)} />
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* AI ANALYSIS TAB */}
            <TabsContent value="ai-analysis" className="px-6 py-4 space-y-4">
              <Card className="p-4 border-blue-200 bg-blue-50/30">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-slate-900">AI Exception Analysis</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500">Exception Type</span>
                    <p className="text-sm font-medium text-slate-900">{signal.label}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Signal Type</span>
                    <p className="text-sm font-medium text-slate-900">{signal.type}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">AI Rationale</span>
                    <p className="text-sm text-slate-700">{signal.rationale || "The AI model detected a scheduling discrepancy between the MRP required date and the supplier's committed delivery date."}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-white rounded-md border">
                      <p className="text-xs text-slate-500">Confidence</p>
                      <p className="text-lg font-bold text-blue-700">{aiConf ?? "-"}%</p>
                    </div>
                    <div className="p-3 bg-white rounded-md border">
                      <p className="text-xs text-slate-500">Risk Score</p>
                      <p className="text-lg font-bold text-slate-900">{signal.score ?? "-"}</p>
                    </div>
                    <div className="p-3 bg-white rounded-md border">
                      <p className="text-xs text-slate-500">Recommendation</p>
                      <p className="text-sm font-bold text-slate-900">{signal.recommendation || signal.recommended || "-"}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {signal.type === "SIG_PULL_IN" || signal.type === "SIG_PUSH_OUT" ? (
                <Card className="p-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Scheduling Impact</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">MRP Required Date</span>
                      <span className="font-medium">{fmtDate(po.mrp_required_date)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Supplier Promise</span>
                      <span className="font-medium">{fmtDate(po.po_promise_date)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm border-t pt-2 mt-2">
                      <span className="text-slate-600 font-medium">Scheduling Gap</span>
                      <span className={cn("font-bold", isLate ? "text-red-600" : "text-emerald-600")}>
                        {deltaDays !== null ? `${Math.abs(deltaDays)} days ${isLate ? "late" : "early"}` : "-"}
                      </span>
                    </div>
                  </div>
                </Card>
              ) : null}
            </TabsContent>

            {/* TIMELINE TAB */}
            <TabsContent value="timeline" className="px-6 py-4">
              <div className="space-y-0">
                {timeline.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full mt-1.5",
                        item.type === "resolved" ? "bg-emerald-500" :
                        item.type === "ai" ? "bg-blue-500" :
                        item.type === "status" ? "bg-amber-500" :
                        "bg-slate-400"
                      )} />
                      {idx < timeline.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-200 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-5">
                      <p className="text-sm text-slate-700">{item.message}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.date ? fmtDate(item.date) : "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* NOTES TAB */}
            <TabsContent value="notes" className="px-6 py-4">
              <div className="text-center py-12 text-slate-400">
                <MessageSquare className="h-10 w-10 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-500">No notes yet</p>
                <p className="text-xs text-slate-400 mt-1">Notes and comments will appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
