import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { LeftItem } from '../types';

// Small shared primitives — Badge, StatusChip, EyebrowLabel, etc.

export function Badge({ tone = 'blue', children }: { tone?: 'red' | 'green' | 'amber' | 'blue'; children: ReactNode }) {
  const cls = {
    red: 'bg-negative-weak text-negative',
    green: 'bg-positive-weak text-positive',
    amber: 'bg-warning-weak text-warning',
    blue: 'bg-brand-tint text-brand',
  }[tone];
  return <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${cls}`}>{children}</span>;
}

export function StatusChip({ kind, children }: { kind: 'neg' | 'pos' | 'warn' | 'info'; children: ReactNode }) {
  const map = { neg: 'chip-neg', pos: 'chip-pos', warn: 'chip-warn', info: 'chip-info' };
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${map[kind]}`}><span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />{children}</span>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="text-[10px] font-semibold tracking-wider uppercase text-muted">{children}</span>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-surface border border-rule rounded-xl shadow-e1 ${className}`}>{children}</div>;
}

export function CardHeader({ title, meta }: { title: string; meta?: ReactNode }) {
  return (
    <div className="flex justify-between items-center mb-2.5">
      <div className="text-[13px] font-semibold text-ink">{title}</div>
      {meta && <div className="text-[11px] text-faint">{meta}</div>}
    </div>
  );
}

export function Divider() {
  return <hr className="border-t border-rule" />;
}

/**
 * Compact dropdown for top-bar filters that used to live in the left rail.
 * Keeps the display tight: "{label}: {activeName} ▾". Click opens a small
 * menu below. Click-outside + Esc close. Active item highlighted.
 */
export function InlineFilterMenu({
  label,
  items,
  value,
  onChange,
  align = 'right',
}: {
  label: string;
  items: LeftItem[];
  value: string;
  onChange: (k: string) => void;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = items.find(i => i.k === value) ?? items[0];

  // Close on outside click + Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
          open
            ? 'border-brand bg-brand-tint text-brand'
            : 'border-rule bg-surface text-ink hover:border-brand hover:bg-brand-tint'
        }`}
      >
        <span className="text-muted">{label}</span>
        <span className="font-semibold">{active?.n ?? '—'}</span>
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute top-full mt-1 ${align === 'right' ? 'right-0' : 'left-0'} z-50 min-w-[180px] rounded-lg border border-rule bg-surface shadow-e2 py-1`}
          role="listbox"
        >
          {items.map(it => {
            const isActive = it.k === value;
            const toneCls =
              it.tone === 'pos' ? 'text-positive' :
              it.tone === 'neg' ? 'text-negative' :
              it.tone === 'warn' ? 'text-warning' : 'text-faint';
            return (
              <button
                key={it.k}
                type="button"
                onClick={() => { onChange(it.k); setOpen(false); }}
                role="option"
                aria-selected={isActive}
                className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[12px] text-left transition-colors ${
                  isActive
                    ? 'bg-brand-tint text-brand font-semibold'
                    : 'text-ink hover:bg-surface-soft'
                }`}
              >
                <span>{it.n}</span>
                {it.d && (
                  <span className={`text-[11px] font-medium num ${isActive ? 'text-brand' : toneCls}`}>
                    {it.d}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
