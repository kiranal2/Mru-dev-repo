import { useEffect, useState } from 'react';
import type { Kpi } from '../types';

/**
 * Renders the 3-tile KPI row. The "watched" KPI (typically the worst-performing
 * one) cycles a subtle live-pulse indicator so the user can see the agent is
 * actively monitoring it.
 */
export function KpiRow({ kpis }: { kpis: Kpi[] }) {
  // The agent "watches" the most concerning KPI. Cycle the indicator slowly.
  const watchedIndex = kpis.findIndex(k => k.tone === 'neg');
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-3 mb-3.5">
      {kpis.map((k, i) => {
        const deltaCls = k.tone === 'pos' ? 'text-positive' : k.tone === 'neg' ? 'text-negative' : 'text-warning';
        const isWatched = i === watchedIndex;
        return (
          <div
            key={k.lbl}
            className="relative bg-surface border border-rule rounded-xl p-3.5 shadow-e1 hover:-translate-y-0.5 hover:shadow-e2 transition-all cursor-pointer overflow-hidden"
          >
            {isWatched && pulse && (
              <div className="absolute inset-0 shimmer-bg pointer-events-none" />
            )}
            <div className="flex items-center justify-between relative">
              <div className="text-[10px] font-semibold tracking-wider uppercase text-muted">{k.lbl}</div>
              {isWatched && (
                <span
                  className="inline-flex items-center gap-1 px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-brand-tint text-brand"
                  title="Agent actively watching this metric"
                >
                  <span className="w-1 h-1 rounded-full bg-brand live-dot" />
                  Watch
                </span>
              )}
            </div>
            <div className="text-[26px] font-semibold text-ink mt-1 num tracking-tight relative">{k.val}</div>
            <div className={`text-[11px] mt-1 ${deltaCls} relative`}>{k.delta}</div>
          </div>
        );
      })}
    </div>
  );
}
