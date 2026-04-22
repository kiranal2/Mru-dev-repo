import { useMemo, useState } from 'react';
import { useChat, useToasts } from '../store';
import { usePersona } from './AppShell';
import { Icon } from '../icons';
import { SlackPreviewModal } from './SlackPreviewModal';
import type { ActionCard, ActionKind } from '../types';

function orderByRole(cards: ActionCard[], order: string[]): ActionCard[] {
  const rank = new Map(order.map((k, i) => [k, i]));
  return [...cards].sort((a, b) => (rank.get(a.kind) ?? 99) - (rank.get(b.kind) ?? 99));
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

// ────────────────────────────────────────────────────────────
// Per-kind visual treatment
// ────────────────────────────────────────────────────────────

const VERB: Record<string, { label: string; doneLabel: string }> = {
  slack:       { label: 'Send',    doneLabel: '✓ Sent' },
  email:       { label: 'Send',    doneLabel: '✓ Sent' },
  im:          { label: 'Send',    doneLabel: '✓ Sent' },
  pin:         { label: 'Pin it',  doneLabel: '✓ Pinned' },
  remind:      { label: 'Schedule', doneLabel: '✓ Scheduled' },
  share:       { label: 'Share',   doneLabel: '✓ Shared' },
  approve:     { label: 'Approve', doneLabel: '✓ Approved' },
  whatif:      { label: 'Run',     doneLabel: '✓ Ran' },
  open:        { label: 'Open',    doneLabel: '✓ Opened' },
  investigate: { label: 'Investigate', doneLabel: '✓ Opened' },
};

const KIND_THEME: Record<ActionKind, { primaryBg: string; primaryText: string; tint: string; label: string }> = {
  slack:       { primaryBg: 'bg-[#4A154B] hover:bg-[#4A154B]/90', primaryText: 'text-[#4A154B]', tint: 'bg-[#4A154B]/5',     label: 'Slack' },
  email:       { primaryBg: 'bg-brand hover:opacity-90',          primaryText: 'text-brand',     tint: 'bg-brand-tint',      label: 'Email' },
  im:          { primaryBg: 'bg-positive hover:opacity-90',        primaryText: 'text-positive',  tint: 'bg-[#16A34A]/10',    label: 'Direct Message' },
  pin:         { primaryBg: 'bg-warning hover:opacity-90',         primaryText: 'text-warning',   tint: 'bg-[#F59E0B]/10',    label: 'Workspace' },
  remind:      { primaryBg: 'bg-[#8B5CF6] hover:bg-[#7C3AED]',     primaryText: 'text-[#8B5CF6]', tint: 'bg-[#8B5CF6]/10',    label: 'Reminder' },
  share:       { primaryBg: 'bg-muted hover:opacity-90',           primaryText: 'text-muted',     tint: 'bg-surface-soft',    label: 'Share' },
  approve:     { primaryBg: 'bg-positive hover:opacity-90',        primaryText: 'text-positive',  tint: 'bg-[#16A34A]/10',    label: 'Approval' },
  whatif:      { primaryBg: 'bg-brand hover:opacity-90',           primaryText: 'text-brand',     tint: 'bg-brand-tint',      label: 'What-if' },
  open:        { primaryBg: 'bg-brand hover:opacity-90',           primaryText: 'text-brand',     tint: 'bg-brand-tint',      label: 'Workbench' },
  investigate: { primaryBg: 'bg-warning hover:opacity-90',         primaryText: 'text-warning',   tint: 'bg-[#F59E0B]/10',    label: 'Investigation' },
};

// ────────────────────────────────────────────────────────────
// Per-kind header chrome (the top strip of each card)
// ────────────────────────────────────────────────────────────

function ChromeHeader({ kind, who }: { kind: ActionKind; who: string }) {
  const t = KIND_THEME[kind];

  if (kind === 'slack') {
    // Slack-style: channel + "preview" chip
    const channel = who.split('·').pop()?.trim().toLowerCase().replace(/\s+/g, '-') ?? 'finance';
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 ${t.tint} border-b border-rule`}>
        <Icon.Slack className="w-3.5 h-3.5 text-[#4A154B]" />
        <span className="text-[11px] font-semibold text-ink">#{channel}</span>
        <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider text-faint">Preview</span>
      </div>
    );
  }

  if (kind === 'email') {
    const to = who.replace(/.*·\s*/, '').toLowerCase().replace(/\s+/g, '.');
    return (
      <div className={`px-3 py-1.5 ${t.tint} border-b border-rule space-y-0.5`}>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-faint w-6">To</span>
          <span className="font-semibold text-ink truncate">{to}@meeru.ai</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-faint w-6">Re</span>
          <span className="text-muted truncate">{who}</span>
        </div>
      </div>
    );
  }

  if (kind === 'im') {
    const name = who.split('·')[0].trim();
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 ${t.tint} border-b border-rule`}>
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-positive/20 text-positive text-[9px] font-bold grid place-items-center">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-positive ring-1 ring-surface" />
        </div>
        <span className="text-[11px] font-semibold text-ink truncate">{name}</span>
        <span className="ml-auto text-[9px] text-faint">online</span>
      </div>
    );
  }

  if (kind === 'pin') {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 ${t.tint} border-b border-rule`}>
        <Icon.Pin className="w-3.5 h-3.5 text-warning" />
        <span className="text-[11px] font-semibold text-ink truncate">{who}</span>
        <span className="ml-auto text-[9px] text-faint">on workspace</span>
      </div>
    );
  }

  if (kind === 'remind') {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 ${t.tint} border-b border-rule`}>
        <Icon.Remind className="w-3.5 h-3.5 text-[#8B5CF6]" />
        <span className="text-[11px] font-semibold text-ink">Tomorrow · 9:00 AM</span>
        <span className="ml-auto text-[9px] text-faint">{who.split('·')[0].trim().toLowerCase()}</span>
      </div>
    );
  }

  if (kind === 'approve') {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 ${t.tint} border-b border-rule`}>
        <Icon.Check className="w-3.5 h-3.5 text-positive" />
        <span className="text-[11px] font-semibold text-ink">Approval required</span>
        <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider text-positive">Awaiting you</span>
      </div>
    );
  }

  if (kind === 'whatif') {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 ${t.tint} border-b border-rule`}>
        <Icon.WhatIf className="w-3.5 h-3.5 text-brand" />
        <span className="text-[11px] font-semibold text-ink">What-if scenario</span>
        <span className="ml-auto text-[9px] text-faint">model v2.3</span>
      </div>
    );
  }

  if (kind === 'open' || kind === 'investigate') {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 ${t.tint} border-b border-rule`}>
        {kind === 'open' ? <Icon.Open className="w-3.5 h-3.5 text-brand" /> : <Icon.Search className="w-3.5 h-3.5 text-warning" />}
        <span className="text-[11px] font-semibold text-ink truncate">{who}</span>
        <span className="ml-auto text-[9px] text-faint">opens in workbench</span>
      </div>
    );
  }

  if (kind === 'share') {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 ${t.tint} border-b border-rule`}>
        <Icon.Share className="w-3.5 h-3.5 text-muted" />
        <span className="text-[11px] font-semibold text-ink truncate">Shareable snapshot</span>
        <span className="ml-auto text-[9px] text-faint">meeru.ai/s/…</span>
      </div>
    );
  }

  return null;
}

// ────────────────────────────────────────────────────────────
// Per-kind body (inside the card, between chrome and CTA)
// ────────────────────────────────────────────────────────────

function CardBody({ card }: { card: ActionCard }) {
  const { kind, body, label } = card;

  if (kind === 'slack' || kind === 'im') {
    // Chat bubble style
    return (
      <div className="px-3 py-2.5">
        <div className="rounded-lg bg-surface-soft border border-rule px-2.5 py-1.5">
          <p className="text-[12px] text-ink leading-snug line-clamp-3">
            {body || label}
          </p>
        </div>
        <div className="mt-1.5 text-[10px] text-faint">Delivered as {kind === 'slack' ? 'channel post' : 'direct message'}</div>
      </div>
    );
  }

  if (kind === 'email') {
    return (
      <div className="px-3 py-2.5">
        <p className="text-[12px] text-ink leading-snug line-clamp-3">{body || label}</p>
        <div className="mt-2 flex items-center gap-1 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[9px] font-medium text-faint bg-surface-soft border border-rule px-1.5 py-0.5 rounded">
            <Icon.File className="w-2.5 h-2.5" />
            variance-snapshot.pdf
          </span>
        </div>
      </div>
    );
  }

  if (kind === 'pin') {
    return (
      <div className="px-3 py-2.5">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded bg-warning/15 grid place-items-center shrink-0">
            <Icon.Pin className="w-3.5 h-3.5 text-warning" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-ink leading-tight truncate">{label}</p>
            <p className="text-[11px] text-muted leading-snug line-clamp-2 mt-0.5">{body}</p>
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'remind') {
    return (
      <div className="px-3 py-2.5">
        <p className="text-[12px] text-ink leading-snug line-clamp-2">{body || label}</p>
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted">
          <Icon.Calendar className="w-3 h-3" />
          <span>Reminder will ping you via Slack + email</span>
        </div>
      </div>
    );
  }

  if (kind === 'approve') {
    return (
      <div className="px-3 py-2.5">
        <p className="text-[12px] text-ink leading-snug line-clamp-2 font-medium">{label}</p>
        <p className="text-[11px] text-muted leading-snug line-clamp-2 mt-1">{body}</p>
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-positive">
          <Icon.Check className="w-3 h-3" />
          <span>2 of 3 approvals collected</span>
        </div>
      </div>
    );
  }

  if (kind === 'whatif') {
    return (
      <div className="px-3 py-2.5">
        <p className="text-[12px] text-ink leading-snug line-clamp-2">{body || label}</p>
        <div className="mt-2 h-1.5 rounded-full bg-surface-soft overflow-hidden">
          <div className="h-full bg-brand" style={{ width: '62%' }} />
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-faint">
          <span>scenario confidence</span>
          <span className="font-semibold">62%</span>
        </div>
      </div>
    );
  }

  if (kind === 'open' || kind === 'investigate') {
    return (
      <div className="px-3 py-2.5">
        <p className="text-[12px] text-ink leading-snug line-clamp-3">{body || label}</p>
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-faint">
          <Icon.Bolt className="w-3 h-3" />
          <span>Opens scoped view with filters pre-applied</span>
        </div>
      </div>
    );
  }

  if (kind === 'share') {
    return (
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 rounded border border-dashed border-rule bg-surface-soft px-2 py-1.5">
          <Icon.Share className="w-3 h-3 text-muted shrink-0" />
          <span className="text-[10px] text-muted font-mono truncate">
            meeru.ai/s/{truncate((label || body || 'snapshot').toLowerCase().replace(/[^a-z0-9]+/g, '-'), 24)}
          </span>
        </div>
        <p className="text-[11px] text-muted leading-snug line-clamp-2 mt-1.5">{body || label}</p>
      </div>
    );
  }

  return null;
}

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────

export function NbaMainSection() {
  const persona = usePersona();
  const { contextual, sent, markSent, thinking } = useChat();
  const { push } = useToasts();

  // Slack preview modal state: holds the currently-previewed card + its idKey.
  const [slackPreview, setSlackPreview] = useState<{ card: ActionCard; idKey: string } | null>(null);

  const cards = useMemo(
    () => orderByRole(contextual, persona.order).slice(0, 5),
    [contextual, persona.order],
  );

  if (cards.length === 0) return null;

  const fireDirect = (a: ActionCard, idKey: string) => {
    if (sent.has(idKey)) return;
    markSent(idKey);
    const v = VERB[a.kind] ?? { label: 'Run', doneLabel: '✓ Done' };
    push({
      kind: 'ok',
      title: `${a.label} — ${v.label.toLowerCase()}`,
      sub: `${a.who}${a.body ? ' · ' + truncate(a.body, 60) : ''}`,
    });
  };

  // Slack kind opens the preview modal; everything else fires directly.
  const fire = (a: ActionCard, idKey: string) => {
    if (sent.has(idKey)) return;
    if (a.kind === 'slack') {
      setSlackPreview({ card: a, idKey });
      return;
    }
    fireDirect(a, idKey);
  };

  return (
    <section className="mt-4 rounded-xl border border-rule bg-gradient-to-b from-brand-tint/30 to-surface overflow-hidden">
      {/* Section header */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-rule bg-surface">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-brand-tint grid place-items-center">
            <Icon.Sparkle className="w-3.5 h-3.5 text-brand" />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-ink tracking-tight">Adaptive Next Best Actions</div>
            <div className="text-[10px] text-faint">
              {thinking ? 'Rebuilding from your next question…' : 'Ready to fire · each card previews what will happen'}
            </div>
          </div>
        </div>
        <span className="text-[10px] font-medium text-faint tabular-nums">
          {cards.length} {cards.length === 1 ? 'card' : 'cards'} · ranked for {persona.key}
        </span>
      </header>

      {/* Slack preview modal — opens when a Slack-kind card is clicked */}
      {slackPreview && (
        <SlackPreviewModal
          card={slackPreview.card}
          onClose={() => setSlackPreview(null)}
          onSent={() => markSent(slackPreview.idKey)}
        />
      )}

      {/* Card grid — auto-fill gives each card at least 280px, spreads to fill available width */}
      <div
        className="p-3 grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
      >
        {cards.map((a, i) => {
          const idKey = `mainsec-${a.kind}-${i}`;
          const isSent = sent.has(idKey);
          const theme = KIND_THEME[a.kind];
          const v = VERB[a.kind] ?? { label: 'Run', doneLabel: '✓ Done' };
          return (
            <article
              key={idKey}
              className={`rounded-lg border bg-surface overflow-hidden flex flex-col transition-all ${
                isSent ? 'opacity-60' : 'hover:-translate-y-0.5 hover:shadow-e2 hover:border-brand'
              }`}
              style={{ borderColor: 'var(--rule)' }}
            >
              <ChromeHeader kind={a.kind} who={a.who} />
              <div className="flex-1">
                <CardBody card={a} />
              </div>
              <footer className="px-3 py-1.5 border-t border-rule bg-surface-soft/40 flex items-center gap-3">
                <span className={`text-[9px] font-semibold uppercase tracking-wider shrink-0 ${theme.primaryText}`}>
                  {theme.label}
                </span>
                <button
                  onClick={() => fire(a, idKey)}
                  disabled={isSent}
                  className={`ml-auto shrink-0 px-3 py-1 rounded text-[10px] font-semibold text-white whitespace-nowrap transition-opacity ${
                    isSent ? 'bg-positive' : theme.primaryBg
                  }`}
                >
                  {isSent ? v.doneLabel : v.label}
                </button>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}
