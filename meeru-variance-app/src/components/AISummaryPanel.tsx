import { useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../icons';
import { useChat, useToasts } from '../store';
import { RouteToControllerModal, AddToWatchlistModal } from './AISummaryModals';

export type Severity = 'critical' | 'warning' | 'note';

const SEVERITY_STYLES: Record<Severity, {
  dotBg: string;
  chipText: string;
  label: string;
}> = {
  critical: { dotBg: 'bg-negative', chipText: 'text-negative', label: 'Action required' },
  warning:  { dotBg: 'bg-warning',  chipText: 'text-warning',  label: 'Monitor' },
  note:     { dotBg: 'bg-positive', chipText: 'text-muted',    label: 'On track' },
};

interface Props {
  severity: Severity;
  /** Override for the chip label (e.g., "Variance flagged · action recommended"). */
  severityLabel?: string;
  /** Body of the AI Summary. */
  text: ReactNode;
  /** Workbench scope label — passed to modals so they know what they're acting on. */
  scopeLabel: string;
  /** Optional headline variance number — surfaces in modal subtitles. */
  varianceDelta?: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

/**
 * AI Summary container — a calm narrative panel with two end-action buttons:
 * "AI Diagnose" (always available, opens a rich diagnosis modal with charts) and
 * a severity-specific second action (Route to Controller for critical issues,
 * Add to watchlist for warnings). Note severity gets just the diagnose button —
 * there's nothing to escalate when on track.
 */
export function AISummaryPanel({
  severity, severityLabel, text, scopeLabel, varianceDelta, open, onToggle, onClose,
}: Props) {
  const s = SEVERITY_STYLES[severity];
  const chipText = severityLabel ?? s.label;
  const { send } = useChat();
  const { push } = useToasts();

  // Route + Watchlist still get small dialogs (they're forms, not narratives).
  // Diagnose ditches the modal entirely — it pushes a rich answer (with charts)
  // straight into the Command Center transcript so the user stays in flow.
  const [openModal, setOpenModal] = useState<'route' | 'watch' | null>(null);

  const onDiagnose = () => {
    send(`Run an AI diagnosis for ${scopeLabel}${varianceDelta ? ` (${varianceDelta})` : ''}. Show driver decomposition, 10-week trend, and recommended levers.`);
    push({ kind: 'info', title: 'Diagnosing…', sub: 'Continuing in Command Center' });
  };

  return (
    <>
      <div className="relative mb-3 rounded-lg border border-rule bg-surface anim-fade-up">
        <div className="flex items-center gap-2.5 px-3.5 py-2">
          <Icon.Sparkle className="w-3.5 h-3.5 text-brand shrink-0" />
          <span className="text-[10.5px] font-bold tracking-wider uppercase text-faint">
            AI Summary
          </span>
          <span className="text-faint">·</span>
          <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium ${s.chipText}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dotBg}`} />
            {chipText}
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            title={open ? 'Collapse' : 'Expand'}
            className="w-7 h-7 rounded grid place-items-center text-faint hover:text-ink hover:bg-surface-soft transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
            >
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Hide AI summary"
            className="w-7 h-7 rounded grid place-items-center text-faint hover:text-ink hover:bg-surface-soft transition-colors"
          >
            <Icon.X className="w-3.5 h-3.5" />
          </button>
        </div>

        {open && (
          <div className="px-3.5 pb-3 pt-1 border-t border-rule">
            <p className="text-[12.5px] leading-[1.55] text-ink mt-3 mb-3">
              {text}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Primary AI action — pushes a rich diagnostic answer (charts +
                  lineage) into the Command Center transcript. Stays in-flow
                  instead of bouncing the user into a modal. */}
              <ActionButton
                primary
                icon={<Icon.Sparkle className="w-3 h-3" />}
                label="AI Diagnose"
                onClick={onDiagnose}
              />
              {/* Severity-specific secondary action. Critical → escalate to
                  Controller; warning → watchlist; note → no second action. */}
              {severity === 'critical' && (
                <ActionButton
                  icon={<Icon.Share className="w-3 h-3" />}
                  label="Route to Controller"
                  onClick={() => setOpenModal('route')}
                />
              )}
              {severity === 'warning' && (
                <ActionButton
                  icon={<Icon.Pin className="w-3 h-3" />}
                  label="Add to watchlist"
                  onClick={() => setOpenModal('watch')}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {openModal === 'route' && (
        <RouteToControllerModal
          severity={severity}
          scopeLabel={scopeLabel}
          varianceDelta={varianceDelta}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === 'watch' && (
        <AddToWatchlistModal
          scopeLabel={scopeLabel}
          onClose={() => setOpenModal(null)}
        />
      )}
    </>
  );
}

function ActionButton({
  icon, label, onClick, primary,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  if (primary) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-semibold text-white bg-brand hover:opacity-90 transition-opacity"
      >
        {icon}
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-medium text-muted hover:text-ink hover:bg-surface-soft transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}
