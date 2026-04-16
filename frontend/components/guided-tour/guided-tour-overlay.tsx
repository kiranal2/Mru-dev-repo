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

/* ─── Design tokens (Shawn's HTML v2.5) ─── */
const INK = "#1A1F2E";
const GOLD = "#C8A96E";
const PARCHMENT = "#F4F3EF";

/* ─── Icon mapping ─── */
const STEP_ICONS: Record<TourStep["icon"], React.ReactNode> = {
  welcome: <Sparkles className="w-4 h-4" />,
  sidebar: <LayoutGrid className="w-4 h-4" />,
  decision: <Sparkles className="w-4 h-4" />,
  close: <FileCheck className="w-4 h-4" />,
  workbench: <Layers className="w-4 h-4" />,
  ai: <Brain className="w-4 h-4" />,
  theme: <Moon className="w-4 h-4" />,
  ready: <Rocket className="w-4 h-4" />,
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
    const cardWidth = 360;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const estimatedCardH = 300;

    const targetCenterY = targetRect.top + targetRect.height / 2;
    const clampedTop = Math.max(pad, Math.min(targetCenterY - estimatedCardH / 2, vh - estimatedCardH - pad));
    const clampLeft = (idealLeft: number) => Math.max(pad, Math.min(idealLeft, vw - cardWidth - pad));

    switch (step.position) {
      case "right": {
        const idealLeft = targetRect.left + targetRect.width + pad;
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
    const p = 8;
    const r = 12;
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
          fill="rgba(0,0,0,0.6)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>
    );
  };

  /* ─── Gold highlight ring around target ─── */
  const renderHighlightRing = () => {
    if (!targetRect) return null;
    const p = 8;
    return (
      <div
        className="absolute rounded-xl pointer-events-none transition-all duration-300"
        style={{
          zIndex: 2,
          top: targetRect.top - p,
          left: targetRect.left - p,
          width: targetRect.width + p * 2,
          height: targetRect.height + p * 2,
          border: `2px solid ${GOLD}`,
          boxShadow: `0 0 0 4px ${GOLD}25, 0 0 24px ${GOLD}30`,
        }}
      />
    );
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] transition-opacity duration-300",
        exiting ? "opacity-0" : "opacity-100"
      )}
    >
      {/* Backdrop */}
      {isCentered ? (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      ) : (
        <>
          {renderSpotlight()}
          {renderHighlightRing()}
        </>
      )}

      {/* Dark callout bubble */}
      <div
        ref={cardRef}
        className={cn(
          "z-10 w-[360px] rounded-xl overflow-hidden transition-all duration-300",
          exiting ? "scale-95 opacity-0" : "scale-100 opacity-100"
        )}
        style={{
          ...getTooltipStyle(),
          background: INK,
          border: `1px solid rgba(255,255,255,0.1)`,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
        }}
      >
        {/* Segmented progress bar */}
        <div className="flex gap-0.5 px-4 pt-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-[3px] flex-1 rounded-full transition-all duration-500"
              style={{
                background: i <= currentStep ? GOLD : "rgba(255,255,255,0.1)",
              }}
            />
          ))}
        </div>

        {/* Skip button */}
        {!isLast && (
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 p-1 rounded-md transition-colors z-10"
            style={{ color: "rgba(255,255,255,0.3)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            aria-label="Skip tour"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Content */}
        <div className="px-5 pt-4 pb-3">
          {/* Step label + icon */}
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${GOLD}20`, color: GOLD }}
            >
              {STEP_ICONS[step.icon]}
            </div>
            <div>
              <div
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: GOLD }}
              >
                Step {currentStep + 1} of {steps.length}
              </div>
              <h2
                className="text-[14px] font-bold leading-tight"
                style={{ color: PARCHMENT }}
              >
                {step.title}
              </h2>
            </div>
          </div>

          {/* Description */}
          <p
            className="text-[12px] leading-relaxed mb-2.5"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {step.description}
          </p>

          {/* Bullets */}
          {step.bullets && step.bullets.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {step.bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div
                    className="mt-[6px] w-1 h-1 rounded-full shrink-0"
                    style={{ background: GOLD }}
                  />
                  <span
                    className="text-[11px] leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {bullet}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Highlight CTA */}
          {step.highlightRoute && step.highlightLabel && (
            <button
              onClick={handleHighlight}
              className="mb-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors"
              style={{
                background: `${GOLD}15`,
                color: GOLD,
                border: `1px solid ${GOLD}30`,
              }}
            >
              <Activity className="w-3 h-3" />
              {step.highlightLabel}
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Keyboard hint */}
          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            Use &larr; &rarr; to navigate
          </span>

          {/* Navigation buttons */}
          <div className="flex items-center gap-1.5">
            {!isFirst && (
              <button
                onClick={handlePrev}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors"
              style={{
                background: isLast ? "#22C55E" : GOLD,
                color: isLast ? "white" : INK,
              }}
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
