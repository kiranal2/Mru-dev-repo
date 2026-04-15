"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Building2, Stethoscope, Factory, ArrowLeft } from "lucide-react";
import {
  Persona,
  Industry,
  PERSONAS,
  INDUSTRIES,
  getPersonaLandingRoute,
} from "@/lib/persona-context";

// ─── Constants ────────────────────────────────────────────────────
const STEP_LABELS = ["Your Role", "Your Industry", "Ready"];

const INDUSTRY_ICONS: Record<Industry, React.ReactNode> = {
  technology: <Building2 className="w-5 h-5" />,
  healthcare: <Stethoscope className="w-5 h-5" />,
  manufacturing: <Factory className="w-5 h-5" />,
};

// ─── Page ─────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const personaFromLogin = useRef(false);

  // If persona was already selected from login page, skip to industry step
  useEffect(() => {
    try {
      const stored = localStorage.getItem("meeru-demo-config");
      if (stored) {
        const config = JSON.parse(stored);
        if (config.persona && !config.industry) {
          setSelectedPersona(config.persona);
          setStep(2);
          personaFromLogin.current = true;
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const handlePersonaSelect = useCallback((persona: Persona) => {
    setSelectedPersona(persona);
    personaFromLogin.current = false;
    setTimeout(() => setStep(2), 300);
  }, []);

  const handleIndustrySelect = useCallback((industry: Industry) => {
    setSelectedIndustry(industry);
    setTimeout(() => setStep(3), 300);
  }, []);

  const handleEnterPlatform = useCallback(() => {
    if (!selectedPersona || !selectedIndustry) return;

    const config = { persona: selectedPersona, industry: selectedIndustry };
    try {
      localStorage.setItem("meeru-demo-config", JSON.stringify(config));
    } catch {
      // Ignore storage errors
    }

    const route = getPersonaLandingRoute(selectedPersona);
    router.push(route);
  }, [selectedPersona, selectedIndustry, router]);

  const handleBack = useCallback(() => {
    if (step === 2) {
      if (personaFromLogin.current) {
        router.push("/login");
      } else {
        setStep(1);
      }
    } else if (step === 3) {
      setStep(2);
    }
  }, [step, router]);

  const personaInfo = PERSONAS.find((p) => p.id === selectedPersona);
  const industryInfo = INDUSTRIES.find((i) => i.id === selectedIndustry);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#FEFDFB]">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-md bg-[#B8860B]/20 flex items-center justify-center">
            <div className="w-4 h-4 rounded-sm bg-[#B8860B]" />
          </div>
          <span
            className="text-2xl tracking-tight text-slate-900"
            style={{ fontFamily: "var(--font-serif, 'Georgia'), serif" }}
          >
            MeeruAI
          </span>
        </div>
        <p className="text-[10px] tracking-[0.25em] uppercase text-slate-400 font-medium">
          Decision Intelligence for Finance
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i + 1 <= step ? "bg-[#B8860B]" : "bg-slate-200"
                }`}
              />
              <span
                className={`text-[10px] uppercase tracking-wider ${
                  i + 1 === step
                    ? "text-[#B8860B] font-semibold"
                    : i + 1 < step
                      ? "text-slate-500"
                      : "text-slate-300"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className="w-6 h-px bg-slate-200" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="w-full max-w-xl">
        {/* Step 1: Role selection */}
        {step === 1 && (
          <div className="animate-in fade-in duration-300">
            <div className="text-center mb-8">
              <h1
                className="text-3xl text-slate-900 mb-1"
                style={{ fontFamily: "var(--font-serif, 'Georgia'), serif" }}
              >
                What best describes
              </h1>
              <h1
                className="text-3xl italic text-[#B8860B]"
                style={{ fontFamily: "var(--font-serif, 'Georgia'), serif" }}
              >
                your position?
              </h1>
            </div>

            <div className="space-y-3">
              {PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => handlePersonaSelect(persona.id)}
                  className={`w-full text-left px-6 py-5 rounded-xl border transition-all group ${
                    selectedPersona === persona.id
                      ? "border-[#B8860B] bg-[#B8860B]/5 shadow-sm"
                      : "border-slate-200 hover:border-[#B8860B]/40 hover:bg-[#FEFDFB]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-semibold text-slate-900">
                        {persona.title}
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5">
                        {persona.subtitle}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 transition-colors ${
                        selectedPersona === persona.id
                          ? "text-[#B8860B]"
                          : "text-slate-300 group-hover:text-[#B8860B]/50"
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Industry selection */}
        {step === 2 && (
          <div className="animate-in fade-in duration-300">
            <div className="text-center mb-8">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-4 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <h1
                className="text-3xl text-slate-900 mb-1"
                style={{ fontFamily: "var(--font-serif, 'Georgia'), serif" }}
              >
                Select your
              </h1>
              <h1
                className="text-3xl italic text-[#B8860B]"
                style={{ fontFamily: "var(--font-serif, 'Georgia'), serif" }}
              >
                industry
              </h1>
            </div>

            <div className="space-y-3">
              {INDUSTRIES.map((industry) => (
                <button
                  key={industry.id}
                  onClick={() => handleIndustrySelect(industry.id)}
                  className={`w-full text-left px-6 py-5 rounded-xl border transition-all group ${
                    selectedIndustry === industry.id
                      ? "border-[#B8860B] bg-[#B8860B]/5 shadow-sm"
                      : "border-slate-200 hover:border-[#B8860B]/40 hover:bg-[#FEFDFB]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          selectedIndustry === industry.id
                            ? "bg-[#B8860B]/15 text-[#B8860B]"
                            : "bg-slate-100 text-slate-400 group-hover:bg-[#B8860B]/10 group-hover:text-[#B8860B]/60"
                        }`}
                      >
                        {INDUSTRY_ICONS[industry.id]}
                      </div>
                      <div>
                        <div className="text-base font-semibold text-slate-900">
                          {industry.title}
                        </div>
                        <div className="text-sm text-slate-500 mt-0.5">
                          {industry.subtitle}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 transition-colors ${
                        selectedIndustry === industry.id
                          ? "text-[#B8860B]"
                          : "text-slate-300 group-hover:text-[#B8860B]/50"
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="animate-in fade-in duration-300">
            <div className="text-center mb-8">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-4 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <h1
                className="text-3xl text-slate-900 mb-1"
                style={{ fontFamily: "var(--font-serif, 'Georgia'), serif" }}
              >
                Your experience is
              </h1>
              <h1
                className="text-3xl italic text-[#B8860B]"
                style={{ fontFamily: "var(--font-serif, 'Georgia'), serif" }}
              >
                ready
              </h1>
            </div>

            {/* Summary cards */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-4 px-6 py-4 rounded-xl border border-slate-200 bg-white">
                <div className="w-10 h-10 rounded-lg bg-[#B8860B]/10 flex items-center justify-center text-[#B8860B] text-sm font-bold">
                  {personaInfo?.title.charAt(0)}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                    Role
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {personaInfo?.title}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 px-6 py-4 rounded-xl border border-slate-200 bg-white">
                <div className="w-10 h-10 rounded-lg bg-[#B8860B]/10 flex items-center justify-center text-[#B8860B]">
                  {selectedIndustry && INDUSTRY_ICONS[selectedIndustry]}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                    Industry
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {industryInfo?.title}
                  </div>
                </div>
              </div>
            </div>

            {/* What you'll see */}
            <div className="text-center mb-8">
              <p className="text-xs text-slate-500">
                Your workbench has been configured with{" "}
                <span className="text-slate-700 font-medium">
                  {industryInfo?.title}
                </span>{" "}
                data and{" "}
                <span className="text-slate-700 font-medium">
                  {personaInfo?.keywords[0]}
                </span>{" "}
                workflows.
              </p>
            </div>

            {/* Enter button */}
            <button
              onClick={handleEnterPlatform}
              className="w-full py-4 rounded-xl bg-[#B8860B] text-white font-semibold text-sm hover:bg-[#9A7209] transition-colors shadow-sm"
            >
              Enter Platform
            </button>

            <p className="text-center text-[10px] text-slate-400 mt-3">
              You can change these settings anytime from the header menu.
            </p>
          </div>
        )}
      </div>

      {/* Bottom tagline */}
      <div className="mt-12 text-center">
        <p
          className="text-sm italic text-slate-400"
          style={{ fontFamily: "var(--font-serif, 'Georgia'), serif" }}
        >
          Finance finally has a system that explains the business, not just the numbers.
        </p>
      </div>
    </div>
  );
}
