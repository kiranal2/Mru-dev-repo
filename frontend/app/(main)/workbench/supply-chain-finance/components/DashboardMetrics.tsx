"use client";

import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Truck,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FiltersService } from "../services/FiltersService";
import { MOCK_DASHBOARD_STATS } from "../mrp/mock-data";
import { cn } from "@/lib/utils";

type Props = {
  autoRefresh: boolean;
  onToggleRefresh: () => void;
};

export function DashboardMetrics({ autoRefresh, onToggleRefresh }: Props) {
  const { data: dashboardStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      try {
        const result = await FiltersService.getDashboardStats();
        return result.totalOpen > 0 ? result : MOCK_DASHBOARD_STATS;
      } catch {
        return MOCK_DASHBOARD_STATS;
      }
    },
    refetchInterval: false,
  });

  if (!dashboardStats) {
    return (
      <Card className="p-4">
        <div className="grid grid-cols-5 gap-6 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 bg-slate-200 rounded w-20 mb-2" />
              <div className="h-6 bg-slate-200 rounded w-14" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const cards = [
    {
      label: "Open Exceptions",
      value: dashboardStats.totalOpen,
      change: dashboardStats.openChange,
      icon: AlertTriangle,
      iconColor: "text-red-500",
      valueSuffix: "",
    },
    {
      label: "Avg Resolution",
      value: dashboardStats.avgResolutionTime,
      change: dashboardStats.resolutionTimeChange,
      icon: Clock,
      iconColor: "text-blue-500",
      valueSuffix: "d",
      inverse: true,
    },
    {
      label: "Response Rate",
      value: dashboardStats.supplierResponseRate,
      change: dashboardStats.responseRateChange,
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      valueSuffix: "%",
    },
    {
      label: "On-Time Delivery",
      value: dashboardStats.onTimeDeliveryRate,
      change: dashboardStats.deliveryRateChange,
      icon: Truck,
      iconColor: "text-teal-500",
      valueSuffix: "%",
    },
    {
      label: "Auto-Clear Rate",
      value: dashboardStats.autoClearPercent,
      change: dashboardStats.autoClearChange,
      icon: Zap,
      iconColor: "text-amber-500",
      valueSuffix: "%",
    },
  ];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Performance Overview</h3>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-7 text-[11px] text-slate-500", autoRefresh && "text-blue-600")}
          onClick={onToggleRefresh}
        >
          <RefreshCw className={cn("h-3 w-3 mr-1.5", autoRefresh && "animate-spin")} />
          {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh"}
        </Button>
      </div>

      <div className="grid grid-cols-5 divide-x divide-slate-200">
        {cards.map((card, idx) => {
          const isPositive = card.inverse ? card.change < 0 : card.change > 0;
          const isNegative = card.inverse ? card.change > 0 : card.change < 0;

          return (
            <div key={idx} className={cn("px-4", idx === 0 && "pl-0", idx === cards.length - 1 && "pr-0")}>
              <div className="flex items-center gap-1.5 mb-1">
                <card.icon className={cn("h-3.5 w-3.5", card.iconColor)} />
                <span className="text-[11px] font-medium text-slate-500">{card.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900">
                  {card.value}{card.valueSuffix}
                </span>
                {card.change !== 0 && (
                  <span className={cn(
                    "flex items-center gap-0.5 text-[11px] font-medium",
                    isPositive ? "text-emerald-600" : isNegative ? "text-red-500" : "text-slate-400"
                  )}>
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : isNegative ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : null}
                    {Math.abs(card.change)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
