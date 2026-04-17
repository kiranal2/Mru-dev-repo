import { useState } from 'react';
import { useChat, useToasts } from '../store';
import { Card, Eyebrow, StatusChip } from '../components/ui';
import { Icon } from '../icons';
import type { SavedReply } from '../types';

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function ItemCard({ item, onRemove, action }: { item: SavedReply; onRemove: () => void; action: 'pinned' | 'saved' }) {
  const [expanded, setExpanded] = useState(false);
  const { push } = useToasts();

  const copyAnswer = () => {
    try { navigator.clipboard?.writeText(item.answerText); } catch {}
    push({ kind: 'ok', title: 'Copied', sub: `${item.answerText.length} characters` });
  };

  return (
    <Card className="p-4 hover:shadow-e2 transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold tracking-wider uppercase text-muted flex items-center gap-2">
            <Icon.Sparkle className="w-3 h-3 text-brand" />
            Reply to
          </div>
          <div className="text-[13px] font-semibold text-ink mt-0.5 line-clamp-1">{item.question}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${action === 'pinned' ? 'bg-warning-weak text-warning' : 'bg-brand-tint text-brand'}`}>
            {action}
          </span>
        </div>
      </div>

      <div
        className={`text-[12px] text-ink leading-relaxed p-2.5 rounded-lg bg-surface-alt border border-rule ${expanded ? '' : 'line-clamp-3'}`}
        dangerouslySetInnerHTML={{ __html: item.answerHtml }}
      />

      {item.answerText.length > 200 && (
        <button onClick={() => setExpanded(v => !v)} className="mt-1 text-[11px] text-brand hover:underline">
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-rule/60">
        <div className="flex items-center gap-2 text-[10px] text-faint">
          <span>{fmtDate(item.timestamp)}</span>
          <span>·</span>
          <span>{item.scope}</span>
          <span>·</span>
          <span>{item.persona}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={copyAnswer} className="p-1 rounded hover:bg-surface-soft text-faint hover:text-brand" title="Copy text">
            <Icon.Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={onRemove} className="p-1 rounded hover:bg-negative-weak text-faint hover:text-negative" title={`Remove from ${action}`}>
            <Icon.X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function Notebook() {
  const { pinned, saved, removePinned, removeSaved } = useChat();
  const [tab, setTab] = useState<'saved' | 'pinned'>('saved');
  const items = tab === 'saved' ? saved : pinned;

  return (
    <div className="flex-1 overflow-auto bg-surface-alt p-6">
      <div className="max-w-[820px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <Eyebrow>Notebook</Eyebrow>
            <h1 className="text-[22px] font-semibold text-ink tracking-tight mt-0.5">Saved & pinned AI replies</h1>
            <p className="text-[12px] text-muted mt-1">Every reply you mark with Save or Pin in the chat lands here. Items persist locally across sessions.</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusChip kind="info">{saved.length} saved · {pinned.length} pinned</StatusChip>
          </div>
        </div>

        <div className="flex gap-1 mb-4 border-b border-rule">
          <button
            onClick={() => setTab('saved')}
            className={`relative px-4 py-2 text-[12px] font-medium transition-colors ${tab === 'saved' ? 'text-brand' : 'text-muted hover:text-ink'}`}
          >
            Saved ({saved.length})
            {tab === 'saved' && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand rounded-full" />}
          </button>
          <button
            onClick={() => setTab('pinned')}
            className={`relative px-4 py-2 text-[12px] font-medium transition-colors ${tab === 'pinned' ? 'text-brand' : 'text-muted hover:text-ink'}`}
          >
            Pinned ({pinned.length})
            {tab === 'pinned' && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand rounded-full" />}
          </button>
        </div>

        {items.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-surface-alt grid place-items-center mb-3">
              {tab === 'saved' ? <Icon.File className="w-5 h-5 text-muted" /> : <Icon.Pin className="w-5 h-5 text-muted" />}
            </div>
            <div className="text-[14px] font-semibold text-ink">No {tab} replies yet</div>
            <div className="text-[12px] text-muted mt-1 max-w-[420px] mx-auto">
              Open any workbench, ask the AI a question, and click {tab === 'saved' ? '"Save"' : '"Pin"'} below the reply. It will appear here.
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map(it => (
              <ItemCard
                key={it.id}
                item={it}
                action={tab}
                onRemove={() => tab === 'saved' ? removeSaved(it.id) : removePinned(it.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
