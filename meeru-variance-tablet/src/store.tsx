import {
  createContext, useContext, useState, useCallback,
  useEffect, useMemo, useRef,
} from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Role, Persona, ChatMsg, ActionCard } from './types';
import { PERSONAS, CHAT_RESPONSES, FALLBACK_RESPONSE } from './data';

// ==========================================================
// AUTH
// ==========================================================
interface AuthCtx {
  user: Persona | null;
  login: (role: Role) => void;
  logout: () => void;
  hydrated: boolean;
}
const AuthContext = createContext<AuthCtx | null>(null);
export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be inside AppProviders');
  return c;
};

// ==========================================================
// CHAT
// ==========================================================
interface ChatCtx {
  msgs: ChatMsg[];
  contextual: ActionCard[];
  followUps: string[];
  sent: Set<string>;
  thinking: boolean;
  send: (q: string) => void;
  reset: () => void;
  markSent: (id: string) => void;
}
const ChatContext = createContext<ChatCtx | null>(null);
export const useChat = () => {
  const c = useContext(ChatContext);
  if (!c) throw new Error('useChat must be inside AppProviders');
  return c;
};

// ==========================================================
// TOASTS
// ==========================================================
export interface Toast { id: number; kind: 'ok' | 'warn' | 'info'; title: string; sub?: string; }
interface ToastCtx { toasts: Toast[]; push: (t: Omit<Toast, 'id'>) => void; dismiss: (id: number) => void; }
const ToastContext = createContext<ToastCtx | null>(null);
export const useToasts = () => {
  const c = useContext(ToastContext);
  if (!c) throw new Error('useToasts must be inside AppProviders');
  return c;
};

// ==========================================================
// APP PROVIDERS
// ==========================================================
export function AppProviders({ children }: { children: ReactNode }) {
  // ---- auth ----
  const [user, setUser] = useState<Persona | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('meeru.user').then((raw) => {
      if (raw && PERSONAS[raw as Role]) setUser(PERSONAS[raw as Role]);
      setHydrated(true);
    });
  }, []);

  const login = useCallback((role: Role) => {
    setUser(PERSONAS[role]);
    AsyncStorage.setItem('meeru.user', role).catch(() => {});
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    AsyncStorage.removeItem('meeru.user').catch(() => {});
  }, []);

  // ---- chat ----
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [contextual, setContextual] = useState<ActionCard[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [thinking, setThinking] = useState(false);

  const send = useCallback((q: string) => {
    if (!q.trim()) return;
    setMsgs((prev) => [...prev, { role: 'user', text: q }]);
    setThinking(true);
    const resp = CHAT_RESPONSES.find((r) => r.match.test(q)) ?? FALLBACK_RESPONSE;
    const delay = 900 + Math.random() * 500;
    setTimeout(() => {
      setMsgs((prev) => [...prev, { role: 'ai', text: resp.text }]);
      setContextual(resp.actions);
      setFollowUps(resp.followUps ?? []);
      setSent(new Set());
      setThinking(false);
    }, delay);
  }, []);

  const reset = useCallback(() => {
    setMsgs([]); setContextual([]); setFollowUps([]); setSent(new Set());
  }, []);

  const markSent = useCallback((id: string) => {
    setSent((prev) => { const n = new Set(prev); n.add(id); return n; });
  }, []);

  // ---- toasts ----
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3200);
  }, []);
  const dismiss = useCallback(
    (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    []
  );

  // ---- memoised contexts ----
  const authV = useMemo(() => ({ user, login, logout, hydrated }), [user, login, logout, hydrated]);
  const chatV = useMemo(
    () => ({ msgs, contextual, followUps, sent, thinking, send, reset, markSent }),
    [msgs, contextual, followUps, sent, thinking, send, reset, markSent]
  );
  const toastV = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return (
    <AuthContext.Provider value={authV}>
      <ChatContext.Provider value={chatV}>
        <ToastContext.Provider value={toastV}>{children}</ToastContext.Provider>
      </ChatContext.Provider>
    </AuthContext.Provider>
  );
}
