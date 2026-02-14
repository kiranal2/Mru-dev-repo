"use client";

import { AgentProcessDesign, AgentProcessTaskId } from "@/lib/autonomy/processTypes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessAgentSidebarProps {
  design: AgentProcessDesign;
  onSelectTask: (taskId: AgentProcessTaskId) => void;
}

export function ProcessAgentSidebar({ design, onSelectTask }: ProcessAgentSidebarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-[#6C5CE7]" />
          <h3 className="text-base font-semibold text-slate-900">Agents in this Workflow</h3>
        </div>
        <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
          {design.agents.map((agent) => (
            <div
              key={agent.name}
              className="border border-slate-200 rounded-lg p-2.5 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="font-medium text-xs text-slate-900 line-clamp-1">{agent.name}</div>
                <Badge
                  variant={agent.type === "SUPERVISOR" ? "default" : "secondary"}
                  className="text-xs flex-shrink-0 ml-2"
                >
                  {agent.type}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mb-1.5 line-clamp-2">{agent.description}</p>
              {agent.handlesTasks.length > 0 && (
                <div className="text-xs text-slate-500">
                  Handles: {agent.handlesTasks.length} task
                  {agent.handlesTasks.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-amber-500" />
          <h3 className="text-base font-semibold text-slate-900">Tasks & Human Checkpoints</h3>
        </div>
        <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
          {design.tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onSelectTask(task.id)}
              className="border border-slate-200 rounded-lg p-2.5 cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="font-medium text-xs text-slate-900 line-clamp-1 flex-1">
                  {task.label}
                </div>
                {task.requiresHumanAction && (
                  <Badge
                    variant="outline"
                    className="text-xs border-amber-500 text-amber-700 flex-shrink-0 ml-2"
                  >
                    Human
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
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
                {task.slaLabel && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span className="line-clamp-1">{task.slaLabel}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
