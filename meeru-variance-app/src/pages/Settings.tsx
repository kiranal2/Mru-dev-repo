import { useSettings, useTheme, useAuth, useToasts } from '../store';
import { Card, Eyebrow } from '../components/ui';
import { PERSONAS } from '../data';
import type { ActionKind } from '../types';

const ALL_KINDS: { kind: ActionKind; label: string }[] = [
  { kind: 'pin', label: 'Pin' },
  { kind: 'remind', label: 'Remind' },
  { kind: 'share', label: 'Share' },
  { kind: 'slack', label: 'Slack' },
  { kind: 'email', label: 'Email' },
  { kind: 'im', label: 'IM' },
];

export default function Settings() {
  const { settings, update } = useSettings();
  const { theme, set } = useTheme();
  const { user } = useAuth();
  const { push } = useToasts();

  const toggleKind = (k: ActionKind) => {
    const next = settings.pinnedActions.includes(k)
      ? settings.pinnedActions.filter(x => x !== k)
      : [...settings.pinnedActions, k];
    update({ pinnedActions: next });
    push({ kind: 'ok', title: 'Saved', sub: `${next.length} quick action${next.length === 1 ? '' : 's'} shown in the strip.` });
  };

  return (
    <div className="flex-1 overflow-auto bg-surface-alt p-6">
      <div className="max-w-[720px] mx-auto">
        <div className="mb-6">
          <div className="text-[11px] tracking-wider uppercase text-muted">Settings</div>
          <h1 className="text-[22px] font-semibold text-ink tracking-tight mt-0.5">Adaptive preferences</h1>
          <p className="text-[12px] text-muted mt-1">These settings demonstrate how the workbench adapts per user. Changes save to localStorage and apply immediately.</p>
        </div>

        {/* Profile */}
        <Card className="p-5 mb-4">
          <Eyebrow>Profile</Eyebrow>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-14 h-14 rounded-full text-white grid place-items-center text-[18px] font-semibold" style={{ background: 'linear-gradient(135deg,#6366F1,#1E40AF)' }}>{user?.init}</div>
            <div>
              <div className="text-[14px] font-semibold text-ink">{user?.name}</div>
              <div className="text-[12px] text-muted">{user?.role}</div>
              <div className="text-[11px] text-faint mt-0.5">{user?.email}</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-surface-alt rounded-lg border border-rule">
            <div className="text-[11px] text-muted mb-1">Your default action order (based on role):</div>
            <div className="flex flex-wrap gap-1.5">
              {user?.order.slice(0, 6).map((k, i) => (
                <span key={i} className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-brand-tint text-brand rounded">{i + 1}. {k}</span>
              ))}
            </div>
            <div className="text-[11px] text-faint mt-2">Switch persona in the header to see this re-order.</div>
          </div>
        </Card>

        {/* Theme */}
        <Card className="p-5 mb-4">
          <Eyebrow>Appearance</Eyebrow>
          <div className="mt-2.5 flex gap-2">
            {(['light', 'dark'] as const).map(t => (
              <button key={t} onClick={() => set(t)} className={`flex-1 px-4 py-3 rounded-lg border capitalize text-[12px] font-medium transition-all ${theme === t ? 'border-brand bg-brand-tint text-brand' : 'border-rule text-muted hover:bg-surface-soft'}`}>
                {t} mode {theme === t && '·  active'}
              </button>
            ))}
          </div>
        </Card>

        {/* Density */}
        <Card className="p-5 mb-4">
          <Eyebrow>Density</Eyebrow>
          <div className="mt-2.5 flex gap-2">
            {(['comfortable', 'compact'] as const).map(d => (
              <button key={d} onClick={() => update({ density: d })} className={`flex-1 px-4 py-3 rounded-lg border capitalize text-[12px] font-medium transition-all ${settings.density === d ? 'border-brand bg-brand-tint text-brand' : 'border-rule text-muted hover:bg-surface-soft'}`}>
                {d} {settings.density === d && '· active'}
              </button>
            ))}
          </div>
        </Card>

        {/* Chat panel */}
        <Card className="p-5 mb-4">
          <Eyebrow>Chat panel</Eyebrow>
          <div className="space-y-2.5 mt-2.5">
            <label className="flex items-center justify-between gap-2 p-2 rounded hover:bg-surface-soft">
              <div>
                <div className="text-[13px] text-ink">Show Insights Feed</div>
                <div className="text-[11px] text-muted">Persistent notifications at the top of the AI panel.</div>
              </div>
              <input type="checkbox" checked={settings.showInsightsFeed} onChange={e => update({ showInsightsFeed: e.target.checked })} className="w-4 h-4 accent-brand" />
            </label>
            <label className="flex items-center justify-between gap-2 p-2 rounded hover:bg-surface-soft">
              <div>
                <div className="text-[13px] text-ink">Auto-open chat on workbench entry</div>
                <div className="text-[11px] text-muted">The chat is pinned by default — uncheck to collapse on load.</div>
              </div>
              <input type="checkbox" checked={settings.autoOpenChat} onChange={e => update({ autoOpenChat: e.target.checked })} className="w-4 h-4 accent-brand" />
            </label>
          </div>
        </Card>

        {/* Pinned actions */}
        <Card className="p-5 mb-4">
          <Eyebrow>Quick actions in the strip</Eyebrow>
          <div className="text-[11px] text-muted mt-1.5 mb-2.5">Which universal actions always appear in the bottom strip. Chat-contextual cards always show regardless.</div>
          <div className="grid grid-cols-3 gap-2">
            {ALL_KINDS.map(({ kind, label }) => {
              const on = settings.pinnedActions.includes(kind);
              return (
                <button key={kind} onClick={() => toggleKind(kind)} className={`px-3 py-2.5 rounded-lg border text-[12px] font-medium transition-all ${on ? 'border-brand bg-brand-tint text-brand' : 'border-rule text-muted hover:bg-surface-soft'}`}>
                  {on && '✓ '} {label}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Meta */}
        <Card className="p-5">
          <Eyebrow>Persona defaults (read-only)</Eyebrow>
          <p className="text-[11px] text-muted mt-2 mb-3">The persona you log in as sets a default action-priority order. You can override per-session above.</p>
          <div className="space-y-2">
            {Object.values(PERSONAS).map(p => (
              <div key={p.key} className="flex items-center justify-between p-2 rounded border border-rule bg-surface-alt">
                <div>
                  <div className="text-[12px] font-semibold text-ink">{p.role}</div>
                  <div className="text-[10px] text-muted">Priority: {p.order.slice(0, 4).join(' → ')} …</div>
                </div>
                {user?.key === p.key && <span className="px-2 py-0.5 bg-positive-weak text-positive rounded text-[10px] font-semibold">Active</span>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
