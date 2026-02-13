"use client";

import {
  AgentProcessDesign,
  AgentSimulationEvent,
  AutonomyStage,
} from "@/lib/autonomy/processTypes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, Play, Rocket } from "lucide-react";

interface ProcessNarrativePanelProps {
  stage: AutonomyStage;
  design: AgentProcessDesign;
  simulationEvents: AgentSimulationEvent[];
}

export function ProcessNarrativePanel({
  stage,
  design,
  simulationEvents,
}: ProcessNarrativePanelProps) {
  const getNarrativeContent = () => {
    switch (stage) {
      case "INGEST":
        return {
          icon: <FileText className="w-6 h-6 text-[#6C5CE7]" />,
          title: "Ingesting Process Documentation",
          paragraphs: [
            "We're reading the SOP and extracting key information including process steps, responsible roles, and service level agreements (SLAs).",
            "The system identifies decision points, approval workflows, and integration requirements with existing systems like ERP and document management.",
            "Once extraction is complete, click 'Generate Workflow' to proceed to the design phase.",
          ],
        };

      case "DESIGN":
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-[#00CEC9]" />,
          title: "Workflow Design Complete",
          paragraphs: [
            `Tasks ${design.tasks.map((_, i) => `T${i + 1}`).join(", ")} have been mapped to specialized worker agents and human roles.`,
            `The workflow includes ${design.agents.filter((a) => a.type === "WORKER").length} worker agents coordinated by a supervisor agent.`,
            `${design.tasks.filter((t) => t.requiresHumanAction).length} tasks require human-in-the-loop checkpoints for review, approval, or exception handling.`,
            "Click 'Simulate' to see how this workflow processes a sample invoice.",
          ],
        };

      case "SIMULATE":
        const events = simulationEvents.length;
        const taskIds = new Set(simulationEvents.map((e) => e.taskId));
        const warnings = simulationEvents.filter((e) => e.severity === "WARN").length;

        return {
          icon: <Play className="w-6 h-6 text-blue-500" />,
          title: "Simulation Results",
          paragraphs:
            events > 0
              ? [
                  `The simulation processed ${events} events across ${taskIds.size} different tasks.`,
                  "AP Intake Agent created a draft invoice from the email. Extract & Validate Agent processed and validated the invoice data.",
                  "Coding Agent suggested GL codes based on vendor history. Human preparers and reviewers confirmed the coding and amount.",
                  "The invoice was routed to the appropriate approver based on amount thresholds, approved, posted to ERP, and scheduled for payment.",
                  warnings > 0
                    ? `${warnings} warning(s) were flagged during processing, highlighting items that exceeded normal parameters.`
                    : "The entire process completed successfully with no exceptions.",
                  "Total processing time: 2.3 hours end-to-end. Click 'Finalize & Deploy' when ready.",
                ]
              : [
                  "Simulation has not been run yet.",
                  "Click 'Run Simulation' in the controls panel to process a sample invoice through the workflow.",
                ],
        };

      case "DEPLOY":
        return {
          icon: <Rocket className="w-6 h-6 text-green-500" />,
          title: "Workflow Ready for Deployment",
          paragraphs: [
            `${design.tasks.length} tasks have been orchestrated across ${design.agents.filter((a) => a.type === "WORKER").length} worker agents.`,
            `${design.tasks.filter((t) => t.requiresHumanAction).length} human checkpoints ensure proper oversight and exception handling.`,
            "This workflow is ready to be bound to live invoice processing. Backend connectors can integrate with email systems, ERP, and document management.",
            "The autonomous workflow will handle routine invoices while escalating exceptions to human reviewers based on configured business rules.",
          ],
        };
    }
  };

  const content = getNarrativeContent();

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-50 to-white">
      <div className="flex items-start gap-4">
        <div className="mt-1">{content.icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">{content.title}</h3>
          <div className="space-y-3">
            {content.paragraphs.map((para, idx) => (
              <p key={idx} className="text-sm text-slate-700 leading-relaxed">
                {para}
              </p>
            ))}
          </div>

          {stage === "DEPLOY" && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-green-900 mb-1">
                    Autonomy workflow saved (mock)
                  </div>
                  <p className="text-sm text-green-700">
                    Backend connectors can later bind this to live invoices. Integration points
                    include email monitoring, ERP APIs, and document storage.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-200">
            <Badge variant="outline" className="text-xs">
              {design.sourceType}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {design.name}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Stage: {stage}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
