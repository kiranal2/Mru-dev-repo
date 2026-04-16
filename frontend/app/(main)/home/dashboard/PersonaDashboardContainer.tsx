"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandCenterPanel } from "@/components/ai";
import { GuidedTourOverlay, getTourSteps } from "@/components/guided-tour";
import { useGuidedTour } from "@/hooks/use-guided-tour";
import { CFOHomeDashboard } from "./dashboards/cfo-home";
import { CAOHomeDashboard } from "./dashboards/cao-home";
import { ControllerHomeDashboard } from "./dashboards/controller-home";
import type { Persona } from "@/lib/persona-context";

export default function PersonaDashboardContainer() {
  const router = useRouter();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [checked, setChecked] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);

  // Read persona from localStorage directly (avoids PersonaProvider dependency issues)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("meeru-demo-config");
      if (stored) {
        const config = JSON.parse(stored);
        if (config.persona) {
          setPersona(config.persona);
          setChecked(true);
          return;
        }
      }
    } catch { /* ignore */ }
    setChecked(true);
    router.replace("/login");
  }, [router]);

  // Guided tour
  const tour = useGuidedTour(persona);
  const tourSteps = persona ? getTourSteps(persona) : [];

  if (!checked || !persona) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <div className="text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  const toggleAI = () => setAiPanelOpen((prev) => !prev);

  const dashboards: Record<Persona, React.ReactNode> = {
    cfo: <CFOHomeDashboard onToggleAI={toggleAI} aiActive={aiPanelOpen} />,
    "cao": <CAOHomeDashboard onToggleAI={toggleAI} aiActive={aiPanelOpen} />,
    "cao-controller": <ControllerHomeDashboard onToggleAI={toggleAI} aiActive={aiPanelOpen} />,
  };

  return (
    <div className="flex h-full" style={{ minHeight: 0 }}>
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {dashboards[persona]}
      </div>
      {aiPanelOpen && (
        <div className="w-[340px] shrink-0 border-l border-slate-200">
          <CommandCenterPanel
            workbenchContext="dashboard"
            isOpen={aiPanelOpen}
            onClose={() => setAiPanelOpen(false)}
            theme="light"
          />
        </div>
      )}

      {/* Guided tour overlay — shows on first visit per persona */}
      {tour.showTour && tourSteps.length > 0 && (
        <GuidedTourOverlay
          steps={tourSteps}
          onComplete={tour.completeTour}
          onSkip={tour.skipTour}
        />
      )}
    </div>
  );
}
