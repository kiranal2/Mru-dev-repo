"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, Users, AlertTriangle, CheckCircle2, Plus } from "lucide-react";

const mockRules = [
  {
    id: 1,
    name: "High Variance Approval",
    condition: "Any variance > $10,000",
    action: "Require Reviewer approval",
    role: "Reviewer",
    status: "active",
  },
  {
    id: 2,
    name: "Large Journal Entry",
    condition: "Any JE > $100,000",
    action: "Require Dual approval",
    role: "Controller + CFO",
    status: "active",
  },
  {
    id: 3,
    name: "Late AP Invoice",
    condition: "Any late AP invoice",
    action: "Controller review required",
    role: "Controller",
    status: "active",
  },
  {
    id: 4,
    name: "SOX Control Test",
    condition: "Monthly control execution",
    action: "Evidence collection + approval",
    role: "Auditor",
    status: "active",
  },
];

export function ControlsView() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Controls & Governance</h2>
        <p className="text-slate-600">
          Define policy logic for approvals, thresholds, and human oversight.
        </p>
      </div>

      {/* Control Categories */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900">Approval Rules</h3>
          </div>
          <p className="text-sm text-slate-600">
            Define when human approval is required based on amount, variance, or risk level.
          </p>
        </Card>

        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900">Threshold Rules</h3>
          </div>
          <p className="text-sm text-slate-600">
            Set automatic escalation based on dollar amounts, percentages, or counts.
          </p>
        </Card>

        <Card className="p-6 bg-purple-50 border-purple-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900">Human-in-the-Loop</h3>
          </div>
          <p className="text-sm text-slate-600">
            Specify tasks that always require human review, regardless of automation.
          </p>
        </Card>
      </div>

      {/* Policy Rules Table */}
      <Card className="p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Policy Rules</h3>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Rule
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule Name</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Required Action</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockRules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell className="text-sm text-slate-600">{rule.condition}</TableCell>
                <TableCell className="text-sm text-slate-600">{rule.action}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {rule.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-slate-600 capitalize">{rule.status}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Examples */}
      <Card className="p-6 bg-slate-50 border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">Example Control Scenarios</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-medium text-slate-900 mb-2">Variance Review</h4>
            <p className="text-sm text-slate-600 mb-3">
              Any GL account variance over $10,000 requires Reviewer approval before close.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="h-3 w-3" />
              <span>SOX Control: Account Reconciliation</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-medium text-slate-900 mb-2">Journal Entry Approval</h4>
            <p className="text-sm text-slate-600 mb-3">
              Manual journal entries over $100,000 require dual approval from Controller and CFO.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="h-3 w-3" />
              <span>SOX Control: Journal Entry Review</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-medium text-slate-900 mb-2">Late Invoice Escalation</h4>
            <p className="text-sm text-slate-600 mb-3">
              AP invoices more than 30 days late automatically escalate to Controller.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <AlertTriangle className="h-3 w-3" />
              <span>Operational Control: AP Management</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-medium text-slate-900 mb-2">Reconciliation Sign-off</h4>
            <p className="text-sm text-slate-600 mb-3">
              All reconciliations require Preparer, Reviewer, and Approver before close.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="h-3 w-3" />
              <span>SOX Control: Three-Way Matching</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
