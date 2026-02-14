"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Database, AlertCircle, CheckCircle2, Plus } from "lucide-react";

const mockSheets = [
  { id: 1, name: "AR Aging Analysis", category: "AR", lastRun: "2 hours ago", status: "healthy" },
  {
    id: 2,
    name: "Cash Reconciliation",
    category: "Recon",
    lastRun: "5 hours ago",
    status: "healthy",
  },
  { id: 3, name: "Variance Analysis", category: "Close", lastRun: "1 day ago", status: "warning" },
  { id: 4, name: "AP Invoice Tracker", category: "AP", lastRun: "3 hours ago", status: "healthy" },
  { id: 5, name: "GL Account Review", category: "Close", lastRun: "2 days ago", status: "healthy" },
];

export function DataIntelligenceView() {
  const [selectedSheet, setSelectedSheet] = useState<number | null>(1);
  const [trigger, setTrigger] = useState("schedule");
  const [conditionType, setConditionType] = useState("row_count");
  const [conditionValue, setConditionValue] = useState("100");
  const [action, setAction] = useState("create_task");

  const selectedSheetData = mockSheets.find((s) => s.id === selectedSheet);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Data Intelligence</h2>
        <p className="text-slate-600">
          Define what happens when data changes. Connect Dynamic Sheets to automation rules.
        </p>
      </div>

      <div className="grid grid-cols-[350px_1fr] gap-6">
        {/* Left: Dynamic Sheets List */}
        <Card className="p-4 bg-white h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Dynamic Sheets</h3>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>

          <div className="space-y-2">
            {mockSheets.map((sheet) => (
              <div
                key={sheet.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedSheet === sheet.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
                onClick={() => setSelectedSheet(sheet.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm text-slate-900">{sheet.name}</span>
                  </div>
                  {sheet.status === "healthy" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="outline" className="text-xs">
                    {sheet.category}
                  </Badge>
                  <span className="text-slate-500">{sheet.lastRun}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Rule Builder */}
        <div className="space-y-6">
          <Card className="p-6 bg-white">
            <h3 className="font-semibold text-slate-900 mb-4">
              Rules for: {selectedSheetData?.name}
            </h3>

            <div className="space-y-6">
              {/* Trigger */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Trigger</Label>
                <Select value={trigger} onValueChange={setTrigger}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schedule">On Schedule</SelectItem>
                    <SelectItem value="close_phase">On Close Phase</SelectItem>
                    <SelectItem value="manual">Manual Only</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">When should this rule evaluate?</p>
              </div>

              {/* Conditions */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Conditions</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={conditionType} onValueChange={setConditionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="row_count">Row count</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="variance_pct">Variance %</SelectItem>
                      <SelectItem value="days_late">Days late</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    placeholder="Threshold value"
                  />
                </div>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">Rule:</span> If {conditionType.replace("_", " ")}{" "}
                    &gt; {conditionValue}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Actions</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create_task">Create Task</SelectItem>
                    <SelectItem value="auto_close">Auto-Close Task</SelectItem>
                    <SelectItem value="escalate">Escalate to Manager</SelectItem>
                    <SelectItem value="block_close">Block Close</SelectItem>
                    <SelectItem value="notify_role">Notify Role</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Details */}
              {action === "create_task" && (
                <div className="p-4 border rounded-lg bg-slate-50">
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    Task Details
                  </Label>
                  <div className="space-y-3">
                    <Input
                      placeholder="Task title template"
                      defaultValue="Review AR items over threshold"
                    />
                    <Select defaultValue="controller">
                      <SelectTrigger>
                        <SelectValue placeholder="Assign to role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="controller">Controller</SelectItem>
                        <SelectItem value="analyst">Analyst</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline">Test Rule</Button>
                <Button className="bg-blue-600 hover:bg-blue-700">Save Rule</Button>
              </div>
            </div>
          </Card>

          {/* Example Rules */}
          <Card className="p-6 bg-slate-50 border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Active Rules (Mock)</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Condition</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-sm">Row count &gt; 100</TableCell>
                  <TableCell className="text-sm">Create task for Controller</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      Active
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm">Variance % &gt; 5</TableCell>
                  <TableCell className="text-sm">Escalate to Manager</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      Active
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
