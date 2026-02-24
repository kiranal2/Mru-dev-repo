"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { CircleHelp, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

interface HeaderProps {
  loadingState: "loading" | "loaded";
}

export default function Header({ loadingState }: HeaderProps) {
  const pathname = usePathname();
  const isIGRSModule = pathname?.startsWith("/igrs/");

  return (
    <>
      {/* Top gradient accent line */}
      <div className="h-[2px] w-full" style={{ background: 'var(--gradient-primary)' }} />

      {/* Top App Bar */}
      <header
        className={cn(
          "h-14 flex items-center justify-between px-6 border-b border-[rgba(14,42,82,0.06)]",
          loadingState === "loading"
            ? "transition-all duration-300 ease-out opacity-0 -translate-y-4"
            : "transition-none opacity-100 translate-y-0"
        )}
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,251,255,1) 100%)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <img src="/meeru-logo.png" alt="Meeru AI Logo" className="h-8 w-auto object-contain" />
          {isIGRSModule && (
            <span className="hidden lg:inline text-sm font-semibold text-[#0A3B77] truncate">
              Revenue Intelligence &amp; Leakage Detection System
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            className="text-[#7C8A9A] hover:text-[#0A3B77] hover:bg-[#0A3B77]/5 p-2 rounded-lg transition-all duration-200 ease-out-expo"
            aria-label="Help"
          >
            <CircleHelp size={20} />
          </button>
          <button
            className="text-[#7C8A9A] hover:text-[#0A3B77] hover:bg-[#0A3B77]/5 p-2 rounded-lg transition-all duration-200 ease-out-expo relative"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-rose-400 animate-breathing" />
          </button>
          <div className="w-px h-6 bg-[#0A3B77]/8 mx-1" />
          <UserMenu />
        </div>
      </header>
    </>
  );
}
