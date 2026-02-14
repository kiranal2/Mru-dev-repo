"use client";

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
        <div className="px-6 py-3">
          <Breadcrumb activeRoute={activeRoute} className="mb-1.5" />
          <div className="flex items-center justify-between gap-4 mt-1">
            <div>
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-6 h-6 text-slate-700" />
                <h1 className="text-2xl font-bold text-[#000000]">Cash Application Workbench</h1>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs transition-colors ${
                      dataHealth.guard.overallState === "Healthy"
                        ? "bg-green-50 border-green-200 hover:bg-green-100"
                        : dataHealth.guard.overallState === "Degraded"
                          ? "bg-orange-50 border-orange-200 hover:bg-orange-100"
                          : "bg-red-50 border-red-200 hover:bg-red-100"
                    }`}
                  >
                    <span className="text-xs font-medium text-gray-600">NetSuite Sync</span>
                    <Badge
                      variant={
                        dataHealth.guard.overallState === "Healthy"
                          ? "default"
                          : dataHealth.guard.overallState === "Degraded"
                            ? "secondary"
                            : "destructive"
                      }
                      className="ml-1"
                    >
                      {dataHealth.guard.overallState === "BlockPosting"
                        ? "Posting Blocked"
                        : dataHealth.guard.overallState}
                    </Badge>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm p-4">
                  <div className="space-y-3">
                    <div className="font-semibold text-sm border-b pb-2">Data Freshness</div>
                    {dataHealth.freshness.map((fresh) => (
                      <div key={fresh.entityType} className="text-xs space-y-1">
                        <div className="font-medium">{fresh.entityType}</div>
                        <div className="text-gray-600">
                          Last sync: {fresh.ageMinutes} minutes ago
                          {fresh.ageMinutes && fresh.ageMinutes > 30 && (
                            <span className="text-orange-600 ml-1">(stale)</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {dataHealth.guard.reasons.length > 0 && (
                      <>
                        <div className="font-semibold text-sm border-b pb-2 pt-2">Issues</div>
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
        <div className="px-6 py-1.5">
          <div className="flex items-center gap-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => router.push(item.path)}
                  className="whitespace-nowrap"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}

            {/* Overflow "More" dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={activeOverflowItem ? "default" : "ghost"}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {activeOverflowItem ? (
                    <>
                      {(() => {
                        const Icon = activeOverflowItem.icon;
                        return <Icon className="w-4 h-4 mr-2" />;
                      })()}
                      {activeOverflowItem.label}
                    </>
                  ) : (
                    "More"
                  )}
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {overflowNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.path}
                      onClick={() => router.push(item.path)}
                      className={`flex items-center gap-2 cursor-pointer ${
                        isActive(item.path) ? "bg-slate-100 font-medium" : ""
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
