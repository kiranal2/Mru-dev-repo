"use client";

import { AgentProcessDesign, AgentProcessTaskId } from "@/lib/autonomy/processTypes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, User, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessWorkflowCanvasProps {
  design: AgentProcessDesign;
  selectedTaskId: AgentProcessTaskId | null;
  onSelectTask: (taskId: AgentProcessTaskId) => void;
}

export function ProcessWorkflowCanvas({
  design,
  selectedTaskId,
  onSelectTask,
}: ProcessWorkflowCanvasProps) {
  return (
    <Card className="p-4">
      <div className="mb-3 bg-[#6C5CE7] bg-opacity-10 border border-[#6C5CE7] rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#6C5CE7]" />
          <span className="text-xs font-medium text-[#6C5CE7]">
            Supervisor Agent orchestrates these worker agents and assigns tasks
          </span>
        </div>
      </div>

      <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
        {design.tasks.map((task, idx) => (
          <div key={task.id}>
            <div
              onClick={() => onSelectTask(task.id)}
              className={cn(
                "border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm",
                selectedTaskId === task.id
                  ? "border-[#6C5CE7] bg-[#6C5CE7] bg-opacity-5 shadow-sm"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-700 flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-slate-900">{task.label}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">{task.description}</div>
                  </div>
                </div>
                {task.requiresHumanAction && (
                  <User className="w-4 h-4 text-amber-500 flex-shrink-0 ml-2" />
                )}
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    task.humanRole === "SYSTEM"
                      ? "border-[#00CEC9] text-[#00CEC9]"
                      : task.humanRole === "PREPARER"
                        ? "border-blue-500 text-blue-700"
                        : task.humanRole === "REVIEWER"
                          ? "border-orange-500 text-orange-700"
                          : "border-green-500 text-green-700"
                  )}
                >
                  {task.humanRole}
                </Badge>
              </div>
            </div>

            {idx < design.tasks.length - 1 && (
              <div className="flex justify-center py-0.5">
                <ArrowDown className="w-3 h-3 text-slate-400" />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
