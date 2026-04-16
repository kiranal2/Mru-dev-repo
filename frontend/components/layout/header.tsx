"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { CircleHelp, Bell, Menu, PanelLeftClose, RotateCcw, Globe, ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";
import { ThemeSwitcher } from "./theme-switcher";
import { useTheme } from "@/lib/theme-context";
import { PERSONA_LABELS } from "@/lib/demo-routing";
import { PERSONAS, INDUSTRIES, type Industry, type Persona } from "@/lib/persona-context";

interface HeaderProps {
  loadingState: "loading" | "loaded";
  isSidebarHidden?: boolean;
  onToggleSidebar?: () => void;
  isMobile?: boolean;
  onMobileMenuToggle?: () => void;
}

export default function Header({ loadingState, isSidebarHidden, onToggleSidebar, isMobile, onMobileMenuToggle }: HeaderProps) {
  const { isDark } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const isCashAppWorkbench = pathname?.startsWith("/workbench/order-to-cash/cash-application");
  const isCollectionsWorkbench = pathname?.startsWith("/workbench/order-to-cash/collections");

  // Read persona + industry from localStorage
  const [demoPersona, setDemoPersona] = React.useState<Persona | null>(null);
  const [demoIndustry, setDemoIndustry] = React.useState<Industry | null>(null);
  const [industryDropdownOpen, setIndustryDropdownOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const userDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("meeru-demo-config");
      if (stored) {
        const config = JSON.parse(stored);
        setDemoPersona(config.persona || null);
        setDemoIndustry(config.industry || null);
      }
    } catch { /* ignore */ }
  }, [pathname]);

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIndustryDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleResetDemo = () => {
    try { localStorage.removeItem("meeru-demo-config"); } catch { /* ignore */ }
    setDemoPersona(null);
    setDemoIndustry(null);
    router.push("/login");
  };

  const handleIndustryChange = (industry: Industry) => {
    try {
      const stored = localStorage.getItem("meeru-demo-config");
      const config = stored ? JSON.parse(stored) : {};
      config.industry = industry;
      localStorage.setItem("meeru-demo-config", JSON.stringify(config));
      setDemoIndustry(industry);
      window.dispatchEvent(new CustomEvent("meeru-config-changed"));
      setIndustryDropdownOpen(false);
      router.refresh();
    } catch { /* ignore */ }
  };

  const personaInfo = demoPersona ? PERSONAS.find((p) => p.id === demoPersona) : null;
  const industryInfo = demoIndustry ? INDUSTRIES.find((i) => i.id === demoIndustry) : null;

  let headerTitle: string | null = null;
  if (isCashAppWorkbench) {
    headerTitle = "Cash App Workbench";
  } else if (isCollectionsWorkbench) {
    headerTitle = "Collections Workbench";
  }

  return (
      <header
        className={cn(
          "relative z-50 flex items-center justify-between px-2 sm:px-3 xl:px-4 h-10 md:h-10 xl:h-11",
          loadingState === "loading"
            ? "transition-all duration-300 ease-out opacity-0 -translate-y-4"
            : "transition-none opacity-100 translate-y-0"
        )}
        style={{
          background: 'var(--theme-header-bg)',
          borderBottom: '1px solid var(--theme-header-border)',
        }}
      >
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          {/* Mobile hamburger */}
          {isMobile && onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className="p-2 rounded-lg transition-all duration-200"
              style={{ color: 'var(--theme-text-secondary)', outline: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
          )}
          {/* Sidebar toggle (desktop only) */}
          {!isMobile && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg transition-all duration-200"
              style={{ color: 'var(--theme-text-secondary)', outline: 'none', border: 'none', cursor: 'pointer' }}
              aria-label={isSidebarHidden ? "Show sidebar" : "Hide sidebar"}
            >
              {isSidebarHidden ? <Menu size={20} /> : <PanelLeftClose size={20} />}
            </button>
          )}
          {/* Logo */}
          {!isDark ? (
            <img src="/meeru-logo.png" alt="Meeru AI Logo" className="h-4 xl:h-5 w-auto object-contain" />
          ) : (
            <span className="text-[15px] xl:text-[18px]" style={{ fontWeight: 700, color: '#FFFFFF', letterSpacing: -0.3 }}>
              Meeru<span style={{ color: 'var(--theme-accent)' }}>AI</span>
            </span>
          )}
          {headerTitle && (
            <span className="hidden lg:inline text-sm font-semibold truncate" style={{ color: 'var(--theme-text)' }}>
              {headerTitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 xl:gap-2.5">
          {/* Industry dropdown */}
          {demoIndustry && (
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                onClick={() => setIndustryDropdownOpen(!industryDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors outline-none"
                style={{
                  color: industryDropdownOpen ? 'var(--theme-accent, #1E40AF)' : 'var(--theme-text-secondary)',
                  border: industryDropdownOpen ? '1px solid var(--theme-accent, #1E40AF)' : '1px solid var(--theme-border)',
                  background: industryDropdownOpen ? 'var(--theme-accent-subtle, #EFF6FF)' : 'var(--theme-surface)',
                }}
              >
                <Globe size={12} />
                {industryInfo?.title || "Industry"}
                <ChevronDown size={11} className={cn("transition-transform", industryDropdownOpen && "rotate-180")} />
              </button>
              {industryDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-1 min-w-[160px] rounded-md py-1 shadow-lg"
                  style={{
                    background: 'var(--theme-surface, #ffffff)',
                    border: '1px solid var(--theme-border)',
                    zIndex: 9999,
                  }}
                >
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.id}
                      onClick={() => handleIndustryChange(ind.id)}
                      className="w-full text-left px-3 py-1.5 text-[11px] transition-colors flex items-center justify-between outline-none"
                      style={{
                        color: demoIndustry === ind.id ? 'var(--theme-accent, #1E40AF)' : 'var(--theme-text, #0f172a)',
                        background: demoIndustry === ind.id ? 'var(--theme-accent-subtle, #EFF6FF)' : 'transparent',
                        fontWeight: demoIndustry === ind.id ? 600 : 400,
                      }}
                      onMouseEnter={(e) => { if (demoIndustry !== ind.id) e.currentTarget.style.background = 'var(--theme-surface-alt, #f1f5f9)'; }}
                      onMouseLeave={(e) => { if (demoIndustry !== ind.id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span>{ind.title}</span>
                      {demoIndustry === ind.id && <span style={{ color: 'var(--theme-accent, #1E40AF)', fontSize: '10px' }}>&#10003;</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            className="hidden xl:block p-2 rounded-lg transition-all duration-200 ease-out-expo"
            style={{ color: 'var(--theme-text-secondary)' }}
            aria-label="Help"
          >
            <CircleHelp size={18} />
          </button>
          <button
            className="p-1.5 xl:p-2 rounded-lg transition-all duration-200 ease-out-expo relative"
            style={{ color: 'var(--theme-text-secondary)' }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 xl:top-1.5 xl:right-1.5 w-1.5 h-1.5 xl:w-2 xl:h-2 rounded-full animate-breathing" style={{ background: 'var(--theme-notification-dot)' }} />
          </button>
          <span data-tour-id="theme-toggle"><ThemeSwitcher /></span>
          <div className="hidden xl:block w-px h-5 mx-0.5" style={{ background: 'var(--theme-border)' }} />

          {/* User profile with logout dropdown */}
          {personaInfo ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors outline-none"
                style={{
                  background: userDropdownOpen ? 'var(--theme-surface-alt, #f1f5f9)' : 'transparent',
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-primary/10 text-primary"
                >
                  {personaInfo.profileInitials}
                </div>
                <div className="hidden xl:block text-left">
                  <div className="text-[11px] font-semibold leading-tight" style={{ color: 'var(--theme-text)' }}>
                    {personaInfo.profileName}
                  </div>
                  <div className="text-[9px] leading-tight" style={{ color: 'var(--theme-text-muted)' }}>
                    {personaInfo.title}
                  </div>
                </div>
                <ChevronDown size={11} className={cn("hidden xl:block transition-transform", userDropdownOpen && "rotate-180")} style={{ color: 'var(--theme-text-muted)' }} />
              </button>
              {userDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-1 min-w-[180px] rounded-md py-1 shadow-lg"
                  style={{
                    background: 'var(--theme-surface, #ffffff)',
                    border: '1px solid var(--theme-border)',
                    zIndex: 9999,
                  }}
                >
                  {/* Profile info (mobile — hidden on xl since it's in the button) */}
                  <div className="xl:hidden px-3 py-2 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                    <div className="text-[11px] font-semibold" style={{ color: 'var(--theme-text)' }}>{personaInfo.profileName}</div>
                    <div className="text-[9px]" style={{ color: 'var(--theme-text-muted)' }}>{personaInfo.title}</div>
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleResetDemo();
                    }}
                    className="w-full text-left px-3 py-2 text-[11px] transition-colors flex items-center gap-2 outline-none"
                    style={{ color: 'var(--theme-text, #0f172a)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--theme-surface-alt, #f1f5f9)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <LogOut size={12} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <UserMenu />
          )}
        </div>
      </header>
  );
}
