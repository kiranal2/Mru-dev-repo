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
              {count && count > 0 && (
                <span className="relative flex">
                  <span className="w-1.5 h-1.5 rounded-full bg-negative alert-pulse" title={`${count} flagged`} />
                </span>
              )}
              {isActive && <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 bg-brand rounded-full" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
