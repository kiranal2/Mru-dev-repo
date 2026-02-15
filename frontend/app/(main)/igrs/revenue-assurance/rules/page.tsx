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
import { Switch } from "@/components/ui/switch";

const CATEGORY_OPTIONS = [
  "Valuation",
  "StampDuty",
  "Exemption",
  "Compliance",
  "Operational",
  "Systemic",
];

function severityVariant(severity: string): "default" | "secondary" | "destructive" | "outline" {
  switch (severity) {
    case "High":
      return "destructive";
    case "Medium":
      return "secondary";
    case "Low":
      return "outline";
    default:
      return "outline";
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
  };
  return colors[category] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

export default function RulesPage() {
  const { data: rules, loading, error, refetch } = useIGRSRules();
  const { toggleRule, loading: toggling } = useIGRSRuleMutation();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No rules match the current filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRules.map((rule) => (
                  <TableRow key={rule.ruleId}>
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
                    <TableCell className="text-center">
                      <Switch
                        checked={rule.enabled}
                        disabled={toggling}
                        onCheckedChange={() => handleToggle(rule.ruleId, rule.enabled)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
