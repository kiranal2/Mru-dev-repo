"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIGRSExports } from "@/hooks/data/use-igrs-exports";

interface ExportRecord {
  exportId: string;
  createdBy: string;
  createdAt: string;
  type: string;
  filtersUsed: string;
  status: "Queued" | "Ready" | "Running" | "Failed" | "Processing" | "Expired";
}

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Ready":
      return "default";
    case "Running":
    case "Processing":
      return "secondary";
    case "Queued":
    case "Expired":
      return "outline";
    case "Failed":
      return "destructive";
    default:
      return "outline";
  }
}

const EXPORT_TYPES = [
  "CaseList-CSV",
  "Dashboard-PDF",
  "RulesReport-CSV",
  "TrendsReport-PDF",
  "OfficeAnalysis-CSV",
];

export default function ExportsPage() {
  const { data: hookExports, loading, error } = useIGRSExports();
  const [exports, setExports] = useState<ExportRecord[]>([]);

  // Seed from hook data
  useEffect(() => {
    if (hookExports.length > 0) {
      setExports(
        hookExports.map((e) => ({
          exportId: e.exportId,
          createdBy: e.createdBy,
          createdAt: e.createdAt,
          type: e.type,
          filtersUsed: e.filtersUsed,
          status: e.status as ExportRecord["status"],
        }))
      );
    }
  }, [hookExports]);
  const [selectedType, setSelectedType] = useState<string>("CaseList-CSV");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);

    const newExport: ExportRecord = {
      exportId: `EXP-${String(exports.length + 1).padStart(3, "0")}`,
      createdBy: "current-user@igrs.gov.in",
      createdAt: new Date().toISOString(),
      type: selectedType,
      filtersUsed: "Current active filters",
      status: "Queued",
    };

    setTimeout(() => {
      setExports((prev) => [newExport, ...prev]);
      setIsExporting(false);

      // Simulate status progression
      setTimeout(() => {
        setExports((prev) =>
          prev.map((e) =>
            e.exportId === newExport.exportId ? { ...e, status: "Running" } : e
          )
        );
        setTimeout(() => {
          setExports((prev) =>
            prev.map((e) =>
              e.exportId === newExport.exportId ? { ...e, status: "Ready" } : e
            )
          );
        }, 2000);
      }, 1000);
    }, 500);
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
      <h1 className="text-2xl font-semibold">Export Management</h1>

      {/* New Export */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Export Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select export type" />
                </SelectTrigger>
                <SelectContent>
                  {EXPORT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? "Creating Export..." : "Export Now"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Exports are generated using the currently active filters. Large exports may
            take a few minutes to complete.
          </p>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Export History ({exports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Export ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Filters</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exports.map((exp) => (
                <TableRow key={exp.exportId}>
                  <TableCell className="font-mono text-sm">
                    {exp.exportId}
                  </TableCell>
                  <TableCell>{exp.type}</TableCell>
                  <TableCell className="text-sm">{exp.createdBy}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(exp.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {exp.filtersUsed}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(exp.status)}>{exp.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {exp.status === "Ready" ? (
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    ) : exp.status === "Failed" ? (
                      <Button variant="outline" size="sm">
                        Retry
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Processing</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
