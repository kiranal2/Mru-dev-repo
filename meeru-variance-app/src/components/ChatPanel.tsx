import { useRef, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useChat, useSettings, useToasts, useMission } from '../store';
import { INSIGHTS, NEW_INSIGHTS_POOL, SUGGESTIONS, UNIVERSAL_ACTIONS, CHAT_RESPONSES } from '../data';
import { Icon, getActionIcon } from '../icons';
import { usePersona } from './AppShell';
import { ShareModal, FactCheckModal } from './ChatReplyModals';
import type { ActionCard } from '../types';

// ---------- Typeahead helpers ----------
/**
 * Score a prompt against a query: higher = better match.
 * - 0 if no match
 * - 10 if the whole query is a contiguous substring
 * - 5 per word in the query that appears as a word-prefix in the prompt
 */
function scorePrompt(prompt: string, query: string): number {
  const p = prompt.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  let score = 0;
  if (p.includes(q)) score += 10;
  const promptWords = p.split(/\W+/).filter(Boolean);
  const queryWords = q.split(/\s+/).filter(Boolean);
  for (const qw of queryWords) {
    if (promptWords.some(pw => pw.startsWith(qw))) score += 5;
    else if (p.includes(qw)) score += 2;
  }
  return score;
}

// ---------- Insights (compact + expanded) ----------
/**
 * Map an insight (title + body) to the most relevant pre-authored chat question.
 * Clicking the insight auto-sends this question so the AI deep-dives on it.
 */
function insightToQuery(title: string, text: string): string {
  const blob = (title + ' ' + text).toLowerCase();
  if (blob.includes('california') || blob.includes('labor') || blob.includes('ca retail')) return "What's happening with California Retail labor costs?";
  if (blob.includes('cloud') || blob.includes('egress'))                                   return "What's driving cloud cost increase?";
  if (blob.includes('churn') || blob.includes('logo'))                                      return 'Why did Enterprise churn spike this quarter?';
  if (blob.includes('at-risk') || blob.includes('at risk') || blob.includes('voltair') || blob.includes('meridian')) return 'Which accounts are at risk for next quarter?';
  if (blob.includes('nrr') || blob.includes('retention') || blob.includes('cohort'))        return 'Compare NRR trend to prior 4 quarters';
  if (blob.includes('recon') || blob.includes('variance'))                                   return 'Show me open reconciliations';
  if (blob.includes('expansion') || blob.includes('cinder') || blob.includes('seat'))       return 'Show expansion ARR by segment';
  if (blob.includes('close') || blob.includes('blocker'))                                   return "What's the close blocker today?";
  if (blob.includes('exception') || blob.includes('flagged'))                                return 'Summarize the flagged exceptions';
  return `Tell me more about: ${title}`;
}

function InsightRow({
  i,
  isNew,
  onAsk,
  onDismiss,
  onPin,
}: {
  i: { id?: string; ico: 'neg' | 'warn' | 'info'; title: string; text: string; when: string };
  isNew?: boolean;
  onAsk: () => void;
  onDismiss: () => void;
  onPin: () => void;
}) {
  const wrapCls = i.ico === 'neg' ? 'bg-negative-weak text-negative' : i.ico === 'warn' ? 'bg-warning-weak text-warning' : 'bg-brand-tint text-brand';
  const Ic = i.ico === 'neg' ? Icon.DownRight : i.ico === 'warn' ? Icon.Alert : Icon.Info;
  return (
    <div
      onClick={onAsk}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAsk(); } }}
      className={`group flex gap-2.5 p-2.5 rounded-lg border border-rule bg-surface-alt hover:bg-brand-tint hover:border-brand-weak transition-colors cursor-pointer relative ${isNew ? 'flash-new' : ''}`}
    >
      <div className={`w-7 h-7 rounded-full grid place-items-center shrink-0 ${wrapCls}`}>
        <Ic className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-2 items-start">
          <div className="text-[12px] font-semibold text-ink truncate flex items-center gap-1.5">
            {i.title}
            {isNew && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-brand text-white">New</span>}
          </div>
          <div className="text-[10px] text-faint whitespace-nowrap">{i.when}</div>
        </div>
        <div className="text-[11px] text-muted leading-relaxed mt-0.5">{i.text}</div>
        {/* Hover hint: the row IS the ask button; this nudges the user */}
        <div className="mt-1 text-[10px] text-brand opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
          <Icon.Sparkle className="w-2.5 h-2.5" />
          <span>Click to ask AI about this →</span>
        </div>
      </div>
      {/* Hover-revealed quick actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onPin(); }}
          className="w-5 h-5 rounded grid place-items-center text-faint hover:text-warning hover:bg-warning-weak"
          title="Pin this insight"
        >
          <Icon.Pin className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="w-5 h-5 rounded grid place-items-center text-faint hover:text-negative hover:bg-negative-weak"
          title="Dismiss this insight"
        >
          <Icon.X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function CollapsedInsights({ count, critical, onExpand }: { count: number; critical: number; onExpand: () => void }) {
  return (
    <button onClick={onExpand} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-rule bg-surface-alt hover:bg-surface-soft transition-colors">
      <span className="w-2 h-2 rounded-full bg-negative shrink-0" />
      <span className="text-[11px] font-semibold text-ink">{count} insights</span>
      <span className="text-[10px] text-muted">· {critical} critical</span>
      <svg className="ml-auto w-3 h-3 text-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
    </button>
  );
}

// ---------- Welcome card (first-time intro) ----------
function ChatWelcomeCard({
  personaFirstName,
  onDismiss,
  onPickSuggestion,
}: {
  personaFirstName: string;
  onDismiss: () => void;
  onPickSuggestion: (s: string) => void;
}) {
  const features: { icon: ReactNode; title: string; body: string }[] = [
    {
      icon: <Icon.Search className="w-3.5 h-3.5" />,
      title: 'Ask in plain English',
      body: 'Variance, drivers, cohorts, at-risk accounts — I answer in the context of the workbench you\'re on.',
    },
    {
      icon: <Icon.Flag className="w-3.5 h-3.5" />,
      title: 'Get one-click actions',
      body: 'Every answer generates Next Best Action cards — Slack, email, pin, run a What-If — ranked for your role.',
    },
    {
      icon: <Icon.Pin className="w-3.5 h-3.5" />,
      title: 'Save, share, fact-check',
      body: 'Pin a reply to your workspace, copy it, share a link, or trace claims back to sources.',
    },
    {
      icon: <Icon.Sparkle className="w-3.5 h-3.5" />,
      title: 'Guided missions',
      body: 'Try the Start Mission button in the header for a 3-minute walkthrough of the full close-loop.',
    },
  ];

  const quickPrompts = [
    'Why did Enterprise churn spike this quarter?',
    "What's happening with California Retail labor costs?",
    'When will margins recover?',
  ];

  return (
    <div className="relative rounded-xl border border-brand-weak bg-gradient-to-br from-brand-tint via-surface to-surface shadow-e1 p-3.5 anim-fade-up">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 w-5 h-5 rounded grid place-items-center text-faint hover:text-ink hover:bg-surface-soft"
        title="Dismiss"
        aria-label="Dismiss welcome message"
      >
        <Icon.X className="w-3 h-3" />
      </button>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-brand text-white grid place-items-center">
          <Icon.Sparkle className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[13px] font-semibold text-ink leading-tight">Welcome, {personaFirstName}.</div>
          <div className="text-[11px] text-muted leading-tight">Here&apos;s what I can help with on this workbench.</div>
        </div>
      </div>

      <ul className="space-y-1.5 mt-2.5">
        {features.map((f, i) => (
          <li key={i} className="flex gap-2 p-1.5 rounded-md hover:bg-surface-soft">
            <span className="w-6 h-6 rounded grid place-items-center bg-brand-tint text-brand shrink-0">{f.icon}</span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-ink">{f.title}</div>
              <div className="text-[11px] text-muted leading-relaxed">{f.body}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 pt-2.5 border-t border-rule/70">
        <div className="text-[10px] font-semibold tracking-wider uppercase text-faint mb-1.5">Try asking</div>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => { onPickSuggestion(p); onDismiss(); }}
              className="text-left px-2.5 py-1 rounded-full border border-rule bg-surface text-[11px] text-ink hover:bg-brand hover:text-white hover:border-brand transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={onDismiss}
          className="text-[11px] font-medium text-brand hover:underline"
        >
          Got it — let me explore
        </button>
      </div>
    </div>
  );
}

// ---------- Suggestion chip ----------
function SuggestionChip({ text, onClick, dataKey }: { text: ReactNode; onClick: () => void; dataKey?: string }) {
  return (
    <button
      data-suggestion-key={dataKey}
      onClick={onClick}
      className="text-left px-2.5 py-1.5 rounded-full border border-rule bg-surface text-[11px] text-ink hover:bg-brand-tint hover:border-brand hover:text-brand transition-colors whitespace-nowrap"
    >
      {text}
    </button>
  );
}

// ---------- Typing indicator (shown while AI is preparing a reply) ----------
function ThinkingBubble() {
  const phrases = [
    'Meeru is analyzing',
    'Scanning sources',
    'Checking the variance model',
    'Pulling latest data',
  ];
  const [phrase, setPhrase] = useState(phrases[0]);
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % phrases.length;
      setPhrase(phrases[i]);
    }, 1200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="flex flex-col gap-1 anim-fade-up">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Meeru AI</div>
      <div className="text-[12px] leading-relaxed text-ink p-2.5 rounded-lg border bg-surface-alt border-rule inline-flex items-center gap-2 max-w-max">
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand dot-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-brand dot-pulse" style={{ animationDelay: '180ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-brand dot-pulse" style={{ animationDelay: '360ms' }} />
        </span>
        <span className="text-muted text-[11px]">{phrase}…</span>
      </div>
    </div>
  );
}

// ---------- Message-level toolbar (appears below each AI reply) ----------
function MessageToolbar({ text, html, msgId, question }: {
  text: string; html: string; msgId: string; question: string;
}) {
  const { push } = useToasts();
  const { isPinned, isSaved, togglePin, toggleSave, regenerate, scope } = useChat();
  const persona = usePersona();
  const [shareOpen, setShareOpen] = useState(false);
  const [factOpen, setFactOpen] = useState(false);

  const item = {
    id: msgId,
    question,
    answerText: text,
    answerHtml: html,
    scope,
    persona: persona.role,
    timestamp: new Date().toISOString(),
  };
  const pinned = isPinned(msgId);
  const saved  = isSaved(msgId);

  const onPin = () => {
    togglePin(item);
    push({
      kind: pinned ? 'info' : 'ok',
      title: pinned ? 'Unpinned' : 'Pinned to workspace',
      sub: pinned ? 'Removed from My Workspace → Pinned' : 'Find it in My Workspace → Pinned',
    });
  };
  const onSave = () => {
    toggleSave(item);
    push({
      kind: saved ? 'info' : 'ok',
      title: saved ? 'Removed from notebook' : 'Saved to notebook',
      sub: saved ? 'Item removed from Notebook' : 'Open Notebook from the profile menu',
    });
  };
  const onCopy = () => {
    try { navigator.clipboard?.writeText(text); } catch { /* ignore */ }
    push({ kind: 'ok', title: 'Copied', sub: `${text.length} characters copied` });
  };
  const onRegenerate = () => {
    regenerate();
    push({ kind: 'info', title: 'Re-running analysis', sub: 'Refreshing with latest data' });
  };

  const actions: { key: string; label: string; icon: ReactNode; onClick: () => void; active?: boolean }[] = [
    { key: 'pin',   label: pinned ? 'Pinned' : 'Pin',    icon: <Icon.Pin   className="w-3 h-3" />, onClick: onPin,          active: pinned },
    { key: 'save',  label: saved  ? 'Saved'  : 'Save',   icon: <Icon.File  className="w-3 h-3" />, onClick: onSave,         active: saved },
    { key: 'share', label: 'Share',                      icon: <Icon.Share className="w-3 h-3" />, onClick: () => setShareOpen(true) },
    { key: 'copy',  label: 'Copy',                       icon: <Icon.Check className="w-3 h-3" />, onClick: onCopy },
    { key: 'regen', label: 'Regenerate',                 icon: <Icon.Refresh className="w-3 h-3" />, onClick: onRegenerate },
    { key: 'fact',  label: 'Fact-check',                 icon: <Icon.Search className="w-3 h-3" />, onClick: () => setFactOpen(true) },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-0.5 mt-0.5 ml-1">
        {actions.map(a => (
          <button
            key={a.key}
            onClick={a.onClick}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors ${a.active ? 'text-brand bg-brand-tint font-semibold' : 'text-faint hover:text-brand hover:bg-brand-tint'}`}
            title={a.label}
          >
            {a.icon}
            <span>{a.label}</span>
          </button>
        ))}
      </div>
      {shareOpen && <ShareModal answerText={text} question={question} onClose={() => setShareOpen(false)} />}
      {factOpen  && <FactCheckModal answerText={text} question={question} onClose={() => setFactOpen(false)} />}
    </>
  );
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/** Deterministic short hash of a string — stable per-text so pin/save state persists across renders. */
function hashStr(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

/**
 * Highlight the first case-insensitive occurrence of `query` inside `text`
 * by wrapping the matched slice in a bold <mark>-like span. If there's no
 * match (or no query), return the plain string unchanged.
 */
function highlightMatch(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  const before = text.slice(0, i);
  const hit = text.slice(i, i + q.length);
  const after = text.slice(i + q.length);
  return (
    <>
      {before}
      <span className="font-semibold text-brand bg-brand-tint rounded-sm px-0.5">{hit}</span>
      {after}
    </>
  );
}

// ---------- Next Best Action card (compact, inline in chat panel) ----------
/** Primary verb per action kind — replaces the generic "Send" button. */
const VERB_PRIMARY: Record<string, { label: string; doneLabel: string }> = {
  slack:       { label: 'Send',     doneLabel: '✓ Sent' },
  email:       { label: 'Send',     doneLabel: '✓ Sent' },
  im:          { label: 'Send',     doneLabel: '✓ Sent' },
  pin:         { label: 'Pin',      doneLabel: '✓ Pinned' },
  remind:      { label: 'Set',      doneLabel: '✓ Scheduled' },
  share:       { label: 'Share',    doneLabel: '✓ Shared' },
  approve:     { label: 'Approve',  doneLabel: '✓ Approved' },
  whatif:      { label: 'Run',      doneLabel: '✓ Ran' },
  open:        { label: 'Open',     doneLabel: '✓ Opened' },
  investigate: { label: 'Open',     doneLabel: '✓ Opened' },
};

function NBACard({ a, idKey }: { a: ActionCard; idKey: string }) {
  const { sent, markSent } = useChat();
  const { push } = useToasts();
  const { advance, currentBeat } = useMission();
  const isSent = sent.has(idKey);
  const IconC = getActionIcon(a.kind);
  const [menuOpen, setMenuOpen] = useState(false);

  const ACCENT: Record<string, string> = {
    slack: '#4A154B', email: 'var(--primary)', im: 'var(--positive)',
    pin: 'var(--warning)', remind: '#8B5CF6', share: 'var(--text-muted)',
    approve: 'var(--positive)', whatif: 'var(--primary)', open: 'var(--primary)', investigate: 'var(--warning)',
  };
  const verb = VERB_PRIMARY[a.kind] ?? { label: 'Run', doneLabel: '✓ Done' };

  const commit = (toastTitle: string) => {
    if (isSent) return;
    markSent(idKey);
    push({ kind: 'ok', title: toastTitle, sub: `${a.who}${a.body ? ' · ' + truncate(a.body, 60) : ''}` });
    if (currentBeat?.glow === `[data-card-kind="${a.kind}"]`) {
      setTimeout(advance, 700);
    }
  };
  const onPrimary  = () => commit(`${a.label} — ${verb.label.toLowerCase()}${verb.label.endsWith('e') ? 'd' : verb.label === 'Set' ? ' scheduled' : verb.label === 'Run' ? ''  : ''}`);
  const onDraft    = () => { push({ kind: 'info',  title: 'Saved as draft', sub: a.label }); setMenuOpen(false); };
  const onSchedule = () => { push({ kind: 'info',  title: 'Scheduled for later', sub: `${a.label} · tomorrow 8 am` }); setMenuOpen(false); };
  const onDelegate = () => { push({ kind: 'info',  title: 'Delegated',       sub: `${a.label} assigned to reviewer` }); setMenuOpen(false); };
  const onDismiss  = () => { push({ kind: 'warn',  title: 'Dismissed',       sub: a.label }); setMenuOpen(false); };

  return (
    <div
      data-card-kind={a.kind}
      className={`relative shrink-0 w-[232px] rounded-lg border bg-surface px-3 pl-3.5 py-2 transition-all ${isSent ? 'opacity-60' : 'hover:-translate-y-0.5 hover:shadow-e2'}`}
      style={{ borderColor: 'var(--rule)' }}
    >
      <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded" style={{ background: ACCENT[a.kind] ?? 'var(--text-muted)' }} />
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
        <IconC className="w-3 h-3" />
        <span className="truncate flex-1">{a.who}</span>
        {!isSent && (
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(m => !m); }}
            className="w-4 h-4 grid place-items-center rounded hover:bg-surface-soft text-faint hover:text-ink"
            title="More options"
          >
            ⋯
          </button>
        )}
      </div>
      <div className="text-[11px] text-ink leading-tight line-clamp-2 mt-0.5">{a.body}</div>
      <div className="flex justify-between items-center mt-1.5">
        <button className="text-[10px] text-faint hover:text-brand">Edit</button>
        <button onClick={onPrimary} className={`px-2.5 py-0.5 text-[10px] font-semibold rounded text-white ${isSent ? 'bg-positive' : 'bg-brand hover:opacity-90'}`}>
          {isSent ? verb.doneLabel : verb.label}
        </button>
      </div>
      {menuOpen && (
        <div className="absolute top-6 right-1 z-10 bg-surface border border-rule rounded-md shadow-e2 py-1 text-[11px] min-w-[140px]">
          <button onClick={onSchedule} className="w-full text-left px-3 py-1.5 hover:bg-surface-soft text-ink">Schedule for later</button>
          <button onClick={onDraft}    className="w-full text-left px-3 py-1.5 hover:bg-surface-soft text-ink">Save as draft</button>
          <button onClick={onDelegate} className="w-full text-left px-3 py-1.5 hover:bg-surface-soft text-ink">Delegate to reviewer</button>
          <div className="h-px bg-rule my-1" />
          <button onClick={onDismiss}  className="w-full text-left px-3 py-1.5 hover:bg-surface-soft text-negative">Dismiss</button>
        </div>
      )}
    </div>
  );
}
function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

function matchSuggestionKey(s: string): string {
  const lower = s.toLowerCase();
  if (lower.includes('california') || lower.includes('labor')) return 'california';
  if (lower.includes('close') || lower.includes('blocker'))   return 'close';
  if (lower.includes('recon'))                                 return 'recon';
  return '';
}

function orderByRole(cards: ActionCard[], order: string[]): ActionCard[] {
  const rank = new Map(order.map((k, i) => [k, i]));
  return [...cards].sort((a, b) => (rank.get(a.kind) ?? 99) - (rank.get(b.kind) ?? 99));
}

// ==================================================================
// Main ChatPanel
// ==================================================================
export function ChatPanel() {
  const { msgs, send, reset, scope, contextual, followUps, clearContextual, thinking, togglePin } = useChat();
  const { push: pushToast } = useToasts();
  const { settings } = useSettings();
  const persona = usePersona();
  const [input, setInput] = useState('');
  const [insightsOpen, setInsightsOpen] = useState(true); // user preference while panel is open
  const [suggestionsOpen, setSuggestionsOpen] = useState<boolean>(() => {
    try { return localStorage.getItem('meeru.suggestionsOpen') !== '0'; } catch { return true; }
  });
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem('meeru.chatWelcomeSeen') === '1'; } catch { return false; }
  });
  const bodyRef = useRef<HTMLDivElement>(null);

  const toggleSuggestions = () => {
    setSuggestionsOpen(v => {
      const next = !v;
      try { localStorage.setItem('meeru.suggestionsOpen', next ? '1' : '0'); } catch {}
      return next;
    });
  };

  const dismissWelcome = () => {
    setWelcomeDismissed(true);
    try { localStorage.setItem('meeru.chatWelcomeSeen', '1'); } catch {}
  };

  // Auto-collapse insights once conversation is active (only on first message)
  useEffect(() => {
    if (msgs.length === 1) setInsightsOpen(false);
    if (msgs.length === 0) setInsightsOpen(true);
  }, [msgs.length]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, contextual]);

  // ---- Live insights — new items rotate in from the agent's activity stream ----
  type LiveInsight = { id: string; ico: 'neg' | 'warn' | 'info'; title: string; text: string; when: string; isNew: boolean };
  const [liveInsights, setLiveInsights] = useState<LiveInsight[]>(() =>
    INSIGHTS.map((i, idx) => ({ id: `init-${idx}`, ...i, isNew: false }))
  );
  useEffect(() => {
    // Periodically inject a new insight from the pool — clear the "NEW" flag after 3s.
    let idx = 0;
    const id = setInterval(() => {
      const src = NEW_INSIGHTS_POOL[idx % NEW_INSIGHTS_POOL.length];
      idx++;
      const item: LiveInsight = { id: `live-${Date.now()}`, ...src, when: 'just now', isNew: true };
      setLiveInsights(prev => [item, ...prev].slice(0, 8));
      // De-emphasize after 3 seconds
      setTimeout(() => {
        setLiveInsights(prev => prev.map(p => p.id === item.id ? { ...p, isNew: false, when: 'moments ago' } : p));
      }, 3000);
    }, 18000); // every 18 seconds — slow enough to feel natural
    return () => clearInterval(id);
  }, []);

  const onSend = () => {
    if (!input.trim()) return;
    send(input);
    setInput('');
  };
  const onSuggestionClick = (s: string) => {
    send(s);
    setInput('');
  };

  const insightsCount = liveInsights.length;
  const insightsCritical = liveInsights.filter(i => i.ico === 'neg').length;

  // Full pool of queryable prompts (defaults + every follow-up in every response)
  const allPrompts = useMemo(() => {
    const fromResponses = CHAT_RESPONSES.flatMap(r => r.followUps ?? []);
    return Array.from(new Set([...SUGGESTIONS, ...fromResponses]));
  }, []);

  // Typeahead: filter + rank by query; empty query → no matches array
  const typedQuery = input.trim();
  const isTyping = typedQuery.length > 0;
  const typeahead = useMemo(() => {
    if (!isTyping) return [];
    return allPrompts
      .map(p => ({ p, s: scorePrompt(p, typedQuery) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 6)
      .map(x => x.p);
  }, [allPrompts, typedQuery, isTyping]);

  // Decide what the chip row shows:
  //   1. While typing → typeahead matches (or a "no matches — press Enter" hint)
  //   2. After an AI reply → contextual follow-ups
  //   3. Default → SUGGESTIONS list
  const chipsToShow = isTyping
    ? typeahead
    : msgs.length > 0 && followUps.length > 0
    ? followUps
    : SUGGESTIONS;

  const chipLabel = isTyping
    ? (typeahead.length > 0 ? 'Matches' : 'No matches')
    : msgs.length > 0 && followUps.length > 0
    ? 'Follow-up'
    : 'Suggested';

  // Ordered contextual cards (NBA)
  const nbaCards = orderByRole(contextual, persona.order);

  return (
    <>
      {/* ========== HEADER ========== */}
      <div className="px-3.5 py-2.5 border-b border-rule flex justify-between items-center shrink-0 relative overflow-hidden">
        {thinking && <div className="absolute inset-0 shimmer-bg pointer-events-none" />}
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink relative z-10">
          <Icon.Sparkle className={`w-3.5 h-3.5 text-brand ${thinking ? 'dot-pulse' : ''}`} />
          <span>AI Analysis</span>
          <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-positive-weak text-positive text-[9px] font-semibold uppercase tracking-wider">
            <span className="w-1 h-1 rounded-full bg-positive live-dot" />
            Live
          </span>
        </div>
        <button onClick={reset} className="text-[11px] text-muted hover:text-brand inline-flex items-center gap-1">
          <Icon.Refresh className="w-3 h-3" />
          <span>New</span>
        </button>
      </div>

      {/* ========== BODY (scrollable) ========== */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-2.5">
        {settings.showInsightsFeed && (
          <>
            {insightsOpen ? (
              <>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-[10px] font-semibold tracking-wider uppercase text-faint px-0.5">Insights Feed</div>
                  {msgs.length > 0 && (
                    <button onClick={() => setInsightsOpen(false)} className="text-[10px] text-faint hover:text-muted">Collapse</button>
                  )}
                </div>
                {liveInsights.map(i => (
                  <InsightRow
                    key={i.id}
                    i={i}
                    isNew={i.isNew}
                    onAsk={() => {
                      const q = insightToQuery(i.title, i.text);
                      send(q);
                      // Collapse insights after the user engages so the
                      // conversation can take over the real estate.
                      setInsightsOpen(false);
                    }}
                    onPin={() => {
                      togglePin({
                        id: `insight-${i.id}`,
                        question: `Insight: ${i.title}`,
                        answerText: i.text,
                        answerHtml: `<strong>${i.title}</strong><br/>${i.text}`,
                        scope,
                        persona: persona.role,
                        timestamp: new Date().toISOString(),
                      });
                      pushToast({ kind: 'ok', title: 'Insight pinned', sub: 'Find it in your Notebook' });
                    }}
                    onDismiss={() => {
                      setLiveInsights(prev => prev.filter(x => x.id !== i.id));
                      pushToast({ kind: 'info', title: 'Insight dismissed', sub: i.title });
                    }}
                  />
                ))}
              </>
            ) : (
              <CollapsedInsights count={insightsCount} critical={insightsCritical} onExpand={() => setInsightsOpen(true)} />
            )}
          </>
        )}

        {msgs.length === 0 && !welcomeDismissed && (
          <ChatWelcomeCard
            personaFirstName={persona.name.split(' ')[0]}
            onDismiss={dismissWelcome}
            onPickSuggestion={(s) => send(s)}
          />
        )}

        {msgs.map((m, idx) => {
          const who = m.role === 'user' ? persona.name.split(' ')[0] : 'Meeru AI';
          const bubbleCls = m.role === 'user' ? 'bg-brand-tint border-brand-weak' : 'bg-surface-alt border-rule';
          const whoCls    = m.role === 'user' ? 'text-brand' : 'text-muted';
          // For AI replies, use the immediately preceding user message as the "question"
          const prevUser = m.role === 'ai' ? [...msgs.slice(0, idx)].reverse().find(p => p.role === 'user') : undefined;
          const rawHtml  = m.html ?? m.text ?? '';
          // Deterministic id for this reply so pin/save state is stable per-text
          const msgId = `reply-${hashStr(rawHtml)}`;
          return (
            <div key={idx} className="flex flex-col gap-1">
              <div className={`text-[10px] font-semibold uppercase tracking-wider ${whoCls}`}>{who}</div>
              <div
                className={`text-[12px] leading-relaxed text-ink p-2.5 rounded-lg border ${bubbleCls}`}
                dangerouslySetInnerHTML={{ __html: rawHtml }}
              />
              {m.role === 'ai' && (
                <MessageToolbar
                  text={stripHtml(rawHtml)}
                  html={rawHtml}
                  msgId={msgId}
                  question={prevUser?.text ?? 'Untitled'}
                />
              )}
            </div>
          );
        })}

        {thinking && <ThinkingBubble />}
      </div>

      {/* ========== FOOTER: NBA + Suggestions + Input ========== */}
      <div className="border-t border-rule bg-surface-alt shrink-0">
        {/* Next Best Action — contextual cards from last AI reply */}
        {nbaCards.length > 0 && (
          <div className="px-3 pt-2.5 pb-2 border-b border-rule">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Icon.Flag className="w-3 h-3 text-brand" />
                <span className="text-[10px] font-semibold tracking-wider uppercase text-brand">Next Best Action</span>
                <span className="text-[10px] text-faint">· ranked for {persona.role.split(' ').slice(-1)[0]}</span>
              </div>
              <button onClick={clearContextual} className="text-[10px] text-faint hover:text-muted">Dismiss</button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {nbaCards.map((a, i) => <NBACard key={`${a.kind}-${i}`} a={a} idKey={`ctx-${a.kind}-${i}`} />)}
            </div>
          </div>
        )}

        {/* Suggestion chips — typeahead while user is typing, otherwise follow-ups / defaults.
            Section is collapsible and remembers user preference. Forced open while typing. */}
        {(() => {
          const effectivelyOpen = suggestionsOpen || isTyping;
          const count = chipsToShow.length;
          return (
            <div className="px-3 pt-2 pb-1.5">
              <button
                type="button"
                onClick={toggleSuggestions}
                disabled={isTyping}
                className="w-full flex items-center gap-1.5 mb-1.5 text-left hover:opacity-80 transition-opacity disabled:opacity-100 disabled:cursor-default"
                title={isTyping ? 'Typing — matches pinned open' : effectivelyOpen ? 'Collapse' : 'Expand'}
              >
                <Icon.Sparkle className="w-3 h-3 text-faint" />
                <span className="text-[10px] font-semibold tracking-wider uppercase text-faint">{chipLabel}</span>
                {count > 0 && (
                  <span className="text-[10px] text-faint">· {count}</span>
                )}
                {isTyping && typeahead.length > 0 && (
                  <span className="text-[10px] text-faint ml-auto">tap a match to send</span>
                )}
                {!isTyping && (
                  <svg className={`ml-auto w-3 h-3 text-faint transition-transform ${effectivelyOpen ? '' : '-rotate-90'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </button>
              {effectivelyOpen && (
                chipsToShow.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto pr-0.5">
                    {chipsToShow.map((s, i) => (
                      <SuggestionChip
                        key={`${s}-${i}`}
                        text={highlightMatch(s, typedQuery)}
                        dataKey={matchSuggestionKey(s)}
                        onClick={() => onSuggestionClick(s)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-faint italic px-1">
                    No matches — press <kbd className="px-1 py-0.5 rounded border border-rule bg-surface text-[10px] font-sans text-muted not-italic">Enter</kbd> to ask this question.
                  </div>
                )
              )}
            </div>
          );
        })()}

        {/* Input */}
        <ChatInputArea
          input={input}
          setInput={setInput}
          onSend={onSend}
          scope={scope}
          personaShort={persona.role.split(' ').slice(-1)[0] ?? 'User'}
        />
      </div>
    </>
  );
}

// ==================================================================
// ChatInputArea — rotating placeholder + resizable textarea
// ==================================================================
const ROTATING_PROMPTS = [
  'Ask about this workbench…',
  'Why did revenue dip last week?',
  'Who are the top at-risk accounts?',
  "What's driving margin compression?",
  'Show me the NRR trend',
  'Summarize the flagged exceptions',
  'Compare this quarter to last',
  'What should I brief the board on?',
  'Find anomalies in cloud spend',
  'When will margins recover?',
  'Which recons need my attention?',
  'Explain the California labor surge',
];

function ChatInputArea({
  input, setInput, onSend, scope, personaShort,
}: {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  scope: string;
  personaShort: string;
}) {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Rotate placeholder every 3s (only when empty + not focused)
  useEffect(() => {
    if (focused || input.length > 0) return;
    const id = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % ROTATING_PROMPTS.length);
    }, 3000);
    return () => clearInterval(id);
  }, [focused, input]);

  const currentPlaceholder = ROTATING_PROMPTS[placeholderIdx];
  const showOverlayPlaceholder = !focused && input.length === 0;

  // Auto-grow textarea while user types (up to max-height). Manual resize-y
  // handle still lets the user drag it taller if they want.
  const handleInput = (v: string) => {
    setInput(v);
    const el = taRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 220) + 'px';
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      if (input.trim()) {
        onSend();
        // Reset height after send
        if (taRef.current) taRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div className="px-3 pt-1.5 pb-2.5">
      <div className="relative flex items-end gap-1.5 bg-surface border border-rule rounded-lg px-2 py-1.5 transition-shadow focus-within:border-brand focus-within:shadow-[0_0_0_2px_var(--primary-tint)]">
        <div className="relative flex-1">
          <textarea
            ref={taRef}
            value={input}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={1}
            // Empty placeholder; we draw our own animated one below
            placeholder=" "
            className="w-full bg-transparent border-none outline-none text-[12px] text-ink resize-y overflow-y-auto leading-relaxed py-0.5 min-h-[22px] max-h-[220px]"
            style={{ height: 'auto' }}
          />
          {showOverlayPlaceholder && (
            <div
              key={currentPlaceholder}
              className="absolute inset-0 pointer-events-none flex items-start text-[12px] text-faint anim-fade-up py-0.5"
            >
              <span className="truncate block">{currentPlaceholder}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => { if (input.trim()) onSend(); }}
          disabled={!input.trim()}
          className="w-7 h-7 shrink-0 rounded-md bg-brand text-white grid place-items-center hover:opacity-90 disabled:opacity-40 self-end"
          title="Send (Enter) · Shift+Enter for newline"
        >
          <Icon.Send className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="mt-1 flex justify-between items-center text-[10px] text-faint">
        <span className="truncate">{scope}</span>
        <span className="flex items-center gap-2 shrink-0">
          <span className="hidden xl:inline">Enter to send · Shift+Enter newline · drag ↕ to resize</span>
          <span>{personaShort} view</span>
        </span>
      </div>
    </div>
  );
}

// Re-export the universal actions list so ActionStrip can use it
export { UNIVERSAL_ACTIONS };
