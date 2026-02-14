"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task, DocumentTab } from "../types";

interface DocumentBreakdownTabProps {
  tasks: Task[];
  onAddTask: () => void;
  onUpdateTask: (index: number, field: keyof Task, value: string) => void;
  onRecommendAutomations: () => void;
  onContinueToWorkflow: () => void;
}

export function DocumentBreakdownTab({
  tasks,
  onAddTask,
  onUpdateTask,
  onRecommendAutomations,
  onContinueToWorkflow,
}: DocumentBreakdownTabProps) {
  return (
    <Card className="p-6">
      <div className="flex gap-2 mb-4">
        <Button variant="outline" onClick={onAddTask}>
          Add Task
        </Button>
        <Button variant="outline" onClick={onRecommendAutomations}>
          Recommend Automations
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={onContinueToWorkflow}
        >
          Continue to Workflow
        </Button>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[40px_1fr_1fr_2fr_120px] gap-3 font-medium text-xs text-slate-600 pb-2 border-b">
          <div className="text-center">#</div>
          <div>Task</div>
          <div>Owner</div>
          <div>Automation</div>
          <div>State</div>
        </div>

        {tasks.map((task, i) => (
          <div
            key={i}
            className="grid grid-cols-[40px_1fr_1fr_2fr_120px] gap-3 items-center py-2 border-b"
          >
            <div className="text-center font-semibold text-slate-500">{i + 1}</div>
            <Input
              value={task.title}
              onChange={(e) => onUpdateTask(i, "title", e.target.value)}
              className="h-8 text-sm"
            />
            <Input
              value={task.owner}
              onChange={(e) => onUpdateTask(i, "owner", e.target.value)}
              className="h-8 text-sm"
            />
            <Input
              value={task.automation}
              onChange={(e) => onUpdateTask(i, "automation", e.target.value)}
              className="h-8 text-sm"
            />
            <Select
              value={task.state}
              onValueChange={(v) => onUpdateTask(i, "state", v as Task["state"])}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Auto">Auto</SelectItem>
                <SelectItem value="Review">Review</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-4">
        Inline-editable. States: Auto, Review, Manual.
      </p>
    </Card>
  );
}
