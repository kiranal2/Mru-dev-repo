"use client";

import { useEffect, useMemo, useState } from "react";
import { RevenueLeakageShell } from "@/components/revenue-leakage/revenue-leakage-shell";
import { revenueLeakageApi } from "@/lib/revenue-leakage/revenueLeakageApi";
import { AdminData, RuleCatalogItem, LeakageCase } from "@/lib/revenue-leakage/types";
import { formatINR } from "@/lib/revenue-leakage/formatINR";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useMenuVisibility, MenuVisibility } from "@/lib/revenue-leakage/menuVisibilityContext";
import {
  Activity,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  Play,
  RefreshCw,
  Shield,
  Users,
  Building2,
  FileText,
  AlertTriangle,
  XCircle,
} from "lucide-react";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ────────────────────────────────────────────────────────────────
// Tab 1: System Health
// ────────────────────────────────────────────────────────────────
function SystemHealthTab({ admin, rules }: { admin: AdminData; rules: RuleCatalogItem[] }) {
  const enabledRules = rules.filter((r) => r.enabled).length;

  const handleRunNow = async () => {
    await revenueLeakageApi.runDetection();
    toast.success("Detection run started");
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-slate-500">System Status</span>
          </div>
          <Badge
            className={
              admin.systemHealth.status === "Healthy"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }
          >
            {admin.systemHealth.status}
          </Badge>
          <p className="text-[10px] text-slate-400 mt-1">Uptime: {admin.systemHealth.uptime}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-slate-500">Last Detection Run</span>
          </div>
          <p className="text-lg font-semibold text-slate-900">
            {timeAgo(admin.systemHealth.lastRun)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {formatDateTime(admin.systemHealth.lastRun)}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-violet-600" />
            <span className="text-xs text-slate-500">Rules Active</span>
          </div>
          <p className="text-lg font-semibold text-slate-900">
            {enabledRules} / {rules.length}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">{rules.length - enabledRules} disabled</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Database className="h-4 w-4 text-teal-600" />
            <span className="text-xs text-slate-500">Data Sync Status</span>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800">Healthy</Badge>
          <p className="text-[10px] text-slate-400 mt-1">
            Last sync: {timeAgo(admin.systemHealth.lastSync)}
          </p>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleRunNow}>
            <Play className="h-3.5 w-3.5 mr-1.5" /> Run Detection Now
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success("Data refresh initiated")}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh Data
          </Button>
        </div>
      </Card>

      {/* Data Sources */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Data Sources</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Last Sync</th>
                <th className="pb-2 font-medium text-right">Records</th>
              </tr>
            </thead>
            <tbody>
              {admin.dataSources.map((ds) => (
                <tr key={ds.id} className="border-b border-slate-50">
                  <td className="py-2 text-slate-700">{ds.name}</td>
                  <td className="py-2 text-slate-500 text-xs">{ds.type}</td>
                  <td className="py-2">
                    <Badge
                      variant="outline"
                      className={
                        ds.status === "Connected"
                          ? "border-emerald-200 text-emerald-700"
                          : "border-red-200 text-red-700"
                      }
                    >
                      {ds.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-slate-500 text-xs">{formatDateTime(ds.last_sync)}</td>
                  <td className="py-2 text-right text-slate-700">
                    {ds.records.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detection Run History */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Detection Run History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500">
                <th className="pb-2 font-medium">Timestamp</th>
                <th className="pb-2 font-medium">Duration</th>
                <th className="pb-2 font-medium">Cases Found</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {admin.detectionHistory.map((run) => (
                <tr key={run.id} className="border-b border-slate-50">
                  <td className="py-2 text-slate-700">{formatDateTime(run.started_at)}</td>
                  <td className="py-2 text-slate-500">
                    {run.duration_sec > 0
                      ? `${Math.floor(run.duration_sec / 60)}m ${run.duration_sec % 60}s`
                      : "—"}
                  </td>
                  <td className="py-2 text-slate-700">{run.cases_found}</td>
                  <td className="py-2">
                    <Badge
                      variant="outline"
                      className={
                        run.status === "Completed"
                          ? "border-emerald-200 text-emerald-700"
                          : run.status === "Running"
                            ? "border-blue-200 text-blue-700"
                            : "border-red-200 text-red-700"
                      }
                    >
                      {run.status === "Completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {run.status === "Failed" && <XCircle className="h-3 w-3 mr-1" />}
                      {run.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Tab 2: Rules Engine
// ────────────────────────────────────────────────────────────────
function RulesEngineTab({ rules }: { rules: RuleCatalogItem[] }) {
  const [ruleToggles, setRuleToggles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const toggles: Record<string, boolean> = {};
    rules.forEach((r) => {
      toggles[r.rule_id] = r.enabled;
    });
    setRuleToggles(toggles);
  }, [rules]);

  const groupedRules = useMemo(() => {
    const groups: Record<string, RuleCatalogItem[]> = {};
    rules.forEach((rule) => {
      if (!groups[rule.category]) groups[rule.category] = [];
      groups[rule.category].push(rule);
    });
    return groups;
  }, [rules]);

  const enabledCount = Object.values(ruleToggles).filter(Boolean).length;
  const disabledCount = rules.length - enabledCount;
  const phaseGroups = rules.reduce(
    (acc, r) => {
      acc[r.phase] = (acc[r.phase] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const categories = [
    { key: "Revenue Gap", label: "Revenue Gap Rules" },
    { key: "Challan Delay", label: "Challan Delay Rules" },
    { key: "Prohibited Land", label: "Prohibited Land Rules" },
    { key: "Valuation", label: "Market Value Rules" },
    { key: "Exemption", label: "Exemption Rules" },
    { key: "Compliance", label: "Compliance Rules" },
  ];

  const handleToggleRule = (ruleId: string, checked: boolean) => {
    setRuleToggles((prev) => ({ ...prev, [ruleId]: checked }));
    revenueLeakageApi.toggleRule(ruleId, checked);
    toast.success(`Rule ${ruleId} ${checked ? "enabled" : "disabled"}`);
  };

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-xs text-slate-500">Total Rules</p>
          <p className="text-xl font-bold text-slate-900">{rules.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-slate-500">Enabled</p>
          <p className="text-xl font-bold text-emerald-700">{enabledCount}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-slate-500">Disabled</p>
          <p className="text-xl font-bold text-red-600">{disabledCount}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-slate-500">By Phase</p>
          <div className="flex gap-2 mt-1">
            {Object.entries(phaseGroups).map(([phase, count]) => (
              <Badge key={phase} variant="secondary" className="text-[10px]">
                {phase}: {count}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      {/* Category toggles */}
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Category Toggles</h3>
        {categories.map((cat) => {
          const catRules = rules.filter((r) =>
            r.category.toLowerCase().includes(cat.key.toLowerCase())
          );
          if (catRules.length === 0) return null;
          const allEnabled = catRules.every((r) => ruleToggles[r.rule_id]);
          return (
            <div key={cat.key} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">
                {cat.label} <span className="text-xs text-slate-400">({catRules.length})</span>
              </span>
              <Switch
                checked={allEnabled}
                onCheckedChange={(checked) => {
                  catRules.forEach((r) => handleToggleRule(r.rule_id, checked));
                }}
              />
            </div>
          );
        })}
      </Card>

      {/* Individual Rules */}
      <Card className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Individual Rule Controls</h3>
        {Object.entries(groupedRules).map(([category, categoryRules]) => (
          <div key={category}>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {category}
            </h4>
            <div className="space-y-1">
              {categoryRules.map((rule) => (
                <div
                  key={rule.rule_id}
                  className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500 w-20">{rule.rule_id}</span>
                    <span className="text-sm text-slate-700">{rule.rule_name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        rule.severity === "High"
                          ? "border-red-200 text-red-700"
                          : rule.severity === "Medium"
                            ? "border-amber-200 text-amber-700"
                            : "border-emerald-200 text-emerald-700"
                      }`}
                    >
                      {rule.severity}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {rule.phase}
                    </Badge>
                  </div>
                  <Switch
                    checked={ruleToggles[rule.rule_id] ?? rule.enabled}
                    onCheckedChange={(checked) => handleToggleRule(rule.rule_id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </Card>

      {/* Locked System Rules */}
      <Card className="p-4 space-y-2 border border-amber-200 bg-amber-50">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-amber-800">Locked System Rules</h3>
          <Badge variant="secondary">Locked</Badge>
        </div>
        <p className="text-xs text-amber-700">Include only CASH_DET.ACC_CANC = &apos;A&apos;.</p>
        <p className="text-xs text-amber-700">Do not use CASH_DET.STATUS (null).</p>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Tab 3: Thresholds & Scoring
// ────────────────────────────────────────────────────────────────
function ThresholdsTab() {
  const [gapThreshold, setGapThreshold] = useState("10000");
  const [gapPercent, setGapPercent] = useState("5");
  const [challanDelay, setChallanDelay] = useState("7");

  const drrBands = [
    { label: "Critical", range: "< 0.50", color: "bg-red-100 text-red-800" },
    { label: "High", range: "< 0.70", color: "bg-orange-100 text-orange-800" },
    { label: "Medium", range: "< 0.85", color: "bg-amber-100 text-amber-800" },
    { label: "Watch", range: "< 0.95", color: "bg-yellow-100 text-yellow-800" },
    { label: "Normal", range: ">= 0.95", color: "bg-emerald-100 text-emerald-800" },
  ];

  const scoreWeights = [
    { component: "Revenue Gap", maxScore: 35 },
    { component: "Challan Delay", maxScore: 25 },
    { component: "Prohibited Land", maxScore: 25 },
    { component: "MV Deviation", maxScore: 35 },
    { component: "Exemption Anomaly", maxScore: 25 },
  ];

  const riskLevels = [
    { level: "High", threshold: ">= 45", color: "bg-red-100 text-red-800" },
    { level: "Medium", threshold: ">= 20", color: "bg-amber-100 text-amber-800" },
    { level: "Low", threshold: "< 20", color: "bg-emerald-100 text-emerald-800" },
  ];

  const slaBuckets = [
    { bucket: "0-7 days", target: "7 days" },
    { bucket: "8-14 days", target: "14 days" },
    { bucket: "15-30 days", target: "30 days" },
    { bucket: "30+ days", target: "Escalation" },
  ];

  const valuationSlabs = [
    { slab: "Low", range: "< ₹10L" },
    { slab: "Medium", range: "₹10L – ₹50L" },
    { slab: "High", range: "₹50L – ₹2Cr" },
    { slab: "Premium", range: ">= ₹2Cr" },
  ];

  return (
    <div className="space-y-4">
      {/* Detection Thresholds */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Detection Thresholds</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-500">Gap Amount (₹)</label>
            <Input value={gapThreshold} onChange={(e) => setGapThreshold(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Gap % of Payable</label>
            <Input value={gapPercent} onChange={(e) => setGapPercent(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Challan Delay (days)</label>
            <Input value={challanDelay} onChange={(e) => setChallanDelay(e.target.value)} />
          </div>
        </div>
      </Card>

      {/* DRR Severity Bands */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">DRR Severity Bands</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500">
                <th className="pb-2 font-medium">Severity</th>
                <th className="pb-2 font-medium">DRR Range</th>
              </tr>
            </thead>
            <tbody>
              {drrBands.map((b) => (
                <tr key={b.label} className="border-b border-slate-50">
                  <td className="py-2">
                    <Badge className={b.color}>{b.label}</Badge>
                  </td>
                  <td className="py-2 text-slate-700">{b.range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Score Weights */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Risk Score Weights</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500">
                <th className="pb-2 font-medium">Component</th>
                <th className="pb-2 font-medium text-right">Max Score</th>
              </tr>
            </thead>
            <tbody>
              {scoreWeights.map((w) => (
                <tr key={w.component} className="border-b border-slate-50">
                  <td className="py-2 text-slate-700">{w.component}</td>
                  <td className="py-2 text-right font-mono text-slate-900">{w.maxScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Risk Level Thresholds */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Risk Level Thresholds</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500">
                <th className="pb-2 font-medium">Level</th>
                <th className="pb-2 font-medium">Score Threshold</th>
              </tr>
            </thead>
            <tbody>
              {riskLevels.map((l) => (
                <tr key={l.level} className="border-b border-slate-50">
                  <td className="py-2">
                    <Badge className={l.color}>{l.level}</Badge>
                  </td>
                  <td className="py-2 text-slate-700">{l.threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SLA Configuration */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">SLA Configuration</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500">
                <th className="pb-2 font-medium">Ageing Bucket</th>
                <th className="pb-2 font-medium">Target</th>
              </tr>
            </thead>
            <tbody>
              {slaBuckets.map((s) => (
                <tr key={s.bucket} className="border-b border-slate-50">
                  <td className="py-2 text-slate-700">{s.bucket}</td>
                  <td className="py-2 text-slate-700">{s.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Valuation Slabs */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Valuation Slabs</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500">
                <th className="pb-2 font-medium">Slab</th>
                <th className="pb-2 font-medium">Range</th>
              </tr>
            </thead>
            <tbody>
              {valuationSlabs.map((v) => (
                <tr key={v.slab} className="border-b border-slate-50">
                  <td className="py-2 text-slate-700">{v.slab}</td>
                  <td className="py-2 text-slate-700">{v.range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Thresholds saved")}>Save Thresholds</Button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Tab 4: User Management
// ────────────────────────────────────────────────────────────────
function UserManagementTab({ admin }: { admin: AdminData }) {
  const { users } = admin;
  const activeCount = users.filter((u) => u.status === "Active").length;
  const adminCount = users.filter((u) => u.role === "Admin").length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-slate-500">Total Users</p>
          <p className="text-xl font-bold text-slate-900">{users.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-slate-500">Active</p>
          <p className="text-xl font-bold text-emerald-700">{activeCount}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-slate-500">Admins</p>
          <p className="text-xl font-bold text-violet-700">{adminCount}</p>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">System Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium text-right">Cases Assigned</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50">
                  <td className="py-2 font-medium text-slate-900">{u.name}</td>
                  <td className="py-2">
                    <Badge
                      variant="outline"
                      className={
                        u.role === "Admin"
                          ? "border-violet-200 text-violet-700"
                          : u.role === "Analyst"
                            ? "border-blue-200 text-blue-700"
                            : "border-slate-200 text-slate-600"
                      }
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td className="py-2 text-slate-500 text-xs">{u.email}</td>
                  <td className="py-2 text-right text-slate-700">{u.cases_assigned}</td>
                  <td className="py-2">
                    <Badge
                      variant="outline"
                      className={
                        u.status === "Active"
                          ? "border-emerald-200 text-emerald-700"
                          : "border-slate-200 text-slate-500"
                      }
                    >
                      {u.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-slate-500 text-xs">{formatDateTime(u.last_active)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Tab 5: Office Registry
// ────────────────────────────────────────────────────────────────
function OfficeRegistryTab({ cases }: { cases: LeakageCase[] }) {
  const officeMap = useMemo(() => {
    const map = new Map<
      string,
      {
        sr_code: string;
        sr_name: string;
        district: string;
        zone: string;
        totalCases: number;
        totalGap: number;
      }
    >();
    cases.forEach((c) => {
      const key = c.office.SR_CODE;
      const existing = map.get(key);
      if (existing) {
        existing.totalCases += 1;
        existing.totalGap += c.gap_inr;
      } else {
        map.set(key, {
          sr_code: c.office.SR_CODE,
          sr_name: c.office.SR_NAME,
          district: c.office.district,
          zone: c.office.zone,
          totalCases: 1,
          totalGap: c.gap_inr,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalGap - a.totalGap);
  }, [cases]);

  const districts = new Set(officeMap.map((o) => o.district));
  const zones = new Set(officeMap.map((o) => o.zone));

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-slate-500">Total Offices</p>
          <p className="text-xl font-bold text-slate-900">{officeMap.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-slate-500">Districts Covered</p>
          <p className="text-xl font-bold text-slate-900">{districts.size}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-slate-500">Zones</p>
          <p className="text-xl font-bold text-slate-900">{zones.size}</p>
        </Card>
      </div>

      {/* Office Table */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Registered SRO Offices</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500">
                <th className="pb-2 font-medium">SR Code</th>
                <th className="pb-2 font-medium">Office Name</th>
                <th className="pb-2 font-medium">District</th>
                <th className="pb-2 font-medium">Zone</th>
                <th className="pb-2 font-medium text-right">Total Cases</th>
                <th className="pb-2 font-medium text-right">Total Gap</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {officeMap.map((o) => (
                <tr key={o.sr_code} className="border-b border-slate-50">
                  <td className="py-2 font-mono text-xs text-slate-500">{o.sr_code}</td>
                  <td className="py-2 text-slate-700">{o.sr_name}</td>
                  <td className="py-2 text-slate-500">{o.district}</td>
                  <td className="py-2 text-slate-500">{o.zone}</td>
                  <td className="py-2 text-right text-slate-700">{o.totalCases}</td>
                  <td className="py-2 text-right font-medium text-slate-900">
                    {formatINR(o.totalGap)}
                  </td>
                  <td className="py-2">
                    <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                      Active
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Tab 6: Audit Log
// ────────────────────────────────────────────────────────────────
function AuditLogTab({ admin }: { admin: AdminData }) {
  const categoryIcons: Record<string, typeof Activity> = {
    system: Activity,
    rule: Shield,
    user: Users,
    case: FileText,
    export: FileText,
  };

  const categoryColors: Record<string, string> = {
    system: "bg-blue-100 text-blue-700",
    rule: "bg-violet-100 text-violet-700",
    user: "bg-teal-100 text-teal-700",
    case: "bg-amber-100 text-amber-700",
    export: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500">
                <th className="pb-2 font-medium">Timestamp</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Actor</th>
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {admin.auditLog.map((entry) => {
                const Icon = categoryIcons[entry.category] || Activity;
                return (
                  <tr key={entry.id} className="border-b border-slate-50">
                    <td className="py-2 text-slate-500 text-xs whitespace-nowrap">
                      {formatDateTime(entry.timestamp)}
                    </td>
                    <td className="py-2">
                      <Badge
                        className={categoryColors[entry.category] || "bg-slate-100 text-slate-700"}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {entry.category}
                      </Badge>
                    </td>
                    <td className="py-2 text-slate-700 whitespace-nowrap">{entry.actor}</td>
                    <td className="py-2 font-medium text-slate-900 whitespace-nowrap">
                      {entry.action}
                    </td>
                    <td className="py-2 text-slate-500 text-xs">{entry.detail}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Tab 7: Menu Visibility
// ────────────────────────────────────────────────────────────────
const menuItems: { key: keyof MenuVisibility; label: string; description: string }[] = [
  {
    key: "insights",
    label: "Insights",
    description: "Analytics and trend analysis for leakage patterns",
  },
  {
    key: "patterns",
    label: "Patterns",
    description: "Recurring leakage pattern detection and grouping",
  },
  { key: "rules", label: "Rules", description: "Rule catalog for automated leakage detection" },
];

function MenuVisibilityTab() {
  const { visibility, setVisibility } = useMenuVisibility();

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Navigation Menu Visibility</h3>
        <p className="text-xs text-slate-500 mb-4">
          Control which tabs are visible in the navigation bar. Overview, Cases, Exports, and Admin
          are always visible.
        </p>
        <div className="space-y-3">
          {menuItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
              <Switch
                checked={visibility[item.key]}
                onCheckedChange={(checked) => setVisibility(item.key, checked)}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Main Admin Page
// ────────────────────────────────────────────────────────────────
export default function RevenueLeakageAdminPage() {
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [rules, setRules] = useState<RuleCatalogItem[]>([]);
  const [cases, setCases] = useState<LeakageCase[]>([]);

  useEffect(() => {
    revenueLeakageApi.getAdminData().then(setAdmin);
    revenueLeakageApi.getRules().then(setRules);
    revenueLeakageApi.getCases().then(setCases);
  }, []);

  if (!admin) {
    return (
      <RevenueLeakageShell subtitle="System Administration">
        <div className="px-6 py-8 text-center text-sm text-slate-500">Loading...</div>
      </RevenueLeakageShell>
    );
  }

  return (
    <RevenueLeakageShell subtitle="System Administration">
      <div className="px-6 py-4">
        <Tabs defaultValue="health">
          <TabsList className="mb-4">
            <TabsTrigger value="health" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" /> System Health
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Rules Engine
            </TabsTrigger>
            <TabsTrigger value="thresholds" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Thresholds
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> Users
            </TabsTrigger>
            <TabsTrigger value="offices" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Office Registry
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Audit Log
            </TabsTrigger>
            <TabsTrigger value="menu-visibility" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Menu Visibility
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health">
            <SystemHealthTab admin={admin} rules={rules} />
          </TabsContent>
          <TabsContent value="rules">
            <RulesEngineTab rules={rules} />
          </TabsContent>
          <TabsContent value="thresholds">
            <ThresholdsTab />
          </TabsContent>
          <TabsContent value="users">
            <UserManagementTab admin={admin} />
          </TabsContent>
          <TabsContent value="offices">
            <OfficeRegistryTab cases={cases} />
          </TabsContent>
          <TabsContent value="audit">
            <AuditLogTab admin={admin} />
          </TabsContent>
          <TabsContent value="menu-visibility">
            <MenuVisibilityTab />
          </TabsContent>
        </Tabs>
      </div>
    </RevenueLeakageShell>
  );
}
