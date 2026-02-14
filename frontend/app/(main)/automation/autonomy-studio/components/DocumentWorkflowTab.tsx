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
import type { WorkflowNode, WorkflowEdge } from "../types";

interface DocumentWorkflowTabProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  nodeForm: { title: string; owner: string; type: string; auto: string };
  setNodeForm: React.Dispatch<
    React.SetStateAction<{ title: string; owner: string; type: string; auto: string }>
  >;
  onAddNode: () => void;
  onSelectNode: (id: string) => void;
  onApplyNodeChanges: () => void;
  onDeleteNode: () => void;
  onConnectFrom: () => void;
  onConnectTo: () => void;
  onResetLayout: () => void;
}

export function DocumentWorkflowTab({
  nodes,
  edges,
  nodeForm,
  setNodeForm,
  onAddNode,
  onSelectNode,
  onApplyNodeChanges,
  onDeleteNode,
  onConnectFrom,
  onConnectTo,
  onResetLayout,
}: DocumentWorkflowTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-sm font-medium text-slate-700 mb-3">VISUAL FLOW</h3>
        <div
          className="relative border-2 border-dashed border-slate-300 rounded-lg p-4 min-h-[400px] bg-slate-50"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #fafafa, #fafafa 10px, #fff 10px, #fff 20px)",
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L6,3 z" fill="#94a3b8" />
              </marker>
            </defs>
            {edges.map((edge, i) => {
              const fromNode = nodes.find((n) => n.id === edge.from);
              const toNode = nodes.find((n) => n.id === edge.to);
              if (!fromNode || !toNode) return null;
              const x1 = fromNode.x + 130;
              const y1 = fromNode.y + 60;
              const x2 = toNode.x + 20;
              const y2 = toNode.y + 20;
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
          </svg>

          {nodes.map((node) => (
            <div
              key={node.id}
              className="absolute bg-white border border-slate-300 rounded-lg p-3 shadow-md cursor-move min-w-[190px] max-w-[260px]"
              style={{ left: node.x, top: node.y, zIndex: 1 }}
            >
              <h4 className="font-semibold text-sm mb-1">{node.title}</h4>
              <div className="text-xs text-slate-600 mb-1">Owner: {node.owner}</div>
              <div className="text-xs text-slate-600 mb-1">Type: {node.type}</div>
              <div className="text-xs text-slate-600 mb-2">
                Automation: {node.auto || "None"}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onSelectNode(node.id)}
                >
                  Select
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => onSelectNode(node.id)}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onAddNode}>
            Add Node
          </Button>
          <Button variant="ghost" onClick={onResetLayout}>
            Reset Layout
          </Button>
          <Button variant="outline">Validate</Button>
          <Button className="bg-blue-600 hover:bg-blue-700">Finalize Automation</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-medium text-slate-700 mb-3">NODE INSPECTOR</h3>
        <div className="grid gap-3">
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Title</label>
            <Input
              value={nodeForm.title}
              onChange={(e) => setNodeForm({ ...nodeForm, title: e.target.value })}
              placeholder="Node title"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Owner</label>
            <Input
              value={nodeForm.owner}
              onChange={(e) => setNodeForm({ ...nodeForm, owner: e.target.value })}
              placeholder="Owner or Role"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Action Type</label>
            <Select
              value={nodeForm.type}
              onValueChange={(v) => setNodeForm({ ...nodeForm, type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Get Data">Get Data</SelectItem>
                <SelectItem value="Transform">Transform</SelectItem>
                <SelectItem value="Send Email">Send Email</SelectItem>
                <SelectItem value="Create Task">Create Task</SelectItem>
                <SelectItem value="Schedule">Schedule</SelectItem>
                <SelectItem value="Decision">Decision</SelectItem>
                <SelectItem value="Notify">Notify</SelectItem>
                <SelectItem value="Update System">Update System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Automation</label>
            <Input
              value={nodeForm.auto}
              onChange={(e) => setNodeForm({ ...nodeForm, auto: e.target.value })}
              placeholder="e.g., Generate email draft from template"
            />
          </div>

          <div className="flex gap-2 mt-2">
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={onApplyNodeChanges}
            >
              Apply
            </Button>
            <Button variant="destructive" onClick={onDeleteNode}>
              Delete Node
            </Button>
          </div>

          <div className="border-t pt-3 mt-2">
            <h4 className="text-xs font-medium text-slate-600 mb-2">CONNECTIONS</h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onConnectFrom}>
                Connect From Selected
              </Button>
              <Button variant="outline" size="sm" onClick={onConnectTo}>
                Connect To Selected
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
