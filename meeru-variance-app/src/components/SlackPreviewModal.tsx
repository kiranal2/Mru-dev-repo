import { useEffect, useState } from 'react';
import { useToasts } from '../store';
import { usePersona } from './AppShell';
import { Icon } from '../icons';
import type { ActionCard } from '../types';

interface Props {
  card: ActionCard;
  onClose: () => void;
  onSent: () => void;
}

/**
 * Slack share preview modal — per Shawn (2026-04-20 meeting):
 *   "if we can have a pop-up to show how it shares to Slack, I think that
 *   would be helpful"
 *
 * Renders a live-looking Slack-style preview of what will be posted: workspace
 * chrome, channel sidebar, bot avatar, rich message bubble, and a "Post to
 * #channel" CTA. Commits the action on post — everything stays in-app.
 */
export function SlackPreviewModal({ card, onClose, onSent }: Props) {
  const { push } = useToasts();
  const persona = usePersona();

  // Derive channel name from the card's "who" field. Fallback: #finance-team
  const channel =
    card.who
      .split('·')
      .pop()
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') || 'finance-team';

  const [message, setMessage] = useState(card.body || card.label);
  const [posting, setPosting] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onPost = () => {
    setPosting(true);
    setTimeout(() => {
      push({
        kind: 'ok',
        title: `Posted to #${channel}`,
        sub: `via Meeru · ${persona.name}`,
      });
      onSent();
      onClose();
    }, 600);
  };

  const nowLabel = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const initials = persona.init || persona.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/50 grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-rule rounded-xl shadow-e3 w-full overflow-hidden anim-fade-up"
        style={{ maxWidth: 640 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-start justify-between px-5 py-3 border-b border-rule">
          <div>
            <div className="flex items-center gap-2">
              <Icon.Slack className="w-4 h-4 text-[#4A154B]" />
              <h3 className="text-[14px] font-semibold text-ink">Share to Slack</h3>
            </div>
            <div className="text-[11px] text-muted mt-0.5">
              Preview what your team will see · edit before posting
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded grid place-items-center text-faint hover:text-ink hover:bg-surface-soft"
            aria-label="Close"
          >
            <Icon.X className="w-4 h-4" />
          </button>
        </div>

        {/* Slack UI mock */}
        <div className="bg-[#1A1D21] text-[#D1D2D3] overflow-hidden">
          {/* Workspace + channel header */}
          <div className="flex items-stretch h-11 border-b border-white/10">
            <div className="w-[180px] shrink-0 bg-[#19171D] flex items-center gap-2 px-3">
              <div className="w-5 h-5 rounded bg-[#4A154B] grid place-items-center text-white text-[10px] font-bold">
                M
              </div>
              <span className="text-[12px] font-semibold text-white truncate">Meeru Finance</span>
            </div>
            <div className="flex-1 flex items-center px-4 gap-3">
              <div>
                <div className="text-[13px] font-semibold text-white"># {channel}</div>
                <div className="text-[10px] text-white/50">12 members · pinned</div>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-white/50">
                <div className="w-5 h-5 rounded-full bg-white/10" />
                <div className="w-5 h-5 rounded-full bg-white/10" />
                <div className="w-5 h-5 rounded-full bg-white/10" />
                <span className="text-[11px] ml-1">+9</span>
              </div>
            </div>
          </div>

          {/* Message preview */}
          <div className="px-4 py-4">
            {/* Pinned notice */}
            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-3">
              — new post preview —
            </div>

            {/* Message row */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded bg-brand text-white grid place-items-center text-[12px] font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-[13px] font-bold text-white">{persona.name}</span>
                  <span className="text-[10px] text-white/40">via Meeru</span>
                  <span className="text-[10px] text-white/40">{nowLabel}</span>
                </div>

                {/* Message body — editable */}
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full bg-transparent text-[13px] text-white/90 leading-snug resize-none focus:outline-none border border-white/0 focus:border-white/20 rounded px-2 py-1 -mx-2"
                  rows={Math.min(4, Math.max(2, Math.ceil(message.length / 70)))}
                />

                {/* Attached snapshot card (Slack block-kit style) */}
                <div className="mt-2 rounded border-l-4 border-brand bg-white/5 px-3 py-2">
                  <div className="text-[11px] font-semibold text-white/90">Variance snapshot · Week 10</div>
                  <div className="text-[11px] text-white/60 mt-0.5">
                    Global revenue variance −$3.2M vs Plan · 3 critical signals
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button className="text-[10px] font-semibold text-white bg-white/10 hover:bg-white/15 rounded px-2 py-0.5">
                      Open in Meeru
                    </button>
                    <button className="text-[10px] font-semibold text-white/70 hover:text-white bg-white/5 rounded px-2 py-0.5">
                      View data
                    </button>
                  </div>
                </div>

                {/* Reactions strip */}
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-[10px] bg-white/10 hover:bg-white/15 rounded px-1.5 py-0.5 cursor-pointer">👀 2</span>
                  <span className="text-[10px] bg-white/10 hover:bg-white/15 rounded px-1.5 py-0.5 cursor-pointer">✅ 1</span>
                  <span className="text-[10px] bg-white/5 hover:bg-white/10 rounded px-1.5 py-0.5 cursor-pointer text-white/50">+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fake Slack composer row */}
          <div className="mx-4 mb-3 rounded-lg border border-white/15 bg-[#222529] p-2 text-[10px] text-white/40">
            <span className="inline-flex items-center gap-1">
              <Icon.Email className="w-3 h-3" />
              <span>Reply in thread…</span>
            </span>
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-surface-soft/60">
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <Icon.Info className="w-3.5 h-3.5" />
            <span>Posting as {persona.name} via Meeru integration · in-app only</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={posting}
              className="px-3 py-1.5 rounded text-[12px] font-semibold text-muted hover:text-ink hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onPost}
              disabled={posting}
              className="px-3.5 py-1.5 rounded text-[12px] font-semibold text-white bg-[#4A154B] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {posting ? 'Posting…' : `Post to #${channel}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
