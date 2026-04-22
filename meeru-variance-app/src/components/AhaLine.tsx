import type { ReactNode } from 'react';

/**
 * Compact AI one-liner shown at the top of a workbench canvas.
 *
 *  ┌──┐
 *  │AI│  Q1 revenue $46.8M vs plan $50.0M — missed by -$3.2M. New business ...
 *  └──┘
 *
 * Designed to replace the heavy "AI-Generated Commentary" block that previously
 * consumed the whole top of the canvas. Keeps the human-readable headline
 * front-and-center while the detail lives in the right panel / bridge below.
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
  return (
    <div className="flex gap-2.5 items-start mb-3">
      <div
        className="w-[22px] h-[22px] rounded-full bg-brand text-white text-[9.5px] font-bold grid place-items-center shrink-0 mt-0.5 tracking-wide"
        title="AI explanation"
      >
        AI
      </div>
      <p className="m-0 text-[13px] leading-[1.55] text-ink">
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
    </div>
  );
}
