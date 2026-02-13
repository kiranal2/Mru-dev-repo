"use client";

import React from "react";
import { Bot, CheckCircle, AlertCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AgentStatus {
  id: string;
  name: string;
  status: 'idle' | 'active' | 'completed' | 'error';
  currentTask?: string;
}

interface AgentStatusIndicatorProps {
  agents: AgentStatus[];
  className?: string;
}

export const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({
  agents,
  className
}) => {
  const getStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case "active":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: AgentStatus['status']) => {
    switch (status) {
      case "active":
        return "border-blue-200 bg-blue-50";
      case "completed":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  const getStatusText = (status: AgentStatus['status']) => {
    switch (status) {
      case "active":
        return "Active";
      case "completed":
        return "Completed";
      case "error":
        return "Error";
      default:
        return "Idle";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-medium text-gray-700 mb-3">Agent Status</h3>
      {agents.map((agent) => (
        <div
          key={agent.id}
          className={cn(
            "flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200",
            getStatusColor(agent.status)
          )}
        >
          {/* Agent Icon */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-300">
              <Bot className="w-4 h-4 text-gray-600" />
            </div>
          </div>

          {/* Agent Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 truncate">
                {agent.name}
              </p>
              <div className="flex items-center space-x-2">
                {getStatusIcon(agent.status)}
                <span className="text-xs text-gray-500">
                  {getStatusText(agent.status)}
                </span>
              </div>
            </div>
            
            {agent.currentTask && (
              <p className="text-xs text-gray-600 mt-1 truncate">
                {agent.currentTask}
              </p>
            )}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {agents.length === 0 && (
        <div className="text-center py-4">
          <Bot className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No agents available</p>
        </div>
      )}
    </div>
  );
};
