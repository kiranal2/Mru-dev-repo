"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { RevenueLeakageShell } from "@/components/revenue-leakage/RevenueLeakageShell";
import { revenueLeakageApi } from "@/lib/revenue-leakage/revenueLeakageApi";
import { RuleCatalogItem } from "@/lib/revenue-leakage/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function RevenueLeakageSettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [rules, setRules] = useState<RuleCatalogItem[]>([]);
  const [ruleToggles, setRuleToggles] = useState<Record<string, boolean>>({});
  const [gapThreshold, setGapThreshold] = useState("10000");
  const [gapPercent, setGapPercent] = useState("5");
  const [challanDelay, setChallanDelay] = useState("7");
  const [riskBands, setRiskBands] = useState("High ≥ 80, Medium ≥ 55");

  useEffect(() => {
    revenueLeakageApi.getRules().then((data) => {
      setRules(data);
      const toggles: Record<string, boolean> = {};
      data.forEach((rule) => {
        toggles[rule.rule_id] = rule.enabled;
      });
      setRuleToggles(toggles);
    });
  }, []);

  const groupedRules = useMemo(() => {
    const groups: Record<string, RuleCatalogItem[]> = {};
    rules.forEach((rule) => {
      if (!groups[rule.category]) groups[rule.category] = [];
      groups[rule.category].push(rule);
    });
    return groups;
  }, [rules]);

  const handleToggleRule = (ruleId: string, checked: boolean) => {
    setRuleToggles((prev) => ({ ...prev, [ruleId]: checked }));
  };

  const handleSave = () => {
    toast.success("Settings saved");
  };

  const handleRunNow = async () => {
    await revenueLeakageApi.runDetection();
    toast.success("Detection run started");
  };

  if (!isAdmin) {
    return (
      <RevenueLeakageShell subtitle="Admin-only configuration">
        <div className="px-6 py-8">
          <Card className="p-6 text-center">
            <h2 className="text-lg font-semibold text-slate-900">Access Denied</h2>
            <p className="text-sm text-slate-500 mt-2">
              You do not have permission to view settings.
            </p>
          </Card>
        </div>
      </RevenueLeakageShell>
    );
  }

  return (
    <RevenueLeakageShell subtitle="Admin-only configuration">
      <div className="px-6 py-4 space-y-4">
        <Card className="p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Thresholds</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Gap threshold amount (₹)</label>
              <Input value={gapThreshold} onChange={(e) => setGapThreshold(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Gap threshold % of payable</label>
              <Input value={gapPercent} onChange={(e) => setGapPercent(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Challan delay threshold (days)</label>
              <Input value={challanDelay} onChange={(e) => setChallanDelay(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-500">
                Risk score bands (High {">="} X, Medium {">="} Y)
              </label>
              <Input value={riskBands} onChange={(e) => setRiskBands(e.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Category Toggles</h3>
          <div className="flex items-center justify-between text-sm">
            <span>Enable Revenue Gap Rules</span>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Enable Challan Delay Rules</span>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Enable Prohibited Land Rules</span>
            <Switch defaultChecked />
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Individual Rule Controls</h3>
          {Object.entries(groupedRules).map(([category, categoryRules]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {category}
              </h4>
              <div className="space-y-2">
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
          {!rules.length && <p className="text-xs text-slate-500">Loading rules...</p>}
        </Card>

        <Card className="p-4 space-y-2 border border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-amber-800">Locked System Rules</h3>
            <Badge variant="secondary">Locked</Badge>
          </div>
          <p className="text-xs text-amber-700">Include only CASH_DET.ACC_CANC = &apos;A&apos;.</p>
          <p className="text-xs text-amber-700">Do not use CASH_DET.STATUS (null).</p>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Run Schedule</h3>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleRunNow}>
              Run Now
            </Button>
            <Button size="sm" variant="outline" disabled>
              Nightly Batch (Coming Soon)
            </Button>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </RevenueLeakageShell>
  );
}
