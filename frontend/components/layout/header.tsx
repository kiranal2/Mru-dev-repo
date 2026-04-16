"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { CircleHelp, Bell, Menu, PanelLeftClose, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";
import { ThemeSwitcher } from "./theme-switcher";
import { useTheme } from "@/lib/theme-context";
import { PERSONA_LABELS } from "@/lib/demo-routing";

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

  // Read persona from localStorage (lightweight, no context dependency)
  const [demoPersona, setDemoPersona] = React.useState<string | null>(null);
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("meeru-demo-config");
      if (stored) {
        const config = JSON.parse(stored);
        setDemoPersona(config.persona || null);
      }
    } catch { /* ignore */ }
  }, [pathname]); // Re-read on navigation

  const handleResetDemo = () => {
    try { localStorage.removeItem("meeru-demo-config"); } catch { /* ignore */ }
    setDemoPersona(null);
    router.push("/login");
  };

  let headerTitle: string | null = null;
  if (isCashAppWorkbench) {
    headerTitle = "Cash App Workbench";
  } else if (isCollectionsWorkbench) {
    headerTitle = "Collections Workbench";
  }

  return (
    <>
      {/* Top gradient accent line */}
      <div className="h-[2px] w-full" style={{ background: 'var(--theme-gradient-accent)' }} />

      {/* Top App Bar — compact on tablet (md), full on desktop */}
      <header
        className={cn(
          "flex items-center justify-between px-2 sm:px-3 xl:px-4 h-11 md:h-12 xl:h-14",
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
          {/* Logo — smaller on tablet */}
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
        <div className="flex items-center gap-1 xl:gap-3">
          {/* Persona badge + reset */}
          {demoPersona && PERSONA_LABELS[demoPersona as keyof typeof PERSONA_LABELS] && (
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#B8860B]/10 text-[#B8860B] border border-[#B8860B]/20">
                {PERSONA_LABELS[demoPersona as keyof typeof PERSONA_LABELS]}
              </span>
              <button
                onClick={handleResetDemo}
                className="p-1 rounded-md hover:bg-slate-100 transition-colors"
                style={{ color: 'var(--theme-text-secondary)' }}
                title="Reset demo — return to onboarding"
              >
                <RotateCcw size={14} />
              </button>
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
          <UserMenu />
        </div>
      </header>
    </>
  );
}
