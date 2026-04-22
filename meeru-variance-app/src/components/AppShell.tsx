import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuth, useTheme, useSettings, useChat } from '../store';
import { Icon } from '../icons';
import { ToastHost } from './Toast';
import { MarinGuide, MissionEndCard } from './MarinGuide';
import { LoadingBar } from './Skeletons';
import { PERSONAS } from '../data';
import type { Role } from '../types';

function Sidebar() {
  const loc = useLocation();
  const is = (p: string) => loc.pathname.startsWith(p);
  const cls = (active: boolean) =>
    `w-10 h-10 rounded-lg grid place-items-center relative transition-colors ${
      active ? 'bg-brand text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'
    }`;
  return (
    <aside className="bg-slate-900 dark:bg-slate-950 flex flex-col items-center py-2.5 gap-1 border-r border-rule/40" style={{ width: 56 }}>
      <Link to="/workspace" className={cls(is('/workspace'))} title="Home"><Icon.Home className="w-5 h-5" /></Link>
      <Link to="/variance/performance" className={cls(is('/variance'))} title="Decision Intelligence"><Icon.Chart className="w-5 h-5" /></Link>
      <Link to="/close" className={cls(is('/close') || is('/reconciliations'))} title="Close Intelligence"><Icon.Calendar className="w-5 h-5" /></Link>
      <button className={cls(false)} title="Automation"><Icon.Bolt className="w-5 h-5" /></button>
      <button className={cls(false)} title="Reports"><Icon.File className="w-5 h-5" /></button>
      <div className="flex-1" />
      <Link to="/settings" className={cls(is('/settings'))} title="Settings"><Icon.Settings className="w-5 h-5" /></Link>
    </aside>
  );
}

function Header({ sidebarHidden, onToggleSidebar }: { sidebarHidden: boolean; onToggleSidebar: () => void }) {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const personaKey = user?.key;
  const loc = useLocation();
  const crumb = (() => {
    if (loc.pathname.startsWith('/variance')) return 'Variance Workbench';
    if (loc.pathname.startsWith('/close')) return 'Close Workbench';
    if (loc.pathname.startsWith('/reconciliations')) return 'Reconciliations';
    if (loc.pathname.startsWith('/settings')) return 'Settings';
    if (loc.pathname.startsWith('/workspace')) return 'My Workspace';
    return 'MeeruAI';
  })();

  const onPersonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const r = e.target.value as Role;
    localStorage.setItem('meeru.user', r);
    // Force re-load via reload (simpler than re-plumbing auth)
    window.location.reload();
  };

  return (
    <header className="flex items-center justify-between px-3 bg-surface border-b border-rule shrink-0" style={{ height: 44 }}>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          title={sidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
          className="w-8 h-8 rounded-md grid place-items-center text-muted hover:bg-surface-soft hover:text-ink transition-colors"
        >
          <Icon.Menu className="w-4 h-4" />
        </button>
        {theme === 'light' ? (
          <img src="/meeru-logo.png" alt="MeeruAI" className="h-5 w-auto object-contain select-none" draggable={false} />
        ) : (
          <span className="text-[16px] font-bold tracking-tight leading-none text-white">
            Meeru<span style={{ color: 'var(--primary)' }}>AI</span>
          </span>
        )}
        <div className="h-4 w-px bg-rule mx-2" />
        <span className="text-[10px] font-semibold tracking-wider uppercase text-muted">{crumb}</span>
        <AgentStatusPill />
      </div>
      <div className="flex items-center gap-2.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-rule bg-surface text-[12px]">
          <span className="text-muted">Persona</span>
          <select value={personaKey} onChange={onPersonaChange} className="bg-transparent text-ink text-[12px] outline-none cursor-pointer">
            <option value="CFO">CFO · Sarah</option>
            <option value="CONTROLLER">Controller · Raj</option>
            <option value="PREPARER">Preparer · Maya</option>
          </select>
        </div>
        <ChatToggleButton />
        <button onClick={toggle} className="w-7 h-7 rounded-md grid place-items-center text-muted hover:bg-surface-soft hover:text-ink" title="Toggle theme">
          {theme === 'light' ? <Icon.Moon className="w-4 h-4" /> : <Icon.Sun className="w-4 h-4" />}
        </button>
        <ProfileMenu />
      </div>
    </header>
  );
}

// ==========================================================
// ProfileMenu — header user chip + dropdown with persona detail
// ==========================================================
function ProfileMenu() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { pinned, saved } = useChat();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  if (!user) return null;
  const statTone = user.quickStat?.tone === 'pos'  ? 'text-positive'
                 : user.quickStat?.tone === 'neg'  ? 'text-negative'
                 : user.quickStat?.tone === 'warn' ? 'text-warning'
                 : 'text-ink';

  const switchPersona = (r: Role) => {
    if (r === user.key) { setOpen(false); return; }
    try { localStorage.setItem('meeru.user', r); } catch {}
    window.location.reload();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 pl-1 pr-2 py-0.5 rounded-full border transition-colors ${open ? 'bg-brand-tint border-brand-weak' : 'bg-surface-soft border-transparent hover:border-rule'}`}
        title="Open profile menu"
      >
        <div className="w-6 h-6 rounded-full text-white grid place-items-center text-[11px] font-semibold" style={{ background: 'linear-gradient(135deg,#6366F1,#1E40AF)' }}>{user.init}</div>
        <div className="leading-tight text-left">
          <div className="text-[11px] font-semibold text-ink">{user.name}</div>
          <div className="text-[10px] text-muted">{user.role}</div>
        </div>
        <svg className={`w-3 h-3 text-faint transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-[340px] bg-surface border border-rule rounded-xl shadow-e3 z-[60] overflow-hidden anim-fade-up">
          {/* Header */}
          <div className="p-4 border-b border-rule bg-gradient-to-br from-brand-tint to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full text-white grid place-items-center text-[16px] font-semibold shrink-0" style={{ background: 'linear-gradient(135deg,#6366F1,#1E40AF)' }}>{user.init}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-ink truncate">{user.name}</div>
                <div className="text-[11px] text-muted truncate">{user.role}</div>
                <div className="text-[10px] text-faint truncate">{user.email}</div>
              </div>
            </div>
            {user.quickStat && (
              <div className="mt-3 flex items-center justify-between bg-surface/70 backdrop-blur rounded-md px-3 py-2 border border-rule">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted">{user.quickStat.label}</span>
                <span className={`text-[13px] font-semibold num ${statTone}`}>{user.quickStat.value}</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="px-4 py-3 border-b border-rule">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-faint mb-2">Details</div>
            <dl className="grid grid-cols-[90px_1fr] gap-y-1.5 text-[11px]">
              <dt className="text-muted">Department</dt>   <dd className="text-ink">{user.department ?? '—'}</dd>
              <dt className="text-muted">Reports to</dt>    <dd className="text-ink">{user.reportsTo ?? '—'}</dd>
              <dt className="text-muted">Team size</dt>     <dd className="text-ink num">{user.teamSize ?? '—'}</dd>
              <dt className="text-muted">Location</dt>      <dd className="text-ink">{user.location ?? '—'}</dd>
              <dt className="text-muted">Timezone</dt>      <dd className="text-ink">{user.timezone ?? '—'}</dd>
              <dt className="text-muted">Phone</dt>         <dd className="text-ink num">{user.phone ?? '—'}</dd>
            </dl>
          </div>

          {/* Focus areas */}
          {user.focusAreas && user.focusAreas.length > 0 && (
            <div className="px-4 py-3 border-b border-rule">
              <div className="text-[10px] font-semibold tracking-wider uppercase text-faint mb-2">Focus areas</div>
              <div className="flex flex-wrap gap-1.5">
                {user.focusAreas.map(f => (
                  <span key={f} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-tint text-brand border border-brand-weak">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Today */}
          {user.todayAgenda && user.todayAgenda.length > 0 && (
            <div className="px-4 py-3 border-b border-rule">
              <div className="text-[10px] font-semibold tracking-wider uppercase text-faint mb-2">Today</div>
              <ul className="space-y-1">
                {user.todayAgenda.map((item, i) => (
                  <li key={i} className="flex gap-2 text-[11px]">
                    <span className="text-faint shrink-0 mt-1.5 w-1 h-1 rounded-full bg-brand" />
                    <span className="text-ink">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Permissions (expandable collapsed summary) */}
          {user.permissions && user.permissions.length > 0 && (
            <details className="border-b border-rule">
              <summary className="px-4 py-2.5 text-[11px] text-muted cursor-pointer select-none hover:bg-surface-soft flex items-center justify-between">
                <span><span className="text-[10px] font-semibold tracking-wider uppercase text-faint mr-1.5">Permissions</span>· {user.permissions.length} granted</span>
                <span className="text-faint">▾</span>
              </summary>
              <div className="px-4 pb-3">
                <ul className="space-y-1">
                  {user.permissions.map((p, i) => (
                    <li key={i} className="flex gap-2 text-[11px] text-muted">
                      <Icon.Check className="w-3 h-3 text-positive shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          )}

          {/* Quick actions */}
          <div className="py-1.5">
            <MenuItem
              onClick={() => { setOpen(false); nav('/notebook'); }}
              icon={<Icon.File className="w-3.5 h-3.5" />}
              label="Notebook"
              hint={saved.length + pinned.length > 0 ? `${saved.length + pinned.length}` : undefined}
            />
            <MenuItem onClick={() => { setOpen(false); nav('/settings'); }} icon={<Icon.Settings className="w-3.5 h-3.5" />} label="Settings & preferences" />
            <MenuItem onClick={() => { toggle(); }} icon={theme === 'light' ? <Icon.Moon className="w-3.5 h-3.5" /> : <Icon.Sun className="w-3.5 h-3.5" />} label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} />
            <MenuItem onClick={() => { setOpen(false); alert('Keyboard shortcuts:\n\n/ — focus chat\n⌘K — command palette\nEsc — close menu'); }} icon={<Icon.Info className="w-3.5 h-3.5" />} label="Keyboard shortcuts" hint="⌘/" />
            <MenuItem onClick={() => { setOpen(false); alert('Help & docs coming soon'); }} icon={<Icon.Info className="w-3.5 h-3.5" />} label="Help & docs" />
          </div>

          {/* Switch persona */}
          <div className="border-t border-rule py-1.5">
            <div className="px-4 pt-1.5 pb-1 text-[10px] font-semibold tracking-wider uppercase text-faint">Switch persona</div>
            {(['CFO', 'CONTROLLER', 'PREPARER'] as Role[]).map(r => {
              const p = PERSONAS[r];
              const active = r === user.key;
              return (
                <button
                  key={r}
                  onClick={() => switchPersona(r)}
                  className={`w-full flex items-center gap-2.5 px-4 py-1.5 text-left text-[12px] ${active ? 'bg-brand-tint' : 'hover:bg-surface-soft'}`}
                >
                  <div className="w-6 h-6 rounded-full text-white grid place-items-center text-[10px] font-semibold shrink-0" style={{ background: 'linear-gradient(135deg,#6366F1,#1E40AF)' }}>{p.init}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold text-ink truncate">{p.name}</div>
                    <div className="text-[10px] text-muted truncate">{p.role}</div>
                  </div>
                  {active && <span className="text-[10px] text-brand font-semibold">Active</span>}
                </button>
              );
            })}
          </div>

          {/* Logout */}
          <div className="border-t border-rule py-1.5 bg-surface-alt">
            <button
              onClick={() => { setOpen(false); logout(); nav('/login'); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-negative hover:bg-negative-weak transition-colors"
            >
              <Icon.LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
              <span className="ml-auto text-[10px] text-faint">Returns to login</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ onClick, icon, label, hint }: { onClick: () => void; icon: ReactNode; label: string; hint?: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2 px-4 py-1.5 text-left text-[12px] text-ink hover:bg-surface-soft">
      <span className="text-muted shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {hint && <span className="text-[10px] text-faint font-mono">{hint}</span>}
    </button>
  );
}

// ==========================================================
// AgentStatusPill — pulsing "agent active" chip with activity log
// ==========================================================
const AGENT_ACTIVITY: { ts: string; text: string; kind: 'scan' | 'flag' | 'forecast' | 'update' }[] = [
  { ts: 'just now', text: 'Scanning 312 accounts for churn risk',                   kind: 'scan' },
  { ts: '12s ago',  text: 'Flagged CA Retail labor drift — -2.8pp margin',          kind: 'flag' },
  { ts: '45s ago',  text: 'Re-ran NRR projection with cohort weights',               kind: 'forecast' },
  { ts: '1m ago',   text: 'Updated ML confidence on Voltair renewal (→ 28%)',       kind: 'update' },
  { ts: '2m ago',   text: 'Refreshed 9 connected sources',                           kind: 'update' },
  { ts: '4m ago',   text: 'Detected anomaly: cloud egress +18% WoW',                kind: 'flag' },
];

function AgentStatusPill() {
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Tick every second to animate the "updated Xs ago" counter
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % 240), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const secondsAgo = tick;
  const label = secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ago`;

  const kindMeta = (k: string) =>
    k === 'flag'     ? { Ic: Icon.Alert,    cls: 'text-warning bg-warning-weak'  } :
    k === 'forecast' ? { Ic: Icon.Trend,    cls: 'text-brand   bg-brand-tint'    } :
    k === 'update'   ? { Ic: Icon.Refresh,  cls: 'text-muted   bg-surface-soft'  } :
                       { Ic: Icon.Search,   cls: 'text-positive bg-positive-weak' };

  return (
    <div className="relative ml-2" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Agent activity"
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-rule hover:border-positive bg-surface-alt transition-colors"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-positive live-dot" />
        <span className="text-[10px] font-semibold text-ink uppercase tracking-wider">Agent active</span>
        <span className="text-[10px] text-faint hidden xl:inline">· {label}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-[320px] bg-surface border border-rule rounded-xl shadow-e3 z-[60] overflow-hidden anim-fade-up">
          <div className="px-3.5 py-2.5 border-b border-rule bg-gradient-to-br from-positive-weak to-transparent flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-positive live-dot" />
            <div className="flex-1">
              <div className="text-[12px] font-semibold text-ink">Agent active</div>
              <div className="text-[10px] text-muted">9 sources connected · last tick {label}</div>
            </div>
          </div>
          <div className="px-3.5 py-2 border-b border-rule flex items-center justify-between text-[10px]">
            <span className="text-faint font-semibold tracking-wider uppercase">Recent activity</span>
            <span className="text-faint">live</span>
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            {AGENT_ACTIVITY.map((a, i) => {
              const m = kindMeta(a.kind);
              return (
                <div key={i} className="flex items-start gap-2.5 px-3.5 py-2 hover:bg-surface-soft border-b border-rule/50 last:border-b-0">
                  <span className={`w-6 h-6 shrink-0 rounded grid place-items-center ${m.cls}`}>
                    <m.Ic className="w-3 h-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-ink leading-snug">{a.text}</div>
                    <div className="text-[10px] text-faint mt-0.5">{a.ts}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-3.5 py-2 bg-surface-alt border-t border-rule text-[10px] text-muted flex items-center justify-between">
            <span>Confidence 94% · continuous</span>
            <button className="text-brand hover:underline">Open full log</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================================
// ChatToggleButton — show / hide the AI chat side panel
// ==========================================================
function ChatToggleButton() {
  const { settings, update } = useSettings();
  const hidden = settings.chatHidden;
  return (
    <button
      onClick={() => update({ chatHidden: !hidden })}
      title={hidden ? 'Show AI panel' : 'Hide AI panel'}
      className={`w-7 h-7 rounded-md grid place-items-center transition-colors ${hidden ? 'text-faint hover:bg-surface-soft hover:text-ink' : 'text-brand bg-brand-tint hover:bg-brand-weak'}`}
    >
      <Icon.Sparkle className="w-4 h-4" />
    </button>
  );
}

export default function AppShell({ children }: { children?: ReactNode }) {
  const [sidebarHidden, setSidebarHidden] = useState<boolean>(() => {
    try { return localStorage.getItem('meeru.sidebarHidden') === '1'; } catch { return false; }
  });
  const toggleSidebar = useCallback(() => {
    setSidebarHidden(v => {
      const next = !v;
      try { localStorage.setItem('meeru.sidebarHidden', next ? '1' : '0'); } catch {}
      return next;
    });
  }, []);

  return (
    <div className="h-screen flex flex-col bg-surface-alt">
      <Header sidebarHidden={sidebarHidden} onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1 min-h-0">
        {!sidebarHidden && <Sidebar />}
        <div className="flex-1 min-w-0 flex flex-col">
          {children ?? <Outlet />}
        </div>
      </div>
      <LoadingBar />
      <ToastHost />
      <MarinGuide />
      <MissionEndCard />
    </div>
  );
}

// Export a sub-shell explicitly for convenience
export { Sidebar, Header };

// Helper for pages — retrieves persona from auth
export function usePersona() {
  const { user } = useAuth();
  return user ?? PERSONAS.CFO;
}
