"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { loginIGRS, getDemoUsers, type IGRSRole } from "@/lib/ai-chat-intelligence/auth";

// ── Color tokens ────────────────────────────────────────────────────
const C = {
  navy: "#1a365d",
  navyLight: "#234876",
  navyDark: "#0f2744",
  gold: "#d69e2e",
  goldLight: "#f6e05e",
  goldBg: "#fefcbf",
  bg: "#f7fafc",
  white: "#ffffff",
} as const;

// ── AP Government Emblem (real image) ────────────────────────────────
function APEmblem({ size = 56 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/ap-logo.png"
      alt="Government of Andhra Pradesh Emblem"
      width={size}
      height={size}
      className="object-contain"
      draggable={false}
    />
  );
}

// ── AP State Map (real image) ────────────────────────────────────────
function APMapImage() {
  return (
    <div className="flex flex-col items-center relative w-full max-w-[260px] mx-auto -mt-2">
      <Image
        src="/ap-map.png"
        alt="Andhra Pradesh Districts Map"
        width={260}
        height={300}
        className="w-full h-auto object-contain"
        draggable={false}
        unoptimized
      />
    </div>
  );
}

// ── Feature Card ────────────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-white"
        style={{ background: C.navy }}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-gray-800 mb-1 text-sm">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

// ── SVG Icons (inline, no dependency) ───────────────────────────────
const IconBrain = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a4 4 0 0 1 4 4v1a3 3 0 0 1 2 5.2V14a4 4 0 0 1-3 3.87V20a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2.13A4 4 0 0 1 6 14v-1.8A3 3 0 0 1 8 7V6a4 4 0 0 1 4-4z" />
    <path d="M10 10h4" />
    <path d="M12 10v4" />
  </svg>
);

const IconMonitor = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const IconChart = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
  </svg>
);

const IconGlobe = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconLock = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconMail = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 4L12 13 2 4" />
  </svg>
);

// ── Role card icon SVGs ──────────────────────────────────────────────
const RoleIcons: Record<IGRSRole, React.ReactNode> = {
  IG: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  DIG: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  DR: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  SR: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

// ── Demo users data ──────────────────────────────────────────────────
const DEMO_USERS = getDemoUsers();

const ROLE_META: Record<IGRSRole, { label: string; passwordHint: string }> = {
  IG: { label: "Inspector General", passwordHint: "ig123" },
  DIG: { label: "DIG Zone", passwordHint: "dig123" },
  DR: { label: "District Registrar", passwordHint: "dr123" },
  SR: { label: "Sub-Registrar", passwordHint: "sr123" },
};

// ── Scope label helper ──────────────────────────────────────────────
function getScopeLabel(user: (typeof DEMO_USERS)[number]): string {
  switch (user.role) {
    case "IG": return "State of AP";
    case "DIG": return `${user.jurisdiction.zone} Zone · 5 districts`;
    case "DR": return `${user.jurisdiction.district} District`;
    case "SR": return `${user.jurisdiction.srCode} · ${user.jurisdiction.srName}`;
    default: return "";
  }
}

// ── Page Component ──────────────────────────────────────────────────

// ── Login stage definitions ──────────────────────────────────────────
type LoginStage = "idle" | "authenticating" | "verifying" | "loading" | "ready";

const LOGIN_STAGES: { key: LoginStage; label: string; sub: string; duration: number }[] = [
  {
    key: "authenticating",
    label: "Authenticating",
    sub: "Validating credentials with IGRS server...",
    duration: 1000,
  },
  {
    key: "verifying",
    label: "Verifying Access",
    sub: "Verifying role permissions & jurisdiction scope...",
    duration: 1200,
  },
  {
    key: "loading",
    label: "Loading Dashboard",
    sub: "Preparing Revenue Intelligence modules...",
    duration: 1000,
  },
  { key: "ready", label: "Ready", sub: "Redirecting to dashboard...", duration: 600 },
];

export default function AIChatIntelligenceLoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<IGRSRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginStage, setLoginStage] = useState<LoginStage>("idle");

  const handleRoleSelect = (role: IGRSRole) => {
    const user = DEMO_USERS.find((u) => u.role === role);
    setSelectedRole(role);
    setEmail(user?.email ?? "");
    setPassword("");
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Brief pause before validating
    await new Promise((r) => setTimeout(r, 400));

    const result = loginIGRS(email, password);

    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    // Credentials valid — run through animated stages
    for (const stage of LOGIN_STAGES) {
      setLoginStage(stage.key);
      await new Promise((r) => setTimeout(r, stage.duration));
    }

    // Open IGRS panel by default after login and keep IGRS selected in rail.
    try {
      localStorage.setItem("igrs-open-panel-default", "1");
      localStorage.setItem("meeru-selected-rail", "igrs");
    } catch {
      // no-op
    }

    router.push("/igrs/revenue-assurance/ai-chat");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg }}>
      {/* ─── Gold Accent Strip ──────────────────────────────────── */}
      <div
        className="h-1"
        style={{ background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight}, ${C.gold})` }}
      />

      {/* ─── Navy Header ────────────────────────────────────────── */}
      <header style={{ background: C.navy }} className="text-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <APEmblem size={52} />
            <div>
              <h1 className="text-base font-bold tracking-wide leading-tight">
                Government of Andhra Pradesh
              </h1>
              <p className="text-xs opacity-80 mt-0.5">
                Inspector General of Registration &amp; Stamps
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs">
            <a href="#" className="opacity-70 hover:opacity-100 transition-opacity">Help</a>
            <a href="#" className="opacity-70 hover:opacity-100 transition-opacity">Contact</a>
            <a href="#" className="opacity-70 hover:opacity-100 transition-opacity">FAQ</a>
            <span className="opacity-40">|</span>
            <span className="opacity-60 text-[10px]">v2.0.0</span>
          </div>
        </div>
      </header>

      {/* ─── Navigation Bar ─────────────────────────────────────── */}
      <nav style={{ background: C.navyLight }} className="text-white border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-0 text-xs font-medium">
            {[
              { label: "Home", active: false },
              { label: "About IGRS", active: false },
              { label: "Services", active: false },
              { label: "Revenue Intelligence", active: true },
              { label: "Contact", active: false },
            ].map((item) => (
              <a
                key={item.label}
                href="#"
                className={`px-4 py-2.5 transition-colors ${
                  item.active
                    ? "bg-white/15 border-b-2 border-amber-400"
                    : "opacity-80 hover:opacity-100 hover:bg-white/5"
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ───────────────────────────────────────── */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Left Column — Info + Map */}
            <div className="space-y-6">
              <div>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                  style={{
                    background: `${C.gold}18`,
                    color: C.gold,
                    border: `1px solid ${C.gold}40`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  AI-Powered Platform
                </div>
                <h2 className="text-3xl font-bold leading-tight mb-3" style={{ color: C.navy }}>
                  Revenue Intelligence &<br />
                  Leakage Detection System
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed max-w-lg">
                  Advanced AI-powered analytics platform for the Inspector General of Registration
                  &amp; Stamps, Government of Andhra Pradesh. Detect revenue gaps, monitor
                  compliance, and safeguard public revenue across all 26 districts.
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4">
                {[
                  { value: "26", label: "Districts" },
                  { value: "5", label: "Zones" },
                  { value: "500+", label: "Cases Analyzed" },
                  { value: "₹44Cr", label: "Gap Detected" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="text-center px-4 py-2 rounded-lg"
                    style={{ background: `${C.navy}08` }}
                  >
                    <div className="text-lg font-bold" style={{ color: C.navy }}>
                      {stat.value}
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* AP Map */}
              <div>
                <APMapImage />
              </div>
            </div>

            {/* Right Column — Login Card */}
            <div className="flex justify-center lg:justify-end lg:pt-4">
              <div className="w-full max-w-md">
                {/* Login Card */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                  {/* Card Header */}
                  <div
                    className="px-6 py-4 text-white"
                    style={{
                      background: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.15)" }}
                      >
                        {IconLock}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Revenue Intelligence Portal</h3>
                        <p className="text-[10px] opacity-70">Select your role to sign in</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="relative">
                    {/* Login Form with Role Selector */}
                    <form
                      onSubmit={handleLogin}
                      className={`p-6 space-y-4 transition-all duration-300 ${
                        loginStage !== "idle"
                          ? "opacity-0 scale-95 pointer-events-none absolute inset-0"
                          : ""
                      }`}
                    >
                      {/* ── Role Selector Grid ─────────────────── */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Select Your Role
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {DEMO_USERS.map((user) => {
                            const isSelected = selectedRole === user.role;
                            return (
                              <button
                                key={user.role}
                                type="button"
                                onClick={() => handleRoleSelect(user.role)}
                                className={`relative text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                                  isSelected
                                    ? "border-amber-400 bg-amber-50 shadow-sm"
                                    : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                                }`}
                              >
                                {/* Role badge */}
                                <div className="flex items-center gap-2 mb-1.5">
                                  <div
                                    className={`w-8 h-8 rounded-md flex items-center justify-center ${
                                      isSelected ? "text-amber-700" : "text-gray-500"
                                    }`}
                                    style={
                                      isSelected
                                        ? { background: `${C.gold}25` }
                                        : { background: "#f1f5f9" }
                                    }
                                  >
                                    {RoleIcons[user.role]}
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                      isSelected
                                        ? "bg-amber-200 text-amber-800"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {user.role}
                                  </span>
                                </div>
                                {/* Officer info */}
                                <p className="text-xs font-semibold text-gray-800 leading-tight">
                                  {user.name}
                                </p>
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                  {user.designation}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {getScopeLabel(user)}
                                </p>
                                {/* Selection indicator */}
                                {isSelected && (
                                  <div className="absolute top-2 right-2">
                                    <div
                                      className="w-4 h-4 rounded-full flex items-center justify-center"
                                      style={{ background: C.gold }}
                                    >
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 6L9 17l-5-5" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {IconMail}
                          </div>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                            style={
                              {
                                "--tw-ring-color": C.navy,
                              } as React.CSSProperties
                            }
                            placeholder={selectedRole ? "Pre-filled from role selection" : "Select a role above"}
                            required
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Password
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {IconLock}
                          </div>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                            style={
                              {
                                "--tw-ring-color": C.navy,
                              } as React.CSSProperties
                            }
                            placeholder={selectedRole ? `Enter password` : "Select a role first"}
                            required
                          />
                        </div>
                      </div>

                      {/* Error */}
                      {error && (
                        <div className="px-3 py-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                          {error}
                        </div>
                      )}

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={isLoading || !selectedRole}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                        style={{
                          background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                          color: C.navyDark,
                        }}
                      >
                        {isLoading && loginStage === "idle" ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <circle cx="12" cy="12" r="10" opacity="0.3" />
                              <path d="M12 2a10 10 0 0 1 10 10" />
                            </svg>
                            Signing in...
                          </>
                        ) : (
                          <>
                            Sign In
                            {selectedRole && (
                              <span className="text-xs opacity-70">as {ROLE_META[selectedRole].label}</span>
                            )}
                          </>
                        )}
                      </button>

                      {/* Demo hint */}
                      <div className="text-center pt-1">
                        <p className="text-[10px] text-gray-400">
                          {selectedRole ? (
                            <>
                              Demo: password is{" "}
                              <span className="font-mono text-gray-500 font-semibold">
                                {ROLE_META[selectedRole].passwordHint}
                              </span>
                            </>
                          ) : (
                            "Select a role above to see demo credentials"
                          )}
                        </p>
                      </div>
                    </form>

                    {/* ── Multi-stage Login Animation ────────── */}
                    {loginStage !== "idle" && (
                      <div className="p-6 flex flex-col items-center justify-center min-h-[280px] animate-fade-in">
                        {/* Spinner ring */}
                        <div className="relative mb-5">
                          <div
                            className="w-16 h-16 rounded-full border-[3px] border-t-transparent animate-spin"
                            style={{ borderColor: `${C.navy}20`, borderTopColor: C.gold }}
                          />
                          {/* Center icon changes per stage */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            {loginStage === "authenticating" && (
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                            )}
                            {loginStage === "verifying" && (
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="M9 12l2 2 4-4" />
                              </svg>
                            )}
                            {loginStage === "loading" && (
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2" />
                                <line x1="8" y1="21" x2="16" y2="21" />
                                <line x1="12" y1="17" x2="12" y2="21" />
                              </svg>
                            )}
                            {loginStage === "ready" && (
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Stage label */}
                        {LOGIN_STAGES.filter((s) => s.key === loginStage).map((s) => (
                          <div key={s.key} className="text-center animate-fade-in">
                            <p className="text-sm font-semibold" style={{ color: C.navy }}>
                              {s.label}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1">{s.sub}</p>
                          </div>
                        ))}

                        {/* Step indicators */}
                        <div className="flex items-center gap-2 mt-5">
                          {LOGIN_STAGES.map((s, i) => {
                            const stageIdx = LOGIN_STAGES.findIndex((st) => st.key === loginStage);
                            const isDone = i < stageIdx;
                            const isCurrent = i === stageIdx;
                            return (
                              <div key={s.key} className="flex items-center gap-2">
                                <div
                                  className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                                    isDone
                                      ? "bg-green-500 scale-100"
                                      : isCurrent
                                        ? "scale-110"
                                        : "bg-gray-200 scale-100"
                                  }`}
                                  style={
                                    isCurrent
                                      ? { background: C.gold, boxShadow: `0 0 8px ${C.gold}60` }
                                      : {}
                                  }
                                />
                                {i < LOGIN_STAGES.length - 1 && (
                                  <div
                                    className={`w-6 h-0.5 rounded transition-colors duration-500 ${
                                      isDone ? "bg-green-400" : "bg-gray-200"
                                    }`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Progress bar */}
                        <div className="w-full mt-5 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width:
                                loginStage === "authenticating"
                                  ? "25%"
                                  : loginStage === "verifying"
                                    ? "55%"
                                    : loginStage === "loading"
                                      ? "80%"
                                      : "100%",
                              background:
                                loginStage === "ready"
                                  ? "#16a34a"
                                  : `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`,
                            }}
                          />
                        </div>

                        <style jsx>{`
                          @keyframes fade-in {
                            from {
                              opacity: 0;
                              transform: translateY(8px);
                            }
                            to {
                              opacity: 1;
                              transform: translateY(0);
                            }
                          }
                          .animate-fade-in {
                            animation: fade-in 0.35s ease-out forwards;
                          }
                        `}</style>
                      </div>
                    )}
                  </div>
                </div>

                {/* Security note below card */}
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Secured by Government of Andhra Pradesh IT Infrastructure
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Features Strip ─────────────────────────────────────── */}
        <div style={{ background: `${C.navy}06` }} className="border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="text-center mb-6">
              <h3 className="text-sm font-bold" style={{ color: C.navy }}>
                Platform Capabilities
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Comprehensive tools for revenue assurance and compliance
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <FeatureCard
                icon={IconBrain}
                title="AI-Powered Analysis"
                desc="Machine learning algorithms detect revenue gaps and anomalies across registration data."
              />
              <FeatureCard
                icon={IconMonitor}
                title="Real-time Monitoring"
                desc="Live dashboards track stamp duty collections, challans, and SLA compliance."
              />
              <FeatureCard
                icon={IconChart}
                title="Comprehensive Reporting"
                desc="Generate audit-ready reports with drill-down from zone to individual cases."
              />
              <FeatureCard
                icon={IconGlobe}
                title="Multi-Zone Coverage"
                desc="Unified view spanning all 5 zones, 26 districts, and 400+ registration offices."
              />
            </div>
          </div>
        </div>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer style={{ background: C.navyDark }} className="text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <APEmblem size={32} />
              <div>
                <p className="text-xs font-semibold opacity-90">Government of Andhra Pradesh</p>
                <p className="text-[10px] opacity-60">
                  Inspector General of Registration &amp; Stamps
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] opacity-50 max-w-md">
                This is a demonstration portal for the Revenue Intelligence &amp; Leakage Detection
                System. Developed by MeeruAI for IGRS, AP.
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] opacity-60">
                &copy; {new Date().getFullYear()} Govt. of Andhra Pradesh
              </p>
              <p className="text-[10px] opacity-40 mt-0.5">Powered by MeeruAI</p>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── Gold Bottom Strip ──────────────────────────────────── */}
      <div
        className="h-1"
        style={{ background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight}, ${C.gold})` }}
      />
    </div>
  );
}
