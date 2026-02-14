"use client";

import { LeakageCase, RuleHit, ReceiptEvidence, MarketValueEvidence, ExemptionEvidence } from "@/lib/revenue-leakage/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency, payableLabels, riskScoreColor } from "./constants";

interface CaseDrawerSummaryTabProps {
  caseItem: LeakageCase;
  editing: boolean;
  editDraft: Partial<LeakageCase>;
  setEditDraft: React.Dispatch<React.SetStateAction<Partial<LeakageCase>>>;
  paidTotal: number;
  gap: number;
  receiptsIncluded: ReceiptEvidence[];
  mvEvidence: MarketValueEvidence;
  exemptionEvidence: ExemptionEvidence;
}

export function CaseDrawerSummaryTab({
  caseItem,
  editing,
  editDraft,
  setEditDraft,
  paidTotal,
  gap,
  receiptsIncluded,
  mvEvidence,
  exemptionEvidence,
}: CaseDrawerSummaryTabProps) {
  const topRuleHits = caseItem.evidence.triggered_rules.slice(0, 3);
  const suggestedActions = caseItem.suggested_actions;

  const completenessChecklist = [
    { label: "Schedule present", ok: !!caseItem.property_summary },
    { label: "Parties present", ok: caseItem.parties_summary.length > 0 },
    { label: "Receipts linked", ok: receiptsIncluded.length > 0 },
    { label: "Prohibited check complete", ok: true },
    { label: "MV evidence available", ok: mvEvidence.status === "Available" },
    { label: "Exemption check complete", ok: exemptionEvidence.status !== "Placeholder" },
  ];

  return (
    <TabsContent value="summary" className="px-6 py-4 space-y-4">
      {/* Payable Breakdown */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
          Payable Breakdown
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(caseItem.payable_breakdown).map(([key, value]) => (
            <Card key={key} className="p-3 bg-slate-50 border-slate-200">
              <p className="text-[11px] font-medium text-slate-500">
                {payableLabels[key] || key}
              </p>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {formatCurrency(value)}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Paid / Gap / Risk Score */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-[11px] font-medium text-blue-600">Paid Total</p>
          {editing ? (
            <Input
              type="number"
              className="mt-1 h-8 text-sm"
              value={editDraft.paid_total_inr ?? ""}
              onChange={(e) =>
                setEditDraft((d) => ({ ...d, paid_total_inr: Number(e.target.value) }))
              }
            />
          ) : (
            <p className="text-lg font-bold text-blue-900 mt-0.5">
              {formatCurrency(paidTotal)}
            </p>
          )}
        </Card>
        <Card
          className={`p-3 ${gap > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}
        >
          <p
            className={`text-[11px] font-medium ${gap > 0 ? "text-red-600" : "text-emerald-600"}`}
          >
            Gap
          </p>
          {editing ? (
            <Input
              type="number"
              className="mt-1 h-8 text-sm"
              value={editDraft.gap_inr ?? ""}
              onChange={(e) =>
                setEditDraft((d) => ({ ...d, gap_inr: Number(e.target.value) }))
              }
            />
          ) : (
            <p
              className={`text-lg font-bold mt-0.5 ${gap > 0 ? "text-red-700" : "text-emerald-700"}`}
            >
              {formatCurrency(gap)}
            </p>
          )}
        </Card>
        <Card className="p-3 bg-slate-50 border-slate-200">
          <p className="text-[11px] font-medium text-slate-500">Risk Score</p>
          {editing ? (
            <Input
              type="number"
              min={0}
              max={100}
              className="mt-1 h-8 text-sm"
              value={editDraft.risk_score ?? ""}
              onChange={(e) =>
                setEditDraft((d) => ({ ...d, risk_score: Number(e.target.value) }))
              }
            />
          ) : (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${riskScoreColor(caseItem.risk_score)}`}
                  style={{ width: `${caseItem.risk_score}%` }}
                />
              </div>
              <span className="text-sm font-bold text-slate-800">
                {caseItem.risk_score}
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Editable override fields (visible in edit mode) */}
      {editing && (
        <Card className="p-4 border-blue-200 bg-blue-50/30">
          <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">
            Override Fields
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600">Risk Level</label>
              <Select
                value={editDraft.risk_level || caseItem.risk_level}
                onValueChange={(v) =>
                  setEditDraft((d) => ({
                    ...d,
                    risk_level: v as LeakageCase["risk_level"],
                  }))
                }
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600">
                Confidence (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                className="mt-1 h-8 text-xs"
                value={editDraft.confidence ?? ""}
                onChange={(e) =>
                  setEditDraft((d) => ({ ...d, confidence: Number(e.target.value) }))
                }
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600">
                Impact Amount (INR)
              </label>
              <Input
                type="number"
                className="mt-1 h-8 text-xs"
                value={editDraft.impact_amount_inr ?? ""}
                onChange={(e) =>
                  setEditDraft((d) => ({ ...d, impact_amount_inr: Number(e.target.value) }))
                }
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600">
                Payable Total (INR)
              </label>
              <Input
                type="number"
                className="mt-1 h-8 text-xs"
                value={editDraft.payable_total_inr ?? ""}
                onChange={(e) =>
                  setEditDraft((d) => ({ ...d, payable_total_inr: Number(e.target.value) }))
                }
              />
            </div>
          </div>
        </Card>
      )}

      {/* Suggested Actions */}
      {suggestedActions && (
        <Card className="p-4 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <Lightbulb className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-sm font-bold text-blue-900">Suggested Next Steps</p>
          </div>
          <p className="text-sm text-blue-800 mb-2">{suggestedActions.likely_cause}</p>
          <ul className="space-y-1.5">
            {suggestedActions.recommended_checks.map((check, idx) => (
              <li key={idx} className="text-xs text-blue-700 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-500" />
                {check}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Why Flagged */}
      <Card className="p-4 border-amber-200 bg-amber-50/50">
        <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Why Flagged
        </h4>
        <ul className="space-y-3">
          {topRuleHits.map((rule) => (
            <li key={rule.rule_id} className="flex items-start gap-2.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  rule.severity === "High"
                    ? "bg-red-100"
                    : rule.severity === "Medium"
                      ? "bg-amber-100"
                      : "bg-emerald-100"
                }`}
              >
                <AlertTriangle
                  className={`w-3 h-3 ${
                    rule.severity === "High"
                      ? "text-red-600"
                      : rule.severity === "Medium"
                        ? "text-amber-600"
                        : "text-emerald-600"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{rule.rule_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{rule.explanation}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Data Completeness */}
      <Card className="p-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
          Data Completeness
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {completenessChecklist.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm ${item.ok ? "bg-emerald-50" : "bg-slate-50"}`}
            >
              <CheckCircle2
                className={`w-4 h-4 ${item.ok ? "text-emerald-500" : "text-slate-300"}`}
              />
              <span
                className={`text-xs font-medium ${item.ok ? "text-slate-700" : "text-slate-400"}`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Escalation History */}
      {caseItem.escalations && caseItem.escalations.length > 0 && (
        <Card className="p-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
            Escalation History
          </h4>
          <div className="space-y-2.5">
            {caseItem.escalations.map((esc) => (
              <div key={esc.id} className="flex items-start gap-2.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ArrowUpRight className="w-3 h-3 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {esc.escalated_by} → {esc.escalated_to}
                  </p>
                  <p className="text-slate-500 mt-0.5">{esc.reason}</p>
                  <p className="text-slate-400 mt-0.5">
                    {new Date(esc.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </TabsContent>
  );
}
