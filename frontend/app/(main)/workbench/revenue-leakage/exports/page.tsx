"use client";

import { useEffect, useState } from "react";
import { RevenueLeakageShell } from "@/components/revenue-leakage/revenue-leakage-shell";
import { revenueLeakageApi } from "@/lib/revenue-leakage/revenueLeakageApi";
import { ExportRecord, ExportTemplate } from "@/lib/revenue-leakage/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown, Plus } from "lucide-react";
import { toast } from "sonner";

const statusVariant = (status: ExportRecord["status"]) => {
  switch (status) {
    case "Ready":
      return "default" as const;
    case "Running":
      return "secondary" as const;
    case "Queued":
      return "secondary" as const;
    case "Failed":
      return "destructive" as const;
  }
};

export default function RevenueLeakageExportsPage() {
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const loadExports = async () => {
    const data = await revenueLeakageApi.getExports();
    setTemplates(data.templates);
    setHistory(data.history);
  };

  useEffect(() => {
    loadExports();
  }, []);

  const handleCreateExport = async () => {
    if (!selectedTemplate) {
      toast.error("Please select an export type");
      return;
    }
    await revenueLeakageApi.createExport(selectedTemplate, "Current User");
    toast.success("Export queued");
    setModalOpen(false);
    setSelectedTemplate("");
    await loadExports();
  };

  return (
    <RevenueLeakageShell subtitle="Operational export templates and history">
      <div className="px-6 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Export Templates</h3>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Export
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="p-4">
              <h3 className="text-sm font-semibold text-slate-900">{template.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{template.description}</p>
              <Badge variant="outline" className="mt-2 text-xs">
                {template.format}
              </Badge>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Export History</h3>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left py-2">Export ID</th>
                <th className="text-left py-2">Created By</th>
                <th className="text-left py-2">Created At</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Filters</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {history.map((record) => (
                <tr key={record.export_id} className="text-slate-700">
                  <td className="py-2 font-medium">{record.export_id}</td>
                  <td className="py-2">{record.created_by}</td>
                  <td className="py-2">{new Date(record.created_at).toLocaleString()}</td>
                  <td className="py-2">{record.type}</td>
                  <td className="py-2 text-xs text-slate-500">{record.filters_used}</td>
                  <td className="py-2">
                    <Badge variant={statusVariant(record.status)}>{record.status}</Badge>
                  </td>
                  <td className="py-2">
                    <Button size="sm" variant="outline" disabled={record.status !== "Ready"}>
                      <FileDown className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
              {!history.length && (
                <tr>
                  <td colSpan={7} className="py-3 text-xs text-slate-500">
                    No exports yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Export</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500">Export Type</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select export type" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Filters Applied</label>
              <div className="mt-1 p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-600 space-y-1">
                <p>Date range: All dates</p>
                <p>Risk level: All</p>
                <p>Signals: All</p>
                <p>Office: All offices</p>
                <p>Status: All statuses</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateExport}>Create Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RevenueLeakageShell>
  );
}
