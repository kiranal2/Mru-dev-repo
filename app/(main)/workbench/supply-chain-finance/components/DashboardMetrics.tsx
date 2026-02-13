"use client";

import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FiltersService } from "../services/FiltersService";

type Props = {
  autoRefresh: boolean;
  onToggleRefresh: () => void;
};

export function DashboardMetrics({ autoRefresh, onToggleRefresh }: Props) {
  const { data: dashboardStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => FiltersService.getDashboardStats(),
    refetchInterval: false,
  });

  if (!dashboardStats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </Card>
      </div>
    );
  }

  const cards = [
    {
      label: "Total Open Exceptions",
      value: dashboardStats.totalOpen,
      change: dashboardStats.openChange,
      icon: AlertTriangle,
      color: "red",
    },
    {
      label: "Avg Resolution Time",
      value: `${dashboardStats.avgResolutionTime}d`,
      change: dashboardStats.resolutionTimeChange,
      icon: Clock,
      color: "blue",
      inverse: true,
    },
    {
      label: "Supplier Response Rate",
      value: `${dashboardStats.supplierResponseRate}%`,
      change: dashboardStats.responseRateChange,
      icon: CheckCircle,
      color: "green",
    },
    {
      label: "On-Time Delivery %",
      value: `${dashboardStats.onTimeDeliveryRate}%`,
      change: dashboardStats.deliveryRateChange,
      icon: TrendingUp,
      color: "green",
    },
    {
      label: "Auto-Clear Rate",
      value: `${dashboardStats.autoClearPercent}%`,
      change: dashboardStats.autoClearChange,
      icon: CheckCircle,
      color: "green",
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-700">Dashboard Overview</h2>
        <Button
          variant={autoRefresh ? "default" : "outline"}
          size="sm"
          onClick={onToggleRefresh}
          title={autoRefresh ? "Auto-refresh enabled" : "Auto-refresh disabled"}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
          {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, idx) => {
          const isPositive = card.inverse ? card.change < 0 : card.change > 0;
          const isNegative = card.inverse ? card.change > 0 : card.change < 0;

          return (
            <Card key={idx} className="p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-slate-600 font-medium">{card.label}</span>
                <card.icon
                  className={`h-4 w-4 ${
                    card.color === "red"
                      ? "text-red-600"
                      : card.color === "blue"
                        ? "text-blue-600"
                        : "text-green-600"
                  }`}
                />
              </div>

              <div className="flex items-end justify-between">
                <div className="text-2xl font-semibold text-[#000000]">{card.value}</div>

                {card.change !== 0 && (
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${
                      isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-slate-500"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : isNegative ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : null}
                    <span>{Math.abs(card.change)}%</span>
                  </div>
                )}
              </div>

              <div className="mt-2 text-xs text-slate-500">vs last week</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
