"use client";

import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertTriangle } from "lucide-react";
import { MVHotspotDetail } from "@/lib/revenue-leakage/types";
import { formatCurrency, severityBadge, drrText } from "../constants";

export function HotspotDrawer({
  open,
  onOpenChange,
  detail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: MVHotspotDetail | null;
}) {
  if (!detail) return null;
  const riskScore = Math.round(100 - detail.drr * 60 + (detail.severity === "Critical" ? 15 : 0));
  const totalExtent = detail.transactions.reduce((sum, txn) => sum + txn.extent, 0);
  const extentUnit = detail.transactions[0]?.extent_unit || "sq.yd";
  const lossSplit = {
    stamp: Math.round(detail.estimated_loss * 0.8),
    transfer: Math.round(detail.estimated_loss * 0.12),
    registration: Math.round(detail.estimated_loss * 0.08),
  };

  const drrHistory = detail.trend_history;
  const rateHistory = detail.rate_card_history;
  const scatter = detail.scatter_points;
  const maxDrr = Math.max(...drrHistory.map((item) => Math.max(item.drr, item.sro_avg)), 1);
  const maxRate = Math.max(
    ...rateHistory.map((item) => Math.max(item.unit_rate, item.prev_rate)),
    1
  );
  const maxScatter = Math.max(
    ...scatter.map((item) => item.declared_per_unit),
    detail.rate_card_unit_rate
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[760px] sm:max-w-[760px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-5 pb-4 border-b bg-gradient-to-r from-slate-800 to-slate-700">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="text-xl font-bold text-white tracking-tight">
                {detail.case_id}
              </SheetTitle>
              <p className="text-xs text-slate-300 mt-1">{detail.location_label}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${severityBadge[detail.severity]}`}
              >
                {detail.severity}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500 text-white">
                {detail.status}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-white/15 text-white border border-white/20">
                {detail.confidence}% conf.
              </span>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="bg-slate-100">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="trend">Trend</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-4 mt-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Valuation Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <Card className="p-3 border-slate-200">
                    <p className="text-[11px] text-slate-500">Rate Card / Unit</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(detail.rate_card_unit_rate)}
                    </p>
                  </Card>
                  <Card className="p-3 border-red-200 bg-red-50">
                    <p className="text-[11px] text-slate-500">Median Declared / Unit</p>
                    <p className="text-lg font-bold text-red-700">
                      {formatCurrency(detail.median_declared)}
                    </p>
                  </Card>
                  <Card className="p-3 border-red-200 bg-red-50">
                    <p className="text-[11px] text-slate-500">DRR</p>
                    <p className={`text-lg font-bold ${drrText(detail.drr)}`}>
                      {detail.drr.toFixed(2)}
                    </p>
                  </Card>
                  <Card className="p-3 border-slate-200">
                    <p className="text-[11px] text-slate-500">Transactions</p>
                    <p className="text-lg font-bold text-slate-900">
                      {detail.transaction_count} Sale Deeds
                    </p>
                  </Card>
                  <Card className="p-3 border-slate-200">
                    <p className="text-[11px] text-slate-500">Total Extent</p>
                    <p className="text-lg font-bold text-slate-900">
                      {totalExtent} {extentUnit}
                    </p>
                  </Card>
                  <Card className="p-3 border-slate-200">
                    <p className="text-[11px] text-slate-500">Consecutive Quarters</p>
                    <p className="text-lg font-bold text-slate-900">
                      {detail.consecutive_quarters}
                    </p>
                  </Card>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Risk Score</span>
                    <span className="font-semibold text-slate-700">{riskScore}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${riskScore >= 80 ? "bg-red-500" : riskScore >= 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${riskScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Estimated Loss Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Card className="p-3 border-slate-200">
                    <p className="text-[11px] text-slate-500">Stamp Duty Loss</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(lossSplit.stamp)}
                    </p>
                  </Card>
                  <Card className="p-3 border-slate-200">
                    <p className="text-[11px] text-slate-500">Transfer Duty Loss</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(lossSplit.transfer)}
                    </p>
                  </Card>
                  <Card className="p-3 border-slate-200">
                    <p className="text-[11px] text-slate-500">Registration Fee Loss</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(lossSplit.registration)}
                    </p>
                  </Card>
                </div>
                <Card className="p-3 border-emerald-200 bg-emerald-50 mt-2">
                  <p className="text-[11px] text-emerald-700">Total Estimated Loss</p>
                  <p className="text-lg font-bold text-emerald-700">
                    {formatCurrency(detail.estimated_loss)}
                  </p>
                </Card>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Why Flagged
                </h3>
                <div className="space-y-2">
                  {detail.rules_detail.slice(0, 2).map((rule) => (
                    <div key={rule.rule_id} className="bg-white/70 rounded-md px-3 py-2">
                      <p className="text-xs font-semibold text-slate-800">
                        Rule: {rule.rule_name} ({rule.rule_id})
                      </p>
                      <p className="text-xs text-slate-600 mt-1">{rule.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Peer Comparison
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                      <tr>
                        <th className="text-left px-3 py-2">Location</th>
                        <th className="text-center px-3 py-2">DRR</th>
                        <th className="text-center px-3 py-2">Txns</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {detail.peer_locations.map((peer, idx) => (
                        <tr
                          key={`${peer.label}-${idx}`}
                          className={peer.is_sro_avg ? "bg-emerald-50" : ""}
                        >
                          <td className="px-3 py-2 text-slate-700">{peer.label}</td>
                          <td
                            className={`px-3 py-2 text-center font-semibold ${drrText(peer.drr)}`}
                          >
                            {peer.drr.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center text-slate-600">
                            {peer.txn_count || "--"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="mt-4">
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#1B2A4A] text-xs text-slate-200 uppercase">
                    <tr>
                      <th className="text-left px-3 py-2">Document</th>
                      <th className="text-left px-3 py-2">Date</th>
                      <th className="text-right px-3 py-2">Extent</th>
                      <th className="text-right px-3 py-2">Declared / Unit</th>
                      <th className="text-center px-3 py-2">DRR</th>
                      <th className="text-right px-3 py-2">Gap (&#8377;)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {detail.transactions.map((txn) => (
                      <tr key={txn.doc_key} className="hover:bg-blue-50/40">
                        <td className="px-3 py-2 text-blue-700 font-semibold">{txn.doc_key}</td>
                        <td className="px-3 py-2 text-slate-600">{txn.date}</td>
                        <td className="px-3 py-2 text-right text-slate-600">
                          {txn.extent} {txn.extent_unit}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-red-600">
                          {formatCurrency(txn.declared_per_unit)}
                        </td>
                        <td className={`px-3 py-2 text-center font-semibold ${drrText(txn.drr)}`}>
                          {txn.drr.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                          {formatCurrency(txn.gap)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Trend Tab */}
            <TabsContent value="trend" className="mt-4 space-y-4">
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">DRR History</h3>
                <div style={{ height: 160 }}>
                  <svg viewBox="0 0 100 60" className="w-full h-full">
                    <rect x="0" y="0" width="100" height="60" fill="#f8fafc" />
                    <line
                      x1="6"
                      y1={56 - (0.85 / maxDrr) * 46}
                      x2="96"
                      y2={56 - (0.85 / maxDrr) * 46}
                      stroke="#94a3b8"
                      strokeDasharray="2 2"
                    />
                    <polyline
                      points={drrHistory
                        .map((point, idx) => {
                          const x = 6 + (idx / Math.max(drrHistory.length - 1, 1)) * 88;
                          const y = 56 - (point.drr / maxDrr) * 46;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="1.6"
                    />
                    <polyline
                      points={drrHistory
                        .map((point, idx) => {
                          const x = 6 + (idx / Math.max(drrHistory.length - 1, 1)) * 88;
                          const y = 56 - (point.sro_avg / maxDrr) * 46;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                    />
                  </svg>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Rate Card History</h3>
                <div style={{ height: 160 }}>
                  <svg viewBox="0 0 100 60" className="w-full h-full">
                    <rect x="0" y="0" width="100" height="60" fill="#f8fafc" />
                    <polyline
                      points={rateHistory
                        .map((point, idx) => {
                          const x = 6 + (idx / Math.max(rateHistory.length - 1, 1)) * 88;
                          const y = 56 - (point.unit_rate / maxRate) * 46;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="1.6"
                    />
                    <polyline
                      points={rateHistory
                        .map((point, idx) => {
                          const x = 6 + (idx / Math.max(rateHistory.length - 1, 1)) * 88;
                          const y = 56 - (point.prev_rate / maxRate) * 46;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.2"
                    />
                  </svg>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Transaction Scatter</h3>
                <div style={{ height: 160 }}>
                  <svg viewBox="0 0 100 60" className="w-full h-full">
                    <rect x="0" y="0" width="100" height="60" fill="#f8fafc" />
                    <line
                      x1="6"
                      y1={56 - (detail.rate_card_unit_rate / maxScatter) * 46}
                      x2="96"
                      y2={56 - (detail.rate_card_unit_rate / maxScatter) * 46}
                      stroke="#dc2626"
                      strokeDasharray="2 2"
                    />
                    {scatter.map((point, idx) => {
                      const x = 6 + (idx / Math.max(scatter.length - 1, 1)) * 88;
                      const y = 56 - (point.declared_per_unit / maxScatter) * 46;
                      const color =
                        point.drr < 0.5 ? "#dc2626" : point.drr < 0.7 ? "#ea580c" : "#f59e0b";
                      return <circle key={`sc-${idx}`} cx={x} cy={y} r={2} fill={color} />;
                    })}
                  </svg>
                </div>
              </Card>
            </TabsContent>

            {/* Rules Tab */}
            <TabsContent value="rules" className="mt-4">
              <Accordion type="single" collapsible>
                {detail.rules_detail.map((rule) => (
                  <AccordionItem key={rule.rule_id} value={rule.rule_id}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {rule.rule_id}: {rule.rule_name}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${severityBadge[detail.severity]}`}
                        >
                          {detail.severity}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm text-slate-700">
                        <p>{rule.explanation}</p>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Fields Used</p>
                          <div className="flex flex-wrap gap-2">
                            {rule.fields_used.map((field) => (
                              <span
                                key={field}
                                className="px-2 py-0.5 rounded bg-slate-100 text-xs"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Thresholds</p>
                          <div className="space-y-1 text-xs">
                            {rule.thresholds.map((t) => (
                              <div key={t.label} className="flex items-center justify-between">
                                <span>{t.label}</span>
                                <span className="font-medium">{t.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Confidence</span>
                          <span className="font-semibold">{rule.confidence}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Impact</span>
                          <span className="font-semibold">{formatCurrency(rule.impact)}</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-4">
              <div className="space-y-3">
                {(detail.activity_log || []).map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3">
                    <div className="mt-1 w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{entry.action}</p>
                      <p className="text-xs text-slate-500">{entry.detail}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {entry.ts} - {entry.actor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
