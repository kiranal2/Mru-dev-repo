"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { direction: "up" | "down"; label: string };
  subtitle?: string;
  className?: string;
}

export function KpiCard({ label, value, icon, trend, subtitle, className }: KpiCardProps) {
  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 p-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 mt-1 text-[11px] font-medium",
          trend.direction === "up" ? "text-emerald-600" : "text-red-600"
        )}>
          {trend.direction === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend.label}
        </div>
      )}
      {subtitle && <div className="text-[11px] text-slate-400 mt-1">{subtitle}</div>}
    </div>
  );
}
