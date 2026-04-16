"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Settings2, Play } from "lucide-react";
import {
  usePersona,
  PERSONAS,
  INDUSTRIES,
  ANALYSIS_TYPES,
} from "@/lib/persona-context";
import { PERSONA_LABELS } from "@/lib/demo-routing";
import { ContextSwitcher } from "./context-switcher";

export function DemoContextBar() {
  const router = useRouter();
  const { persona, industry, analysisType, resetDemo } = usePersona();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const personaInfo = PERSONAS.find((p) => p.id === persona);
  const industryInfo = INDUSTRIES.find((i) => i.id === industry);
  const analysisInfo = ANALYSIS_TYPES.find((a) => a.id === analysisType);

  const handleReset = () => {
    resetDemo();
    router.push("/login");
  };

  const handleRestartTour = () => {
    window.dispatchEvent(new CustomEvent("meeru-restart-tour"));
  };

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 md:px-4"
        style={{
          height: 36,
          background: "#1A1F2E",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Left: Logo + context chips */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0 overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-4 h-4 rounded-[3px] bg-[#C8A96E]/30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-[2px] bg-[#C8A96E]" />
            </div>
            <span
              className="text-xs font-medium text-white/90 hidden sm:inline"
              style={{ fontFamily: "var(--font-serif, 'Georgia'), serif" }}
            >
              MeeruAI
            </span>
          </div>

          {/* Separator */}
          <div className="w-px h-3.5 bg-white/15 shrink-0" />

          {/* Persona chip */}
          {personaInfo && (
            <span className="inline-flex items-center gap-1.5 text-[10px] text-white/70 shrink-0">
              <span className="w-4 h-4 rounded-full bg-[#C8A96E]/20 flex items-center justify-center text-[8px] font-bold text-[#C8A96E]">
                {personaInfo.profileInitials.charAt(0)}
              </span>
              <span className="hidden lg:inline">{personaInfo.profileName},</span>
              {PERSONA_LABELS[persona!]}
            </span>
          )}

          {/* Analysis chip — hidden on very small screens */}
          {analysisInfo && (
            <>
              <span className="text-white/20 hidden md:inline">&middot;</span>
              <span className="text-[10px] text-[#C8A96E] font-medium hidden md:inline truncate">
                {analysisInfo.title}
              </span>
            </>
          )}

          {/* Industry chip — hidden on small screens */}
          {industryInfo && (
            <>
              <span className="text-white/20 hidden lg:inline">&middot;</span>
              <span className="text-[10px] text-white/50 hidden lg:inline">
                {industryInfo.title}
              </span>
            </>
          )}

          {/* Green pulse dot */}
          <span className="relative flex h-2 w-2 ml-1 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
          <button
            onClick={() => setSwitcherOpen(true)}
            className="flex items-center gap-1.5 px-2 md:px-2.5 py-1 rounded text-[10px] text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors"
            title="Switch Context"
          >
            <Settings2 className="w-3 h-3" />
            <span className="hidden md:inline">Switch Context</span>
          </button>
          <button
            onClick={handleRestartTour}
            className="flex items-center gap-1.5 px-2 md:px-2.5 py-1 rounded text-[10px] text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors"
            title="Restart Tour"
          >
            <Play className="w-3 h-3" />
            <span className="hidden md:inline">Tour</span>
          </button>
          <div className="w-px h-3.5 bg-white/10 mx-0.5" />
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2 md:px-2.5 py-1 rounded text-[10px] text-white/60 hover:text-red-400/90 hover:bg-white/10 transition-colors"
            title="Reset Demo"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Context Switcher */}
      <ContextSwitcher open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </>
  );
}
