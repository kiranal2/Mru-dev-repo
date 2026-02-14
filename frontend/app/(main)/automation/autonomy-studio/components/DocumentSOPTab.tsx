"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import type { SOP } from "../types";

interface DocumentSOPTabProps {
  sopText: string;
  setSOPText: (text: string) => void;
  currentSOP: SOP | null;
}

export function DocumentSOPTab({ sopText, setSOPText, currentSOP }: DocumentSOPTabProps) {
  return (
    <Card className="p-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">SOP TEXT</h3>
          <Textarea
            value={sopText}
            onChange={(e) => setSOPText(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
          />
          <Button className="mt-3 bg-blue-600 hover:bg-blue-700">
            AI Suggest Breakdown
          </Button>
          <p className="text-xs text-slate-500 mt-2">
            You can edit the SOP and regenerate the breakdown.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">SOP HIGHLIGHTS</h3>
          <Card className="p-4 mb-4 font-mono text-sm space-y-1">
            <div>Title: {currentSOP?.title || "Untitled SOP"}</div>
            <div>Owner: {currentSOP?.owner || "Unassigned"}</div>
            <div>Frequency: {currentSOP?.frequency || "Ad hoc"}</div>
            <div>SLA: {currentSOP?.sla || "None"}</div>
            <div>Scope: {currentSOP?.scope || "Not specified"}</div>
          </Card>

          <h3 className="text-sm font-medium text-slate-700 mb-3 mt-6">
            EXTRACTED STRUCTURE
          </h3>
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs font-medium text-slate-600 mb-2">Sections</div>
                <div className="font-mono text-xs">
                  {currentSOP?.sections.map((s, i) => (
                    <div key={i}>
                      {i + 1}. {s}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-600 mb-2">
                  Detected Steps
                </div>
                <div className="font-mono text-xs">
                  {currentSOP?.steps.map((s, i) => (
                    <div key={i}>
                      {i + 1}. {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t pt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-slate-600 mb-2">Inputs</div>
                <div className="font-mono text-xs">
                  {currentSOP?.inputs.map((inp, i) => (
                    <div key={i}>- {inp}</div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-600 mb-2">Outputs</div>
                <div className="font-mono text-xs">
                  {currentSOP?.outputs.map((out, i) => (
                    <div key={i}>- {out}</div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Card>
  );
}
