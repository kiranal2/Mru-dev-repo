import { useMemo } from 'react';
import { useToasts, useSettings } from '../store';
import { UNIVERSAL_ACTIONS } from '../data';
import { usePersona } from './AppShell';
import { getActionIcon, Icon } from '../icons';
import type { ActionCard } from '../types';

function orderByRole(cards: ActionCard[], order: string[]): ActionCard[] {
  const rank = new Map(order.map((k, i) => [k, i]));
  return [...cards].sort((a, b) => (rank.get(a.kind) ?? 99) - (rank.get(b.kind) ?? 99));
}

const ACCENT: Record<string, string> = {
  slack: 'text-[#4A154B]',
  email: 'text-brand',
  im: 'text-positive',
  pin: 'text-warning',
  remind: 'text-violet-500',
  share: 'text-muted',
};

/**
 * Bottom strip — now slim, universal-only quick-action chips.
 * Contextual "Next Best Action" cards have moved into the ChatPanel
 * above the input box, where they sit right next to the AI reply.
 */
export function ActionStrip() {
  const persona = usePersona();
  const { push } = useToasts();
  const { settings } = useSettings();

  const universal = useMemo(() => {
    const filtered = UNIVERSAL_ACTIONS.filter(a => settings.pinnedActions.includes(a.kind));
    const pool = filtered.length ? filtered : UNIVERSAL_ACTIONS;
    return orderByRole(pool, persona.order);
  }, [persona.order, settings.pinnedActions]);

  const fire = (a: ActionCard) => {
    push({ kind: 'ok', title: `${a.label}`, sub: `${a.who}` });
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 h-full overflow-x-auto">
      <div className="text-[10px] font-semibold tracking-wider uppercase text-faint whitespace-nowrap pr-3 border-r border-rule h-6 flex items-center shrink-0">
        Quick Actions
      </div>
      {universal.map((a, i) => {
        const Ic = getActionIcon(a.kind);
        const accent = ACCENT[a.kind] ?? 'text-muted';
        return (
          <button
            key={`uni-${i}`}
            onClick={() => fire(a)}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rule bg-surface hover:border-brand hover:bg-brand-tint transition-all text-[11px] font-medium text-ink"
            title={a.body}
          >
            <span className={accent}><Ic className="w-3.5 h-3.5" /></span>
            <span>{a.label}</span>
          </button>
        );
      })}
      <button
        className="ml-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-rule text-muted hover:border-brand hover:bg-brand-tint hover:text-brand text-[11px] transition-all"
        onClick={() => push({ kind: 'info', title: 'More actions', sub: 'Create JE · Schedule meeting · Post to Teams · Hand off to reviewer' })}
        title="More actions"
      >
        <Icon.Plus className="w-3 h-3" />
        <span>More</span>
      </button>
    </div>
  );
}
