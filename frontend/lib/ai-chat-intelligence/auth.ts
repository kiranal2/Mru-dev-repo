// ── Client-side demo authentication for AI Chat Intelligence ────────
// No Supabase dependency — localStorage only

export type IGRSRole = "IG" | "DIG" | "DR" | "SR";

export interface IGRSJurisdiction {
  zone?: string;
  district?: string;
  srCode?: string;
  srName?: string;
}

export interface IGRSSession {
  email: string;
  name: string;
  role: IGRSRole;
  designation: string;
  jurisdiction: IGRSJurisdiction;
  loginAt: string;
}

const STORAGE_KEY = "igrs_admin_session";

// Demo credentials for each role
interface DemoUser {
  email: string;
  password: string;
  name: string;
  role: IGRSRole;
  designation: string;
  jurisdiction: IGRSJurisdiction;
}

const DEMO_USERS: DemoUser[] = [
  {
    email: "ig@igrs.ap.gov.in",
    password: "ig123",
    name: "IG Officer",
    role: "IG",
    designation: "Inspector General",
    jurisdiction: {},
  },
  {
    email: "dig.south@igrs.ap.gov.in",
    password: "dig123",
    name: "DIG Officer",
    role: "DIG",
    designation: "DIG South Zone",
    jurisdiction: { zone: "South" },
  },
  {
    email: "dr.krishna@igrs.ap.gov.in",
    password: "dr123",
    name: "DR Officer",
    role: "DR",
    designation: "District Registrar, Krishna",
    jurisdiction: { zone: "South", district: "Krishna" },
  },
  {
    email: "sr.vijayawada@igrs.ap.gov.in",
    password: "sr123",
    name: "SR Officer",
    role: "SR",
    designation: "Sub-Registrar, Vijayawada Central",
    jurisdiction: { zone: "South", district: "Krishna", srCode: "SR01", srName: "Vijayawada Central" },
  },
];

/**
 * Validate credentials and store session in localStorage.
 * Returns `{ ok: true }` on success, `{ ok: false, error }` on failure.
 */
export function loginIGRS(
  email: string,
  password: string
): { ok: true } | { ok: false; error: string } {
  const trimmedEmail = email.trim().toLowerCase();

  const user = DEMO_USERS.find(
    (u) => u.email === trimmedEmail && u.password === password
  );

  if (!user) {
    return { ok: false, error: "Invalid email or password" };
  }

  const session: IGRSSession = {
    email: user.email,
    name: user.name,
    role: user.role,
    designation: user.designation,
    jurisdiction: user.jurisdiction,
    loginAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    return { ok: false, error: "Could not persist session" };
  }

  return { ok: true };
}

/** Backwards-compatible alias */
export const loginAdmin = loginIGRS;

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

/** Get all demo users (for the role selector UI). */
export function getDemoUsers() {
  return DEMO_USERS.map(({ password, ...rest }) => rest);
}
