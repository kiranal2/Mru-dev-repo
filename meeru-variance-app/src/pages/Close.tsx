import { useMemo, useState } from 'react';
import { CLOSE_TASKS } from '../data';
import type { CloseTask } from '../data';
import { Card, StatusChip } from '../components/ui';
import { ChatPanel } from '../components/ChatPanel';
import { ActionStrip } from '../components/ActionStrip';
import { useChat } from '../store';
import { useEffect } from 'react';
import { Icon } from '../icons';

const STATUS_META: Record<CloseTask['status'], { label: string; cls: string }> = {
  done: { label: 'Done', cls: 'bg-positive-weak text-positive' },
  in_progress: { label: 'In Progress', cls: 'bg-brand-tint text-brand' },
  blocked: { label: 'Blocked', cls: 'bg-negative-weak text-negative' },
  not_started: { label: 'Not Started', cls: 'bg-surface-soft text-muted' },
};

export default function Close() {
  const { setScope } = useChat();
  const [filter, setFilter] = useState<'all' | CloseTask['status']>('all');

  useEffect(() => { setScope('Close Workbench · Day 4 / 5'); }, [setScope]);

  const filtered = useMemo(() =>
    filter === 'all' ? CLOSE_TASKS : CLOSE_TASKS.filter(t => t.status === filter),
    [filter]
  );

  const counts = useMemo(() => ({
    done: CLOSE_TASKS.filter(t => t.status === 'done').length,
    in_progress: CLOSE_TASKS.filter(t => t.status === 'in_progress').length,
    blocked: CLOSE_TASKS.filter(t => t.status === 'blocked').length,
    not_started: CLOSE_TASKS.filter(t => t.status === 'not_started').length,
    total: CLOSE_TASKS.length,
  }), []);

  return (
    <div className="flex-1 grid min-h-0" style={{ gridTemplateColumns: '1fr 344px', gridTemplateRows: '1fr 48px', gridTemplateAreas: `"main chat" "strip chat"` }}>
      <div style={{ gridArea: 'main' }} className="overflow-auto p-6 bg-surface-alt">
        <div className="max-w-[1080px] mx-auto">
          <div className="flex justify-between items-center mb-5">
            <div>
              <div className="text-[11px] tracking-wider uppercase text-muted">Close Workbench</div>
              <h1 className="text-[22px] font-semibold text-ink tracking-tight mt-0.5 flex items-center gap-2">Day 4 / 5 · Period-End Close
                <StatusChip kind="warn">2 blockers open</StatusChip>
              </h1>
              <p className="text-[12px] text-muted mt-1">Target close: Day 5 EOD. Critical path is on track if blockers unblock by Day 4 EOD.</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-[12px] font-medium text-muted hover:text-ink border border-rule rounded-md">Export</button>
              <button className="px-3 py-1.5 text-[12px] font-medium text-white bg-brand rounded-md hover:opacity-90">Mark progress</button>
            </div>
          </div>

          {/* Status cards */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {([
              ['Done', counts.done, 'positive'],
              ['In Progress', counts.in_progress, 'brand'],
              ['Blocked', counts.blocked, 'negative'],
              ['Not Started', counts.not_started, 'muted'],
            ] as const).map(([lbl, n, tone]) => (
              <button key={lbl} onClick={() => setFilter(lbl === 'Done' ? 'done' : lbl === 'In Progress' ? 'in_progress' : lbl === 'Blocked' ? 'blocked' : 'not_started')} className="bg-surface border border-rule rounded-xl p-3 text-left hover:shadow-e1 transition-all">
                <div className="text-[10px] font-semibold tracking-wider uppercase text-muted">{lbl}</div>
                <div className={`text-[22px] font-semibold num mt-1 ${tone === 'positive' ? 'text-positive' : tone === 'brand' ? 'text-brand' : tone === 'negative' ? 'text-negative' : 'text-muted'}`}>{n}<span className="text-[12px] text-faint ml-1">/ {counts.total}</span></div>
              </button>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 mb-3">
            {(['all', 'blocked', 'in_progress', 'not_started', 'done'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-[12px] rounded-md ${filter === f ? 'bg-brand-tint text-brand font-semibold' : 'text-muted hover:bg-surface-soft hover:text-ink'}`}>
                {f === 'all' ? 'All' : STATUS_META[f].label}
              </button>
            ))}
          </div>

          <Card className="p-0 overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-brand text-white">
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Task</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Group</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Owner</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Due</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Status</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Blocker</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const s = STATUS_META[t.status];
                  return (
                    <tr key={t.id} className={`border-t border-rule ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-alt'} hover:bg-surface-soft`}>
                      <td className="px-4 py-2.5 font-semibold text-ink">
                        <div className="flex items-center gap-2">
                          {t.status === 'done' && <Icon.Check className="w-3.5 h-3.5 text-positive" />}
                          {t.status === 'blocked' && <Icon.Alert className="w-3.5 h-3.5 text-negative" />}
                          <span>{t.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-muted">{t.group}</td>
                      <td className="px-4 py-2.5 text-muted">{t.owner}</td>
                      <td className="px-4 py-2.5 text-muted">{t.due}</td>
                      <td className="px-4 py-2.5"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${s.cls}`}>{s.label}</span></td>
                      <td className="px-4 py-2.5 text-[11px] text-negative">{t.blocker || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      </div>

      <div style={{ gridArea: 'strip' }} className="bg-surface border-t border-rule overflow-x-auto">
        <ActionStrip />
      </div>

      <aside style={{ gridArea: 'chat' }} className="bg-surface border-l border-rule flex flex-col overflow-hidden">
        <ChatPanel />
      </aside>
    </div>
  );
}
