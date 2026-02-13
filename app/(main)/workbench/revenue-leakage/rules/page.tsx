"use client";

import { useEffect, useMemo, useState } from "react";
import { RevenueLeakageShell } from "@/components/revenue-leakage/RevenueLeakageShell";
import { revenueLeakageApi } from "@/lib/revenue-leakage/revenueLeakageApi";
import { RuleCatalogItem } from "@/lib/revenue-leakage/types";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/Switch";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Search,
  Plus,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  AlertTriangle,
  CheckCircle2,
  Code2,
  BookOpen,
  Lightbulb,
} from "lucide-react";

const ruleGroups = [
  "All",
  "Payable vs Paid Gap",
  "Payment Integrity",
  "Challan Delay",
  "Prohibited Land",
  "Data Completeness",
  "Exemption + MV (Phase 2 Enhanced)",
];

const categoryColors: Record<string, string> = {
  "Payable vs Paid Gap": "bg-red-100 text-red-800 border-red-300",
  "Payment Integrity": "bg-orange-100 text-orange-800 border-orange-300",
  "Challan Delay": "bg-amber-100 text-amber-800 border-amber-300",
  "Prohibited Land": "bg-pink-100 text-pink-800 border-pink-300",
  "Data Completeness": "bg-slate-200 text-slate-800 border-slate-400",
  "Market Value": "bg-sky-100 text-sky-800 border-sky-300",
  Exemption: "bg-purple-100 text-purple-800 border-purple-300",
  "Valuation — Market Value Trend": "bg-violet-100 text-violet-800 border-violet-300",
};

const severityStyles: Record<string, string> = {
  High: "bg-red-600 text-white",
  Medium: "bg-amber-500 text-white",
  Low: "bg-emerald-600 text-white",
};

const phaseStyles: Record<string, string> = {
  "Phase 1": "bg-blue-100 text-blue-800 border-blue-300",
  "Phase 2 Enhanced": "bg-violet-100 text-violet-800 border-violet-300",
};

const getCategoryColor = (category: string) => {
  for (const [key, style] of Object.entries(categoryColors)) {
    if (category.includes(key)) return style;
  }
  return "bg-slate-100 text-slate-700 border-slate-300";
};

const groupChipStyles: Record<string, { active: string; idle: string }> = {
  All: {
    active: "bg-slate-800 text-white border-slate-900",
    idle: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
  },
  "Payable vs Paid Gap": {
    active: "bg-red-600 text-white border-red-700",
    idle: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  },
  "Payment Integrity": {
    active: "bg-orange-600 text-white border-orange-700",
    idle: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
  },
  "Challan Delay": {
    active: "bg-amber-500 text-white border-amber-600",
    idle: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  "Prohibited Land": {
    active: "bg-pink-600 text-white border-pink-700",
    idle: "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100",
  },
  "Data Completeness": {
    active: "bg-slate-700 text-white border-slate-800",
    idle: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100",
  },
  "Exemption + MV (Phase 2 Enhanced)": {
    active: "bg-violet-600 text-white border-violet-700",
    idle: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100",
  },
};

const defaultNewRule: RuleCatalogItem = {
  rule_id: "",
  category: "Payable vs Paid Gap",
  rule_name: "",
  description: "",
  severity: "Medium",
  inputs: [],
  output: "",
  enabled: true,
  phase: "Phase 1",
  details: {
    logic: "",
    required_fields: [],
    false_positive_notes: [],
    example: "",
  },
};

export default function RevenueLeakageRulesPage() {
  const [rules, setRules] = useState<RuleCatalogItem[]>([]);
  const [activeGroup, setActiveGroup] = useState("All");
  const [selectedRule, setSelectedRule] = useState<RuleCatalogItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const [newRule, setNewRule] = useState<RuleCatalogItem>({ ...defaultNewRule });

  useEffect(() => {
    revenueLeakageApi.getRules().then(setRules);
  }, []);

  const filteredRules = useMemo(() => {
    let result = rules;
    if (activeGroup !== "All") {
      if (activeGroup === "Exemption + MV (Phase 2 Enhanced)") {
        result = result.filter((rule) => rule.phase === "Phase 2 Enhanced");
      } else {
        result = result.filter((rule) => rule.category === activeGroup);
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (rule) =>
          rule.rule_id.toLowerCase().includes(q) ||
          rule.rule_name.toLowerCase().includes(q) ||
          rule.description.toLowerCase().includes(q) ||
          rule.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [rules, activeGroup, searchQuery]);

  const stats = useMemo(() => {
    const total = rules.length;
    const enabled = rules.filter((r) => r.enabled).length;
    const disabled = total - enabled;
    const high = rules.filter((r) => r.severity === "High").length;
    const medium = rules.filter((r) => r.severity === "Medium").length;
    const low = rules.filter((r) => r.severity === "Low").length;
    return { total, enabled, disabled, high, medium, low };
  }, [rules]);

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    await revenueLeakageApi.toggleRule(ruleId, enabled);
    setRules((prev) => prev.map((r) => (r.rule_id === ruleId ? { ...r, enabled } : r)));
    toast.success(`Rule ${ruleId} ${enabled ? "enabled" : "disabled"}`);
  };

  const handleAddRule = async () => {
    if (!newRule.rule_id.trim() || !newRule.rule_name.trim()) {
      toast.error("Rule ID and Rule Name are required");
      return;
    }
    if (rules.some((r) => r.rule_id === newRule.rule_id.trim())) {
      toast.error("Rule ID already exists");
      return;
    }
    const ruleToAdd: RuleCatalogItem = {
      ...newRule,
      rule_id: newRule.rule_id.trim(),
      rule_name: newRule.rule_name.trim(),
      description: newRule.description.trim(),
      output: newRule.output.trim() || `${newRule.category} signal`,
      inputs: newRule.inputs.length ? newRule.inputs : ["TRAN_MAJOR"],
      details: {
        logic: newRule.details.logic.trim() || "Custom rule logic.",
        required_fields: newRule.details.required_fields.length
          ? newRule.details.required_fields
          : ["TRAN_MAJOR"],
        false_positive_notes: newRule.details.false_positive_notes.filter((n) => n.trim()),
        example: newRule.details.example.trim() || "No example provided.",
      },
    };
    await revenueLeakageApi.addRule(ruleToAdd);
    setRules((prev) => [...prev, ruleToAdd]);
    setNewRule({ ...defaultNewRule });
    setAddRuleOpen(false);
    toast.success(`Rule ${ruleToAdd.rule_id} created`);
  };

  return (
    <RevenueLeakageShell subtitle="Rule catalog and health monitoring">
      <div className="px-6 py-3 space-y-3">
        {/* ─── KPI Summary Strip ─── */}
        <div className="grid grid-cols-6 gap-2">
          <Card className="p-3 bg-slate-50 border-slate-200">
            <p className="text-[11px] font-medium text-slate-500">Total Rules</p>
            <p className="text-xl font-bold text-slate-900">{stats.total}</p>
          </Card>
          <Card className="p-3 bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <p className="text-[11px] font-medium text-emerald-600">Enabled</p>
            </div>
            <p className="text-xl font-bold text-emerald-700">{stats.enabled}</p>
          </Card>
          <Card className="p-3 bg-slate-50 border-slate-200">
            <div className="flex items-center gap-1.5">
              <ShieldOff className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-[11px] font-medium text-slate-500">Disabled</p>
            </div>
            <p className="text-xl font-bold text-slate-600">{stats.disabled}</p>
          </Card>
          <Card className="p-3 bg-red-50 border-red-200">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              <p className="text-[11px] font-medium text-red-600">High</p>
            </div>
            <p className="text-xl font-bold text-red-700">{stats.high}</p>
          </Card>
          <Card className="p-3 bg-amber-50 border-amber-200">
            <p className="text-[11px] font-medium text-amber-600">Medium</p>
            <p className="text-xl font-bold text-amber-700">{stats.medium}</p>
          </Card>
          <Card className="p-3 bg-emerald-50 border-emerald-200">
            <p className="text-[11px] font-medium text-emerald-600">Low</p>
            <p className="text-xl font-bold text-emerald-700">{stats.low}</p>
          </Card>
        </div>

        {/* ─── Toolbar: Search + Filter Chips + Add Rule ─── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[240px] h-8 text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ruleGroups.map((group) => {
              const styles = groupChipStyles[group] || groupChipStyles.All;
              const count =
                group === "All"
                  ? rules.length
                  : group === "Exemption + MV (Phase 2 Enhanced)"
                    ? rules.filter((r) => r.phase === "Phase 2 Enhanced").length
                    : rules.filter((r) => r.category === group).length;
              return (
                <button
                  key={group}
                  onClick={() => setActiveGroup(group)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                    activeGroup === group ? styles.active + " shadow-sm" : styles.idle
                  }`}
                >
                  {group === "Exemption + MV (Phase 2 Enhanced)" ? "Phase 2" : group}
                  <span className="ml-1 opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
          <Button
            size="sm"
            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white h-8"
            onClick={() => setAddRuleOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Rule
          </Button>
        </div>

        {/* ─── Rules Table ─── */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
          <table className="w-full text-sm" style={{ minWidth: 1200 }}>
            <thead className="text-xs uppercase text-slate-200 bg-slate-800">
              <tr>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 90 }}
                >
                  Rule ID
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 140 }}
                >
                  Category
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 200 }}
                >
                  Rule Name
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 250 }}
                >
                  Description
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 80 }}
                >
                  Severity
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 80 }}
                >
                  Phase
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 80 }}
                >
                  Enabled
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 80 }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRules.map((rule) => (
                <tr
                  key={rule.rule_id}
                  className="text-slate-800 hover:bg-blue-50/50 transition-colors"
                >
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {rule.rule_id}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryColor(rule.category)} whitespace-nowrap`}
                    >
                      {rule.category}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-slate-900">{rule.rule_name}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 max-w-[300px]">
                    {rule.description}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${severityStyles[rule.severity]} whitespace-nowrap`}
                    >
                      {rule.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${phaseStyles[rule.phase]} whitespace-nowrap`}
                    >
                      {rule.phase === "Phase 2 Enhanced" ? "P2" : "P1"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => handleToggleRule(rule.rule_id, checked)}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs"
                      onClick={() => setSelectedRule(rule)}
                    >
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
              {!filteredRules.length && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-sm text-slate-500">
                    No rules match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Footer ─── */}
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Showing {filteredRules.length} of {rules.length} rules
          </span>
        </div>
      </div>

      {/* ─── Rule Details Drawer ─── */}
      <Sheet open={!!selectedRule} onOpenChange={() => setSelectedRule(null)}>
        <SheetContent className="w-[580px] sm:max-w-[580px] p-0 flex flex-col">
          {selectedRule && (
            <>
              <SheetHeader className="px-6 pt-5 pb-4 border-b bg-gradient-to-r from-slate-800 to-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SheetTitle className="text-lg font-bold text-white tracking-tight">
                      {selectedRule.rule_name}
                    </SheetTitle>
                    <p className="text-xs text-slate-300 mt-1 font-mono">{selectedRule.rule_id}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${severityStyles[selectedRule.severity]}`}
                    >
                      {selectedRule.severity}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${phaseStyles[selectedRule.phase]}`}
                    >
                      {selectedRule.phase}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${selectedRule.enabled ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200"}`}
                    >
                      {selectedRule.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Category + Description */}
                <div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getCategoryColor(selectedRule.category)} mb-2`}
                  >
                    {selectedRule.category}
                  </span>
                  <p className="text-sm text-slate-700 mt-1">{selectedRule.description}</p>
                </div>

                {/* Logic */}
                <Card className="p-4 bg-slate-50 border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Code2 className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Detection Logic
                    </h4>
                  </div>
                  <p className="text-sm text-slate-800 font-mono bg-white px-3 py-2 rounded border">
                    {selectedRule.details.logic}
                  </p>
                </Card>

                {/* Inputs / Output */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                      Inputs
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedRule.inputs.map((input) => (
                        <span
                          key={input}
                          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-700 border border-blue-200"
                        >
                          {input}
                        </span>
                      ))}
                    </div>
                  </Card>
                  <Card className="p-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                      Output
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                      {selectedRule.output}
                    </span>
                  </Card>
                </div>

                {/* Required Fields */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Required Fields
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRule.details.required_fields.map((field) => (
                      <span
                        key={field}
                        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </Card>

                {/* False Positive Notes */}
                <Card className="p-4 border-amber-200 bg-amber-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                      False Positive Notes
                    </h4>
                  </div>
                  <ul className="space-y-1.5">
                    {selectedRule.details.false_positive_notes.map((note) => (
                      <li key={note} className="text-sm text-amber-800 flex items-start gap-2">
                        <span className="text-amber-400 mt-1">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Example */}
                <Card className="p-4 border-blue-200 bg-blue-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                      Example Scenario
                    </h4>
                  </div>
                  <p className="text-sm text-blue-800">{selectedRule.details.example}</p>
                </Card>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Add New Rule Dialog ─── */}
      <Dialog open={addRuleOpen} onOpenChange={setAddRuleOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Add New Rule
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Rule ID *</label>
                <Input
                  placeholder="e.g. R-CUST-01"
                  value={newRule.rule_id}
                  onChange={(e) => setNewRule((prev) => ({ ...prev, rule_id: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Rule Name *</label>
                <Input
                  placeholder="e.g. Late challan detection"
                  value={newRule.rule_name}
                  onChange={(e) => setNewRule((prev) => ({ ...prev, rule_name: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Description</label>
              <textarea
                className="w-full mt-1 border border-slate-200 rounded-md p-2 text-sm"
                rows={2}
                placeholder="Describe what this rule detects..."
                value={newRule.description}
                onChange={(e) => setNewRule((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Category</label>
                <Select
                  value={newRule.category}
                  onValueChange={(v) => setNewRule((prev) => ({ ...prev, category: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Payable vs Paid Gap",
                      "Payment Integrity",
                      "Challan Delay",
                      "Prohibited Land",
                      "Data Completeness",
                      "Market Value",
                      "Exemption",
                    ].map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Severity</label>
                <Select
                  value={newRule.severity}
                  onValueChange={(v) =>
                    setNewRule((prev) => ({ ...prev, severity: v as "High" | "Medium" | "Low" }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Phase</label>
                <Select
                  value={newRule.phase}
                  onValueChange={(v) =>
                    setNewRule((prev) => ({ ...prev, phase: v as "Phase 1" | "Phase 2 Enhanced" }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Phase 1">Phase 1</SelectItem>
                    <SelectItem value="Phase 2 Enhanced">Phase 2 Enhanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Detection Logic</label>
              <textarea
                className="w-full mt-1 border border-slate-200 rounded-md p-2 text-sm font-mono"
                rows={2}
                placeholder="e.g. Flag when SUM(CASH_PAID.AMOUNT) < SUM(TRAN_MAJOR.*PAYABLE)"
                value={newRule.details.logic}
                onChange={(e) =>
                  setNewRule((prev) => ({
                    ...prev,
                    details: { ...prev.details, logic: e.target.value },
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Inputs (comma-separated)
                </label>
                <Input
                  placeholder="e.g. TRAN_MAJOR, CASH_PAID"
                  value={newRule.inputs.join(", ")}
                  onChange={(e) =>
                    setNewRule((prev) => ({
                      ...prev,
                      inputs: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Output Signal</label>
                <Input
                  placeholder="e.g. RevenueGap + Impact"
                  value={newRule.output}
                  onChange={(e) => setNewRule((prev) => ({ ...prev, output: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Required Fields (comma-separated)
              </label>
              <Input
                placeholder="e.g. TRAN_MAJOR.SD_PAYABLE, CASH_PAID.AMOUNT"
                value={newRule.details.required_fields.join(", ")}
                onChange={(e) =>
                  setNewRule((prev) => ({
                    ...prev,
                    details: {
                      ...prev.details,
                      required_fields: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  }))
                }
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                False Positive Notes (one per line)
              </label>
              <textarea
                className="w-full mt-1 border border-slate-200 rounded-md p-2 text-sm"
                rows={2}
                placeholder="One note per line..."
                value={newRule.details.false_positive_notes.join("\n")}
                onChange={(e) =>
                  setNewRule((prev) => ({
                    ...prev,
                    details: {
                      ...prev.details,
                      false_positive_notes: e.target.value.split("\n").filter(Boolean),
                    },
                  }))
                }
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Example Scenario</label>
              <textarea
                className="w-full mt-1 border border-slate-200 rounded-md p-2 text-sm"
                rows={2}
                placeholder="Describe an example trigger scenario..."
                value={newRule.details.example}
                onChange={(e) =>
                  setNewRule((prev) => ({
                    ...prev,
                    details: { ...prev.details, example: e.target.value },
                  }))
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={newRule.enabled}
                onCheckedChange={(checked) => setNewRule((prev) => ({ ...prev, enabled: checked }))}
              />
              <label className="text-sm text-slate-700">Enable rule immediately</label>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setAddRuleOpen(false);
                setNewRule({ ...defaultNewRule });
              }}
            >
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAddRule}>
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RevenueLeakageShell>
  );
}
