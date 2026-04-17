import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
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

function Header() {
  const { user, logout } = useAuth();
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
    <header className="flex items-center justify-between px-4 bg-surface border-b border-rule shrink-0" style={{ height: 44 }}>
      <div className="flex items-center gap-2.5">
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
        <div className="flex items-center gap-2 pl-1.5 pr-1 py-0.5 rounded-full bg-surface-soft">
          <div className="w-6 h-6 rounded-full text-white grid place-items-center text-[11px] font-semibold" style={{ background: 'linear-gradient(135deg,#6366F1,#1E40AF)' }}>{user?.init}</div>
          <div className="leading-tight pr-1">
            <div className="text-[11px] font-semibold text-ink">{user?.name}</div>
            <div className="text-[10px] text-muted">{user?.role}</div>
          </div>
          <button onClick={logout} title="Log out" className="w-6 h-6 rounded grid place-items-center text-faint hover:text-ink hover:bg-rule/30">
            <Icon.LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default function AppShell({ children }: { children?: ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-surface-alt">
      <Header />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
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
