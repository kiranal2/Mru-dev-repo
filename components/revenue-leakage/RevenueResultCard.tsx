"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
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
  Expand,
  Download,
  Pin,
  Star,
  FileText,
  Eye,
  Clock,
  AlertTriangle,
  TrendingDown,
  Shield,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { formatINR } from "@/lib/revenue-leakage/formatINR";
import { LeakageSignal, RiskLevel } from "@/lib/revenue-leakage/types";
import type {
  RevenueSummaryData,
  RevenueResultRow,
} from "@/lib/revenue-leakage/revenueIntelligenceChat";

// ── Display Constants (same as cases page) ─────────────────────────

const riskBadge: Record<RiskLevel, string> = {
  High: "bg-red-600 text-white border-red-700",
  Medium: "bg-amber-500 text-white border-amber-600",
  Low: "bg-emerald-600 text-white border-emerald-700",
};

const signalLabels: Record<LeakageSignal, string> = {
  RevenueGap: "Revenue Gap",
  ChallanDelay: "Challan Delay",
  ExemptionRisk: "Exemption Risk",
  MarketValueRisk: "Market Value",
  ProhibitedLand: "Prohibited Land",
  DataIntegrity: "Data Integrity",
  HolidayFee: "Holiday Fee",
};

const signalColor: Record<LeakageSignal, string> = {
  RevenueGap: "bg-red-100 text-red-800 border-red-300",
  ChallanDelay: "bg-orange-100 text-orange-800 border-orange-300",
  ExemptionRisk: "bg-purple-100 text-purple-800 border-purple-300",
  MarketValueRisk: "bg-sky-100 text-sky-800 border-sky-300",
  ProhibitedLand: "bg-pink-100 text-pink-800 border-pink-300",
  DataIntegrity: "bg-slate-200 text-slate-800 border-slate-400",
  HolidayFee: "bg-amber-100 text-amber-800 border-amber-300",
};

// ── Component ──────────────────────────────────────────────────────

interface RevenueResultCardProps {
  summary: RevenueSummaryData;
  meta: { as_of: string; row_count: number; duration_ms?: number };
  rows: RevenueResultRow[];
  filters: Record<string, string>;
}

export function RevenueResultCard({ summary, meta, rows, filters }: RevenueResultCardProps) {
  const router = useRouter();
  const [isExpanding, setIsExpanding] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────

  const handleExpand = () => {
    setIsExpanding(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    // Show loading animation then navigate
    setTimeout(() => {
      router.push(`/workbench/revenue-leakage/cases?${params.toString()}`);
    }, 1800);
  };

  const handleCSVExport = () => {
    const headers = [
      "Case ID",
      "Office Code",
      "Office Name",
      "District",
      "Doc Type",
      "Reg Date",
      "Payable (INR)",
      "Paid (INR)",
      "Gap (INR)",
      "Risk",
      "Signals",
    ];
    const csvRows = rows.map((r) =>
      [
        r.case_id,
        r.office_code,
        r.office_name,
        r.district,
        r.doc_type,
        r.reg_date,
        r.payable_inr,
        r.paid_inr,
        r.gap_inr,
        r.risk_level,
        r.signals.map((s) => signalLabels[s]).join("; "),
      ].join(",")
    );

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-leakage-${meta.as_of}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ───────────────────────────────────────────────────────

  return (
    <Card className="mx-4 mb-4 overflow-hidden border-slate-200 relative">
      {/* Expand Loading Overlay */}
      {isExpanding && (
        <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-[3px] border-slate-200 border-t-[#6B7EF3] animate-spin" />
            <Expand className="absolute inset-0 m-auto h-4 w-4 text-[#6B7EF3]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">Loading Cases View</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Applying {Object.keys(filters).length} filter
              {Object.keys(filters).length !== 1 ? "s" : ""} to {meta.row_count} records...
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#6B7EF3] rounded-full animate-expand-progress" />
          </div>
          <style jsx>{`
            @keyframes expand-progress {
              0% {
                width: 0%;
              }
              30% {
                width: 45%;
              }
              60% {
                width: 70%;
              }
              80% {
                width: 88%;
              }
              100% {
                width: 100%;
              }
            }
            .animate-expand-progress {
              animation: expand-progress 1.8s ease-out forwards;
            }
          `}</style>
        </div>
      )}

      {/* Summary Tiles */}
      <div className="grid grid-cols-6 gap-0 border-b border-slate-100">
        <SummaryTile
          label="Total Registrations"
          value={summary.total_registrations.toLocaleString("en-IN")}
          icon={<FileText className="h-3 w-3 text-slate-400" />}
        />
        <SummaryTile
          label="Total Payable"
          value={formatINR(summary.total_payable)}
          icon={<TrendingDown className="h-3 w-3 text-slate-400" />}
        />
        <SummaryTile
          label="Total Paid"
          value={formatINR(summary.total_paid)}
          icon={<TrendingDown className="h-3 w-3 text-slate-400" />}
        />
        <SummaryTile
          label="Total Gap"
          value={formatINR(summary.total_gap)}
          icon={<AlertTriangle className="h-3 w-3 text-red-500" />}
          highlight
        />
        <SummaryTile
          label="High Risk Cases"
          value={summary.high_risk_count.toString()}
          icon={<Shield className="h-3 w-3 text-red-500" />}
          highlight={summary.high_risk_count > 0}
        />
        <SummaryTile
          label="Avg Confidence"
          value={`${summary.avg_confidence}%`}
          icon={<Eye className="h-3 w-3 text-slate-400" />}
        />
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{meta.row_count} records</span>
          {meta.duration_ms !== undefined && (
            <>
              <span className="text-slate-300">|</span>
              <Clock className="h-2.5 w-2.5" />
              <span>{meta.duration_ms}ms</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className={`h-6 text-[11px] gap-1 px-2 ${isExpanding ? "border-[#6B7EF3] text-[#6B7EF3] bg-[#EEF8FF]" : ""}`}
            onClick={handleExpand}
            disabled={isExpanding}
          >
            {isExpanding ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Expand className="h-3 w-3" />
            )}
            {isExpanding ? "Expanding..." : "Expand"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] gap-1 px-2"
            onClick={handleCSVExport}
          >
            <Download className="h-3 w-3" />
            Download
          </Button>
          <Button variant="outline" size="sm" className="h-6 text-[11px] gap-1 px-2">
            <Pin className="h-3 w-3" />
            Pin
          </Button>
          <Button variant="outline" size="sm" className="h-6 text-[11px] gap-1 px-2">
            <Star className="h-3 w-3" />
            Favorite
          </Button>
          <Button variant="outline" size="sm" className="h-6 text-[11px] gap-1 px-2">
            <Eye className="h-3 w-3" />
            Watchlist
          </Button>
        </div>
      </div>

      {/* Data Table — compact */}
      <div className="overflow-auto max-h-[320px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs font-semibold h-8 px-2 w-[28px]" />
              <TableHead className="text-xs font-semibold h-8 px-2">Case ID</TableHead>
              <TableHead className="text-xs font-semibold h-8 px-2">Office</TableHead>
              <TableHead className="text-xs font-semibold h-8 px-2">Doc Type</TableHead>
              <TableHead className="text-xs font-semibold h-8 px-2">Reg Date</TableHead>
              <TableHead className="text-xs font-semibold h-8 px-2 text-right">Payable</TableHead>
              <TableHead className="text-xs font-semibold h-8 px-2 text-right">Paid</TableHead>
              <TableHead className="text-xs font-semibold h-8 px-2 text-right">Gap</TableHead>
              <TableHead className="text-xs font-semibold h-8 px-2">Risk</TableHead>
              <TableHead className="text-xs font-semibold h-8 px-2">Signals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.case_id} className="cursor-pointer hover:bg-slate-50/80">
                <TableCell className="py-2 px-2 w-[28px]">
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </TableCell>
                <TableCell className="py-2 px-2 text-xs font-mono text-slate-700">
                  {row.case_id}
                </TableCell>
                <TableCell className="py-2 px-2 text-xs">
                  <div className="flex flex-col leading-none">
                    <span className="font-medium text-slate-800">{row.office_code}</span>
                    <span className="text-slate-400 text-[10px] mt-0.5">{row.office_name}</span>
                  </div>
                </TableCell>
                <TableCell className="py-2 px-2 text-xs text-slate-600 max-w-[120px] truncate">
                  {row.doc_type}
                </TableCell>
                <TableCell className="py-2 px-2 text-xs text-slate-600">{row.reg_date}</TableCell>
                <TableCell className="py-2 px-2 text-xs text-right font-mono text-slate-700">
                  {formatINR(row.payable_inr)}
                </TableCell>
                <TableCell className="py-2 px-2 text-xs text-right font-mono text-slate-700">
                  {formatINR(row.paid_inr)}
                </TableCell>
                <TableCell className="py-2 px-2 text-xs text-right font-mono">
                  <span
                    className={row.gap_inr > 0 ? "text-red-700 font-semibold" : "text-slate-500"}
                  >
                    {formatINR(row.gap_inr)}
                  </span>
                </TableCell>
                <TableCell className="py-2 px-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 border ${riskBadge[row.risk_level]}`}
                  >
                    {row.risk_level}
                  </Badge>
                </TableCell>
                <TableCell className="py-2 px-2">
                  <div className="flex flex-wrap gap-0.5 max-w-[180px]">
                    {row.signals.slice(0, 2).map((sig) => (
                      <Badge
                        key={sig}
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 border ${signalColor[sig]}`}
                      >
                        {signalLabels[sig]}
                      </Badge>
                    ))}
                    {row.signals.length > 2 && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 border-slate-300 text-slate-500"
                      >
                        +{row.signals.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer — View All Link */}
      {meta.row_count > rows.length && (
        <div className="border-t border-slate-100 px-3 py-1.5 bg-slate-50/30">
          <Button
            variant="link"
            size="sm"
            className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
            onClick={handleExpand}
            disabled={isExpanding}
          >
            {isExpanding ? "Loading cases..." : `View all ${meta.row_count} cases →`}
          </Button>
        </div>
      )}
    </Card>
  );
}

// ── Summary Tile ───────────────────────────────────────────────────

function SummaryTile({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="px-3 py-2 border-r border-slate-100 last:border-r-0">
      <div className="flex items-center gap-1 mb-0.5">
        {icon}
        <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className={`text-sm font-semibold ${highlight ? "text-red-700" : "text-slate-800"}`}>
        {value}
      </div>
    </div>
  );
}
