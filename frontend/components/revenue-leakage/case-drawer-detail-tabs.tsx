"use client";

import { LeakageCase, RuleHit, PartyInfo } from "@/lib/revenue-leakage/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCurrency } from "./constants";

interface GroupedParties {
  buyers: PartyInfo[];
  sellers: PartyInfo[];
  others: PartyInfo[];
}

/* ─── Prohibited Tab ─── */

interface CaseDrawerProhibitedTabProps {
  caseItem: LeakageCase;
}

export function CaseDrawerProhibitedTab({ caseItem }: CaseDrawerProhibitedTabProps) {
  return (
    <TabsContent value="prohibited" className="px-6 py-4 space-y-3">
      {caseItem.evidence.prohibited_matches.length > 0 ? (
        caseItem.evidence.prohibited_matches.map((match) => (
          <Card key={match.PROHIB_CD} className="p-3 border border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-red-700">Match Found</p>
              <Badge variant="destructive">Prohibited</Badge>
            </div>
            <div className="text-xs text-red-700 mt-2 space-y-1">
              <p>PROHIB_CD: {match.PROHIB_CD}</p>
              <p>
                Notification: {match.NOTI_GAZ_NO} ({match.NOTI_GAZ_DT})
              </p>
              <p>Match level: {match.match_level}</p>
              <p>Fields: {match.match_fields.join(", ")}</p>
            </div>
          </Card>
        ))
      ) : (
        <Card className="p-3">
          <p className="text-sm text-slate-600">No prohibited land match found.</p>
        </Card>
      )}
    </TabsContent>
  );
}

/* ─── Parties Tab ─── */

interface CaseDrawerPartiesTabProps {
  groupedParties: GroupedParties;
}

export function CaseDrawerPartiesTab({ groupedParties }: CaseDrawerPartiesTabProps) {
  return (
    <TabsContent value="parties" className="px-6 py-4 space-y-3">
      <Card className="p-3">
        <h4 className="text-sm font-semibold mb-2">Buyers</h4>
        {groupedParties.buyers.length ? (
          groupedParties.buyers.map((party) => (
            <div key={party.NAME} className="text-sm text-slate-700 mb-2">
              <p className="font-medium">{party.NAME}</p>
              <p className="text-xs text-slate-500">
                PAN: {party.PAN_NO || "\u2014"} | Phone: {party.PHONE_NO || "\u2014"}
              </p>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500">No buyers identified.</p>
        )}
      </Card>
      <Card className="p-3">
        <h4 className="text-sm font-semibold mb-2">Sellers</h4>
        {groupedParties.sellers.length ? (
          groupedParties.sellers.map((party) => (
            <div key={party.NAME} className="text-sm text-slate-700 mb-2">
              <p className="font-medium">{party.NAME}</p>
              <p className="text-xs text-slate-500">
                PAN: {party.PAN_NO || "\u2014"} | Phone: {party.PHONE_NO || "\u2014"}
              </p>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500">No sellers identified.</p>
        )}
      </Card>
      {groupedParties.others.length > 0 && (
        <Card className="p-3">
          <h4 className="text-sm font-semibold mb-2">Other Parties</h4>
          {groupedParties.others.map((party) => (
            <div key={party.NAME} className="text-sm text-slate-700 mb-2">
              <p className="font-medium">{party.NAME}</p>
              <p className="text-xs text-slate-500">Role: {party.CODE}</p>
            </div>
          ))}
        </Card>
      )}
    </TabsContent>
  );
}

/* ─── Explainability Tab ─── */

interface CaseDrawerExplainTabProps {
  caseItem: LeakageCase;
}

function RuleBadge({ rule }: { rule: RuleHit }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
        rule.severity === "High"
          ? "bg-red-600 text-white"
          : rule.severity === "Medium"
            ? "bg-amber-500 text-white"
            : "bg-emerald-600 text-white"
      }`}
    >
      {rule.severity}
    </span>
  );
}

export function CaseDrawerExplainTab({ caseItem }: CaseDrawerExplainTabProps) {
  return (
    <TabsContent value="explainability" className="px-6 py-4 space-y-3">
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
          Triggered Rules
        </h4>
        <div className="overflow-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-300 bg-slate-700">
              <tr>
                <th className="text-left py-2 px-3 font-semibold">Rule</th>
                <th className="text-left py-2 px-3 font-semibold">Severity</th>
                <th className="text-left py-2 px-3 font-semibold">Impact (\u20B9)</th>
                <th className="text-left py-2 px-3 font-semibold">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {caseItem.evidence.triggered_rules.map((rule) => (
                <tr key={rule.rule_id} className="text-slate-800 hover:bg-slate-50">
                  <td className="py-2 px-3 font-medium">
                    {rule.rule_id} · {rule.rule_name}
                  </td>
                  <td className="py-2 px-3"><RuleBadge rule={rule} /></td>
                  <td className="py-2 px-3 font-semibold">
                    {formatCurrency(rule.impact_inr)}
                  </td>
                  <td className="py-2 px-3">{rule.confidence}%</td>
                </tr>
              ))}
              {!caseItem.evidence.triggered_rules.length && (
                <tr>
                  <td colSpan={4} className="py-3 px-3 text-xs text-slate-500">
                    No rules triggered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Card className="p-4 bg-slate-50">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
          Decision Trace
        </h4>
        <div className="flex items-center gap-2 text-xs mb-3">
          <span className="px-2 py-1 bg-white rounded border text-slate-700 font-medium">
            Inputs
          </span>
          <span className="text-slate-400">{"\u2192"}</span>
          <span className="px-2 py-1 bg-white rounded border text-slate-700 font-medium">
            Rules
          </span>
          <span className="text-slate-400">{"\u2192"}</span>
          <span className="px-2 py-1 bg-white rounded border text-slate-700 font-medium">
            Signals
          </span>
          <span className="text-slate-400">{"\u2192"}</span>
          <span className="px-2 py-1 bg-white rounded border text-slate-700 font-medium">
            Risk Score
          </span>
        </div>
        <div className="text-xs text-slate-600 space-y-1.5">
          <p>
            <span className="font-semibold text-slate-700">Inputs:</span> TRAN_MAJOR,
            CASH_DET, CASH_PAID, TRAN_SCHED
          </p>
          <p>
            <span className="font-semibold text-slate-700">Rules:</span>{" "}
            {caseItem.evidence.triggered_rules.map((rule) => rule.rule_id).join(", ") ||
              "\u2014"}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Signals:</span>{" "}
            {caseItem.leakage_signals.join(", ")}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Risk Score:</span>{" "}
            {caseItem.risk_score}
          </p>
        </div>
      </Card>

      <Accordion type="single" collapsible className="space-y-2">
        {caseItem.evidence.triggered_rules.map((rule) => (
          <AccordionItem
            key={rule.rule_id}
            value={rule.rule_id}
            className="border rounded-md"
          >
            <AccordionTrigger className="px-3 py-2 text-sm font-medium hover:no-underline">
              {rule.rule_id} · {rule.rule_name}
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 text-xs text-slate-600 space-y-2">
              <p>{rule.explanation}</p>
              <div>
                <p className="font-medium text-slate-500 mb-1">Fields used</p>
                <ul className="list-disc ml-4 space-y-1">
                  {rule.fields_used.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-slate-500 mb-1">Calculation snapshot</p>
                <ul className="space-y-1">
                  {rule.calculations.map((calc) => (
                    <li key={calc.label}>
                      {calc.label}: {calc.value}
                    </li>
                  ))}
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </TabsContent>
  );
}
