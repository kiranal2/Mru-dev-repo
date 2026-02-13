"use client";

import { AutonomyStage } from "@/lib/autonomy/processTypes";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessStageHeaderProps {
  stage: AutonomyStage;
  onGenerateWorkflow: () => void;
  onSimulate: () => void;
  onFinalizeDeploy: () => void;
}

const STAGES = [
  { id: "INGEST" as AutonomyStage, label: "Ingest & Interpret", number: 1 },
  { id: "DESIGN" as AutonomyStage, label: "Design & Validate", number: 2 },
  { id: "SIMULATE" as AutonomyStage, label: "Simulate", number: 3 },
  { id: "DEPLOY" as AutonomyStage, label: "Finalize & Deploy", number: 4 },
];

export function ProcessStageHeader({
  stage,
  onGenerateWorkflow,
  onSimulate,
  onFinalizeDeploy,
}: ProcessStageHeaderProps) {
  const currentStageIndex = STAGES.findIndex((s) => s.id === stage);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Process Autonomy</h2>
          <p className="text-sm text-slate-600 mt-1">
            Multi-agent workflow builder for SOPs and business processes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={onGenerateWorkflow}
            disabled={stage !== "INGEST"}
            className="bg-[#6C5CE7] hover:bg-[#5f4fd1] text-white"
          >
            Generate Workflow
          </Button>
          <Button
            onClick={onSimulate}
            disabled={stage !== "DESIGN"}
            className="bg-[#00CEC9] hover:bg-[#00b8b3] text-white"
          >
            Simulate
          </Button>
          <Button
            onClick={onFinalizeDeploy}
            disabled={stage !== "SIMULATE"}
            className="bg-[#6C5CE7] hover:bg-[#5f4fd1] text-white"
          >
            Finalize & Deploy
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {STAGES.map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors",
                  idx <= currentStageIndex
                    ? "bg-[#6C5CE7] text-white"
                    : "bg-slate-200 text-slate-500"
                )}
              >
                {idx < currentStageIndex ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span>{s.number}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <div
                  className={cn(
                    "text-sm font-medium",
                    idx <= currentStageIndex ? "text-slate-900" : "text-slate-500"
                  )}
                >
                  {s.label}
                </div>
              </div>
            </div>
            {idx < STAGES.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-1 mx-4 rounded transition-colors",
                  idx < currentStageIndex ? "bg-[#6C5CE7]" : "bg-slate-200"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
