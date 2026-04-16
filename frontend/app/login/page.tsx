"use client";

export const dynamic = "force-dynamic";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Persona } from "@/lib/persona-context";

// Try to import session APIs (may not exist in all setups)
let removeSessionState: any = null;
let localStorageNames: any = {
  userLoggedInLocalStorageName: "meeru-user",
  lastActivityTimeLocalStorageName: "meeru-last-activity",
};
try {
  const storage = require("@/utils/use-storage");
  removeSessionState = storage.removeSessionState;
  const conf = require("@/conf/conf");
  localStorageNames = conf.localStorageNames;
} catch {
  // Dependencies not available — demo mode
}

// ─── Email → Persona mapping ─────────────────────────────────────
const EMAIL_PERSONA_MAP: Record<string, { persona: Persona; industry: "technology" | "healthcare" | "manufacturing" }> = {
  "cfo@meeru.ai":        { persona: "cfo",            industry: "technology" },
  "cao@meeru.ai":        { persona: "cao",            industry: "technology" },
  "controller@meeru.ai": { persona: "cao-controller", industry: "technology" },
};

// ─── Page ─────────────────────────────────────────────────────────
function LoginPage() {
  const router = useRouter();
  const effectRan = useRef(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear session state on mount
  useEffect(() => {
    if (!effectRan.current) {
      if (removeSessionState) removeSessionState();
      try {
        localStorage.removeItem(localStorageNames.userLoggedInLocalStorageName);
        localStorage.removeItem(localStorageNames.lastActivityTimeLocalStorageName);
        localStorage.removeItem("meeru-demo-config");
      } catch {
        /* ignore */
      }
      effectRan.current = true;
    }
  }, []);

  const handleLogin = useCallback((loginEmail: string) => {
    const trimmed = loginEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    setIsLoading(true);
    const match = EMAIL_PERSONA_MAP[trimmed];
    if (match) {
      try {
        localStorage.setItem("meeru-demo-config", JSON.stringify({ persona: match.persona, industry: null }));
      } catch { /* ignore */ }
      router.push("/onboarding");
    } else {
      setIsLoading(false);
      setError("Unrecognized email. Use cfo@meeru.ai, cao@meeru.ai, or controller@meeru.ai");
    }
  }, [router]);

  const handleSubmit = useCallback(() => {
    handleLogin(email);
  }, [email, handleLogin]);

  const handleDemoClick = useCallback((demoEmail: string) => {
    setEmail(demoEmail);
    setError("");
    handleLogin(demoEmail);
  }, [handleLogin]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--theme-bg, #F8FAFC)" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <img src="/meeru-logo.png" alt="Meeru AI" className="h-6 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <span className="text-2xl font-semibold tracking-tight" style={{ color: "var(--theme-text)" }}>
              Meeru<span className="text-primary font-bold">AI</span>
            </span>
          </div>
          <p className="text-[11px]" style={{ color: "var(--theme-text-muted)" }}>
            Decision Intelligence for Finance
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-6"
          style={{
            background: "var(--theme-surface, #ffffff)",
            border: "1px solid var(--theme-border)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div className="text-center mb-5">
            <h2 className="text-lg font-semibold mb-0.5" style={{ color: "var(--theme-text)" }}>
              Sign In
            </h2>
            <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
              Enter your email to access the platform
            </p>
          </div>

          {/* Security notice */}
          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
            <div className="flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-[11px] text-primary/80">
                Sign in with your corporate email to access the platform.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium" style={{ color: "var(--theme-text-secondary)" }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--theme-text-muted)" }} />
                <Input
                  id="email"
                  type="email"
                  placeholder="cfo@meeru.ai"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className={cn("pl-10 h-9 text-sm", error && "border-red-400")}
                  disabled={isLoading}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
                  }}
                />
              </div>
              {error && (
                <Alert variant="destructive" className="py-1.5">
                  <AlertDescription className="text-[11px]">{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-9 text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign in with SSO
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--theme-border)" }}>
            <p className="text-[10px] text-center mb-2 uppercase tracking-wider font-medium" style={{ color: "var(--theme-text-muted)" }}>
              Quick Access
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { email: "cfo@meeru.ai", label: "CFO" },
                { email: "cao@meeru.ai", label: "CAO" },
                { email: "controller@meeru.ai", label: "Controller" },
              ].map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleDemoClick(account.email)}
                  disabled={isLoading}
                  className="text-center px-2 py-2 rounded-lg transition-all duration-150 disabled:opacity-50"
                  style={{
                    background: "var(--theme-surface-alt, #f1f5f9)",
                    border: "1px solid var(--theme-border)",
                    color: "var(--theme-text)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.4)";
                    e.currentTarget.style.background = "hsl(var(--primary) / 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--theme-border)";
                    e.currentTarget.style.background = "var(--theme-surface-alt, #f1f5f9)";
                  }}
                >
                  <div className="text-xs font-semibold">{account.label}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: "var(--theme-text-muted)" }}>{account.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 text-center">
          <p className="text-[10px]" style={{ color: "var(--theme-text-muted)" }}>
            Meeru AI &copy; {new Date().getFullYear()} &middot; All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}

export default React.memo(LoginPage);
