import { useMemo, useState, useEffect } from 'react';
import { RECONS } from '../data';
import { Card, StatusChip } from '../components/ui';
import { ChatPanel } from '../components/ChatPanel';
import { ActionStrip } from '../components/ActionStrip';
import { useChat, useToasts } from '../store';
import { Icon } from '../icons';

function fmt(n: number) {
  const sign = n < 0 ? '-' : '';
  const v = Math.abs(n);
  return `${sign}$${v.toLocaleString()}`;
}

export default function Recons() {
  const { setScope } = useChat();
  const { push } = useToasts();
  const [filter, setFilter] = useState<'all' | 'material' | 'variance' | 'matched'>('all');

  useEffect(() => { setScope('Reconciliations · Q1 FY26'); }, [setScope]);

  const filtered = useMemo(() => {
    if (filter === 'all') return RECONS;
    if (filter === 'material') return RECONS.filter(r => r.material);
    if (filter === 'variance') return RECONS.filter(r => r.status === 'variance');
    return RECONS.filter(r => r.status === 'matched');
  }, [filter]);

  const counts = useMemo(() => ({
    matched: RECONS.filter(r => r.status === 'matched').length,
    variance: RECONS.filter(r => r.status === 'variance').length,
    material: RECONS.filter(r => r.material).length,
    totalGL: RECONS.reduce((s, r) => s + r.gl, 0),
    totalVar: RECONS.reduce((s, r) => s + Math.abs(r.variance), 0),
  }), []);

  return (
    <div className="flex-1 grid min-h-0" style={{ gridTemplateColumns: '1fr 344px', gridTemplateRows: '1fr 48px', gridTemplateAreas: `"main chat" "strip chat"` }}>
      <div style={{ gridArea: 'main' }} className="overflow-auto p-6 bg-surface-alt">
        <div className="max-w-[1080px] mx-auto">
          <div className="flex justify-between items-center mb-5">
            <div>
              <div className="text-[11px] tracking-wider uppercase text-muted">Reconciliations</div>
              <h1 className="text-[22px] font-semibold text-ink tracking-tight mt-0.5 flex items-center gap-2">
                Q1 FY26 · GL-to-Subledger
                <StatusChip kind="warn">3 material variances</StatusChip>
              </h1>
              <p className="text-[12px] text-muted mt-1">Automated matching engine ran at 06:00. Materiality threshold: $50K.</p>
            </div>
            <button onClick={() => push({ kind: 'info', title: 'Auto-match running', sub: 'Reconciling 32 accounts — ~45 seconds.' })} className="px-3 py-1.5 text-[12px] font-medium text-white bg-brand rounded-md hover:opacity-90 inline-flex items-center gap-1.5">
              <Icon.Refresh className="w-3.5 h-3.5" />
              <span>Re-run Match</span>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-5">
            <Card className="p-3"><div className="text-[10px] tracking-wider uppercase text-muted font-semibold">Matched</div><div className="text-[22px] font-semibold num mt-1 text-positive">{counts.matched}<span className="text-[12px] text-faint ml-1">/ {RECONS.length}</span></div></Card>
            <Card className="p-3"><div className="text-[10px] tracking-wider uppercase text-muted font-semibold">Variance</div><div className="text-[22px] font-semibold num mt-1 text-negative">{counts.variance}</div></Card>
            <Card className="p-3"><div className="text-[10px] tracking-wider uppercase text-muted font-semibold">Material</div><div className="text-[22px] font-semibold num mt-1 text-warning">{counts.material}</div></Card>
            <Card className="p-3"><div className="text-[10px] tracking-wider uppercase text-muted font-semibold">Total |Variance|</div><div className="text-[18px] font-semibold num mt-1 text-ink">{fmt(counts.totalVar)}</div></Card>
          </div>

          <div className="flex items-center gap-1 mb-3">
            {(['all', 'material', 'variance', 'matched'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-[12px] rounded-md capitalize ${filter === f ? 'bg-brand-tint text-brand font-semibold' : 'text-muted hover:bg-surface-soft hover:text-ink'}`}>{f}</button>
            ))}
          </div>

          <Card className="p-0 overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-brand text-white">
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Account</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Owner</th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-semibold">GL Balance</th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Subledger</th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Variance</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} className={`border-t border-rule ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-alt'} hover:bg-surface-soft`}>
                    <td className="px-4 py-2.5 font-semibold text-ink flex items-center gap-2">
                      {r.material && <Icon.Alert className="w-3.5 h-3.5 text-warning" />}
                      {r.name}
                    </td>
                    <td className="px-4 py-2.5 text-muted">{r.owner}</td>
                    <td className="px-4 py-2.5 text-right num text-ink">{fmt(r.gl)}</td>
                    <td className="px-4 py-2.5 text-right num text-muted">{fmt(r.sub)}</td>
                    <td className={`px-4 py-2.5 text-right num font-semibold ${r.variance === 0 ? 'text-faint' : r.variance < 0 ? 'text-negative' : 'text-warning'}`}>{r.variance === 0 ? '—' : fmt(r.variance)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${r.status === 'matched' ? 'bg-positive-weak text-positive' : r.status === 'variance' ? 'bg-negative-weak text-negative' : 'bg-warning-weak text-warning'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
      <div style={{ gridArea: 'strip' }} className="bg-surface border-t border-rule overflow-x-auto"><ActionStrip /></div>
      <aside style={{ gridArea: 'chat' }} className="bg-surface border-l border-rule flex flex-col overflow-hidden"><ChatPanel /></aside>
    </div>
  );
}
