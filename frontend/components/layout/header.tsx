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
          "flex items-center justify-between px-3 sm:px-4 xl:px-6 h-11 md:h-12 xl:h-14",
          loadingState === "loading"
            ? "transition-all duration-300 ease-out opacity-0 -translate-y-4"
            : "transition-none opacity-100 translate-y-0"
        )}
        style={{
          background: 'var(--theme-header-bg)',
          borderBottom: '1px solid var(--theme-header-border)',
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
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
          {theme === "default" ? (
            <img src="/meeru-logo.png" alt="Meeru AI Logo" className="h-8 w-auto object-contain" />
          ) : (
            <span style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', letterSpacing: -0.3 }}>
              Meeru<span style={{ color: 'var(--theme-accent)' }}>AI</span>
            </span>
          )}
          {headerTitle && (
            <span className="hidden lg:inline text-sm font-semibold truncate" style={{ color: 'var(--theme-text)' }}>
              {headerTitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          <button
            className="hidden sm:block p-2 rounded-lg transition-all duration-200 ease-out-expo"
            style={{ color: 'var(--theme-text-secondary)' }}
            aria-label="Help"
          >
            <CircleHelp size={20} />
          </button>
          <button
            className="p-2 rounded-lg transition-all duration-200 ease-out-expo relative"
            style={{ color: 'var(--theme-text-secondary)' }}
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-breathing" style={{ background: 'var(--theme-notification-dot)' }} />
          </button>
          <span className="hidden sm:block"><ThemeSwitcher /></span>
          <div className="hidden sm:block w-px h-6 mx-1" style={{ background: 'var(--theme-border)' }} />
          <UserMenu />
        </div>
      </header>
    </>
  );
}
