"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Upload,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
} from "lucide-react";

interface DataTemplate {
  id: string;
  name: string;
  description: string;
  type: "Import" | "Export" | "Transform";
  source: string;
  destination: string;
  format: "CSV" | "Excel" | "JSON" | "XML";
  status: "Active" | "Draft" | "Archived";
  lastRun: string;
  nextScheduled: string;
  fieldCount: number;
  mappings: { source: string; destination: string; transform: string }[];
  schedule: string;
  createdBy: string;
  createdDate: string;
}

const MOCK_TEMPLATES: DataTemplate[] = [
  {
    id: "TPL-001",
    name: "Bank Statement Import",
    description: "Import daily bank statements from Chase, BofA, and Wells Fargo",
    type: "Import",
    source: "SFTP Server",
    destination: "Cash Management",
    format: "CSV",
    status: "Active",
    lastRun: "2026-02-16 06:00 AM",
    nextScheduled: "2026-02-17 06:00 AM",
    fieldCount: 24,
    mappings: [
      { source: "Transaction_Date", destination: "posting_date", transform: "DATE_FORMAT(MM/DD/YYYY)" },
      { source: "Amount", destination: "transaction_amount", transform: "DECIMAL(2)" },
      { source: "Description", destination: "memo", transform: "TRIM()" },
      { source: "Reference", destination: "bank_reference", transform: "UPPERCASE()" },
    ],
    schedule: "Daily at 6:00 AM EST",
    createdBy: "System Admin",
    createdDate: "2025-11-15",
  },
  {
    id: "TPL-002",
    name: "AR Aging Export",
    description: "Export accounts receivable aging report for management review",
    type: "Export",
    source: "AR Subledger",
    destination: "Reporting Dashboard",
    format: "Excel",
    status: "Active",
    lastRun: "2026-02-15 08:00 PM",
    nextScheduled: "2026-02-16 08:00 PM",
    fieldCount: 18,
    mappings: [
      { source: "customer_id", destination: "Customer ID", transform: "NONE" },
      { source: "invoice_total", destination: "Invoice Amount", transform: "CURRENCY(USD)" },
      { source: "days_outstanding", destination: "Days Outstanding", transform: "INTEGER" },
    ],
    schedule: "Daily at 8:00 PM EST",
    createdBy: "AR Manager",
    createdDate: "2025-12-01",
  },
  {
    id: "TPL-003",
    name: "GL Journal Transform",
    description: "Transform ERP journal entries to standard chart of accounts format",
    type: "Transform",
    source: "SAP ERP",
    destination: "General Ledger",
    format: "JSON",
    status: "Active",
    lastRun: "2026-02-16 12:00 PM",
    nextScheduled: "2026-02-16 06:00 PM",
    fieldCount: 32,
    mappings: [
      { source: "BUKRS", destination: "company_code", transform: "LOOKUP(company_map)" },
      { source: "HKONT", destination: "gl_account", transform: "LOOKUP(coa_map)" },
      { source: "DMBTR", destination: "amount_local", transform: "DECIMAL(2)" },
      { source: "WAERS", destination: "currency", transform: "ISO_CURRENCY()" },
    ],
    schedule: "Every 6 hours",
    createdBy: "IT Admin",
    createdDate: "2025-10-20",
  },
  {
    id: "TPL-004",
    name: "Vendor Invoice Import",
    description: "Bulk import vendor invoices from AP email inbox OCR output",
    type: "Import",
    source: "OCR Engine",
    destination: "AP Subledger",
    format: "JSON",
    status: "Active",
    lastRun: "2026-02-16 02:30 PM",
    nextScheduled: "2026-02-16 03:30 PM",
    fieldCount: 28,
    mappings: [
      { source: "vendor_name", destination: "vendor_id", transform: "FUZZY_MATCH(vendor_master)" },
      { source: "invoice_number", destination: "invoice_ref", transform: "TRIM()" },
      { source: "total_amount", destination: "invoice_amount", transform: "DECIMAL(2)" },
    ],
    schedule: "Hourly",
    createdBy: "AP Manager",
    createdDate: "2025-11-30",
  },
  {
    id: "TPL-005",
    name: "Intercompany Elimination",
    description: "Transform and match intercompany transactions for consolidation",
    type: "Transform",
    source: "Multi-Entity GL",
    destination: "Consolidation Engine",
    format: "XML",
    status: "Draft",
    lastRun: "Never",
    nextScheduled: "Not scheduled",
    fieldCount: 22,
    mappings: [
      { source: "entity_from", destination: "eliminating_entity", transform: "LOOKUP(entity_map)" },
      { source: "entity_to", destination: "partner_entity", transform: "LOOKUP(entity_map)" },
      { source: "ic_amount", destination: "elimination_amount", transform: "NEGATE()" },
    ],
    schedule: "Monthly (Day 3)",
    createdBy: "Controller",
    createdDate: "2026-01-15",
  },
  {
    id: "TPL-006",
    name: "Revenue Recognition Export",
    description: "Export revenue recognition schedules for ASC 606 compliance",
    type: "Export",
    source: "Revenue Engine",
    destination: "SEC Reporting",
    format: "Excel",
    status: "Archived",
    lastRun: "2026-01-31 11:00 PM",
    nextScheduled: "Not scheduled",
    fieldCount: 20,
    mappings: [
      { source: "contract_id", destination: "Contract ID", transform: "NONE" },
      { source: "recognized_rev", destination: "Recognized Revenue", transform: "CURRENCY(USD)" },
      { source: "deferred_rev", destination: "Deferred Revenue", transform: "CURRENCY(USD)" },
    ],
    schedule: "Archived",
    createdBy: "Revenue Analyst",
    createdDate: "2025-09-10",
  },
];

export default function DataTemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<DataTemplate | null>(null);

  const filtered = MOCK_TEMPLATES.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === "all" || t.type === typeFilter;
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const activeCount = MOCK_TEMPLATES.filter((t) => t.status === "Active").length;
  const importCount = MOCK_TEMPLATES.filter((t) => t.type === "Import").length;
  const exportCount = MOCK_TEMPLATES.filter((t) => t.type === "Export").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>;
      case "Draft":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Draft</Badge>;
      case "Archived":
        return <Badge className="bg-gray-50 text-gray-500 border-gray-200">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Import":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200"><Upload className="w-3 h-3 mr-1" />Import</Badge>;
      case "Export":
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200"><Download className="w-3 h-3 mr-1" />Export</Badge>;
      case "Transform":
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200"><Layers className="w-3 h-3 mr-1" />Transform</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage data import, export, and transformation templates</p>
        </div>
        <Button className="bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 stagger-children">
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Templates</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{MOCK_TEMPLATES.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Import Templates</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{importCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Export Templates</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{exportCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Download className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Import">Import</SelectItem>
            <SelectItem value="Export">Export</SelectItem>
            <SelectItem value="Transform">Transform</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source → Dest</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead>Last Run</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow
                key={t.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedTemplate(t)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.id}</p>
                  </div>
                </TableCell>
                <TableCell>{getTypeBadge(t.type)}</TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{t.source} → {t.destination}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{t.format}</Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">{t.fieldCount}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {t.lastRun}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(t.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedTemplate && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  {selectedTemplate.name}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-2">
                  {getTypeBadge(selectedTemplate.type)}
                  {getStatusBadge(selectedTemplate.status)}
                  <Badge variant="outline">{selectedTemplate.format}</Badge>
                </div>

                <p className="text-sm text-gray-600">{selectedTemplate.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Source</p>
                    <p className="text-sm font-medium mt-1">{selectedTemplate.source}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Destination</p>
                    <p className="text-sm font-medium mt-1">{selectedTemplate.destination}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Schedule</p>
                    <p className="text-sm font-medium mt-1">{selectedTemplate.schedule}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Fields</p>
                    <p className="text-sm font-medium mt-1">{selectedTemplate.fieldCount} fields</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Field Mappings</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Source</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Destination</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Transform</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTemplate.mappings.map((m, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2 font-mono text-xs">{m.source}</td>
                            <td className="px-3 py-2 font-mono text-xs">{m.destination}</td>
                            <td className="px-3 py-2 font-mono text-xs text-blue-600">{m.transform}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-gray-50 text-sm text-gray-600">
                  <p>Created by <span className="font-medium">{selectedTemplate.createdBy}</span> on {selectedTemplate.createdDate}</p>
                  <p className="mt-1">Next scheduled: <span className="font-medium">{selectedTemplate.nextScheduled}</span></p>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
                    Edit Template
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Run Now
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
