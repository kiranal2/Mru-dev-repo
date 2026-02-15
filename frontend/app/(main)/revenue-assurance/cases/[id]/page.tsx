"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRevenueCase, useRevenueCaseMutation } from "@/hooks/data";
import { formatUSD } from "@/lib/data/utils/format-currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  AlertTriangle,
  DollarSign,
  FileText,
  User,
  Clock,
  Brain,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const RISK_BADGE: Record<string, string> = {
  Critical: "bg-red-700 text-white",
  High: "bg-red-600 text-white",
  Medium: "bg-amber-500 text-white",
  Low: "bg-emerald-600 text-white",
};

const STATUS_BADGE: Record<string, string> = {
  Open: "bg-blue-600 text-white",
  Investigating: "bg-amber-500 text-white",
  Confirmed: "bg-orange-600 text-white",
  Recovered: "bg-emerald-600 text-white",
  Closed: "bg-slate-500 text-white",
  "False Positive": "bg-slate-400 text-white",
};

const CATEGORY_COLORS: Record<string, string> = {
  Pricing: "bg-red-100 text-red-800 border-red-300",
  Billing: "bg-orange-100 text-orange-800 border-orange-300",
  Contract: "bg-blue-100 text-blue-800 border-blue-300",
  Discount: "bg-purple-100 text-purple-800 border-purple-300",
  Subscription: "bg-cyan-100 text-cyan-800 border-cyan-300",
  Commission: "bg-pink-100 text-pink-800 border-pink-300",
  Recognition: "bg-amber-100 text-amber-800 border-amber-300",
};

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      <div className="h-32 bg-slate-200 rounded-lg animate-pulse" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-48 bg-slate-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="p-6">
      <Card className="p-6 text-center border-red-200 bg-red-50">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h2 className="text-lg font-semibold text-red-800">Error Loading Case</h2>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </Card>
    </div>
  );
}

export default function RevenueAssuranceCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: caseData, loading, error, refetch } = useRevenueCase(id);
  const { update, loading: updating } = useRevenueCaseMutation();
  const [newNote, setNewNote] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("");

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!caseData) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-900">Case Not Found</h2>
          <p className="text-sm text-slate-500 mt-1">The requested case could not be found.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/revenue-assurance/cases")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cases
          </Button>
        </Card>
      </div>
    );
  }

  const handleStatusUpdate = async () => {
    if (!statusUpdate) return;
    try {
      await update(id, { status: statusUpdate as any });
      toast.success(`Status updated to ${statusUpdate}`);
      setStatusUpdate("");
      refetch();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const updatedNotes = [
        ...(caseData.notes || []),
        {
          id: `note-${Date.now()}`,
          author: "Current User",
          createdAt: new Date().toISOString(),
          note: newNote.trim(),
        },
      ];
      await update(id, { notes: updatedNotes } as any);
      toast.success("Note added");
      setNewNote("");
      refetch();
    } catch {
      toast.error("Failed to add note");
    }
  };

  const recoveryPct =
    caseData.leakageAmountUsd > 0
      ? Math.round((caseData.recoveredAmountUsd / caseData.leakageAmountUsd) * 100)
      : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Back + Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 text-slate-500"
          onClick={() => router.push("/revenue-assurance/cases")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Cases
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">{caseData.caseNumber}</h1>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold ${STATUS_BADGE[caseData.status] || "bg-slate-500 text-white"}`}
              >
                {caseData.status}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold ${RISK_BADGE[caseData.riskLevel]}`}
              >
                {caseData.riskLevel}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${CATEGORY_COLORS[caseData.category] || "bg-slate-100 text-slate-700 border-slate-300"}`}
              >
                {caseData.category}
              </span>
            </div>
            <h2 className="text-lg text-slate-700 mt-1">{caseData.title}</h2>
            <p className="text-sm text-slate-500 mt-1">{caseData.description}</p>
          </div>
        </div>
      </div>

      {/* Amount Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="p-4 border-red-200 bg-red-50/40">
          <p className="text-[11px] font-medium text-red-600">Estimated Leakage</p>
          <p className="text-xl font-bold text-red-700">{formatUSD(caseData.leakageAmountUsd)}</p>
        </Card>
        <Card className="p-4 border-emerald-200 bg-emerald-50/40">
          <p className="text-[11px] font-medium text-emerald-600">Recovered</p>
          <p className="text-xl font-bold text-emerald-700">{formatUSD(caseData.recoveredAmountUsd)}</p>
        </Card>
        <Card className="p-4 border-blue-200 bg-blue-50/40">
          <p className="text-[11px] font-medium text-blue-600">Recovery Rate</p>
          <p className="text-xl font-bold text-blue-700">{recoveryPct}%</p>
          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${Math.min(recoveryPct, 100)}%` }}
            />
          </div>
        </Card>
        <Card className="p-4 border-slate-200 bg-slate-50/40">
          <p className="text-[11px] font-medium text-slate-500">Risk Score</p>
          <p className="text-xl font-bold text-slate-700">{caseData.riskScore}/100</p>
          {caseData.recurrenceFlag && (
            <span className="text-[10px] text-amber-600 font-semibold mt-1 inline-block">
              Recurring Pattern
            </span>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Customer & Contract Info */}
        <Card className="p-4">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              Customer & Contract Info
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-slate-500">Customer</p>
                <p className="font-semibold text-slate-900">{caseData.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tier</p>
                <p className="font-medium text-slate-700">{caseData.customerTier}</p>
              </div>
              {caseData.contractName && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-500">Contract</p>
                  <p className="font-medium text-slate-700">{caseData.contractName}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500">Assigned To</p>
                <p className="font-medium text-slate-700">
                  {caseData.assignedTo || "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Team</p>
                <p className="font-medium text-slate-700">{caseData.assignedTeam}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Detected</p>
                <p className="font-medium text-slate-700">
                  {new Date(caseData.detectedAt).toLocaleDateString()}
                </p>
              </div>
              {caseData.resolvedAt && (
                <div>
                  <p className="text-xs text-slate-500">Resolved</p>
                  <p className="font-medium text-slate-700">
                    {new Date(caseData.resolvedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Related Invoices */}
        <Card className="p-4">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              Related Invoices & Products
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Invoices ({caseData.relatedInvoices.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {caseData.relatedInvoices.length > 0 ? (
                  caseData.relatedInvoices.map((inv) => (
                    <span
                      key={inv}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {inv}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No related invoices</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Products ({caseData.relatedProducts.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {caseData.relatedProducts.length > 0 ? (
                  caseData.relatedProducts.map((prod) => (
                    <span
                      key={prod}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {prod}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No related products</span>
                )}
              </div>
            </div>
            {caseData.tags.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {caseData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Root Cause */}
        <Card className="p-4">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Root Cause Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {caseData.rootCause ? (
              <p className="text-sm text-slate-700 leading-relaxed">{caseData.rootCause}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Root cause not yet determined.</p>
            )}
          </CardContent>
        </Card>

        {/* AI Explanation */}
        <Card className="p-4 border-blue-200 bg-blue-50/30">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-sm font-bold text-blue-800 flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600" />
              AI Explanation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {caseData.aiExplanation ? (
              <p className="text-sm text-blue-800 leading-relaxed">{caseData.aiExplanation}</p>
            ) : (
              <p className="text-sm text-blue-400 italic">No AI explanation available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recovery Tracking */}
      <Card className="p-4">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            Recovery Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Leakage Amount</p>
              <p className="text-lg font-bold text-red-700">{formatUSD(caseData.leakageAmountUsd)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Recovered Amount</p>
              <p className="text-lg font-bold text-emerald-700">{formatUSD(caseData.recoveredAmountUsd)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Outstanding</p>
              <p className="text-lg font-bold text-amber-700">
                {formatUSD(caseData.leakageAmountUsd - caseData.recoveredAmountUsd)}
              </p>
            </div>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(recoveryPct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1 text-right">{recoveryPct}% recovered</p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Update Status */}
        <Card className="p-4">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-500" />
              Update Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center gap-2">
              <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select new status..." />
                </SelectTrigger>
                <SelectContent>
                  {["Open", "Investigating", "Confirmed", "Recovered", "Closed", "False Positive"].map(
                    (s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <Button onClick={handleStatusUpdate} disabled={!statusUpdate || updating}>
                Update
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add Note */}
        <Card className="p-4">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              Add Note
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-start gap-2">
              <textarea
                className="flex-1 border border-slate-200 rounded-md p-2 text-sm resize-none"
                rows={2}
                placeholder="Add a note to this case..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <Button onClick={handleAddNote} disabled={!newNote.trim() || updating}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes History */}
      {caseData.notes && caseData.notes.length > 0 && (
        <Card className="p-4">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">
              Notes ({caseData.notes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-2">
            {caseData.notes.map((note) => (
              <div key={note.id} className="border border-slate-100 rounded-md p-3 bg-slate-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700">{note.author}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{note.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Activity Log */}
      {caseData.activityLog && caseData.activityLog.length > 0 && (
        <Card className="p-4">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2">
              {caseData.activityLog.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 text-sm border-l-2 border-slate-200 pl-3 py-1"
                >
                  <div className="flex-1">
                    <span className="font-semibold text-slate-700">{entry.actor}</span>
                    <span className="text-slate-500 mx-1.5">{entry.action}</span>
                    <span className="text-slate-600">{entry.detail}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(entry.ts).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
