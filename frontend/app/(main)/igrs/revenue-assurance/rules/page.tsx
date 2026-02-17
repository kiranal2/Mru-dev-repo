"use client";

import { useState } from "react";
import { useIGRSRules, useIGRSRuleMutation } from "@/hooks/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ChevronRight, Code2, AlertTriangle, FileText, Zap } from "lucide-react";
import type { IGRSRule } from "@/lib/data/types";

const CATEGORY_OPTIONS = [
  "Valuation",
  "StampDuty",
  "Exemption",
  "Compliance",
  "Operational",
  "Systemic",
  "StampIntelligence",
];

function severityVariant(severity: string): "default" | "secondary" | "destructive" | "outline" {
  switch (severity) {
    case "High": return "destructive";
    case "Medium": return "secondary";
    case "Low": return "outline";
    default: return "outline";
  }
}

function categoryColor(category: string): string {
  const colors: Record<string, string> = {
    Valuation: "bg-blue-100 text-blue-800 border-blue-200",
    StampDuty: "bg-purple-100 text-purple-800 border-purple-200",
    Exemption: "bg-amber-100 text-amber-800 border-amber-200",
    Compliance: "bg-green-100 text-green-800 border-green-200",
    Operational: "bg-cyan-100 text-cyan-800 border-cyan-200",
    Systemic: "bg-red-100 text-red-800 border-red-200",
    StampIntelligence: "bg-amber-100 text-amber-800 border-amber-200",
  };
  return colors[category] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

export default function RulesPage() {
  const { data: rules, loading, error, refetch } = useIGRSRules();
  const { toggleRule, loading: toggling } = useIGRSRuleMutation();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedRule, setSelectedRule] = useState<IGRSRule | null>(null);

  if (loading)
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button onClick={refetch} className="mt-2 text-sm text-red-600 underline">
            Retry
          </button>
        </div>
      </div>
    );

  const filteredRules =
    categoryFilter === "all"
      ? rules
      : rules.filter((r) => r.category === categoryFilter);

  const enabledCount = rules.filter((r) => r.enabled).length;
  const disabledCount = rules.length - enabledCount;

  const handleToggle = async (ruleId: string, currentEnabled: boolean) => {
    try {
      await toggleRule(ruleId, !currentEnabled);
      refetch();
    } catch {
      // error handled by mutation hook
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rules Engine</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {enabledCount} enabled / {disabledCount} disabled
          </span>
        </div>
      </div>

      {/* Category Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Category:</span>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filteredRules.length} rule{filteredRules.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead className="text-center">Enabled</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No rules match the current filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRules.map((rule) => (
                  <TableRow
                    key={rule.ruleId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedRule(rule)}
                  >
                    <TableCell className="font-mono text-sm">{rule.ruleId}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${categoryColor(
                          rule.category
                        )}`}
                      >
                        {rule.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rule.ruleName}</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">
                          {rule.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={severityVariant(rule.severity)}>
                        {rule.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {rule.phase}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={rule.enabled}
                        disabled={toggling}
                        onCheckedChange={() => handleToggle(rule.ruleId, rule.enabled)}
                      />
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rule Detail Sheet */}
      <Sheet open={!!selectedRule} onOpenChange={(open) => !open && setSelectedRule(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedRule && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{selectedRule.ruleId}</span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${categoryColor(
                      selectedRule.category
                    )}`}
                  >
                    {selectedRule.category}
                  </span>
                </div>
                <SheetTitle className="text-lg">{selectedRule.ruleName}</SheetTitle>
                <SheetDescription>{selectedRule.description}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {/* Status Row */}
                <div className="flex items-center gap-3">
                  <Badge variant={severityVariant(selectedRule.severity)}>
                    {selectedRule.severity} Severity
                  </Badge>
                  <Badge variant="outline">{selectedRule.phase}</Badge>
                  <Badge variant={selectedRule.enabled ? "default" : "secondary"}>
                    {selectedRule.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                {/* Logic */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Code2 className="w-4 h-4" />
                    Detection Logic
                  </h3>
                  <div className="bg-slate-50 border rounded-lg p-3">
                    <code className="text-sm text-slate-800 whitespace-pre-wrap font-mono">
                      {selectedRule.logic}
                    </code>
                  </div>
                </div>

                {/* Inputs & Output */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Inputs</h3>
                    <div className="space-y-1">
                      {selectedRule.inputs.map((input) => (
                        <div key={input} className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                          <span className="text-xs font-mono bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                            {input}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Output</h3>
                    <span className="text-xs font-mono bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                      {selectedRule.output}
                    </span>
                  </div>
                </div>

                {/* Required Fields */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" />
                    Required Fields
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRule.requiredFields.map((field) => (
                      <span
                        key={field}
                        className="text-xs font-mono bg-slate-100 border rounded px-2 py-0.5"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Example */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4" />
                    Example
                  </h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-900">{selectedRule.example}</p>
                  </div>
                </div>

                {/* False Positive Notes */}
                {selectedRule.falsePositiveNotes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      False Positive Notes
                    </h3>
                    <ul className="space-y-1.5">
                      {selectedRule.falsePositiveNotes.map((note, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-amber-400 mt-0.5 shrink-0">-</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
