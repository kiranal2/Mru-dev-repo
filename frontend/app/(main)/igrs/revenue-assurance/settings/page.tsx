"use client";

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
import { formatINR } from "@/lib/data/utils/format-currency";
import { useIGRSSettings } from "@/hooks/data/use-igrs-settings";

export default function SettingsPage() {
  const { data: settings, loading, error } = useIGRSSettings();

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">Error loading settings: {error}</p>
      </div>
    );
  }

  // Extract settings data with fallbacks
  const stampDutyRates: Record<string, any> = (settings as any)?.stampDutyRates ?? {};
  const registrationFeeSlabs: any[] = (settings as any)?.registrationFeeSlabs ?? [];
  const thresholds = settings?.thresholds ?? {
    minGapInr: 0,
    highRiskScoreMin: 0,
    maxChallanDelayDays: 0,
    mvDeviationPct: 0,
    slaTargetDays: 0,
  };

  // Flatten stamp duty rates for display (JSON has nested category objects)
  const flatRates: Array<{ label: string; rate: number }> = [];
  Object.entries(stampDutyRates).forEach(([category, value]) => {
    if (typeof value === "number") {
      flatRates.push({ label: category, rate: value });
    } else if (typeof value === "object" && value !== null) {
      Object.entries(value as Record<string, any>).forEach(([subKey, subValue]) => {
        if (typeof subValue === "number" && subKey !== "description") {
          const label = `${category.replace(/([A-Z])/g, " $1").replace(/^./, (s: string) => s.toUpperCase())} - ${subKey.replace(/([A-Z])/g, " $1")}`;
          flatRates.push({ label, rate: subValue });
        }
      });
    }
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Badge variant="outline">Read-Only</Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        System configuration parameters for the IGRS Revenue Assurance engine.
        Contact your administrator to modify these settings.
      </p>

      {/* Stamp Duty Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Stamp Duty Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Type / Category</TableHead>
                <TableHead className="text-right">Rate (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flatRates.map((item) => (
                <TableRow key={item.label}>
                  <TableCell className="font-medium">{item.label}</TableCell>
                  <TableCell className="text-right">{item.rate.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Registration Fee Slabs */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Fee Slabs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Min Value (INR)</TableHead>
                <TableHead>Max Value (INR)</TableHead>
                <TableHead className="text-right">Fee (%)</TableHead>
                <TableHead className="text-right">Min Fee (INR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrationFeeSlabs.map((slab: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{formatINR(slab.minValueInr ?? slab.minValue ?? 0)}</TableCell>
                  <TableCell>
                    {slab.maxValueInr == null && slab.maxValue == null
                      ? "No limit"
                      : formatINR(slab.maxValueInr ?? slab.maxValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {(slab.feePercent ?? slab.feePct ?? 0).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {formatINR(slab.minFeeInr ?? slab.fixedFee ?? 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detection Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Detection Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Minimum Gap to Flag</p>
              <p className="text-lg font-semibold">
                {formatINR(thresholds.minGapInr)}
              </p>
              <p className="text-xs text-muted-foreground">
                Cases with gap below this value are not flagged
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                High Risk Score Minimum
              </p>
              <p className="text-lg font-semibold">
                {thresholds.highRiskScoreMin}/100
              </p>
              <p className="text-xs text-muted-foreground">
                Score threshold for high-risk classification
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Max Challan Delay
              </p>
              <p className="text-lg font-semibold">
                {thresholds.maxChallanDelayDays} days
              </p>
              <p className="text-xs text-muted-foreground">
                Delays beyond this trigger ChallanDelay signal
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                MV Deviation Threshold
              </p>
              <p className="text-lg font-semibold">
                {thresholds.mvDeviationPct}%
              </p>
              <p className="text-xs text-muted-foreground">
                Market value deviation above this raises MarketValueRisk
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">SLA Target</p>
              <p className="text-lg font-semibold">
                {thresholds.slaTargetDays} days
              </p>
              <p className="text-xs text-muted-foreground">
                Target resolution time for flagged cases
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <p className="text-xs text-muted-foreground">
        These values are configured at the system level and apply globally to all
        detection runs. Historical data may have been processed with different
        thresholds.
      </p>
    </div>
  );
}
