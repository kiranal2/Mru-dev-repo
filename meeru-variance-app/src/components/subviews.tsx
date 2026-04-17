import { Fragment, useMemo, useState } from 'react';
import type {
  DrillRow, ExceptionItem, SignalItem, HistoryRow,
  WaterfallStep, ProductMixRow, CostRow, SensitivityScenario, FluxRow,
} from '../data';
import { Card, CardHeader, StatusChip, Badge } from './ui';
import { Icon } from '../icons';

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
export function DrillDownView({ rows }: { rows: DrillRow[] }) {
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'Enterprise' | 'Mid-Market' | 'SMB'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Churned' | 'At Risk' | 'Expansion' | 'Healthy'>('all');

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

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="text-[11px] text-muted">{filtered.length} customers · ARR {fmtMoney(totals.arr, true)} · Δ <span className={toneClass(totals.delta)}>{fmtMoney(totals.delta, true)}</span></div>
        <div className="flex gap-1 ml-auto">
          {(['all', 'Enterprise', 'Mid-Market', 'SMB'] as const).map(s => (
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

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-brand text-white">
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Customer</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Segment</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Region</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">ARR</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Δ ARR</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">NRR</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Status</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} className={`border-t border-rule ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-alt'} hover:bg-surface-soft cursor-pointer`}>
                <td className="px-4 py-2.5 font-semibold text-ink">{r.customer}</td>
                <td className="px-4 py-2.5 text-muted">{r.segment}</td>
                <td className="px-4 py-2.5 text-muted">{r.region}</td>
                <td className="px-4 py-2.5 text-right num text-ink">{fmtMoney(r.arr, true)}</td>
                <td className={`px-4 py-2.5 text-right num font-medium ${toneClass(r.deltaArr)}`}>{r.deltaArr === 0 ? '—' : fmtMoney(r.deltaArr, true)}</td>
                <td className={`px-4 py-2.5 text-right num ${r.nrr === 0 ? 'text-negative' : r.nrr < 100 ? 'text-warning' : 'text-positive'}`}>{r.nrr}%</td>
                <td className="px-4 py-2.5"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${statusColor(r.status)}`}>{r.status}</span></td>
                <td className="px-4 py-2.5 text-[11px] text-faint">{r.lastActivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
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
                <div className={`w-10 h-10 rounded-lg grid place-items-center ${m.bg} ${m.text} shrink-0`}>
                  <m.Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink">{e.title}</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded ${m.bg} ${m.text}`}>{m.label}</span>
                      </div>
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
      <div className="text-[11px] text-muted mb-3">Rolling 8 quarters · revenue in $B, NRR in %</div>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-brand text-white">
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold">Period</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Revenue ($B)</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Plan</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Variance</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">NRR</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold">Churns</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold">NRR Trend</th>
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
                <td className={`px-4 py-2.5 text-right num ${r.nrr < 110 ? 'text-warning' : 'text-positive'}`}>{r.nrr}%</td>
                <td className={`px-4 py-2.5 text-right num ${r.churn >= 2 ? 'text-negative' : 'text-muted'}`}>{r.churn}</td>
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
  const [selected, setSelected] = useState(scenarios[0]?.id ?? '');
  const current = scenarios.find(s => s.id === selected) ?? scenarios[0];
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
          <div className="mt-4 flex gap-2">
            <button className="px-3 py-1.5 bg-brand text-white text-[12px] font-medium rounded-md hover:opacity-90">Run full simulation</button>
            <button className="px-3 py-1.5 border border-rule text-muted text-[12px] font-medium rounded-md hover:bg-surface-soft">Pin to Board Deck</button>
          </div>
        </Card>
      )}
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
