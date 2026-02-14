"use client";

import { LeakageCase } from "@/lib/revenue-leakage/types";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";

interface CaseDrawerActivityTabProps {
  caseItem: LeakageCase;
}

export function CaseDrawerActivityTab({ caseItem }: CaseDrawerActivityTabProps) {
  return (
    <TabsContent value="activity" className="px-6 py-4 space-y-4">
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
          Activity Log
        </h4>
        <div className="space-y-0">
          {caseItem.activity_log.map((entry, idx) => (
            <div key={entry.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                {idx < caseItem.activity_log.length - 1 && (
                  <div className="w-0.5 flex-1 bg-slate-200 mt-1" />
                )}
              </div>
              <div className="pb-4">
                <p className="text-[11px] text-slate-400">
                  {new Date(entry.ts).toLocaleString()}
                </p>
                <p className="text-sm font-semibold text-slate-900">{entry.action}</p>
                <p className="text-xs text-slate-600 mt-0.5">{entry.detail}</p>
                {entry.diff && (
                  <p className="text-xs text-slate-400 mt-0.5 font-mono bg-slate-50 px-2 py-1 rounded">
                    Diff: {entry.diff}
                  </p>
                )}
              </div>
            </div>
          ))}
          {!caseItem.activity_log.length && (
            <p className="text-xs text-slate-500">No activity yet.</p>
          )}
        </div>
      </div>

      {/* Notes section */}
      {caseItem.notes.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
            Notes
          </h4>
          <div className="space-y-2">
            {caseItem.notes.map((note) => (
              <Card
                key={note.id}
                className="p-3 border-l-4 border-l-blue-500 bg-blue-50/30"
              >
                <p className="text-[11px] text-slate-400">
                  {note.author} · {new Date(note.created_at).toLocaleString()}
                </p>
                <p className="text-sm text-slate-800 mt-0.5">{note.note}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </TabsContent>
  );
}
