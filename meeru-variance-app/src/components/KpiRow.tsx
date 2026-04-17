import type { Kpi } from '../types';

export function KpiRow({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-3.5">
      {kpis.map(k => {
        const deltaCls = k.tone === 'pos' ? 'text-positive' : k.tone === 'neg' ? 'text-negative' : 'text-warning';
        return (
          <div key={k.lbl} className="bg-surface border border-rule rounded-xl p-3.5 shadow-e1 hover:-translate-y-0.5 hover:shadow-e2 transition-all cursor-pointer">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-muted">{k.lbl}</div>
            <div className="text-[26px] font-semibold text-ink mt-1 num tracking-tight">{k.val}</div>
            <div className={`text-[11px] mt-1 ${deltaCls}`}>{k.delta}</div>
          </div>
        );
      })}
    </div>
  );
}
