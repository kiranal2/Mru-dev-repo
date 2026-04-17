import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuth, useTheme, useMission } from '../store';
import { Icon } from '../icons';
import { ToastHost } from './Toast';
import { MarinGuide, MissionEndCard } from './MarinGuide';
import { PERSONAS, MISSIONS } from '../data';
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
  const { start } = useMission();
  const nav = useNavigate();
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

  const onStartMission = () => {
    const m = MISSIONS.find(x => x.persona === personaKey) ?? MISSIONS[0];
    if (m.startPath) nav(m.startPath);
    start(m);
  };

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
      </div>
      <div className="flex items-center gap-2.5">
        <button onClick={onStartMission} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white" style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }} title="Start the guided mission">
          <Icon.Flag className="w-3 h-3" />
          <span>Start Mission</span>
        </button>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-rule bg-surface text-[12px]">
          <span className="text-muted">Persona</span>
          <select value={personaKey} onChange={onPersonaChange} className="bg-transparent text-ink text-[12px] outline-none cursor-pointer">
            <option value="CFO">CFO · Sarah</option>
            <option value="CONTROLLER">Controller · Raj</option>
            <option value="PREPARER">Preparer · Maya</option>
          </select>
        </div>
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
