"use client";

import React from "react";
import { CircleHelp, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";

interface HeaderProps {
  loadingState: "loading" | "loaded";
}

export default function Header({ loadingState }: HeaderProps) {
  return (
    <>
      {/* Top border line */}
      <div className="h-px w-full" style={{ backgroundColor: "rgba(14, 42, 82, 0.16)" }} />

      {/* Top App Bar */}
      <header
        className={cn(
          "h-14 bg-transparent border-b border-[rgba(14,42,82,0.16)] flex items-center justify-between px-6",
          loadingState === "loading"
            ? "transition-all duration-300 ease-out opacity-0 -translate-y-4"
            : "transition-none opacity-100 translate-y-0"
        )}
      >
        <div className="flex items-center">
          <img src="/meeru-logo.png" alt="Meeru AI Logo" className="h-8 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-4">
          <button
            className="text-[#7C8A9A] hover:text-[#334155] hover:scale-110 transition-all duration-200 ease-out"
            aria-label="Help"
          >
            <CircleHelp size={22} />
          </button>
          <button
            className="text-[#7C8A9A] hover:text-[#334155] hover:scale-110 transition-all duration-200 ease-out"
            aria-label="Notifications"
          >
            <Bell size={22} />
          </button>
          <UserMenu />
        </div>
      </header>
    </>
  );
}
