"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AutonomyProcessShell } from "../AutonomyProcessShell";
import { Database, CheckCircle2 } from "lucide-react";

export function ProcessesView() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  return (
    <div className="space-y-6">
      {/* Process Metadata */}
      <Card className="p-6 bg-white">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Process Configuration</h3>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Process Category
            </label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="ap">Accounts Payable</SelectItem>
                <SelectItem value="ar">Accounts Receivable</SelectItem>
                <SelectItem value="reconciliation">Reconciliation</SelectItem>
                <SelectItem value="close">Month-End Close</SelectItem>
                <SelectItem value="controls">SOX Controls</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Linked Assets</label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Database className="h-4 w-4 text-blue-600" />
                <span>AR Aging Analysis (Dynamic Sheet)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Cash Reconciliation (Task)</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Used In</label>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Close
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Recon
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                AP Operations
              </Badge>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-slate-600">
            <span className="font-medium">Current Process:</span> Non-PO Vendor Invoice Processing
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Automated workflow for processing vendor invoices without purchase orders. Includes
            intake, validation, coding, approval routing, and payment scheduling.
          </p>
        </div>
      </Card>

      {/* Existing Process Autonomy Workflow Builder */}
      <div>
        <AutonomyProcessShell />
      </div>
    </div>
  );
}
