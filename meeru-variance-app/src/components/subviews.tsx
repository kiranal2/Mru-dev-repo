import { Fragment, useEffect, useMemo, useState } from 'react';
import type {
  DrillRow, ExceptionItem, SignalItem, HistoryRow,
  WaterfallStep, ProductMixRow, CostRow, SensitivityScenario, FluxRow,
} from '../data';
import { Card, CardHeader, StatusChip, Badge } from './ui';
import { Icon } from '../icons';
import { useToasts } from '../store';

// ==========================================================
// helpers
// ==========================================================
function fmtMoney(n: number, compact = false): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (compact) {
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(0)}K`;
    return `${sign}$${abs}`;
  }
  return `${sign}$${abs.toLocaleString()}`;
}
function toneClass(n: number): string {
  if (n > 0) return 'text-positive';
  if (n < 0) return 'text-negative';
  return 'text-faint';
}
function Sparkline({ points, color }: { points: number[]; color?: string }) {
  const W = 60, H = 18;
  const min = Math.min(...points), max = Math.max(...points);
  const dx = W / (points.length - 1 || 1);
  const norm = (v: number) => H - ((v - min) / (max - min || 1)) * H;
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * dx} ${norm(v)}`).join(' ');
  const stroke = color ?? (points[points.length - 1] < points[0] ? 'var(--negative)' : 'var(--positive)');
  return <svg width={W} height={H}><path d={d} fill="none" stroke={stroke} strokeWidth="1.5" /></svg>;
}

// ==========================================================
// PERFORMANCE — Drill-Down
// ==========================================================
function DrillCard({ r, focused }: { r: DrillRow; focused?: boolean }) {
  const varCls = r.deltaArr > 0 ? 'text-positive' : r.deltaArr < 0 ? 'text-negative' : 'text-muted';
  const utilTone = r.nrr >= 63 ? 'text-negative'
    : r.nrr >= 55 ? 'text-warning'
    : 'text-positive';
  const tripsLabel = r.arr >= 1_000_000
    ? `${(r.arr / 1_000_000).toFixed(2)}M trips`
    : `${(r.arr / 1_000).toFixed(0)}K trips`;
  const varianceLabel = r.deltaArr === 0 ? '—' : fmtMoney(r.deltaArr, true);
  const tripsVsPlanCls = r.tripsVsPlan.startsWith('+') ? 'text-positive'
    : r.tripsVsPlan.startsWith('-') ? 'text-negative'
    : 'text-muted';

  // Sparkline bars — last bar accented, earlier bars muted so the eye lands
  // on the current week. Color follows the segment's variance direction.
  const min = Math.min(...r.spark), max = Math.max(...r.spark);
  const barHeights = r.spark.map(v => Math.max(4, ((v - min) / (max - min || 1)) * 28 + 4));
  const isPositive = r.deltaArr > 0;
  const accentLast = isPositive ? 'var(--positive)' : 'var(--negative)';
  const accentMuted = isPositive ? 'rgba(16,185,129,0.45)' : 'rgba(74,122,155,0.6)';

  return (
    <div
      className={`bg-surface border rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-e2 transition-all cursor-pointer ${
        focused ? 'border-brand ring-2 ring-brand-weak shadow-e2' : 'border-rule'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink truncate">{r.customer}</div>
          <div className="text-[10px] font-semibold tracking-wider uppercase text-faint mt-0.5">{r.region}</div>
        </div>
        <div className={`text-[13px] font-semibold num shrink-0 ${varCls}`}>{varianceLabel}</div>
      </div>
      <div className="flex items-end gap-1 h-8 mb-3">
        {r.spark.map((_v, i) => {
          const isLast = i === r.spark.length - 1;
          return (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${barHeights[i]}px`,
                backgroundColor: isLast ? accentLast : accentMuted,
              }}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className={`text-[13px] font-semibold num ${utilTone}`}>{r.nrr}%</div>
          <div className="text-[10px] text-faint mt-0.5">Courier Util</div>
        </div>
        <div>
          <div className="text-[13px] font-semibold text-ink num truncate">{tripsLabel}</div>
          <div className="text-[10px] text-faint mt-0.5">Trips W10</div>
        </div>
        <div>
          <div className={`text-[13px] font-semibold num ${tripsVsPlanCls}`}>{r.tripsVsPlan}</div>
          <div className="text-[10px] text-faint mt-0.5">vs Plan</div>
        </div>
      </div>
    </div>
  );
}

export function DrillDownView({ rows, focusSegment }: { rows: DrillRow[]; focusSegment?: string | null }) {
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'Grocery' | 'Convenience' | 'Alcohol' | 'Pharmacy'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Churned' | 'At Risk' | 'Expansion' | 'Healthy'>('all');

  // Snap to Cards view when the user arrives via a drill-in from the right-nav
  // so the highlighted card is immediately visible.
  useEffect(() => {
    if (focusSegment) setView('cards');
  }, [focusSegment]);

  const isFocused = (customer: string) => {
    if (!focusSegment) return false;
    const a = customer.toLowerCase();
    const b = focusSegment.toLowerCase();
    return a === b || a.includes(b) || b.includes(a);
  };

  const filtered = useMemo(() =>
    rows.filter(r =>
      (segmentFilter === 'all' || r.segment === segmentFilter) &&
      (statusFilter === 'all' || r.status === statusFilter)
    ),
    [rows, segmentFilter, statusFilter]
  );

  const totals = useMemo(() => ({
    arr: filtered.reduce((s, r) => s + r.arr, 0),
    delta: filtered.reduce((s, r) => s + r.deltaArr, 0),
  }), [filtered]);

  const statusColor = (s: DrillRow['status']) =>
    s === 'Churned' ? 'bg-negative-weak text-negative' :
    s === 'At Risk' ? 'bg-warning-weak text-warning' :
    s === 'Expansion' ? 'bg-positive-weak text-positive' :
    'bg-surface-soft text-muted';

  const viewBtnCls = (v: typeof view) =>
    `px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
      view === v ? 'bg-surface text-ink shadow-e1' : 'text-muted hover:text-ink'
    }`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="text-[11px] text-muted">{filtered.length} segments · {(totals.arr / 1_000_000).toFixed(1)}M trips · Δ <span className={toneClass(totals.delta)}>{fmtMoney(totals.delta, true)}</span></div>
        <div className="ml-auto inline-flex items-center gap-0.5 p-0.5 bg-surface-soft border border-rule rounded-md">
          <button onClick={() => setView('cards')} className={viewBtnCls('cards')}>Cards</button>
          <button onClick={() => setView('table')} className={viewBtnCls('table')}>Table</button>
        </div>
        <div className="flex gap-1">
          {(['all', 'Grocery', 'Convenience', 'Alcohol', 'Pharmacy'] as const).map(s => (
            <button key={s} onClick={() => setSegmentFilter(s)} className={`px-2.5 py-1 rounded-md text-[11px] ${segmentFilter === s ? 'bg-brand-tint text-brand font-semibold' : 'text-muted hover:bg-surface-soft'}`}>
              {s === 'all' ? 'All segments' : s}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['all', 'Churned', 'At Risk', 'Expansion', 'Healthy'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-2.5 py-1 rounded-md text-[11px] ${statusFilter === s ? 'bg-brand-tint text-brand font-semibold' : 'text-muted hover:bg-surface-soft'}`}>
              {s === 'all' ? 'All status' : s}
            </button>
          ))}
        </div>
      </div>

      {view === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(r => <DrillCard key={r.id} r={r} focused={isFocused(r.customer)} />)}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-brand text-white">
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Segment</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Category</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Region</th>
                <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Trips W10</th>
                <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Δ vs Plan</th>
                <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Courier Util</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Status</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const tripsLabel = r.arr >= 1_000_000
                  ? `${(r.arr / 1_000_000).toFixed(2)}M`
                  : `${(r.arr / 1_000).toFixed(0)}K`;
                const utilTone = r.nrr >= 63 ? 'text-negative'
                  : r.nrr >= 55 ? 'text-warning'
                  : 'text-positive';
                const focused = isFocused(r.customer);
                return (
                  <tr key={r.id} className={`border-t border-rule ${focused ? 'bg-brand-tint' : i % 2 === 0 ? 'bg-surface' : 'bg-surface-alt'} hover:bg-surface-soft cursor-pointer`}>
                    <td className="px-4 py-2.5 font-semibold text-ink">{r.customer}</td>
                    <td className="px-4 py-2.5 text-muted">{r.segment}</td>
                    <td className="px-4 py-2.5 text-muted">{r.region}</td>
                    <td className="px-4 py-2.5 text-right num text-ink">{tripsLabel}</td>
                    <td className={`px-4 py-2.5 text-right num font-medium ${toneClass(r.deltaArr)}`}>{r.deltaArr === 0 ? '—' : fmtMoney(r.deltaArr, true)}</td>
                    <td className={`px-4 py-2.5 text-right num ${utilTone}`}>{r.nrr}%</td>
                    <td className="px-4 py-2.5"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${statusColor(r.status)}`}>{r.status}</span></td>
                    <td className="px-4 py-2.5 text-[11px] text-faint">{r.lastActivity}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

// ==========================================================
// PERFORMANCE — Exceptions
// ==========================================================
export function ExceptionsView({ items }: { items: ExceptionItem[] }) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'positive'>('all');
  const filtered = filter === 'all' ? items : items.filter(i => i.severity === filter);

  const sevMeta = (s: ExceptionItem['severity']) =>
    s === 'critical' ? { bg: 'bg-negative-weak', text: 'text-negative', Icon: Icon.Alert, label: 'Critical' } :
    s === 'warning'  ? { bg: 'bg-warning-weak',  text: 'text-warning',  Icon: Icon.Alert, label: 'Warning' } :
                       { bg: 'bg-positive-weak', text: 'text-positive', Icon: Icon.Check, label: 'Positive' };

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-[11px] text-muted mr-2">{filtered.length} items flagged</div>
        {(['all', 'critical', 'warning', 'positive'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 rounded-md text-[11px] capitalize ${filter === f ? 'bg-brand-tint text-brand font-semibold' : 'text-muted hover:bg-surface-soft'}`}>{f}</button>
        ))}
      </div>
      <div className="space-y-2.5">
        {filtered.map(e => {
          const m = sevMeta(e.severity);
          return (
            <Card key={e.id} className="p-4 hover:shadow-e2 transition-all cursor-pointer">
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-md grid place-items-center ${m.bg} ${m.text} shrink-0 mt-0.5`} title={m.label}>
                  <m.Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-[13px] font-semibold text-ink">{e.title}</div>
                      <div className="text-[11px] text-muted mt-0.5">{e.entity} · aged {e.age}</div>
                    </div>
                    <div className={`text-[16px] font-semibold num ${e.severity === 'positive' ? 'text-positive' : 'text-negative'}`}>{e.impact}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                    <div><span className="text-faint">Driver:</span> <span className="text-ink">{e.driver}</span></div>
                    <div><span className="text-faint">Owner:</span> <span className="text-ink">{e.owner}</span></div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

// ==========================================================
// PERFORMANCE — ML Signals
// ==========================================================
export function SignalsView({ items }: { items: SignalItem[] }) {
  return (
    <>
      <div className="text-[11px] text-muted mb-3">{items.length} active signals · confidence ≥ 65%</div>
      <div className="space-y-2.5">
        {items.map(s => {
          const barColor = s.confidence >= 85 ? 'bg-negative' : s.confidence >= 70 ? 'bg-warning' : 'bg-brand';
          const dir = s.direction === 'up' ? { Ic: Icon.Trend, cls: 'text-positive' } : s.direction === 'down' ? { Ic: Icon.DownRight, cls: 'text-negative' } : { Ic: Icon.Info, cls: 'text-muted' };
          return (
            <Card key={s.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg grid place-items-center bg-brand-tint ${dir.cls} shrink-0`}>
                  <dir.Ic className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-ink">{s.title}</div>
                      <div className="text-[11px] text-muted mt-0.5">Horizon: {s.horizon} · Model: <code className="text-[10px] bg-surface-soft px-1 py-0.5 rounded">{s.model}</code></div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-faint">Confidence</div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-20 h-1.5 bg-surface-soft rounded-full overflow-hidden">
                          <div className={`h-full ${barColor}`} style={{ width: `${s.confidence}%` }} />
                        </div>
                        <span className="text-[12px] font-semibold num text-ink">{s.confidence}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[12px] text-ink leading-relaxed mt-2">{s.body}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-[11px]"><span className="text-faint">Suggested:</span> <span className="text-brand font-medium">{s.suggestedAction}</span></div>
                    <button className="text-[11px] text-muted hover:text-brand">View model details →</button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

// ==========================================================
// PERFORMANCE — History
// ==========================================================
export function HistoryView({ rows }: { rows: HistoryRow[] }) {
  return (
    <>
      <div className="text-[11px] text-muted mb-3">12-week rolling history · actuals & plan in $M (Global rollup)</div>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-brand text-white">
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Week</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Actual ($M)</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Plan</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Variance</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Demand Health</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Flagged</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Trend</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.period} className={`border-t border-rule ${i === 0 ? 'bg-brand-tint/40' : i % 2 === 0 ? 'bg-surface' : 'bg-surface-alt'} hover:bg-surface-soft`}>
                <td className="px-4 py-2.5 font-semibold text-ink">{r.period}{i === 0 && <span className="ml-2 text-[10px] font-normal text-brand">(current)</span>}</td>
                <td className="px-4 py-2.5 text-right num text-ink">{r.revenue.toFixed(1)}</td>
                <td className="px-4 py-2.5 text-right num text-muted">{r.plan.toFixed(1)}</td>
                <td className={`px-4 py-2.5 text-right num font-medium ${toneClass(r.variance)}`}>{r.variance > 0 ? '+' : ''}{r.variance.toFixed(1)}</td>
                <td className={`px-4 py-2.5 text-right num ${r.nrr < 95 ? 'text-negative' : r.nrr < 100 ? 'text-warning' : 'text-positive'}`}>{r.nrr}</td>
                <td className={`px-4 py-2.5 text-right num ${r.churn >= 2 ? 'text-negative' : r.churn >= 1 ? 'text-warning' : 'text-muted'}`}>{r.churn}</td>
                <td className="px-4 py-2.5"><Sparkline points={r.spark} /></td>
                <td className="px-4 py-2.5 text-[11px] text-muted">{r.annotations || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

// ==========================================================
// MARGIN — Waterfall
// ==========================================================
export function WaterfallView({ steps }: { steps: WaterfallStep[] }) {
  // Render a simple stacked-bar bridge using inline SVG
  const W = 760, H = 280, pad = 40;
  const allValues: number[] = [];
  let running = 0;
  steps.forEach(s => {
    if (s.kind === 'start' || s.kind === 'end') {
      running = s.value;
      allValues.push(running);
    } else {
      allValues.push(running);
      running += s.value;
      allValues.push(running);
    }
  });
  const min = Math.min(...allValues) - 0.5;
  const max = Math.max(...allValues) + 0.5;
  const scale = (v: number) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);
  const slot = (W - pad * 2) / steps.length;
  const bw = Math.min(60, slot * 0.6);

  let x = pad;
  let cum = 0;
  const bars: React.ReactElement[] = [];
  steps.forEach((s, i) => {
    let y: number, h: number, fill: string;
    if (s.kind === 'start' || s.kind === 'end') {
      y = scale(s.value);
      h = H - pad - y;
      fill = s.kind === 'start' ? 'var(--text-muted)' : 'var(--primary)';
      cum = s.value;
    } else {
      const from = cum;
      const to = cum + s.value;
      const yTop = scale(Math.max(from, to));
      const yBot = scale(Math.min(from, to));
      y = yTop;
      h = yBot - yTop;
      fill = s.value >= 0 ? 'var(--positive)' : 'var(--negative)';
      cum = to;
    }
    const cx = x + slot / 2;
    bars.push(
      <g key={i}>
        <rect x={cx - bw / 2} y={y} width={bw} height={Math.max(h, 2)} fill={fill} rx={2} />
        <text x={cx} y={y - 6} textAnchor="middle" fontSize="10" fill="var(--ink)" fontWeight="600">
          {s.kind === 'start' || s.kind === 'end' ? `${s.value.toFixed(1)}%` : `${s.value > 0 ? '+' : ''}${s.value.toFixed(1)}pp`}
        </text>
        <text x={cx} y={H - 22} textAnchor="middle" fontSize="10" fill="var(--text-muted)">{s.label.length > 14 ? s.label.slice(0, 13) + '…' : s.label}</text>
        {i < steps.length - 1 && s.kind !== 'end' && (
          <line x1={cx + bw / 2} y1={scale(cum)} x2={cx + slot - bw / 2} y2={scale(cum)} stroke="var(--rule)" strokeDasharray="2,2" strokeWidth="1" />
        )}
      </g>
    );
    x += slot;
  });

  return (
    <Card className="p-4">
      <CardHeader title="Gross Margin Bridge — Q4 FY25 → Q1 FY26" meta={<span>-0.9pp net · 8 drivers</span>} />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[280px]">
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--rule)" strokeWidth="1" />
        {bars}
      </svg>
      <div className="mt-2 flex gap-4 text-[10px] text-muted">
        <span><span className="inline-block w-2 h-2 rounded-sm bg-positive mr-1 align-middle"/>Tailwind</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-negative mr-1 align-middle"/>Headwind</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-brand mr-1 align-middle"/>End value</span>
      </div>
    </Card>
  );
}

// ==========================================================
// MARGIN — Product Mix
// ==========================================================
export function ProductMixView({ rows }: { rows: ProductMixRow[] }) {
  const maxRev = Math.max(...rows.map(r => r.revenue));
  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Card className="p-4">
          <CardHeader title="Revenue share by product" />
          <div className="space-y-2 mt-2">
            {rows.map(r => (
              <div key={r.product}>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-ink font-medium">{r.product}</span>
                  <span className="num text-muted">${r.revenue.toFixed(1)}B · {r.share.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-surface-soft rounded-full overflow-hidden">
                  <div className="h-full bg-brand" style={{ width: `${(r.revenue / maxRev) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <CardHeader title="Gross margin by product" />
          <div className="space-y-2 mt-2">
            {rows.map(r => {
              const barColor = r.gm >= 65 ? 'bg-positive' : r.gm >= 45 ? 'bg-warning' : 'bg-negative';
              return (
                <div key={r.product}>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-ink font-medium">{r.product}</span>
                    <span className="num"><span className="text-ink">{r.gm.toFixed(1)}%</span> <span className={toneClass(r.gmDelta)}>({r.gmDelta > 0 ? '+' : ''}{r.gmDelta.toFixed(1)}pp)</span></span>
                  </div>
                  <div className="h-1.5 bg-surface-soft rounded-full overflow-hidden">
                    <div className={`h-full ${barColor}`} style={{ width: `${r.gm}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-brand text-white">
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Product</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Revenue ($B)</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Share</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">GM %</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Δ GM pp</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">GM Contribution</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.product} className={`border-t border-rule ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-alt'}`}>
                <td className="px-4 py-2.5 font-semibold text-ink">{r.product}</td>
                <td className="px-4 py-2.5 text-right num text-ink">{r.revenue.toFixed(1)}</td>
                <td className="px-4 py-2.5 text-right num text-muted">{r.share.toFixed(1)}%</td>
                <td className="px-4 py-2.5 text-right num text-ink">{r.gm.toFixed(1)}%</td>
                <td className={`px-4 py-2.5 text-right num font-medium ${toneClass(r.gmDelta)}`}>{r.gmDelta > 0 ? '+' : ''}{r.gmDelta.toFixed(1)}</td>
                <td className="px-4 py-2.5 text-right num text-ink">{r.contribution.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

// ==========================================================
// MARGIN — Cost Decomposition
// ==========================================================
export function CostsView({ rows }: { rows: CostRow[] }) {
  const maxAmt = Math.max(...rows.map(r => r.amount));
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const totalDelta = rows.reduce((s, r) => s + r.qoqDelta, 0);

  const toneBar = (t: CostRow['tone']) =>
    t === 'neg' ? 'bg-negative' : t === 'warn' ? 'bg-warning' : t === 'pos' ? 'bg-positive' : 'bg-brand';

  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Card className="p-4"><div className="text-[10px] tracking-wider uppercase text-muted font-semibold">Total COGS</div><div className="text-[22px] font-semibold num mt-1 text-ink">${total.toLocaleString()}M</div></Card>
        <Card className="p-4"><div className="text-[10px] tracking-wider uppercase text-muted font-semibold">Δ vs Prior Q</div><div className={`text-[22px] font-semibold num mt-1 ${toneClass(totalDelta)}`}>{totalDelta > 0 ? '+' : ''}${totalDelta}M</div></Card>
        <Card className="p-4"><div className="text-[10px] tracking-wider uppercase text-muted font-semibold">Top Driver</div><div className="text-[16px] font-semibold mt-1 text-ink">Components <span className="text-[12px] text-negative">+$62M</span></div></Card>
      </div>
      <Card className="p-4">
        <CardHeader title="Cost categories ranked by share of COGS" meta={<span>8 categories</span>} />
        <div className="space-y-3 mt-2">
          {rows.map(r => (
            <div key={r.category}>
              <div className="flex justify-between text-[11px] mb-1">
                <div>
                  <span className="text-ink font-medium">{r.category}</span>
                  <span className="text-muted ml-2">{r.shareOfCogs.toFixed(1)}% of COGS</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`num font-medium ${toneClass(r.qoqDelta)}`}>{r.qoqDelta > 0 ? '+' : ''}${r.qoqDelta}M</span>
                  <span className="num text-ink">${r.amount}M</span>
                </div>
              </div>
              <div className="h-2 bg-surface-soft rounded-full overflow-hidden">
                <div className={`h-full ${toneBar(r.tone)}`} style={{ width: `${(r.amount / maxAmt) * 100}%` }} />
              </div>
              <div className="text-[11px] text-faint mt-1">{r.commentary}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

// ==========================================================
// MARGIN — Sensitivity
// ==========================================================
export function SensitivityView({ scenarios }: { scenarios: SensitivityScenario[] }) {
  const { push } = useToasts();
  const [selected, setSelected] = useState(scenarios[0]?.id ?? '');
  // Track which scenarios are currently running a simulation and which have
  // been pinned to the board deck. Keyed by scenario id so user can run /
  // pin different scenarios independently.
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [pinned, setPinned] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const current = scenarios.find(s => s.id === selected) ?? scenarios[0];
  const isRunning = current ? !!running[current.id] : false;
  const isPinned = current ? !!pinned[current.id] : false;
  const isComplete = current ? !!completed[current.id] : false;

  const runSimulation = () => {
    if (!current || isRunning) return;
    setRunning(prev => ({ ...prev, [current.id]: true }));
    push({ kind: 'info', title: 'Running full simulation…', sub: `${current.name} · 5,000 iterations` });
    // Simulated compute window — keeps the demo realistic without hitting an
    // actual backend. ~2.4s feels weighty for a "5k iterations" toast.
    window.setTimeout(() => {
      setRunning(prev => ({ ...prev, [current.id]: false }));
      setCompleted(prev => ({ ...prev, [current.id]: true }));
      push({
        kind: 'ok',
        title: 'Simulation complete',
        sub: `${current.name} · GM ${current.gmImpact} · EPS ${current.epsImpact} (${current.confidence}% confidence)`,
      });
    }, 2400);
  };

  const togglePin = () => {
    if (!current) return;
    const next = !isPinned;
    setPinned(prev => ({ ...prev, [current.id]: next }));
    push({
      kind: 'ok',
      title: next ? 'Pinned to Board Deck' : 'Removed from Board Deck',
      sub: next ? `${current.name} · Q1 board prep` : undefined,
    });
  };

  const riskCls = (r: SensitivityScenario['risk']) =>
    r === 'low' ? 'bg-positive-weak text-positive' :
    r === 'medium' ? 'bg-warning-weak text-warning' :
    'bg-negative-weak text-negative';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-3">
      <div className="space-y-2">
        <div className="text-[10px] tracking-wider uppercase text-muted font-semibold mb-1">Scenarios</div>
        {scenarios.map(s => (
          <button
            key={s.id}
            onClick={() => setSelected(s.id)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${selected === s.id ? 'border-brand bg-brand-tint' : 'border-rule bg-surface hover:bg-surface-soft'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-[12px] font-semibold text-ink">{s.name}</div>
              <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded ${riskCls(s.risk)}`}>{s.risk}</span>
            </div>
            <div className="text-[11px] text-muted mt-0.5">{s.lever} · {s.change}</div>
          </button>
        ))}
      </div>
      {current && (
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] tracking-wider uppercase text-muted font-semibold">Selected scenario</div>
              <h3 className="text-[18px] font-semibold text-ink mt-0.5">{current.name}</h3>
              <p className="text-[12px] text-muted mt-1">{current.lever} · <span className="font-medium text-ink">{current.change}</span></p>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${riskCls(current.risk)}`}>{current.risk} risk</div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="p-3 bg-surface-alt rounded-lg border border-rule">
              <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Gross Margin</div>
              <div className="text-[22px] font-semibold text-positive num mt-0.5">{current.gmImpact}</div>
            </div>
            <div className="p-3 bg-surface-alt rounded-lg border border-rule">
              <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Operating Margin</div>
              <div className="text-[22px] font-semibold text-positive num mt-0.5">{current.omImpact}</div>
            </div>
            <div className="p-3 bg-surface-alt rounded-lg border border-rule">
              <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">EPS Impact</div>
              <div className="text-[22px] font-semibold text-positive num mt-0.5">{current.epsImpact}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-muted">Model confidence</span>
              <span className="font-semibold text-ink num">{current.confidence}%</span>
            </div>
            <div className="h-2 bg-surface-soft rounded-full overflow-hidden">
              <div className={`h-full ${current.confidence >= 80 ? 'bg-positive' : current.confidence >= 60 ? 'bg-warning' : 'bg-negative'}`} style={{ width: `${current.confidence}%` }} />
            </div>
          </div>
          <p className="mt-4 text-[12px] text-muted leading-relaxed">{current.body}</p>
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <button
              onClick={runSimulation}
              disabled={isRunning}
              title="Runs a 5,000-iteration Monte Carlo over the scenario's input distributions and returns a P10/P50/P90 outcome range. The headline numbers above are the P50 baseline; the simulation reveals the spread and tail risk."
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-[12px] font-medium rounded-md hover:opacity-90 disabled:opacity-60 disabled:cursor-progress transition-opacity"
            >
              {isRunning ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-white/80 dot-pulse" />
                  Running…
                </>
              ) : isComplete ? (
                <>
                  <Icon.Refresh className="w-3.5 h-3.5" />
                  Re-run simulation
                </>
              ) : (
                <>
                  <Icon.WhatIf className="w-3.5 h-3.5" />
                  Run full simulation
                </>
              )}
            </button>
            <button
              onClick={togglePin}
              title="Adds the simulated outcome (P50 + range + top drivers) to the next board deck."
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors border ${
                isPinned
                  ? 'bg-brand-tint border-brand text-brand'
                  : 'border-rule text-muted hover:bg-surface-soft hover:text-ink'
              }`}
            >
              <Icon.Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-brand' : ''}`} />
              {isPinned ? 'Pinned to Board Deck' : 'Pin to Board Deck'}
            </button>
            {isComplete && !isRunning && (
              <span className="inline-flex items-center gap-1 text-[11px] text-positive font-medium">
                <Icon.Check className="w-3 h-3" />
                5,000 iterations · simulation valid
              </span>
            )}
          </div>

          {/* Simulation results — materialize after the run completes so the
              button leaves a visible artifact, not just a toast. The headline
              KPIs above are the P50; this panel shows P10/P90 spread, the
              outcome distribution, and the top sensitivity drivers. */}
          {isComplete && !isRunning && (
            <SimulationResults scenario={current} />
          )}
        </Card>
      )}
    </div>
  );
}

/**
 * Monte-Carlo result panel for the Sensitivity scenario card.
 *
 * What "Run full simulation" does conceptually: rolls the scenario's input
 * variables (price elasticity, ramp curve, FX, retention, etc) through 5,000
 * iterations using the modeled probability distributions, and emits an
 * outcome distribution for GM / OM / EPS. The card's headline KPIs are the
 * P50 (median) — this panel reveals the surrounding spread, the upside /
 * downside tails, and which inputs contribute most to the variance.
 *
 * The numbers here are deterministic from the scenario's confidence level
 * (lower confidence → wider band) so the demo is reproducible without a
 * real Monte Carlo backend.
 */
function SimulationResults({ scenario }: { scenario: SensitivityScenario }) {
  // Parse the scenario's headline impact strings into numbers so we can
  // synthesize a normal distribution centered on each.
  const parse = (s: string) => parseFloat(s.replace(/[^\d.\-]/g, '')) || 0;
  const gmMid  = parse(scenario.gmImpact);
  const omMid  = parse(scenario.omImpact);
  const epsMid = parse(scenario.epsImpact);

  // Wider band when confidence is low — confidence 50% = ±50% of midpoint,
  // confidence 95% = ±10%. Shape: span = (1 - confidence/100) * mid * 2 + floor.
  const span = (mid: number) => Math.max(Math.abs(mid) * (1 - scenario.confidence / 100) * 2, Math.abs(mid) * 0.15);
  const gmSpan = span(gmMid), omSpan = span(omMid), epsSpan = span(epsMid);

  const ranges = [
    { label: 'Gross Margin',   unit: 'pp', mid: gmMid,  span: gmSpan,  fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}pp` },
    { label: 'Operating Margin', unit: 'pp', mid: omMid,  span: omSpan,  fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}pp` },
    { label: 'EPS',              unit: '$',  mid: epsMid, span: epsSpan, fmt: (v: number) => `${v >= 0 ? '+' : ''}$${v.toFixed(2)}` },
  ];

  // Outcome histogram — 25 bins of synthetic normal samples around gmMid.
  // Reproducible per scenario id (seeded) so re-runs produce a similar shape
  // until the user re-runs (when actual MC would re-roll). Acceptable for demo.
  const bins = 25;
  const hist = (() => {
    const arr = new Array(bins).fill(0);
    let s = scenario.id.charCodeAt(scenario.id.length - 1) || 7;
    const rand = () => { s = (s * 1664525 + 1013904223) % 2147483647; return (s & 0x7fffffff) / 0x7fffffff; };
    const samples = 5000;
    const lo = gmMid - gmSpan * 1.6;
    const hi = gmMid + gmSpan * 1.6;
    for (let i = 0; i < samples; i++) {
      // Box-Muller transform for normal distribution.
      const u1 = rand() || 1e-9, u2 = rand();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const v = gmMid + z * (gmSpan * 0.45);
      const idx = Math.floor(((v - lo) / (hi - lo)) * bins);
      if (idx >= 0 && idx < bins) arr[idx]++;
    }
    const max = Math.max(...arr, 1);
    return { arr, max, lo, hi };
  })();

  // Top sensitivity drivers — synthetic but scenario-flavored so the panel
  // doesn't feel generic. Real model would surface partial-derivative ranks.
  const drivers = (() => {
    if (scenario.id === 'sc1') return [
      { name: 'Volume guarantee threshold', pct: 38 },
      { name: 'Memory spot-price drift',     pct: 27 },
      { name: 'Logistics cost variance',     pct: 18 },
      { name: 'FX (KRW/USD)',                pct: 11 },
    ];
    if (scenario.id === 'sc2') return [
      { name: 'Ramp time to productivity',   pct: 34 },
      { name: 'Attrition during onboarding',  pct: 28 },
      { name: 'Demand seasonality',           pct: 22 },
      { name: 'Wage benchmark drift',         pct: 10 },
    ];
    if (scenario.id === 'sc3') return [
      { name: 'Premium price elasticity',    pct: 46 },
      { name: 'Competitor price moves',      pct: 24 },
      { name: 'Mix shift to mid-tier',        pct: 20 },
      { name: 'Channel margin stack',         pct:  8 },
    ];
    if (scenario.id === 'sc4') return [
      { name: 'Workload utilization curve',  pct: 41 },
      { name: 'Cloud list price drift',       pct: 26 },
      { name: 'Egress cost volatility',       pct: 20 },
      { name: 'Reservation overhang risk',     pct:  9 },
    ];
    return [
      { name: 'Trial-to-paid conversion',    pct: 36 },
      { name: 'Cannibalization rate',         pct: 28 },
      { name: 'Pro+ adoption pace',           pct: 22 },
      { name: 'APAC-to-global lift transfer',  pct: 11 },
    ];
  })();

  // Histogram geometry
  const W = 480, H = 110, P = 12;
  const barW = (W - P * 2) / bins;

  return (
    <div className="mt-4 pt-4 border-t border-rule">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <span className="text-[10px] font-bold tracking-wider uppercase text-faint">
          Simulation results · 5,000 Monte-Carlo iterations
        </span>
        <span className="text-[10px] text-muted">
          P10 · P50 · P90 ranges
        </span>
      </div>

      {/* Range bars for the 3 metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
        {ranges.map(r => {
          const p10 = r.mid - r.span;
          const p90 = r.mid + r.span;
          const total = Math.abs(p90 - p10) || 1;
          const pct = (v: number) => ((v - p10) / total) * 100;
          const tone = r.mid >= 0 ? 'positive' : 'negative';
          return (
            <div key={r.label} className="bg-surface-alt rounded-md border border-rule p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{r.label}</div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className={`text-[16px] font-semibold num text-${tone}`}>{r.fmt(r.mid)}</span>
                <span className="text-[10px] text-faint">P50</span>
              </div>
              <div className="relative h-2 mt-2 rounded-full bg-surface-soft overflow-hidden">
                <div
                  className={`absolute top-0 h-full rounded-full bg-${tone}/30`}
                  style={{ left: `${pct(p10)}%`, width: `${pct(p90) - pct(p10)}%` }}
                />
                <div className={`absolute top-0 h-full w-0.5 bg-${tone}`} style={{ left: `calc(${pct(r.mid)}% - 1px)` }} />
              </div>
              <div className="flex justify-between text-[10px] text-muted num mt-1">
                <span>{r.fmt(p10)}</span>
                <span>{r.fmt(p90)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Outcome distribution histogram for GM (the headline metric) */}
      <div className="mb-4 bg-surface-alt rounded-md border border-rule p-3">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[11px] font-semibold text-ink">Outcome distribution · GM impact (pp)</span>
          <span className="text-[10px] text-muted">μ {gmMid.toFixed(2)}pp · σ {(gmSpan * 0.45).toFixed(2)}</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="block">
          {hist.arr.map((c, i) => {
            const h = (c / hist.max) * (H - P * 2);
            const x = P + i * barW;
            const y = H - P - h;
            const v = hist.lo + (i + 0.5) / bins * (hist.hi - hist.lo);
            const inMid = Math.abs(v - gmMid) <= gmSpan;
            return <rect key={i} x={x} y={y} width={Math.max(barW - 1.5, 1)} height={h} rx="1" fill={inMid ? 'var(--positive)' : 'var(--text-faint)'} opacity={inMid ? 0.85 : 0.45} />;
          })}
          {/* P50 marker */}
          {(() => {
            const xMid = P + ((gmMid - hist.lo) / (hist.hi - hist.lo)) * (W - P * 2);
            return <line x1={xMid} y1={P} x2={xMid} y2={H - P} stroke="var(--text-ink)" strokeWidth="1.5" strokeDasharray="3 3" />;
          })()}
          <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="var(--rule)" strokeWidth="1" />
        </svg>
      </div>

      {/* Top sensitivity drivers — what's contributing to the variance */}
      <div>
        <div className="text-[10px] font-bold tracking-wider uppercase text-faint mb-1.5">
          Top sensitivity drivers · % contribution to variance
        </div>
        <ul className="space-y-1.5">
          {drivers.map(d => (
            <li key={d.name} className="flex items-center gap-2.5 text-[11.5px]">
              <span className="text-ink truncate flex-1">{d.name}</span>
              <div className="w-32 h-1.5 rounded-full bg-surface-soft overflow-hidden">
                <div className="h-full bg-brand" style={{ width: `${d.pct}%` }} />
              </div>
              <span className="text-muted num w-9 text-right">{d.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ==========================================================
// FLUX — Line-item table (shared by IS / BS / CF)
// ==========================================================
export function FluxTable({ rows, unitLabel = '$M' }: { rows: FluxRow[]; unitLabel?: string }) {
  const [materialOnly, setMaterialOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unreviewed' | 'reviewed' | 'auto-closed'>('all');
  const filtered = useMemo(() =>
    rows.filter(r =>
      (!materialOnly || r.material) &&
      (statusFilter === 'all' || r.status === statusFilter)
    ),
    [rows, materialOnly, statusFilter]
  );

  const statusBadge = (s: FluxRow['status']) =>
    s === 'unreviewed' ? { cls: 'bg-warning-weak text-warning', label: 'Unreviewed' } :
    s === 'reviewed' ? { cls: 'bg-positive-weak text-positive', label: 'Reviewed' } :
    { cls: 'bg-surface-soft text-muted', label: 'Auto-closed' };

  // Group by section
  const sections = useMemo(() => {
    const map = new Map<string, FluxRow[]>();
    filtered.forEach(r => {
      if (!map.has(r.section)) map.set(r.section, []);
      map.get(r.section)!.push(r);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const counts = useMemo(() => ({
    material: rows.filter(r => r.material).length,
    unreviewed: rows.filter(r => r.status === 'unreviewed').length,
    reviewed: rows.filter(r => r.status === 'reviewed').length,
  }), [rows]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="text-[11px] text-muted mr-2">{filtered.length} of {rows.length} lines · {counts.material} material · {counts.unreviewed} unreviewed</div>
        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-rule text-[11px] cursor-pointer hover:bg-surface-soft">
          <input type="checkbox" checked={materialOnly} onChange={e => setMaterialOnly(e.target.checked)} className="accent-brand" />
          <span>Material only</span>
        </label>
        <div className="flex gap-1 ml-auto">
          {(['all', 'unreviewed', 'reviewed', 'auto-closed'] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className={`px-2.5 py-1 rounded-md text-[11px] capitalize ${statusFilter === f ? 'bg-brand-tint text-brand font-semibold' : 'text-muted hover:bg-surface-soft'}`}>
              {f === 'all' ? 'All status' : f.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-brand text-white">
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Line item</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Current ({unitLabel})</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Prior ({unitLabel})</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Variance</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">%</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Driver</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Owner</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {sections.map(([section, lines]) => (
              <Fragment key={`sec-${section}`}>
                <tr className="bg-surface-soft">
                  <td colSpan={8} className="px-4 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-muted">{section}</td>
                </tr>
                {lines.map((r, i) => {
                  const sb = statusBadge(r.status);
                  return (
                    <tr key={r.id} className={`border-t border-rule ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-alt'} hover:bg-surface-soft`}>
                      <td className="px-4 py-2 text-ink">
                        <div className="flex items-center gap-2">
                          {r.material && <span className="w-1 h-1 rounded-full bg-warning" title="Material" />}
                          <span className={r.line.startsWith('Total') || r.line === 'Net Income' || r.line === 'Operating Income' || r.line === 'Gross Profit' || r.line === 'Free Cash Flow' || r.line.startsWith('Cash from') || r.line === 'Net Change in Cash' ? 'font-semibold' : ''}>
                            {r.line}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right num text-ink">{r.current.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right num text-muted">{r.prior.toLocaleString()}</td>
                      <td className={`px-4 py-2 text-right num font-medium ${toneClass(r.variance)}`}>{r.variance > 0 ? '+' : ''}{r.variance.toLocaleString()}</td>
                      <td className={`px-4 py-2 text-right num text-[11px] ${toneClass(r.variancePct)}`}>{r.variancePct > 0 ? '+' : ''}{r.variancePct.toFixed(1)}%</td>
                      <td className="px-4 py-2 text-[11px] text-muted">{r.driver || '—'}</td>
                      <td className="px-4 py-2 text-[11px] text-muted">{r.owner}</td>
                      <td className="px-4 py-2"><span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded ${sb.cls}`}>{sb.label}</span></td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

// A small status summary shown above the FluxTable for context
export function FluxSummary({ title, kpis }: { title: string; kpis: { lbl: string; val: string; tone?: 'pos' | 'neg' | 'warn' }[] }) {
  return (
    <div className="mb-3">
      <div className="grid grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <Card key={i} className="p-3">
            <div className="text-[10px] tracking-wider uppercase text-muted font-semibold">{k.lbl}</div>
            <div className={`text-[18px] font-semibold num mt-1 ${k.tone === 'pos' ? 'text-positive' : k.tone === 'neg' ? 'text-negative' : k.tone === 'warn' ? 'text-warning' : 'text-ink'}`}>{k.val}</div>
          </Card>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <StatusChip kind="info">{title}</StatusChip>
        <Badge tone="blue">AI commentary available</Badge>
      </div>
    </div>
  );
}
