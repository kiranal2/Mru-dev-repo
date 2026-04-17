import type { LeftItem } from '../types';

interface GroupProps {
  label: string;
  items: LeftItem[];
  active?: string | null;
  onSelect: (k: string) => void;
  /** Optional: group key passed as data attribute for mission glow targeting */
  groupKey?: string;
}

export function RailGroup({ label, items, active, onSelect, groupKey }: GroupProps) {
  return (
    <div className="mb-3.5">
      <div className="flex justify-between items-center px-1.5 pb-1.5">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-muted">{label}</span>
      </div>
      {items.map(it => {
        const isActive = it.k === active;
        const toneCls = it.tone === 'pos' ? 'text-positive' : it.tone === 'neg' ? 'text-negative' : it.tone === 'warn' ? 'text-warning' : 'text-faint';
        return (
          <button
            key={it.k}
            onClick={() => onSelect(it.k)}
            data-left-key={it.k}
            data-left-group={groupKey}
            className={`w-full flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-md text-[12px] text-left mb-0.5 transition-colors ${
              isActive
                ? 'bg-brand-tint text-brand font-semibold dark:bg-brand-weak dark:text-blue-200'
                : 'text-muted hover:bg-surface-soft hover:text-ink'
            }`}
          >
            <span>{it.n}</span>
            {it.d && <span className={`text-[11px] font-medium num ${isActive ? 'text-brand' : toneCls}`}>{it.d}</span>}
          </button>
        );
      })}
    </div>
  );
}
