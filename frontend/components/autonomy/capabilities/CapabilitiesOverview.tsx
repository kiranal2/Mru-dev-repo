"use client";

import { Card } from "@/components/ui/card";
import { Workflow, Database, GitMerge, Shield, FlaskConical, ArrowRight } from "lucide-react";

interface CapabilitiesOverviewProps {
  onNavigate: (view: string) => void;
}

const capabilities = [
  {
    id: "processes",
    title: "Process Orchestration",
    description:
      "SOP-driven workflows with Supervisor and Worker agents that handle multi-step automation",
    icon: Workflow,
    color: "blue",
  },
  {
    id: "data-intelligence",
    title: "Data-Driven Automation",
    description:
      "Dynamic Sheets as triggers with threshold-based rules that respond to data changes",
    icon: Database,
    color: "green",
  },
  {
    id: "recon-automation",
    title: "Reconciliation Automation",
    description:
      "Auto-match transactions, variance handling, and close orchestration with task dependencies",
    icon: GitMerge,
    color: "purple",
  },
  {
    id: "controls",
    title: "Controls & Compliance",
    description:
      "Approval workflows, SOX controls logic, and governance policies for financial operations",
    icon: Shield,
    color: "red",
  },
  {
    id: "simulations",
    title: "Simulation & What-If",
    description: "Dry-run workflows to test scenarios before deploying automations in production",
    icon: FlaskConical,
    color: "amber",
  },
  {
    id: "close-orchestration",
    title: "Close Orchestration",
    description: "Task dependencies, readiness checks, and automated close management workflows",
    icon: Workflow,
    color: "indigo",
  },
];

const colorClasses = {
  blue: "bg-blue-50 border-blue-200 hover:border-blue-400 hover:shadow-md",
  green: "bg-green-50 border-green-200 hover:border-green-400 hover:shadow-md",
  purple: "bg-purple-50 border-purple-200 hover:border-purple-400 hover:shadow-md",
  red: "bg-red-50 border-red-200 hover:border-red-400 hover:shadow-md",
  amber: "bg-amber-50 border-amber-200 hover:border-amber-400 hover:shadow-md",
  indigo: "bg-indigo-50 border-indigo-200 hover:border-indigo-400 hover:shadow-md",
};

const iconColorClasses = {
  blue: "text-blue-600",
  green: "text-green-600",
  purple: "text-purple-600",
  red: "text-red-600",
  amber: "text-amber-600",
  indigo: "text-indigo-600",
};

export function CapabilitiesOverview({ onNavigate }: CapabilitiesOverviewProps) {
  const handleCardClick = (id: string) => {
    if (id === "processes") {
      onNavigate("processes");
    } else if (id === "recon-automation" || id === "close-orchestration") {
      onNavigate("data-intelligence");
    } else {
      onNavigate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Autonomy Capabilities</h2>
        <p className="text-slate-600">
          Design how work runs across your organization. Humans where it matters, automation where
          it doesn't.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {capabilities.map((capability) => {
          const Icon = capability.icon;
          return (
            <Card
              key={capability.id}
              className={`p-6 cursor-pointer transition-all ${
                colorClasses[capability.color as keyof typeof colorClasses]
              }`}
              onClick={() => handleCardClick(capability.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-lg bg-white ${iconColorClasses[capability.color as keyof typeof iconColorClasses]}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{capability.title}</h3>
              <p className="text-sm text-slate-600">{capability.description}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 bg-slate-50 border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-2">What This Enables</h3>
        <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
          <div>
            <div className="font-medium text-slate-900 mb-1">Process Automation</div>
            <p>Convert SOPs into multi-agent workflows</p>
          </div>
          <div>
            <div className="font-medium text-slate-900 mb-1">Data-Driven Actions</div>
            <p>Trigger automation when data conditions change</p>
          </div>
          <div>
            <div className="font-medium text-slate-900 mb-1">Policy Governance</div>
            <p>Define rules for approvals and controls</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
