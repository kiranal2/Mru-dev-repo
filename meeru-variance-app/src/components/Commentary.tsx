import type { CommentaryItem } from '../types';
import { Badge, Card, CardHeader } from './ui';

export function Commentary({ items, title = 'AI-Generated Commentary — Ranked by Impact' }: { items: CommentaryItem[]; title?: string }) {
  return (
    <Card className="p-3.5 mb-3">
      <CardHeader title={title} meta={<span>{items.length} ranked · sparkle explanations ready</span>} />
      {items.map((c, idx) => {
        const deltaCls = c.delta.startsWith('+') ? 'text-positive' : 'text-negative';
        return (
          <div key={c.rank} className={`flex gap-2.5 py-2.5 ${idx > 0 ? 'border-t border-rule' : ''}`}>
            <div className="w-6 h-6 rounded-full bg-surface-soft grid place-items-center text-[11px] font-semibold text-ink shrink-0">{c.rank}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px]">
                <span className="font-semibold text-ink">{c.name}</span>
                <span className={`ml-1.5 text-[11px] font-medium ${deltaCls}`}>— {c.delta}</span>
              </div>
              <div className="text-[12px] text-muted leading-relaxed mt-0.5">{c.text}</div>
              {c.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {c.tags.map((t, i) => <Badge key={i} tone={t.t}>{t.l}</Badge>)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </Card>
  );
}
