"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Building2,
  Stethoscope,
  ShoppingBag,
  ArrowLeft,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  ArrowRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Persona,
  Industry,
  AnalysisType,
  PERSONAS,
  INDUSTRIES,
  ANALYSIS_TYPES,
  getAnalysisRoute,
} from "@/lib/persona-context";

// ─── Constants ────────────────────────────────────────────────────
const STEP_LABELS = ["Role", "Analysis", "Industry", "Ready"];

const INDUSTRY_ICONS: Record<Industry, React.ReactNode> = {
  technology: <Building2 className="w-5 h-5" />,
  healthcare: <Stethoscope className="w-5 h-5" />,
  manufacturing: <ShoppingBag className="w-5 h-5" />,
};

const ANALYSIS_ICONS: Record<AnalysisType, React.ReactNode> = {
  strategic: <BarChart3 className="w-5 h-5" />,
  margin: <TrendingUp className="w-5 h-5" />,
  flux: <FileSpreadsheet className="w-5 h-5" />,
};

// ─── Page ─────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLaunching, setIsLaunching] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const personaFromLogin = useRef(false);

  // If persona was already selected from login page, skip to analysis type step
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
    setTimeout(() => setStep(2), 250);
  }, []);

  const handleAnalysisSelect = useCallback((analysis: AnalysisType) => {
    setSelectedAnalysis(analysis);
    setTimeout(() => setStep(3), 250);
  }, []);

  const handleIndustrySelect = useCallback((industry: Industry) => {
    setSelectedIndustry(industry);
    setTimeout(() => setStep(4), 250);
  }, []);

  const handleEnterWorkbench = useCallback(() => {
    if (!selectedPersona || !selectedIndustry || !selectedAnalysis) return;
    setIsLaunching(true);
    const config = {
      persona: selectedPersona,
      industry: selectedIndustry,
      analysisType: selectedAnalysis,
      demoMode: true,
    };
    try {
      localStorage.setItem("meeru-demo-config", JSON.stringify(config));
    } catch { /* ignore */ }
    const route = getAnalysisRoute(selectedAnalysis);
    setTimeout(() => router.push(route), 500);
  }, [selectedPersona, selectedIndustry, selectedAnalysis, router]);

  const handleBack = useCallback(() => {
    if (step === 2) {
      if (personaFromLogin.current) { router.push("/login"); } else { setStep(1); }
    } else if (step === 3) { setStep(2); }
    else if (step === 4) { setStep(3); }
  }, [step, router]);

  const personaInfo = PERSONAS.find((p) => p.id === selectedPersona);
  const analysisInfo = ANALYSIS_TYPES.find((a) => a.id === selectedAnalysis);
  const industryInfo = INDUSTRIES.find((i) => i.id === selectedIndustry);

  // ─── Shared option card renderer ───
  const OptionCard = ({
    selected,
    onClick,
    icon,
    title,
    subtitle,
  }: {
    selected: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
    title: string;
    subtitle: string;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-5 py-4 rounded-lg border transition-all duration-150 group",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "hover:border-primary/30 hover:bg-primary/[0.02]"
      )}
      style={{
        borderColor: selected ? undefined : "var(--theme-border)",
        background: selected ? undefined : "var(--theme-surface)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          {icon && (
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                selected
                  ? "bg-primary/10 text-primary"
                  : "text-slate-400 group-hover:text-primary/60"
              )}
              style={!selected ? { background: "var(--theme-surface-alt)" } : undefined}
            >
              {icon}
            </div>
          )}
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
              {title}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--theme-text-muted)" }}>
              {subtitle}
            </div>
          </div>
        </div>
        <ChevronRight
          className={cn(
            "w-4 h-4 transition-colors",
            selected ? "text-primary" : "group-hover:text-primary/40"
          )}
          style={!selected ? { color: "var(--theme-text-muted)" } : undefined}
        />
      </div>
    </button>
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 transition-opacity duration-500"
      style={{
        background: "var(--theme-bg, #F8FAFC)",
        opacity: isLaunching ? 0 : 1,
      }}
    >
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          <img src="/meeru-logo.png" alt="Meeru AI" className="h-6 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span className="text-2xl font-semibold tracking-tight" style={{ color: "var(--theme-text)" }}>
            Meeru<span className="text-primary font-bold">AI</span>
          </span>
        </div>
        <p className="text-[11px]" style={{ color: "var(--theme-text-muted)" }}>
          Decision Intelligence for Finance
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 mb-7">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors",
                  i + 1 < step
                    ? "bg-primary text-white"
                    : i + 1 === step
                      ? "bg-primary text-white"
                      : ""
                )}
                style={
                  i + 1 > step
                    ? { background: "var(--theme-surface-alt)", color: "var(--theme-text-muted)" }
                    : undefined
                }
              >
                {i + 1 < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium hidden sm:inline",
                  i + 1 === step ? "text-primary" : ""
                )}
                style={i + 1 !== step ? { color: "var(--theme-text-muted)" } : undefined}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className="w-6 h-px" style={{ background: "var(--theme-border)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="w-full max-w-lg">
        {/* Step 1: Role */}
        {step === 1 && (
          <div className="animate-in fade-in duration-200">
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold" style={{ color: "var(--theme-text)" }}>
                What best describes your role?
              </h1>
              <p className="text-xs mt-1" style={{ color: "var(--theme-text-muted)" }}>
                This personalizes your workbench experience
              </p>
            </div>
            <div className="space-y-2.5">
              {PERSONAS.map((persona) => (
                <OptionCard
                  key={persona.id}
                  selected={selectedPersona === persona.id}
                  onClick={() => handlePersonaSelect(persona.id)}
                  title={persona.title}
                  subtitle={persona.subtitle}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Analysis Type */}
        {step === 2 && (
          <div className="animate-in fade-in duration-200">
            <div className="text-center mb-6">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1 text-xs mb-3 transition-colors"
                style={{ color: "var(--theme-text-muted)" }}
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <h1 className="text-xl font-semibold" style={{ color: "var(--theme-text)" }}>
                Choose your analysis type
              </h1>
              <p className="text-xs mt-1" style={{ color: "var(--theme-text-muted)" }}>
                This determines which workbench you land on
              </p>
            </div>
            <div className="space-y-2.5">
              {ANALYSIS_TYPES.map((analysis) => (
                <OptionCard
                  key={analysis.id}
                  selected={selectedAnalysis === analysis.id}
                  onClick={() => handleAnalysisSelect(analysis.id)}
                  icon={ANALYSIS_ICONS[analysis.id]}
                  title={analysis.title}
                  subtitle={analysis.subtitle}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Industry */}
        {step === 3 && (
          <div className="animate-in fade-in duration-200">
            <div className="text-center mb-6">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1 text-xs mb-3 transition-colors"
                style={{ color: "var(--theme-text-muted)" }}
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <h1 className="text-xl font-semibold" style={{ color: "var(--theme-text)" }}>
                Select your industry
              </h1>
              <p className="text-xs mt-1" style={{ color: "var(--theme-text-muted)" }}>
                Data and terminology adapt to your sector
              </p>
            </div>
            <div className="space-y-2.5">
              {INDUSTRIES.map((industry) => (
                <OptionCard
                  key={industry.id}
                  selected={selectedIndustry === industry.id}
                  onClick={() => handleIndustrySelect(industry.id)}
                  icon={INDUSTRY_ICONS[industry.id]}
                  title={industry.title}
                  subtitle={industry.subtitle}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Launch */}
        {step === 4 && (
          <div className="animate-in fade-in duration-200">
            <div className="text-center mb-6">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1 text-xs mb-3 transition-colors"
                style={{ color: "var(--theme-text-muted)" }}
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <h1 className="text-xl font-semibold" style={{ color: "var(--theme-text)" }}>
                Your workspace is ready
              </h1>
            </div>

            {/* Summary chips */}
            <div className="flex items-center justify-center gap-1.5 mb-6 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-medium">
                {personaInfo?.profileName || personaInfo?.title}
              </span>
              <span style={{ color: "var(--theme-text-muted)" }}>&middot;</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-medium">
                {analysisInfo?.title}
              </span>
              <span style={{ color: "var(--theme-text-muted)" }}>&middot;</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-medium">
                {industryInfo?.title}
              </span>
            </div>

            {/* Summary cards */}
            <div className="space-y-2 mb-6">
              {[
                {
                  label: "Role",
                  value: `${personaInfo?.profileName}, ${personaInfo?.title}`,
                  iconEl: <span className="text-sm font-bold text-primary">{personaInfo?.profileInitials || personaInfo?.title.charAt(0)}</span>,
                },
                {
                  label: "Workbench",
                  value: analysisInfo?.title || "",
                  iconEl: selectedAnalysis ? ANALYSIS_ICONS[selectedAnalysis] : null,
                },
                {
                  label: "Industry",
                  value: industryInfo?.title || "",
                  iconEl: selectedIndustry ? INDUSTRY_ICONS[selectedIndustry] : null,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3.5 px-5 py-3.5 rounded-lg"
                  style={{
                    background: "var(--theme-surface)",
                    border: "1px solid var(--theme-border)",
                  }}
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {item.iconEl}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--theme-text-muted)" }}>
                      {item.label}
                    </div>
                    <div className="text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleEnterWorkbench}
              className="w-full h-10 text-sm font-semibold"
            >
              Enter Workbench
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <p className="text-center text-[10px] mt-2.5" style={{ color: "var(--theme-text-muted)" }}>
              You can switch context anytime from the sidebar.
            </p>
          </div>
        )}
      </div>

      {/* Footer tagline */}
      {step < 4 && (
        <div className="mt-10 text-center">
          <p className="text-xs italic" style={{ color: "var(--theme-text-muted)" }}>
            Finance finally has a system that explains the business, not just the numbers.
          </p>
        </div>
      )}
    </div>
  );
}
