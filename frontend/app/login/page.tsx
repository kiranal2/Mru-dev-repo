"use client";

export const dynamic = "force-dynamic";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Persona, getPersonaLandingRoute } from "@/lib/persona-context";

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
        localStorage.setItem("meeru-demo-config", JSON.stringify(match));
      } catch { /* ignore */ }
      const route = getPersonaLandingRoute(match.persona);
      router.push(route);
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl tracking-tight text-slate-800 mb-1">
            Meeru<span className="text-primary font-bold">AI</span>
          </h1>
          <p className="text-xs text-slate-500">
            AI-powered financial analysis platform
          </p>
        </div>

        {/* SSO Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              Sign In
            </h2>
            <p className="text-sm text-slate-500">
              Enter your email to access the platform
            </p>
          </div>

          {/* Security notice */}
          <div className="mb-5 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-primary/80">
                Sign in with your corporate email to access the Meeru AI platform.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="cfo@meeru.ai"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className={cn("pl-10 h-10", error && "border-red-400")}
                  disabled={isLoading}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
                  }}
                />
              </div>
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-10"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Sign in with SSO
                </>
              )}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 text-center mb-2.5 uppercase tracking-wider font-medium">
              Demo Accounts
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
                  className="text-center px-2 py-2.5 rounded-lg border border-slate-200 bg-white hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  <div className="text-xs font-semibold text-slate-700">{account.label}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{account.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Meeru AI &copy; {new Date().getFullYear()} &middot; All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}

export default React.memo(LoginPage);
