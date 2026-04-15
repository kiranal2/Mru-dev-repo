"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  LayoutGrid,
  Brain,
  FileCheck,
  Moon,
  Rocket,
  Activity,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TourStep } from "./tour-steps";

/* ─── Icon mapping ─── */
const STEP_ICONS: Record<TourStep["icon"], React.ReactNode> = {
  welcome: <Sparkles className="w-5 h-5" />,
  sidebar: <LayoutGrid className="w-5 h-5" />,
  decision: <Sparkles className="w-5 h-5" />,
  close: <FileCheck className="w-5 h-5" />,
  workbench: <Layers className="w-5 h-5" />,
  ai: <Brain className="w-5 h-5" />,
  theme: <Moon className="w-5 h-5" />,
  ready: <Rocket className="w-5 h-5" />,
};

const ICON_COLORS: Record<TourStep["icon"], string> = {
  welcome: "from-blue-600 to-indigo-700",
  sidebar: "from-slate-600 to-slate-800",
  decision: "from-blue-600 to-indigo-700",
  close: "from-emerald-600 to-teal-700",
  workbench: "from-amber-600 to-orange-700",
  ai: "from-purple-600 to-violet-700",
  theme: "from-slate-600 to-slate-800",
  ready: "from-emerald-500 to-green-600",
};

/* ─── Types ─── */
interface Rect { top: number; left: number; width: number; height: number; }

interface GuidedTourOverlayProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
}

/* ─── Component ─── */
export function GuidedTourOverlay({ steps, onComplete, onSkip }: GuidedTourOverlayProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isCentered = !step.targetId;

  /* ─── Measure target element ─── */
  useEffect(() => {
    if (!step.targetId) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour-id="${step.targetId}"]`);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step.targetId, currentStep]);

  /* ─── Calculate tooltip position ─── */
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || isCentered) {
      return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    const pad = 16;
    const cardWidth = 380;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const estimatedCardH = 340;

    // Vertically center the tooltip relative to the target, clamped to viewport
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const clampedTop = Math.max(pad, Math.min(targetCenterY - estimatedCardH / 2, vh - estimatedCardH - pad));

    // Clamp left so card never overflows right edge of viewport
    const clampLeft = (idealLeft: number) => Math.max(pad, Math.min(idealLeft, vw - cardWidth - pad));

    switch (step.position) {
      case "right": {
        const idealLeft = targetRect.left + targetRect.width + pad;
        // If card would overflow right, position to the left of target instead
        const left = idealLeft + cardWidth > vw - pad
          ? Math.max(pad, targetRect.left - cardWidth - pad)
          : idealLeft;
        return { position: "fixed", top: clampedTop, left, maxWidth: cardWidth };
      }
      case "bottom":
        return {
          position: "fixed",
          top: Math.min(targetRect.top + targetRect.height + pad, vh - estimatedCardH - pad),
          left: clampLeft(targetRect.left + targetRect.width / 2 - cardWidth / 2),
          maxWidth: cardWidth,
        };
      case "bottom-right":
        return {
          position: "fixed",
          top: Math.min(targetRect.top + targetRect.height + pad, vh - estimatedCardH - pad),
          left: clampLeft(targetRect.left + targetRect.width + pad),
          maxWidth: cardWidth,
        };
      case "left":
        return {
          position: "fixed",
          top: clampedTop,
          left: Math.max(pad, targetRect.left - cardWidth - pad),
          maxWidth: cardWidth,
        };
      default:
        return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
  };

  /* ─── Handlers ─── */
  const handleNext = useCallback(() => {
    if (isLast) {
      setExiting(true);
      setTimeout(onComplete, 300);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLast, onComplete]);

  const handlePrev = useCallback(() => {
    if (!isFirst) setCurrentStep((prev) => prev - 1);
  }, [isFirst]);

  const handleSkip = useCallback(() => {
    setExiting(true);
    setTimeout(onSkip, 300);
  }, [onSkip]);

  const handleHighlight = useCallback(() => {
    if (step.highlightRoute) {
      setExiting(true);
      setTimeout(() => {
        onComplete();
        router.push(step.highlightRoute!);
      }, 300);
    }
  }, [step, onComplete, router]);

  /* ─── SVG spotlight mask ─── */
  const renderSpotlight = () => {
    if (!targetRect) return null;
    const p = 6; // padding around highlight
    const r = 10; // border radius
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - p}
              y={targetRect.top - p}
              width={targetRect.width + p * 2}
              height={targetRect.height + p * 2}
              rx={r}
              ry={r}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>
    );
  };

  /* ─── Highlight ring around target ─── */
  const renderHighlightRing = () => {
    if (!targetRect) return null;
    const p = 6;
    return (
      <div
        className="absolute rounded-xl pointer-events-none transition-all duration-300"
        style={{
          zIndex: 2,
          top: targetRect.top - p,
          left: targetRect.left - p,
          width: targetRect.width + p * 2,
          height: targetRect.height + p * 2,
          border: "2px solid rgba(59,130,246,0.6)",
          boxShadow: "0 0 0 4px rgba(59,130,246,0.15), 0 0 20px rgba(59,130,246,0.2)",
        }}
      />
    );
  };

  /* ─── Connecting line from ring to tooltip ─── */
  const renderConnector = () => {
    if (!targetRect || isCentered || !cardRef.current) return null;
    // Simple: just the pulsing ring is enough visual connection. Skip SVG connectors for now.
    return null;
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] transition-opacity duration-300",
        exiting ? "opacity-0" : "opacity-100"
      )}
    >
      {/* Backdrop: solid for centered, SVG spotlight mask for targeted */}
      {isCentered ? (
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
      ) : (
        <>
          {renderSpotlight()}
          {renderHighlightRing()}
          {renderConnector()}
        </>
      )}

      {/* Tooltip card */}
      <div
        ref={cardRef}
        className={cn(
          "z-10 w-[380px] rounded-xl bg-white shadow-2xl overflow-hidden transition-all duration-300",
          exiting ? "scale-95 opacity-0" : "scale-100 opacity-100"
        )}
        style={getTooltipStyle()}
      >
        {/* Pointer arrow towards target */}
        {!isCentered && targetRect && step.position === "right" && (
          <div className="absolute w-3 h-3 bg-white rotate-45 -left-1.5 top-10" style={{ zIndex: -1, boxShadow: "-2px 2px 4px rgba(0,0,0,0.08)" }} />
        )}
        {!isCentered && targetRect && step.position === "bottom" && (
          <div className="absolute w-3 h-3 bg-white rotate-45 -top-1.5 left-10" style={{ zIndex: -1, boxShadow: "-2px -2px 4px rgba(0,0,0,0.08)" }} />
        )}
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Skip button */}
        {!isLast && (
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10"
            aria-label="Skip tour"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Content */}
        <div className="px-5 pt-5 pb-4">
          {/* Icon + Step counter */}
          <div className="flex items-center gap-3 mb-4">
            <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0", ICON_COLORS[step.icon])}>
              {STEP_ICONS[step.icon]}
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Step {currentStep + 1} of {steps.length}
              </div>
              <h2 className="text-[15px] font-bold text-slate-900 leading-tight">{step.title}</h2>
            </div>
          </div>

          {/* Description */}
          <p className="text-[13px] text-slate-600 leading-relaxed mb-3">
            {step.description}
          </p>

          {/* Bullets */}
          {step.bullets && step.bullets.length > 0 && (
            <div className="space-y-1.5 mb-4">
              {step.bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="mt-[7px] w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-[12px] text-slate-600 leading-relaxed">{bullet}</span>
                </div>
              ))}
            </div>
          )}

          {/* Highlight CTA */}
          {step.highlightRoute && step.highlightLabel && (
            <button
              onClick={handleHighlight}
              className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              {step.highlightLabel}
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {/* Step dots */}
          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  i === currentStep
                    ? "w-4 bg-blue-500"
                    : i < currentStep
                      ? "w-1.5 bg-blue-300"
                      : "w-1.5 bg-slate-300"
                )}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-1.5">
            {!isFirst && (
              <button
                onClick={handlePrev}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors",
                isLast
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {isLast ? "Get Started" : "Next"}
              {!isLast && <ArrowRight className="w-3 h-3" />}
              {isLast && <Rocket className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
