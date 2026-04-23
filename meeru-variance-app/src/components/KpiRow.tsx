import { useEffect, useState } from 'react';
import type { Kpi } from '../types';

/**
 * Renders the 3-tile KPI row. The "watched" KPI (typically the worst-performing
 * one) cycles a subtle live-pulse indicator so the user can see the agent is
 * actively monitoring it.
 */
export function KpiRow({ kpis, onCardClick }: { kpis: Kpi[]; onCardClick?: (index: number, kpi: Kpi) => void }) {
  // The agent "watches" the most concerning KPI. Cycle the indicator slowly.
  const watchedIndex = kpis.findIndex(k => k.tone === 'neg');
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 6000);
    return () => clearInterval(id);
  }, []);

  // Grid column count follows the KPI count so 3- or 4-card rows both fit in
  // a single line. Compact typography for 4+ cards so they don't feel cramped.
  const cols = kpis.length;
  const gridCls = cols === 4
    ? 'grid-cols-4'
    : cols === 2
    ? 'grid-cols-2'
    : 'grid-cols-3';
  const compact = cols >= 4;
  const valCls = compact ? 'text-[20px]' : 'text-[26px]';
  const padCls = compact ? 'p-2.5' : 'p-3.5';

  return (
    <div className={`grid ${gridCls} gap-2.5 mb-3.5`}>
      {kpis.map((k, i) => {
        const deltaCls = k.tone === 'pos' ? 'text-positive' : k.tone === 'neg' ? 'text-negative' : 'text-warning';
        const isWatched = i === watchedIndex;
        return (
          <div
            key={k.lbl}
            onClick={() => onCardClick?.(i, k)}
            className={`relative bg-surface border border-rule rounded-xl ${padCls} shadow-e1 hover:-translate-y-0.5 hover:shadow-e2 hover:border-brand-weak transition-all cursor-pointer overflow-hidden min-w-0`}
          >
            {isWatched && pulse && (
              <div className="absolute inset-0 shimmer-bg pointer-events-none" />
            )}
            <div className="flex items-center justify-between relative gap-1.5">
              <div className="text-[10px] font-semibold tracking-wider uppercase text-muted truncate">{k.lbl}</div>
              {isWatched && (
                <span
                  className="inline-flex items-center gap-1 px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-brand-tint text-brand shrink-0"
                  title="Agent actively watching this metric"
                >
                  <span className="w-1 h-1 rounded-full bg-brand live-dot" />
                  Watch
                </span>
              )}
            </div>
            <div className={`${valCls} font-semibold text-ink mt-1 num tracking-tight relative truncate`}>{k.val}</div>
            <div className={`text-[11px] mt-1 ${deltaCls} relative truncate`}>{k.delta}</div>
          </div>
        );
      })}
    </div>
  );
}
