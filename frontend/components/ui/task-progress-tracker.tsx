"use client";

import React from "react";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TaskStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "running" | "completed" | "error";
  progress?: number;
  agent?: string;
  timestamp?: string;
}

interface TaskProgressTrackerProps {
  steps: TaskStep[];
  currentStep?: string;
  overallProgress: number;
  className?: string;
}

export const TaskProgressTracker: React.FC<TaskProgressTrackerProps> = ({
  steps,
  currentStep,
  overallProgress,
  className
}) => {
  const getStepIcon = (step: TaskStep) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepStatusColor = (step: TaskStep) => {
    switch (step.status) {
      case "completed":
        return "border-green-200 bg-green-50";
      case "running":
        return "border-blue-200 bg-blue-50";
      case "error":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-500">{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex items-start space-x-4 p-4 rounded-lg border transition-all duration-200",
              getStepStatusColor(step),
              currentStep === step.id && "ring-2 ring-blue-500 ring-opacity-50"
            )}
          >
            {/* Step Number and Icon */}
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-300">
                {getStepIcon(step)}
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">{step.title}</h3>
                {step.agent && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {step.agent}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{step.description}</p>
              
              {/* Progress Bar for Running Steps */}
              {step.status === "running" && step.progress !== undefined && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Progress</span>
                    <span className="text-xs text-gray-500">{step.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Timestamp */}
              {step.timestamp && (
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(step.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {steps.length === 0 && (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No tasks started yet</p>
        </div>
      )}
    </div>
  );
};
