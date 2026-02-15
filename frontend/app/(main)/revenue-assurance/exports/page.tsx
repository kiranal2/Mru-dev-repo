"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileDown, Plus, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useRevenueExports } from "@/hooks/data/use-revenue-exports";

interface ExportRecord {
  id: string;
  createdBy: string;
  createdAt: string;
  type: string;
  filtersUsed: string;
  status: "Queued" | "Running" | "Ready" | "Failed";
  format: "CSV" | "PDF" | "XLSX";
}

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: string;
}

const TEMPLATES: ExportTemplate[] = [
  {
    id: "tpl-cases",
    name: "All Cases Export",
    description: "Export all revenue leakage cases with full details including customer, amounts, and status",
    format: "XLSX",
  },
  {
    id: "tpl-summary",
    name: "Executive Summary",
    description: "High-level dashboard KPIs and leakage breakdown by category, tier, and status",
    format: "PDF",
  },
  {
    id: "tpl-customers",
    name: "Customer Risk Report",
    description: "Customer accounts ranked by risk score with leakage totals and case counts",
    format: "XLSX",
  },
  {
    id: "tpl-contracts",
    name: "Contract Compliance",
    description: "Contract compliance scores, billing frequency adherence, and discount analysis",
    format: "CSV",
  },
  {
    id: "tpl-audit",
    name: "Audit Trail",
    description: "Full activity log and case status change history for compliance auditing",
    format: "CSV",
  },
  {
    id: "tpl-recovery",
    name: "Recovery Tracking",
    description: "Recovery status by case, customer, and category with amounts and timelines",
    format: "XLSX",
  },
];

const INITIAL_HISTORY: ExportRecord[] = [
  {
    id: "EXP-2026-001",
    createdBy: "Sarah Mitchell",
    createdAt: "2026-02-14T09:30:00Z",
    type: "All Cases Export",
    filtersUsed: "Date: Last 30 days, Status: All, Category: All",
    status: "Ready",
    format: "XLSX",
  },
  {
    id: "EXP-2026-002",
    createdBy: "James Chen",
    createdAt: "2026-02-13T16:45:00Z",
    type: "Executive Summary",
    filtersUsed: "Date: Q1 2026, Tier: Enterprise",
    status: "Ready",
    format: "PDF",
  },
  {
    id: "EXP-2026-003",
    createdBy: "Sarah Mitchell",
    createdAt: "2026-02-13T11:20:00Z",
    type: "Customer Risk Report",
    filtersUsed: "Risk Score >= 60, Active Cases > 0",
    status: "Ready",
    format: "XLSX",
  },
  {
    id: "EXP-2026-004",
    createdBy: "David Park",
    createdAt: "2026-02-12T14:10:00Z",
    type: "Contract Compliance",
    filtersUsed: "Compliance < 85%, Status: Active",
    status: "Failed",
    format: "CSV",
  },
  {
    id: "EXP-2026-005",
    createdBy: "James Chen",
    createdAt: "2026-02-12T08:00:00Z",
    type: "Audit Trail",
    filtersUsed: "Date: Last 7 days, All categories",
    status: "Ready",
    format: "CSV",
  },
];

const statusIcon = (status: ExportRecord["status"]) => {
  switch (status) {
    case "Ready":
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case "Running":
      return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
    case "Queued":
      return <Clock className="w-4 h-4 text-amber-500" />;
    case "Failed":
      return <XCircle className="w-4 h-4 text-red-500" />;
  }
};

const statusBadge = (status: ExportRecord["status"]) => {
  switch (status) {
    case "Ready":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Running":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Queued":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Failed":
      return "bg-red-100 text-red-700 border-red-200";
  }
};

export default function RevenueAssuranceExportsPage() {
  const { data: hookExports, loading, error } = useRevenueExports();
  const [history, setHistory] = useState<ExportRecord[]>(INITIAL_HISTORY);

  // Merge hook data with initial history when available
  useEffect(() => {
    if (hookExports.length > 0) {
      const fromHook: ExportRecord[] = hookExports.map((e) => ({
        id: e.id,
        createdBy: e.createdBy,
        createdAt: e.createdAt,
        type: e.type,
        filtersUsed: e.filtersUsed,
        status: e.status,
        format: e.format,
      }));
      setHistory(fromHook);
    }
  }, [hookExports]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const handleCreateExport = () => {
    if (!selectedTemplate) {
      toast.error("Please select an export type");
      return;
    }
    const template = TEMPLATES.find((t) => t.id === selectedTemplate);
    const newExport: ExportRecord = {
      id: `EXP-2026-${String(history.length + 1).padStart(3, "0")}`,
      createdBy: "Current User",
      createdAt: new Date().toISOString(),
      type: template?.name || "Unknown",
      filtersUsed: "Date: All, Status: All, Category: All",
      status: "Queued",
      format: (template?.format || "CSV") as ExportRecord["format"],
    };
    setHistory((prev) => [newExport, ...prev]);
    setModalOpen(false);
    setSelectedTemplate("");
    toast.success("Export queued successfully");
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading exports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">Error loading exports: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Export Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Generate and download revenue assurance reports and data extracts
          </p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Export
        </Button>
      </div>

      {/* Templates */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Export Templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TEMPLATES.map((template) => (
            <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
              <h3 className="text-sm font-semibold text-slate-900">{template.name}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {template.description}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  {template.format}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setModalOpen(true);
                  }}
                >
                  <FileDown className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Export History
        </h2>
        <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-300 bg-slate-700">
                <tr>
                  <th className="text-left py-2.5 px-3 font-semibold">Export ID</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Created By</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Date</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Type</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Format</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Filters</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Status</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map((record) => (
                  <tr
                    key={record.id}
                    className="text-slate-800 hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-900">{record.id}</td>
                    <td className="py-2.5 px-3 font-medium">{record.createdBy}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-600">
                      {new Date(record.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">{record.type}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {record.format}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-500 max-w-[200px] truncate">
                      {record.filtersUsed}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${statusBadge(record.status)}`}
                      >
                        {statusIcon(record.status)}
                        {record.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={record.status !== "Ready"}
                        onClick={() => toast.success(`Downloading ${record.id}...`)}
                      >
                        <FileDown className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
                {!history.length && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-sm text-slate-500">
                      No exports yet. Create one from the templates above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Export Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Export</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Export Type</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select export type" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.format})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Filters Applied</label>
              <div className="mt-1 p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-600 space-y-1">
                <p>Date range: All dates</p>
                <p>Risk level: All levels</p>
                <p>Category: All categories</p>
                <p>Customer tier: All tiers</p>
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
    </div>
  );
}
