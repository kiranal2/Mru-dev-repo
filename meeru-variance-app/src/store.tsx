import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Role, Persona, ActionKind, Toast, Mission, MissionBeat, ChatMsg, ActionCard } from './types';
import { PERSONAS } from './data';

// ==================================================================
// AUTH
// ==================================================================
interface AuthCtx {
  user: Persona | null;
  login: (role: Role) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthCtx | null>(null);
export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be inside AuthProvider');
  return c;
};

// ==================================================================
// THEME
// ==================================================================
type Theme = 'light' | 'dark';
interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
  set: (t: Theme) => void;
}
const ThemeContext = createContext<ThemeCtx | null>(null);
export const useTheme = () => {
  const c = useContext(ThemeContext);
  if (!c) throw new Error('useTheme must be inside ThemeProvider');
  return c;
};

// ==================================================================
// SETTINGS (density, default actions, etc.)
// ==================================================================
interface Settings {
  density: 'comfortable' | 'compact';
  showInsightsFeed: boolean;
  autoOpenChat: boolean;
  pinnedActions: ActionKind[];
}
interface SettingsCtx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}
const SettingsContext = createContext<SettingsCtx | null>(null);
export const useSettings = () => {
  const c = useContext(SettingsContext);
  if (!c) throw new Error('useSettings must be inside SettingsProvider');
  return c;
};

// ==================================================================
// TOASTS
// ==================================================================
interface ToastCtx {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}
const ToastContext = createContext<ToastCtx | null>(null);
export const useToasts = () => {
  const c = useContext(ToastContext);
  if (!c) throw new Error('useToasts must be inside ToastProvider');
  return c;
};

// ==================================================================
// MISSION
// ==================================================================
interface MissionState {
  mission: Mission | null;
  step: number;
  start: (m: Mission) => void;
  advance: () => void;
  skip: () => void;
  end: () => void;
  currentBeat: MissionBeat | null;
  ended: boolean;
  dismissEnded: () => void;
}
const MissionContext = createContext<MissionState | null>(null);
export const useMission = () => {
  const c = useContext(MissionContext);
  if (!c) throw new Error('useMission must be inside MissionProvider');
  return c;
};

// ==================================================================
// CHAT (per-page scope — held at app level but keyed by workbench)
// ==================================================================
interface ChatCtx {
  msgs: ChatMsg[];
  contextual: ActionCard[];
  followUps: string[];
  sent: Set<string>;
  scope: string;
  setScope: (s: string) => void;
  send: (q: string) => void;
  reset: () => void;
  markSent: (id: string) => void;
  clearContextual: () => void;
}
const ChatContext = createContext<ChatCtx | null>(null);
export const useChat = () => {
  const c = useContext(ChatContext);
  if (!c) throw new Error('useChat must be inside ChatProvider');
  return c;
};

// ==================================================================
// AGGREGATE PROVIDER
// ==================================================================
import { CHAT_RESPONSES, FALLBACK_RESPONSE } from './data';

export function AppProviders({ children }: { children: ReactNode }) {
  // AUTH
  const [user, setUser] = useState<Persona | null>(() => {
    try {
      const raw = localStorage.getItem('meeru.user');
      return raw ? (PERSONAS[raw as Role] ?? null) : null;
    } catch { return null; }
  });
  const login = useCallback((role: Role) => {
    const p = PERSONAS[role];
    setUser(p);
    try { localStorage.setItem('meeru.user', role); } catch {}
  }, []);
  const logout = useCallback(() => {
    setUser(null);
    try { localStorage.removeItem('meeru.user'); } catch {}
  }, []);

  // THEME
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem('meeru.theme') as Theme) || 'light'; } catch { return 'light'; }
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('meeru.theme', theme); } catch {}
  }, [theme]);
  const toggleTheme = useCallback(() => setTheme(t => t === 'light' ? 'dark' : 'light'), []);

  // SETTINGS
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const raw = localStorage.getItem('meeru.settings');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { density: 'comfortable', showInsightsFeed: true, autoOpenChat: true, pinnedActions: ['pin', 'remind', 'share'] };
  });
  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings(s => {
      const next = { ...s, ...patch };
      try { localStorage.setItem('meeru.settings', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // TOASTS
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = nextId.current++;
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3600);
  }, []);
  const dismiss = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // MISSION
  const [mission, setMission] = useState<Mission | null>(null);
  const [step, setStep] = useState(0);
  const [ended, setEnded] = useState(false);
  const start = useCallback((m: Mission) => {
    setMission(m); setStep(0); setEnded(false);
  }, []);
  const advance = useCallback(() => {
    setMission(m => {
      if (!m) return m;
      setStep(s => {
        const next = s + 1;
        if (next >= m.beats.length) {
          // end
          setTimeout(() => { setMission(null); setEnded(true); }, 1000);
          return s;
        }
        return next;
      });
      return m;
    });
  }, []);
  const skip = useCallback(() => { setMission(null); setStep(0); }, []);
  const endMission = useCallback(() => { setMission(null); setEnded(true); }, []);
  const dismissEnded = useCallback(() => setEnded(false), []);
  const currentBeat = mission ? (mission.beats[step] ?? null) : null;

  // CHAT
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [contextual, setContextual] = useState<ActionCard[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [scope, setScope] = useState('Variance Workbench');
  const sendChat = useCallback((q: string) => {
    if (!q.trim()) return;
    setMsgs(prev => [...prev, { role: 'user', text: q }]);
    const resp = CHAT_RESPONSES.find(r => r.match.test(q)) ?? FALLBACK_RESPONSE;
    setTimeout(() => {
      setMsgs(prev => [...prev, { role: 'ai', html: resp.text }]);
      setContextual(resp.actions);
      setFollowUps(resp.followUps ?? []);
      setSent(new Set());
    }, 420);
  }, []);
  const resetChat = useCallback(() => {
    setMsgs([]); setContextual([]); setFollowUps([]); setSent(new Set());
  }, []);
  const markSent = useCallback((id: string) => {
    setSent(prev => { const n = new Set(prev); n.add(id); return n; });
  }, []);
  const clearContextual = useCallback(() => { setContextual([]); setSent(new Set()); }, []);

  // ------ Provide values ------
  const auth = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  const themeV = useMemo(() => ({ theme, toggle: toggleTheme, set: setTheme }), [theme, toggleTheme]);
  const settingsV = useMemo(() => ({ settings, update: updateSettings }), [settings, updateSettings]);
  const toastV = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);
  const missionV = useMemo(() => ({
    mission, step, start, advance, skip, end: endMission, currentBeat, ended, dismissEnded
  }), [mission, step, start, advance, skip, endMission, currentBeat, ended, dismissEnded]);
  const chatV = useMemo(() => ({
    msgs, contextual, followUps, sent, scope, setScope, send: sendChat, reset: resetChat, markSent, clearContextual
  }), [msgs, contextual, followUps, sent, scope, sendChat, resetChat, markSent, clearContextual]);

  return (
    <AuthContext.Provider value={auth}>
      <ThemeContext.Provider value={themeV}>
        <SettingsContext.Provider value={settingsV}>
          <ToastContext.Provider value={toastV}>
            <MissionContext.Provider value={missionV}>
              <ChatContext.Provider value={chatV}>
                {children}
              </ChatContext.Provider>
            </MissionContext.Provider>
          </ToastContext.Provider>
        </SettingsContext.Provider>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}
