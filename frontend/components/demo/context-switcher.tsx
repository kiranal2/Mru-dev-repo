"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  Persona,
  Industry,
  AnalysisType,
  PERSONAS,
  INDUSTRIES,
  ANALYSIS_TYPES,
  usePersona,
  getAnalysisRoute,
} from "@/lib/persona-context";
import { PERSONA_LABELS } from "@/lib/demo-routing";

interface ContextSwitcherProps {
  open: boolean;
  onClose: () => void;
}

export function ContextSwitcher({ open, onClose }: ContextSwitcherProps) {
  const router = useRouter();
  const { persona, industry, analysisType, saveDemoConfig } = usePersona();
  const [localPersona, setLocalPersona] = useState<Persona | null>(persona);
  const [localIndustry, setLocalIndustry] = useState<Industry | null>(industry);
  const [localAnalysis, setLocalAnalysis] = useState<AnalysisType | null>(analysisType);

  // Sync local state when opening
  useEffect(() => {
    if (open) {
      setLocalPersona(persona);
      setLocalIndustry(industry);
      setLocalAnalysis(analysisType);
    }
  }, [open, persona, industry, analysisType]);

  const handleApply = () => {
    if (!localPersona || !localIndustry || !localAnalysis) return;

    saveDemoConfig({
      persona: localPersona,
      industry: localIndustry,
      analysisType: localAnalysis,
      demoMode: true,
    });

    const route = getAnalysisRoute(localAnalysis);
    onClose();
    router.push(route);

    // Restart tour after context switch
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("meeru-restart-tour"));
    }, 500);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed bottom-6 left-6 z-[61] w-80 rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "#1A1F2E", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-xs font-semibold text-white/90">Switch Context</span>
          <button
            onClick={onClose}
            className="w-5 h-5 rounded flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-3">
          {/* Role */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-medium mb-1.5 block">
              Role
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setLocalPersona(p.id)}
                  className={`px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                    localPersona === p.id
                      ? "bg-[#C8A96E]/20 text-[#C8A96E] border border-[#C8A96E]/30"
                      : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10 hover:text-white/70"
                  }`}
                >
                  {PERSONA_LABELS[p.id]}
                </button>
              ))}
            </div>
          </div>

          {/* Analysis Type */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-medium mb-1.5 block">
              Analysis
            </label>
            <div className="space-y-1.5">
              {ANALYSIS_TYPES.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setLocalAnalysis(a.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-[11px] transition-colors ${
                    localAnalysis === a.id
                      ? "bg-[#C8A96E]/20 text-[#C8A96E] border border-[#C8A96E]/30"
                      : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10 hover:text-white/70"
                  }`}
                >
                  <div className="font-medium">{a.title}</div>
                  <div className="text-[9px] opacity-60 mt-0.5">{a.subtitle}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Industry */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-medium mb-1.5 block">
              Industry
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {INDUSTRIES.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setLocalIndustry(i.id)}
                  className={`px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                    localIndustry === i.id
                      ? "bg-[#C8A96E]/20 text-[#C8A96E] border border-[#C8A96E]/30"
                      : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10 hover:text-white/70"
                  }`}
                >
                  {i.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10">
          <button
            onClick={handleApply}
            disabled={!localPersona || !localIndustry || !localAnalysis}
            className="w-full py-2 rounded-lg bg-[#C8A96E] text-[#1A1F2E] text-xs font-semibold hover:bg-[#D4B97A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply &amp; Restart Tour
          </button>
        </div>
      </div>
    </>
  );
}
