"use client";

import { cn } from "@/lib/utils";
import type { PromptStep } from "../types";

interface PromptStepIndicatorProps {
  promptStep: PromptStep;
}

const STEPS: { key: PromptStep; label: string }[] = [
  { key: "input", label: "1. Prompt" },
  { key: "config", label: "2. Configure" },
  { key: "final", label: "3. Finalize" },
];

export function PromptStepIndicator({ promptStep }: PromptStepIndicatorProps) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      {STEPS.map(({ key, label }) => (
        <div
          key={key}
          className={cn(
            "flex items-center gap-2 p-3 rounded-lg border-2",
            promptStep === key
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 bg-white border-dashed"
          )}
        >
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              promptStep === key ? "bg-blue-500" : "bg-slate-300"
            )}
          />
          <span
            className={
              promptStep === key ? "text-slate-900 font-medium" : "text-slate-500"
            }
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
