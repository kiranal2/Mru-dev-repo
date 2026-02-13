"use client";

import { AgentProcessDesign, AgentSimulationEvent } from "@/lib/autonomy/processTypes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, FileText, Clock, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessSimulationPanelProps {
  design: AgentProcessDesign;
  simulationEvents: AgentSimulationEvent[];
  onRunSimulation: () => void;
}

export function ProcessSimulationPanel({
  design,
  simulationEvents,
  onRunSimulation,
}: ProcessSimulationPanelProps) {
  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case "WARN":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "ERROR":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "WARN":
        return "border-amber-200 bg-amber-50";
      case "ERROR":
        return "border-red-200 bg-red-50";
      default:
        return "border-blue-200 bg-blue-50";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Simulation Controls</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Sample Invoice</label>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-sm text-slate-900">BS-24718</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div>Vendor: Bright Solutions Inc.</div>
                <div>Amount: $5,247.80</div>
                <div>Date: 2025-10-15</div>
                <div>Terms: Net 30</div>
              </div>
            </div>
          </div>

          <Button
            onClick={onRunSimulation}
            className="w-full bg-[#00CEC9] hover:bg-[#00b8b3] text-white"
          >
            <Play className="w-4 h-4 mr-2" />
            Run Simulation
          </Button>

          <div className="pt-4 border-t border-slate-200">
            <div className="text-sm font-medium text-slate-700 mb-2">Process Summary</div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Total Tasks:</span>
                <span className="font-medium">{design.tasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Worker Agents:</span>
                <span className="font-medium">
                  {design.agents.filter((a) => a.type === "WORKER").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Human Checkpoints:</span>
                <span className="font-medium">
                  {design.tasks.filter((t) => t.requiresHumanAction).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-2 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-[#6C5CE7]" />
          <h3 className="text-lg font-semibold text-slate-900">Simulation Timeline</h3>
        </div>

        {simulationEvents.length === 0 ? (
          <div className="text-center py-12">
            <Play className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              Click "Run Simulation" to see the workflow in action
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {simulationEvents.map((event, idx) => (
              <div
                key={idx}
                className={cn("border rounded-lg p-4", getSeverityColor(event.severity))}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getSeverityIcon(event.severity)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium text-sm text-slate-900">{event.title}</div>
                      <Badge variant="outline" className="text-xs">
                        {event.taskId}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{event.details}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(event.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
