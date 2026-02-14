"use client";

import { useState } from "react";
import {
  AgentProcessDesign,
  AgentProcessTaskId,
  AgentSimulationEvent,
  AutonomyStage,
  mockProcessDesign,
} from "@/lib/autonomy/processTypes";
import { ProcessStageHeader } from "./ProcessStageHeader";
import { ProcessDesignPanel } from "./ProcessDesignPanel";
import { ProcessSimulationPanel } from "./ProcessSimulationPanel";
import { ProcessNarrativePanel } from "./ProcessNarrativePanel";

export function AutonomyProcessShell() {
  const [design, setDesign] = useState<AgentProcessDesign>(mockProcessDesign);
  const [stage, setStage] = useState<AutonomyStage>("INGEST");
  const [simulationEvents, setSimulationEvents] = useState<AgentSimulationEvent[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<AgentProcessTaskId | null>(null);

  const handleGenerateWorkflow = () => {
    setStage("DESIGN");
    setDesign((prev) => ({ ...prev, stage: "DESIGN" }));
  };

  const handleSimulate = () => {
    setStage("SIMULATE");
    setDesign((prev) => ({ ...prev, stage: "SIMULATE" }));

    const now = new Date();
    const events: AgentSimulationEvent[] = [
      {
        timestamp: new Date(now.getTime()).toISOString(),
        taskId: "T1_INTAKE",
        title: "Invoice Received",
        details:
          "AP Intake Agent detected new invoice BS-24718 from Bright Solutions Inc. via email. Draft record created.",
        severity: "INFO",
      },
      {
        timestamp: new Date(now.getTime() + 2000).toISOString(),
        taskId: "T2_EXTRACT_VALIDATE",
        title: "Data Extraction Complete",
        details:
          "Extract & Validate Agent processed invoice: Amount $5,247.80, Date 2025-10-15, Vendor ID: BRGT-001. Validation passed.",
        severity: "INFO",
      },
      {
        timestamp: new Date(now.getTime() + 4000).toISOString(),
        taskId: "T3_CODING",
        title: "GL Coding Suggested",
        details:
          "Coding Agent suggested GL code 6500-Marketing based on vendor history (95% confidence). Awaiting preparer confirmation.",
        severity: "INFO",
      },
      {
        timestamp: new Date(now.getTime() + 6000).toISOString(),
        taskId: "T3_CODING",
        title: "Preparer Confirmed Coding",
        details: "Sarah Chen (Preparer) confirmed GL code 6500-Marketing. Task marked complete.",
        severity: "INFO",
      },
      {
        timestamp: new Date(now.getTime() + 8000).toISOString(),
        taskId: "T4_REVIEW",
        title: "Review in Progress",
        details:
          "Reviewer Agent assigned to Mike Rodriguez. Highlighted that amount exceeds typical range for this vendor (+15%).",
        severity: "WARN",
      },
      {
        timestamp: new Date(now.getTime() + 10000).toISOString(),
        taskId: "T4_REVIEW",
        title: "Review Completed",
        details:
          "Mike Rodriguez (Reviewer) verified amount against contract. No adjustments needed.",
        severity: "INFO",
      },
      {
        timestamp: new Date(now.getTime() + 12000).toISOString(),
        taskId: "T5_ROUTE",
        title: "Routing to Approver",
        details:
          "Approval Router Agent determined Jessica Thompson (Manager) is appropriate approver based on amount threshold ($5k-$10k).",
        severity: "INFO",
      },
      {
        timestamp: new Date(now.getTime() + 14000).toISOString(),
        taskId: "T6_APPROVE",
        title: "Approved",
        details: "Jessica Thompson (Approver) approved invoice BS-24718 for payment.",
        severity: "INFO",
      },
      {
        timestamp: new Date(now.getTime() + 16000).toISOString(),
        taskId: "T7_POST_ERP",
        title: "Posted to ERP",
        details:
          "ERP Posting Agent created journal entry JE-2025-11-047182 in NetSuite. AP liability recorded.",
        severity: "INFO",
      },
      {
        timestamp: new Date(now.getTime() + 18000).toISOString(),
        taskId: "T8_SCHEDULE_PAYMENT",
        title: "Payment Scheduled",
        details:
          "Payment Agent calculated payment date 2025-11-27 (Net 30 terms) and added to payment run PR-2025-11-27.",
        severity: "INFO",
      },
      {
        timestamp: new Date(now.getTime() + 20000).toISOString(),
        taskId: "T9_ARCHIVE_CLOSE",
        title: "Process Complete",
        details:
          "Archival Agent stored invoice PDF in SharePoint and marked record closed. Total processing time: 2.3 hours.",
        severity: "INFO",
      },
    ];

    setSimulationEvents(events);
  };

  const handleFinalizeDeploy = () => {
    setStage("DEPLOY");
    setDesign((prev) => ({ ...prev, stage: "DEPLOY" }));
  };

  return (
    <div className="space-y-6">
      <ProcessStageHeader
        stage={stage}
        onGenerateWorkflow={handleGenerateWorkflow}
        onSimulate={handleSimulate}
        onFinalizeDeploy={handleFinalizeDeploy}
      />

      {(stage === "INGEST" || stage === "DESIGN") && (
        <ProcessDesignPanel
          design={design}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
        />
      )}

      {stage === "SIMULATE" && (
        <ProcessSimulationPanel
          design={design}
          simulationEvents={simulationEvents}
          onRunSimulation={handleSimulate}
        />
      )}

      <ProcessNarrativePanel stage={stage} design={design} simulationEvents={simulationEvents} />
    </div>
  );
}
