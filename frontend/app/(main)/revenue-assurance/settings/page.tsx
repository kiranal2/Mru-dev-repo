"use client";

import { useRevenueSettings } from "@/hooks/data/use-revenue-settings";
import { formatUSD } from "@/lib/data/utils/format-currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ShieldCheck,
  Settings2,
  DollarSign,
  Clock,
  Target,
  BarChart3,
} from "lucide-react";

// Enterprise pricing tier configuration
const PRICING_TIERS: Record<string, { minACV: number; maxACV: number; discountCeiling: number }> = {
  Enterprise: { minACV: 500000, maxACV: Infinity, discountCeiling: 35 },
  "Mid-Market": { minACV: 50000, maxACV: 499999, discountCeiling: 25 },
  SMB: { minACV: 0, maxACV: 49999, discountCeiling: 15 },
};

// Billing frequency rates
const BILLING_FREQUENCIES = [
  { frequency: "Annual (Prepaid)", adjustmentPct: 0, description: "Full contract value invoiced annually" },
  { frequency: "Annual (Arrears)", adjustmentPct: 2.0, description: "Invoiced at year-end with 2% premium" },
  { frequency: "Quarterly", adjustmentPct: 3.0, description: "Quarterly invoicing with 3% convenience premium" },
  { frequency: "Monthly", adjustmentPct: 5.0, description: "Monthly invoicing with 5% convenience premium" },
  { frequency: "Usage-Based", adjustmentPct: 0, description: "Metered consumption billed in arrears" },
];

// Revenue recognition rules
const RECOGNITION_RULES = [
  { type: "SaaS Subscription", method: "Ratably over contract term", standard: "ASC 606" },
  { type: "Professional Services (T&M)", method: "As services are delivered", standard: "ASC 606" },
  { type: "Professional Services (Fixed Fee)", method: "Percentage of completion", standard: "ASC 606" },
  { type: "License (Perpetual)", method: "At delivery / transfer of control", standard: "ASC 606" },
  { type: "License (Term)", method: "Ratably over license term", standard: "ASC 606" },
  { type: "Support & Maintenance", method: "Ratably over support period", standard: "ASC 606" },
  { type: "Training", method: "Upon delivery of training", standard: "ASC 606" },
  { type: "Hardware", method: "At shipment / delivery", standard: "ASC 606" },
];

// Detection thresholds
const THRESHOLDS = {
  minLeakageToFlag: 1000,
  highRiskScoreMin: 70,
  criticalRiskScoreMin: 85,
  maxBillingDelayDays: 30,
  discountDeviationPct: 5,
  slaTargetDays: 14,
  priceDriftPct: 3,
  meterGapToleranceHours: 2,
  renewalRateTolerancePct: 1,
  contractExpiryAlertDays: 90,
};

// Commission calculation parameters
const COMMISSION_RULES = [
  { dealType: "New Business", commissionPct: 10.0, accelerator: "1.5x above quota" },
  { dealType: "Expansion", commissionPct: 8.0, accelerator: "1.3x above quota" },
  { dealType: "Renewal", commissionPct: 4.0, accelerator: "1.2x above quota" },
  { dealType: "Multi-Year (2yr)", commissionPct: 12.0, accelerator: "1.5x above quota" },
  { dealType: "Multi-Year (3yr)", commissionPct: 14.0, accelerator: "1.5x above quota" },
  { dealType: "Channel / Partner", commissionPct: 6.0, accelerator: "None" },
];

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      <div className="h-64 bg-slate-200 rounded-lg animate-pulse" />
      <div className="h-64 bg-slate-200 rounded-lg animate-pulse" />
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="p-6">
      <Card className="p-6 text-center border-red-200 bg-red-50">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h2 className="text-lg font-semibold text-red-800">Error Loading Settings</h2>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </Card>
    </div>
  );
}

export default function RevenueAssuranceSettingsPage() {
  const { loading, error } = useRevenueSettings();

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            System configuration for the Enterprise Revenue Assurance engine
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1.5">
          <Settings2 className="w-3 h-3" />
          Read-Only
        </Badge>
      </div>

      <p className="text-xs text-slate-500">
        These parameters govern detection thresholds, pricing tiers, billing rules, and commission calculations.
        Contact your system administrator to modify these settings.
      </p>

      {/* Detection Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Detection Thresholds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Minimum Leakage to Flag</p>
              <p className="text-lg font-semibold">{formatUSD(THRESHOLDS.minLeakageToFlag)}</p>
              <p className="text-xs text-muted-foreground">
                Cases with leakage below this value are not flagged
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">High Risk Score Minimum</p>
              <p className="text-lg font-semibold">{THRESHOLDS.highRiskScoreMin}/100</p>
              <p className="text-xs text-muted-foreground">
                Threshold for high-risk classification
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Critical Risk Score Minimum</p>
              <p className="text-lg font-semibold">{THRESHOLDS.criticalRiskScoreMin}/100</p>
              <p className="text-xs text-muted-foreground">
                Threshold for critical-severity escalation
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Max Billing Delay</p>
              <p className="text-lg font-semibold">{THRESHOLDS.maxBillingDelayDays} days</p>
              <p className="text-xs text-muted-foreground">
                Delays beyond this trigger a billing anomaly alert
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Discount Deviation Tolerance</p>
              <p className="text-lg font-semibold">{THRESHOLDS.discountDeviationPct}%</p>
              <p className="text-xs text-muted-foreground">
                Discounts exceeding contracted rate by this amount are flagged
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">SLA Target</p>
              <p className="text-lg font-semibold">{THRESHOLDS.slaTargetDays} days</p>
              <p className="text-xs text-muted-foreground">
                Target resolution time for flagged cases
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Price Drift Threshold</p>
              <p className="text-lg font-semibold">{THRESHOLDS.priceDriftPct}%</p>
              <p className="text-xs text-muted-foreground">
                Price changes beyond this trigger drift detection
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Meter Gap Tolerance</p>
              <p className="text-lg font-semibold">{THRESHOLDS.meterGapToleranceHours} hrs</p>
              <p className="text-xs text-muted-foreground">
                Usage metering gaps beyond this trigger alerts
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Renewal Rate Tolerance</p>
              <p className="text-lg font-semibold">{THRESHOLDS.renewalRateTolerancePct}%</p>
              <p className="text-xs text-muted-foreground">
                Renewal pricing mismatch tolerance
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Contract Expiry Alert</p>
              <p className="text-lg font-semibold">{THRESHOLDS.contractExpiryAlertDays} days</p>
              <p className="text-xs text-muted-foreground">
                Alert window before contract expiration
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Customer Pricing Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Min ACV</TableHead>
                <TableHead className="text-right">Max ACV</TableHead>
                <TableHead className="text-right">Max Discount Ceiling</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(PRICING_TIERS).map(([tier, config]) => (
                <TableRow key={tier}>
                  <TableCell className="font-semibold">{tier}</TableCell>
                  <TableCell className="text-right">{formatUSD(config.minACV)}</TableCell>
                  <TableCell className="text-right">
                    {config.maxACV === Infinity ? "No limit" : formatUSD(config.maxACV)}
                  </TableCell>
                  <TableCell className="text-right">{config.discountCeiling}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Billing Frequencies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Billing Frequency Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Frequency</TableHead>
                <TableHead className="text-right">Adjustment (%)</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BILLING_FREQUENCIES.map((item) => (
                <TableRow key={item.frequency}>
                  <TableCell className="font-semibold">{item.frequency}</TableCell>
                  <TableCell className="text-right">
                    {item.adjustmentPct > 0 ? `+${item.adjustmentPct.toFixed(1)}%` : "--"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Revenue Recognition Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-600" />
            Revenue Recognition Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Revenue Type</TableHead>
                <TableHead>Recognition Method</TableHead>
                <TableHead>Standard</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RECOGNITION_RULES.map((rule) => (
                <TableRow key={rule.type}>
                  <TableCell className="font-semibold">{rule.type}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {rule.method}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {rule.standard}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Commission Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-4 h-4 text-pink-600" />
            Commission Calculation Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal Type</TableHead>
                <TableHead className="text-right">Base Commission (%)</TableHead>
                <TableHead>Accelerator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMMISSION_RULES.map((rule) => (
                <TableRow key={rule.dealType}>
                  <TableCell className="font-semibold">{rule.dealType}</TableCell>
                  <TableCell className="text-right">{rule.commissionPct.toFixed(1)}%</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {rule.accelerator}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Separator />

      <p className="text-xs text-muted-foreground">
        These values are configured at the system level and apply globally to all
        detection runs. Historical data may have been processed with different
        thresholds. Contact your administrator for change requests.
      </p>
    </div>
  );
}
