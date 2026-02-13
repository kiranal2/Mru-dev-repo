"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CapabilitiesOverview } from "./CapabilitiesOverview";
import { ProcessesView } from "./ProcessesView";
import { DataIntelligenceView } from "./DataIntelligenceView";
import { ControlsView } from "./ControlsView";
import { SimulationView } from "./SimulationView";

type CapabilityView =
  | "capabilities"
  | "processes"
  | "data-intelligence"
  | "controls"
  | "simulations";

export function AutonomyCapabilitiesShell() {
  const [currentView, setCurrentView] = useState<CapabilityView>("capabilities");

  return (
    <div className="space-y-4">
      {/* Secondary Horizontal Menu */}
      <div className="bg-white border rounded-lg p-1 flex gap-1">
        <Button
          variant={currentView === "capabilities" ? "default" : "ghost"}
          onClick={() => setCurrentView("capabilities")}
          className="flex-1"
        >
          Capabilities
        </Button>
        <Button
          variant={currentView === "processes" ? "default" : "ghost"}
          onClick={() => setCurrentView("processes")}
          className="flex-1"
        >
          Processes
        </Button>
        <Button
          variant={currentView === "data-intelligence" ? "default" : "ghost"}
          onClick={() => setCurrentView("data-intelligence")}
          className="flex-1"
        >
          Data Intelligence
        </Button>
        <Button
          variant={currentView === "controls" ? "default" : "ghost"}
          onClick={() => setCurrentView("controls")}
          className="flex-1"
        >
          Controls
        </Button>
        <Button
          variant={currentView === "simulations" ? "default" : "ghost"}
          onClick={() => setCurrentView("simulations")}
          className="flex-1"
        >
          Simulations
        </Button>
      </div>

      {/* Capability Content */}
      <div className="min-h-[600px]">
        {currentView === "capabilities" && (
          <CapabilitiesOverview onNavigate={(view) => setCurrentView(view as CapabilityView)} />
        )}
        {currentView === "processes" && <ProcessesView />}
        {currentView === "data-intelligence" && <DataIntelligenceView />}
        {currentView === "controls" && <ControlsView />}
        {currentView === "simulations" && <SimulationView />}
      </div>
    </div>
  );
}
