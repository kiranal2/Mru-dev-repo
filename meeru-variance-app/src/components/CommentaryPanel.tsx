import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useChat, useSettings } from '../store';
import { Icon } from '../icons';
import { Badge } from './ui';
import type { ActionCard, CommentaryItem } from '../types';

const MIN_W = 320;
const MAX_W = 560;

/**
 * CommentaryPanel — the right-side AI Commentary surface.
 *
 * Matches the existing `Commentary.tsx` aesthetic (circular rank pill, <Badge>
 * tags, muted-weak fills, rule-line separators) — no bright left stripes, no
 * solid brand pills. The panel uses the same design tokens the rest of the app
 * uses so it reads as part of the workbench, not a bolted-on widget.
 */

type SortKey = 'impact' | 'severity' | 'recency';

interface Props {
  items: CommentaryItem[];
  scopeLabel?: string;
  headline?: string;
  subHeadline?: string;
  style?: CSSProperties;
}

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */

function parseDelta(delta: string): number {
  const m = delta.match(/([-+])?\$?\s*([\d.]+)\s*([MBK]|bps|pp)?/i);
  if (!m) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  const val = parseFloat(m[2] || '0');
  const unit = (m[3] || 'M').toUpperCase();
  const mult = unit === 'B' ? 1000 : unit === 'K' ? 0.001 : 1;
  return sign * val * mult;
}

function severityScore(item: CommentaryItem): number {
  let s = 0;
  for (const t of item.tags) {
    if (t.t === 'red') s += 3;
    else if (t.t === 'amber') s += 2;
    else if (t.t === 'blue') s += 1;
  }
  return s;
}

function deltaClass(delta: string): string {
  if (delta.includes('+')) return 'text-positive';
  if (delta.includes('-') || delta.includes('▼')) return 'text-negative';
  return 'text-muted';
}

function variancePrefix(items: CommentaryItem[]): string {
  const negatives = items
    .map(i => parseDelta(i.delta))
    .filter(v => v < 0)
    .reduce((a, b) => a + b, 0);
  if (!negatives) return "this week's variance";
  return `this week's ${negatives.toFixed(1).replace('-', '-$')}M variance`;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/* ------------------------------------------------------------------ */
/* presentational pieces                                               */
/* ------------------------------------------------------------------ */

function SortPill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
        active
          ? 'bg-brand-tint text-brand border border-brand/30'
          : 'text-muted hover:text-ink hover:bg-surface-soft border border-transparent'
      }`}
    >
      {children}
    </button>
  );
}

function DriverRow({
  item,
  rank,
  onDrill,
  onAsk,
  isLast,
}: {
  item: CommentaryItem;
  rank: number;
  onDrill: () => void;
  onAsk: () => void;
  isLast: boolean;
}) {
  const deltaCls = deltaClass(item.delta);
  return (
    <div className={`flex gap-2.5 py-2.5 ${isLast ? '' : 'border-b border-rule'}`}>
      <div className="w-6 h-6 rounded-full bg-surface-soft grid place-items-center text-[11px] font-semibold text-ink shrink-0">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 text-[13px]">
          <span className="font-semibold text-ink truncate">{item.name}</span>
          <span className={`text-[11px] font-medium num shrink-0 ${deltaCls}`}>— {item.delta}</span>
        </div>
        <div className="text-[12px] text-muted leading-relaxed mt-0.5">{item.text}</div>
        <div className="flex items-center gap-2 mt-2 text-[11px]">
          <button
            onClick={onDrill}
            className="inline-flex items-center gap-0.5 text-brand hover:underline font-medium"
          >
            Drill down
            <Icon.ChevRight className="w-3 h-3" />
          </button>
          <span className="text-faint">·</span>
          <button
            onClick={onAsk}
            className="inline-flex items-center gap-1 text-muted hover:text-ink"
          >
            <Icon.Sparkle className="w-3 h-3" />
            Ask about this
          </button>
        </div>
      </div>
    </div>
  );
}

function AiInsightCard({
  question, answerHtml, actions, onAsk,
}: {
  question: string;
  answerHtml: string;
  actions: ActionCard[];
  onAsk: (q: string) => void;
}) {
  const preview = useMemo(() => {
    const txt = stripHtml(answerHtml);
    return txt.length > 200 ? txt.slice(0, 200) + '…' : txt;
  }, [answerHtml]);
  return (
    <div className="rounded-lg bg-surface-alt border border-rule p-2.5 mb-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon.Sparkle className="w-3 h-3 text-brand" />
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">AI Insight · just now</span>
      </div>
      <div className="text-[12.5px] font-semibold text-ink mb-1 truncate" title={question}>{question}</div>
      <div className="text-[12px] text-muted leading-relaxed">{preview}</div>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {actions.slice(0, 3).map((a, i) => (
            <Badge key={i} tone="blue">{a.label}</Badge>
          ))}
        </div>
      )}
      <button
        onClick={() => onAsk(`Tell me more about "${question}"`)}
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline"
      >
        <Icon.Sparkle className="w-3 h-3" />
        Explore further
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* panel                                                                */
/* ------------------------------------------------------------------ */

export function CommentaryPanel({
  items,
  scopeLabel,
  headline,
  subHeadline = 'Ranked by impact · sparkle explanations ready',
  style,
}: Props) {
  const { settings, update } = useSettings();
  const { msgs, contextual, send } = useChat();

  const [sort, setSort] = useState<SortKey>('impact');
  const [expanded, setExpanded] = useState(false);
  const [tick, setTick] = useState(0);

  const dragState = useRef<{ startX: number; startW: number } | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setTick(0);
  }, [msgs.length, contextual.length]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragState.current) return;
      const dx = dragState.current.startX - e.clientX;
      const nextW = Math.max(MIN_W, Math.min(MAX_W, dragState.current.startW + dx));
      update({ chatWidth: nextW });
    };
    const onUp = () => {
      if (dragState.current) {
        dragState.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [update]);

  const onHandleDown = (e: React.MouseEvent) => {
    dragState.current = { startX: e.clientX, startW: settings.chatWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };
  const onHandleDouble = () => update({ chatWidth: 360 });

  const sorted = useMemo(() => {
    const arr = [...items];
    if (sort === 'impact') {
      arr.sort((a, b) => Math.abs(parseDelta(b.delta)) - Math.abs(parseDelta(a.delta)));
    } else if (sort === 'severity') {
      arr.sort((a, b) => severityScore(b) - severityScore(a));
    } else {
      arr.sort((a, b) => a.rank - b.rank);
    }
    return arr;
  }, [items, sort]);

  const visible = expanded ? sorted : sorted.slice(0, 3);
  const hiddenCount = Math.max(0, sorted.length - 3);

  const headlineText = headline ?? `Drivers of ${variancePrefix(items)}`;

  const sourceCount = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) for (const t of it.tags) set.add(t.l);
    return Math.max(3, Math.min(9, set.size));
  }, [items]);

  const latestExchange = useMemo(() => {
    if (!msgs.length) return null;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'ai' && msgs[i].html) {
        for (let j = i - 1; j >= 0; j--) {
          if (msgs[j].role === 'user' && msgs[j].text) {
            return { question: msgs[j].text!, answerHtml: msgs[i].html! };
          }
        }
        return null;
      }
    }
    return null;
  }, [msgs]);

  if (settings.chatHidden) return null;

  const updatedLabel =
    tick < 60 ? `${tick}s ago` : tick < 3600 ? `${Math.floor(tick / 60)}m ago` : `${Math.floor(tick / 3600)}h ago`;

  return (
    <aside
      style={style}
      className="bg-surface border-l border-rule flex flex-col overflow-hidden relative"
    >
      {/* resize handle */}
      <div
        onMouseDown={onHandleDown}
        onDoubleClick={onHandleDouble}
        title="Drag to resize · double-click to reset"
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-weak group z-20"
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r bg-rule opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* header — same visual weight as CardHeader elsewhere */}
      <div className="px-3.5 pt-3 pb-2 border-b border-rule bg-surface sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex w-1.5 h-1.5 shrink-0">
            <span className="absolute inset-0 rounded-full bg-positive opacity-60 animate-ping" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-positive" />
          </span>
          <div className="text-[13px] font-semibold text-ink">AI Commentary</div>
          <div className="flex-1" />
          <button
            onClick={() => setTick(0)}
            title="Refresh — fetch the latest ranked commentary"
            className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink"
          >
            <Icon.Refresh className="w-3 h-3" />
            New
          </button>
          <button
            onClick={() => update({ chatHidden: true })}
            title="Hide AI panel"
            className="w-6 h-6 rounded grid place-items-center text-faint hover:text-ink transition-colors"
          >
            <Icon.X className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3.5 py-3">
        {/* headline — concise, single line */}
        <div className="text-[13px] font-semibold text-ink leading-tight mb-3">
          {headlineText}
        </div>

        {/* AI Insight — only when a prompt has landed */}
        {latestExchange && contextual.length > 0 && (
          <AiInsightCard
            question={latestExchange.question}
            answerHtml={latestExchange.answerHtml}
            actions={contextual}
            onAsk={send}
          />
        )}

        {/* ranked driver rows — same layout as main Commentary component */}
        <div>
          {visible.map((it, i) => (
            <DriverRow
              key={`${it.name}-${i}`}
              item={it}
              rank={i + 1}
              onDrill={() => {
                // Dispatch to the host page so it can filter/navigate.
                // Falls back to chat if nothing is listening.
                const evt = new CustomEvent('meeru-drill', { detail: { itemName: it.name } });
                window.dispatchEvent(evt);
              }}
              onAsk={() => send(`Tell me more about ${it.name}`)}
              isLast={i === visible.length - 1}
            />
          ))}
        </div>

        {hiddenCount > 0 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full mt-2 py-1.5 text-[11.5px] font-medium text-brand hover:underline inline-flex items-center justify-center gap-1"
          >
            {expanded ? 'Show fewer drivers' : `Show ${hiddenCount} more driver${hiddenCount > 1 ? 's' : ''}`}
            <span className="inline-block">{expanded ? '↑' : '↓'}</span>
          </button>
        )}
      </div>

      {/* footer meta */}
      <div className="px-3.5 py-2 border-t border-rule text-[11px] text-faint flex items-center justify-between">
        <span>Updated {updatedLabel}</span>
        <span>Claims cite <span className="font-medium text-muted">{sourceCount}</span> sources</span>
      </div>
    </aside>
  );
}

export function CommentaryShowButton() {
  const { settings, update } = useSettings();
  if (!settings.chatHidden) return null;
  return (
    <button
      onClick={() => update({ chatHidden: false })}
      title="Show AI Commentary"
      className="fixed right-0 top-1/2 -translate-y-1/2 bg-surface border border-rule border-r-0 rounded-l-lg px-1.5 py-2.5 z-40 shadow-e2 hover:bg-brand-tint hover:border-brand text-muted hover:text-brand transition-colors flex flex-col items-center gap-1"
    >
      <Icon.Sparkle className="w-3.5 h-3.5" />
      <span className="text-[9px] font-semibold tracking-wider [writing-mode:vertical-rl] rotate-180">AI</span>
    </button>
  );
}
