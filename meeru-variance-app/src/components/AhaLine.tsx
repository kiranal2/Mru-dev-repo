import { useState, type ReactNode } from 'react';
import { Icon } from '../icons';

/**
 * Collapsible AI summary shown at the top of a workbench canvas.
 *
 *   ✨ AI summary ▾    ← small muted trigger pill
 *
 * When expanded, reveals a small commentary paragraph. Keeps the page clean
 * by default and lets the user opt-in to the text. Tone-muted per the app
 * theme — numbers use tinted variants, not the full saturation of status
 * chips, so the block reads as an inline summary rather than a callout.
 */
export function AhaLine({
  children,
  onSeeWhy,
  seeWhyLabel = 'See why →',
}: {
  children: ReactNode;
  onSeeWhy?: () => void;
  seeWhyLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium transition-colors ${
          open
            ? 'text-brand bg-brand-tint'
            : 'text-muted hover:text-brand hover:bg-brand-tint'
        }`}
      >
        <Icon.Sparkle className="w-3 h-3" />
        <span>AI summary</span>
        <svg
          width="9"
          height="9"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <p className="m-0 mt-1.5 text-[11.5px] leading-[1.55] text-muted anim-fade-up">
          {children}
          {onSeeWhy && (
            <>
              {' '}
              <button
                onClick={onSeeWhy}
                className="text-brand font-medium whitespace-nowrap hover:underline"
              >
                {seeWhyLabel}
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}
