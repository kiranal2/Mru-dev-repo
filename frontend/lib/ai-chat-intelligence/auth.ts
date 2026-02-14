// ── Client-side demo authentication for AI Chat Intelligence ────────
// No Supabase dependency — localStorage only

export interface IGRSSession {
  email: string;
  name: string;
  role: "ADMIN";
  loginAt: string;
}

const STORAGE_KEY = "igrs_admin_session";

// Hardcoded demo credentials
const DEMO_CREDENTIALS = {
  email: "admin@igrs.ap.gov.in",
  password: "admin123",
  name: "IGRS Administrator",
} as const;

/**
 * Validate credentials and store session in localStorage.
 * Returns `{ ok: true }` on success, `{ ok: false, error }` on failure.
 */
export function loginAdmin(
  email: string,
  password: string
): { ok: true } | { ok: false; error: string } {
  const trimmedEmail = email.trim().toLowerCase();

  if (trimmedEmail !== DEMO_CREDENTIALS.email || password !== DEMO_CREDENTIALS.password) {
    return { ok: false, error: "Invalid email or password" };
  }

  const session: IGRSSession = {
    email: DEMO_CREDENTIALS.email,
    name: DEMO_CREDENTIALS.name,
    role: "ADMIN",
    loginAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    return { ok: false, error: "Could not persist session" };
  }

  return { ok: true };
}

/** Read the current session (or null if not logged in). */
export function getSession(): IGRSSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as IGRSSession;
  } catch {
    return null;
  }
}

/** Clear the session from localStorage. */
export function logoutAdmin(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
