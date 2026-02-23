"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutGrid,
  AlertCircle,
  CheckCircle2,
  Archive,
  Clock,
  Mail,
  FileText,
  Settings,
  BarChart3,
  Landmark,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Breadcrumb from "@/components/layout/breadcrumb";
import { cashAppStore } from "@/lib/cash-app-store";

export default function CashApplicationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dataHealth = cashAppStore.getDataHealth();
  const [isKpiExpanded, setIsKpiExpanded] = useState(false);

  const isPaymentsPage =
    pathname === "/workbench/order-to-cash/cash-application/payments" ||
    pathname?.startsWith("/workbench/order-to-cash/cash-application/payments/");

  const kpiStats = isPaymentsPage ? cashAppStore.getStats() : null;
  const kpiTotalPayments = kpiStats
    ? kpiStats.autoMatched + kpiStats.exceptions + kpiStats.critical + kpiStats.pendingToPost + kpiStats.settlementPending
    : 0;

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const kpiTiles = kpiStats
    ? [
        { label: "Auto-Matched", count: kpiStats.autoMatched, amount: 1245000, dotColor: "bg-emerald-500", textColor: "text-emerald-700", bgColor: "bg-emerald-50 hover:bg-emerald-100" },
        { label: "Exceptions", count: kpiStats.exceptions, amount: 342000, dotColor: "bg-amber-500", textColor: "text-amber-700", bgColor: "bg-amber-50 hover:bg-amber-100" },
        { label: "Critical", count: kpiStats.critical, amount: 89000, dotColor: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50 hover:bg-red-100" },
        { label: "Pending to Post", count: kpiStats.pendingToPost, dotColor: "bg-blue-500", textColor: "text-blue-700", bgColor: "bg-blue-50 hover:bg-blue-100" },
        { label: "Settlement Pending", count: kpiStats.settlementPending, dotColor: "bg-slate-400", textColor: "text-slate-700", bgColor: "bg-slate-50 hover:bg-slate-100" },
      ]
    : [];

  // Detect if we're on a payment detail page (shared by all tabs)
  const paymentDetailPattern = /\/payments\/[^/]+$/;
  const isOnPaymentDetail = paymentDetailPattern.test(pathname || "");
  const fromParam = searchParams?.get("from");

  const navItems = [
    {
      path: "/workbench/order-to-cash/cash-application/payments",
      label: "Payments Queue",
      icon: LayoutGrid,
    },
    {
      path: "/workbench/order-to-cash/cash-application/exceptions",
      label: "Exceptions",
      icon: AlertCircle,
    },
    {
      path: "/workbench/order-to-cash/cash-application/matching-studio",
      label: "Matching Studio",
      icon: LayoutGrid,
    },
    {
      path: "/workbench/order-to-cash/cash-application/pending-to-post",
      label: "Pending to Post",
      icon: CheckCircle2,
    },
    {
      path: "/workbench/order-to-cash/cash-application/payment-batches",
      label: "Payment Batches",
      icon: Archive,
    },
    {
      path: "/workbench/order-to-cash/cash-application/bank-reconciliation",
      label: "Bank Reconciliation",
      icon: Landmark,
    },
    {
      path: "/workbench/order-to-cash/cash-application/history",
      label: "History",
      icon: Clock,
    },
    {
      path: "/workbench/order-to-cash/cash-application/reports",
      label: "Reports",
      icon: BarChart3,
    },
    {
      path: "/workbench/order-to-cash/cash-application/remittances/email-inbox",
      label: "Email Inbox",
      icon: Mail,
    },
    {
      path: "/workbench/order-to-cash/cash-application/remittances/list",
      label: "Remittances",
      icon: FileText,
    },
    {
      path: "/workbench/order-to-cash/cash-application/admin",
      label: "Admin",
      icon: Settings,
    },
  ];

  const primaryNavItems = navItems.slice(0, 4);
  const overflowNavItems = navItems.slice(4);

  const isActive = (path: string) => {
    // When on a payment detail page, use the `from` query param to determine
    // which tab should be highlighted (since detail page is shared across tabs)
    if (isOnPaymentDetail && fromParam) {
      const fromPath = navItems.find((item) => item.path.endsWith("/" + fromParam))?.path;
      return fromPath === path;
    }
    return pathname === path || pathname?.startsWith(path + "/");
  };

  const activeOverflowItem = overflowNavItems.find((item) => isActive(item.path));

  const activeRoute =
    (pathname || "").replace(/^\//, "") || "workbench/order-to-cash/cash-application";

  return (
    <div className="h-full flex flex-col">
      {/* Page Header with Breadcrumb */}
      <header className="sticky top-0 z-10 bg-white border-b flex-shrink-0">
        <div className="px-6 pt-2.5 pb-1">
          <Breadcrumb activeRoute={activeRoute} className="mb-0.5" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4.5 h-4.5 text-slate-700" />
              <h1 className="text-base font-bold text-slate-900">Cash Application Workbench</h1>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] transition-colors ${
                      dataHealth.guard.overallState === "Healthy"
                        ? "bg-green-50 border-green-200 hover:bg-green-100"
                        : dataHealth.guard.overallState === "Degraded"
                          ? "bg-orange-50 border-orange-200 hover:bg-orange-100"
                          : "bg-red-50 border-red-200 hover:bg-red-100"
                    }`}
                  >
                    <span className="font-medium text-gray-500">Sync</span>
                    <Badge
                      variant={
                        dataHealth.guard.overallState === "Healthy"
                          ? "default"
                          : dataHealth.guard.overallState === "Degraded"
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-[10px] px-1.5 py-0"
                    >
                      {dataHealth.guard.overallState === "BlockPosting"
                        ? "Blocked"
                        : dataHealth.guard.overallState}
                    </Badge>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm p-3">
                  <div className="space-y-2">
                    <div className="font-semibold text-xs border-b pb-1.5">Data Freshness</div>
                    {dataHealth.freshness.map((fresh) => (
                      <div key={fresh.entityType} className="text-xs space-y-0.5">
                        <div className="font-medium">{fresh.entityType}</div>
                        <div className="text-gray-600">
                          Last sync: {fresh.ageMinutes} min ago
                          {fresh.ageMinutes && fresh.ageMinutes > 30 && (
                            <span className="text-orange-600 ml-1">(stale)</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {dataHealth.guard.reasons.length > 0 && (
                      <>
                        <div className="font-semibold text-xs border-b pb-1.5 pt-1">Issues</div>
                        {dataHealth.guard.reasons.map((reason, idx) => (
                          <div key={idx} className="text-xs text-red-600 flex items-start gap-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span>{reason.message}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b bg-white">
        <div className="px-6 pb-1.5 pt-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                );
              })}

              {/* Overflow "More" dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      activeOverflowItem
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    {activeOverflowItem ? (
                      <>
                        {(() => {
                          const Icon = activeOverflowItem.icon;
                          return <Icon className="w-3.5 h-3.5" />;
                        })()}
                        {activeOverflowItem.label}
                      </>
                    ) : (
                      "More"
                    )}
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {overflowNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className={`flex items-center gap-2 cursor-pointer text-xs ${
                          isActive(item.path) ? "bg-slate-100 font-medium" : ""
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* KPI toggle — only on Payments page */}
            {isPaymentsPage && (
              <button
                onClick={() => setIsKpiExpanded(!isKpiExpanded)}
                className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-700 transition-colors group"
              >
                <BarChart3 className="w-3 h-3" />
                <span className="font-medium">KPIs</span>
                <span className="text-slate-400">{kpiTotalPayments}</span>
                {isKpiExpanded ? (
                  <ChevronUp className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                )}
              </button>
            )}
          </div>

          {/* KPI tiles — expanded below tabs */}
          {isPaymentsPage && isKpiExpanded && (
            <div className="flex items-center gap-1 mt-1">
              {kpiTiles.map((tile) => (
                <div
                  key={tile.label}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${tile.bgColor} transition-colors cursor-default`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${tile.dotColor}`} />
                  <span className={`text-xs font-bold ${tile.textColor}`}>{tile.count}</span>
                  {tile.amount && (
                    <span className="text-[10px] text-slate-500">
                      {formatCompactCurrency(tile.amount)}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">{tile.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
