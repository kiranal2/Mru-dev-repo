import type { ReactNode } from 'react';

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
