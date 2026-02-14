"use client";

import React from "react";
import { Play, Pause, RotateCcw, Bot, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface FinancialWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  steps: Array<{
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    agent?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface FinancialWorkflowProps {
  workflow: FinancialWorkflow;
  onStart: (workflowId: string) => void;
  onPause: (workflowId: string) => void;
  onResume: (workflowId: string) => void;
  onReset: (workflowId: string) => void;
  className?: string;
}

export const FinancialWorkflow: React.FC<FinancialWorkflowProps> = ({
  workflow,
  onStart,
  onPause,
  onResume,
  onReset,
  className
}) => {
  const getStatusIcon = (status: FinancialWorkflow['status']) => {
    switch (status) {
      case "running":
        return <Play className="w-4 h-4 text-blue-500" />;
      case "paused":
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: FinancialWorkflow['status']) => {
    switch (status) {
      case "running":
        return "border-blue-200 bg-blue-50";
      case "paused":
        return "border-yellow-200 bg-yellow-50";
      case "completed":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Play className="w-3 h-3 text-blue-500" />;
      case "completed":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "error":
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const handleAction = () => {
    switch (workflow.status) {
      case "idle":
        onStart(workflow.id);
        break;
      case "running":
        onPause(workflow.id);
        break;
      case "paused":
        onResume(workflow.id);
        break;
      default:
        onReset(workflow.id);
        break;
    }
  };

  const getActionLabel = () => {
    switch (workflow.status) {
      case "idle":
        return "Start Workflow";
      case "running":
        return "Pause";
      case "paused":
        return "Resume";
      default:
        return "Reset";
    }
  };

  return (
    <Card className={cn("w-full", getStatusColor(workflow.status), className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(workflow.status)}
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {workflow.name}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {workflow.description}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleAction}
              variant={workflow.status === "running" ? "outline" : "default"}
              size="sm"
            >
              {getActionLabel()}
            </Button>
            {workflow.status !== "idle" && (
              <Button
                onClick={() => onReset(workflow.id)}
                variant="ghost"
                size="sm"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{workflow.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${workflow.progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Steps</h4>
          {workflow.steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center space-x-3 p-2 rounded-lg bg-white border border-gray-100"
            >
              <div className="flex-shrink-0">
                {getStepStatusIcon(step.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {step.name}
                </p>
                {step.agent && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Bot className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{step.agent}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Timestamps */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Created: {new Date(workflow.createdAt).toLocaleString()}</span>
            <span>Updated: {new Date(workflow.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
