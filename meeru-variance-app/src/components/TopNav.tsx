import { TOP_TAB_LABELS } from '../data';

interface Props {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
  dots?: Record<string, number>; // unread counts per tab
}

export function TopNav({ tabs, active, onChange, dots = {} }: Props) {
  return (
    <div className="flex items-center justify-between px-4 h-12">
      <div className="flex gap-0.5">
        {tabs.map(k => {
          const isActive = active === k;
          const count = dots[k];
          return (
            <button
              key={k}
              onClick={() => onChange(k)}
              className={`relative px-3 h-12 text-[12px] inline-flex items-center gap-1.5 transition-colors ${
                isActive ? 'text-ink font-semibold' : 'text-muted hover:text-ink'
              }`}
            >
              <span>{TOP_TAB_LABELS[k] ?? k}</span>
              {count && count > 0 && <span className="w-1.5 h-1.5 rounded-full bg-negative" title={`${count} flagged`} />}
              {isActive && <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 bg-brand rounded-full" />}
            </button>
          );
        })}
      </div>
      <div className="hidden lg:flex items-center gap-2 text-[11px] text-muted">
        <span className="num">Sources 9/9</span>
        <span className="text-faint">·</span>
        <span className="num">Segments 12</span>
        <span className="text-faint">·</span>
        <span>Generated 08:38 AM</span>
      </div>
    </div>
  );
}
