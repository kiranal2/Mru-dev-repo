"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { CircleHelp, Bell, Menu, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";
import { ThemeSwitcher } from "./theme-switcher";
import { useTheme } from "@/lib/theme-context";

interface HeaderProps {
  loadingState: "loading" | "loaded";
  isSidebarHidden?: boolean;
  onToggleSidebar?: () => void;
  isMobile?: boolean;
  onMobileMenuToggle?: () => void;
}

export default function Header({ loadingState, isSidebarHidden, onToggleSidebar, isMobile, onMobileMenuToggle }: HeaderProps) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const isCashAppWorkbench = pathname?.startsWith("/workbench/order-to-cash/cash-application");
  const isCollectionsWorkbench = pathname?.startsWith("/workbench/order-to-cash/collections");

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
          {theme === "default" ? (
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
          <span className="hidden xl:block"><ThemeSwitcher /></span>
          <div className="hidden xl:block w-px h-5 mx-0.5" style={{ background: 'var(--theme-border)' }} />
          <UserMenu />
        </div>
      </header>
    </>
  );
}
