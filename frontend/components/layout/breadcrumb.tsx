"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbProps {
  activeRoute: string;
  className?: string;
}

export default function Breadcrumb({ activeRoute, className }: BreadcrumbProps) {
  const generateBreadcrumb = (route: string) => {
    const parts = route.split("/").filter(Boolean);
    const breadcrumbs = [];

    if (parts[0] === "home") breadcrumbs.push("Home");
    if (parts[0] === "automation") breadcrumbs.push("Automate");
    if (parts[0] === "workbench") breadcrumbs.push("Workbench");
    if (parts[0] === "reports") breadcrumbs.push("Reports");

    // Handle workbench sub-categories
    if (parts[0] === "workbench" && parts[1]) {
      if (parts[1] === "bpo-setup") breadcrumbs.push("BPO Setup");
      if (parts[1] === "fpa") breadcrumbs.push("FP&A");
      if (parts[1] === "procure-to-pay") breadcrumbs.push("Procure to Pay");
      if (parts[1] === "order-to-cash") breadcrumbs.push("Order to Cash");
      if (parts[1] === "record-to-report") breadcrumbs.push("Record to Report");
      if (parts[1] === "supply-chain-finance") breadcrumbs.push("Supply Chain Finance");
      if (parts[1] === "revenue-ops") breadcrumbs.push("Revenue Ops");
      if (parts[1] === "revenue-leakage") breadcrumbs.push("Revenue Leakage");
      if (parts[1] === "treasury") breadcrumbs.push("Treasury");
    }

    // Handle reports sub-categories
    if (parts[0] === "reports" && parts[1]) {
      if (parts[1] === "sec") breadcrumbs.push("SEC Reports");
      if (parts[1] === "financials") breadcrumbs.push("Financials");
      if (parts[1] === "analysis") breadcrumbs.push("Analysis");
    }

    // Handle workbench page names
    if (parts[0] === "workbench" && parts[2]) {
      if (parts[2] === "variance-drivers") breadcrumbs.push("Variance Drivers");
      if (parts[2] === "ap-exceptions") breadcrumbs.push("AP Exceptions");
      if (parts[2] === "saas-renewal") breadcrumbs.push("SaaS Renewal");
      if (parts[2] === "disputes") breadcrumbs.push("Disputes");
      if (parts[2] === "cash-application") breadcrumbs.push("Cash Application");
      if (parts[2] === "cash-collection") {
        breadcrumbs.push("Cash Collection");
        // Cash collection sub-pages (parts[3])
        if (parts[3] === "payments") breadcrumbs.push("Payments Queue");
        if (parts[3] === "exceptions") breadcrumbs.push("Exceptions");
        if (parts[3] === "matching-studio") breadcrumbs.push("Matching Studio");
        if (parts[3] === "pending-to-post") breadcrumbs.push("Pending to Post");
        if (parts[3] === "payment-batches") breadcrumbs.push("Payment Batches");
        if (parts[3] === "bank-reconciliation" || parts[3] === "bank-reconcillation")
          breadcrumbs.push("Bank Reconciliation");
        if (parts[3] === "history") breadcrumbs.push("History");
        if (parts[3] === "reports") breadcrumbs.push("Reports");
        if (parts[3] === "admin") breadcrumbs.push("Admin");
        if (parts[3] === "remittances" && parts[4] === "email-inbox")
          breadcrumbs.push("Email Inbox");
        if (parts[3] === "remittances" && parts[4] === "list") breadcrumbs.push("Remittances");
      }
      if (parts[2] === "reconciliations") breadcrumbs.push("Reconciliations");
      if (parts[2] === "close") breadcrumbs.push("Close");
      if (parts[2] === "mrp") breadcrumbs.push("MRP");
      if (parts[2] === "revenue-recognition") breadcrumbs.push("Revenue Recognition");
      if (parts[2] === "ai-chat" && parts[1] === "revenue-leakage") breadcrumbs.push("AI Chat");
      if (parts[2] === "overview" && parts[1] === "revenue-leakage") breadcrumbs.push("Overview");
      if (parts[2] === "cases" && parts[1] === "revenue-leakage") breadcrumbs.push("Cases");
      if (parts[2] === "rules" && parts[1] === "revenue-leakage") breadcrumbs.push("Rules");
      if (parts[2] === "insights" && parts[1] === "revenue-leakage") breadcrumbs.push("Insights");
      if (parts[2] === "patterns" && parts[1] === "revenue-leakage") breadcrumbs.push("Patterns");
      if (parts[2] === "mv-trends" && parts[1] === "revenue-leakage") breadcrumbs.push("MV Trends");
      if (parts[2] === "exports" && parts[1] === "revenue-leakage") breadcrumbs.push("Exports");
      if (parts[2] === "settings" && parts[1] === "revenue-leakage") breadcrumbs.push("Settings");
      if (parts[2] === "admin" && parts[1] === "revenue-leakage") breadcrumbs.push("Admin");
      if (parts[2] === "liquidity") breadcrumbs.push("Liquidity");
    }

    // Handle reports page names
    if (parts[0] === "reports" && parts[2]) {
      if (parts[2] === "balance-sheet") breadcrumbs.push("Balance Sheet");
      if (parts[2] === "income-statement") breadcrumbs.push("Income Statement");
      if (parts[2] === "trial-balance") breadcrumbs.push("Trial Balance");
      if (parts[2] === "account-activity") breadcrumbs.push("Account Activity");
      if (parts[2] === "one-click-variance") breadcrumbs.push("One Click Variance");
      if (parts[2] === "flux-analysis") breadcrumbs.push("Flux Analysis");
    }

    // Handle home workspace pages
    if (parts[0] === "home" && parts[1] === "workspace" && parts[2]) {
      if (parts[2] === "my-workspace") breadcrumbs.push("My Workspace");
      if (parts[2] === "live-pins") breadcrumbs.push("Live Pins");
      if (parts[2] === "watchlist") breadcrumbs.push("Watchlist");
      if (parts[2] === "data-template") breadcrumbs.push("Data template");
    }

    // Handle specific routes without sub-paths
    if (parts[1] && !parts[2]) {
      if (parts[1] === "command-center") breadcrumbs.push("Command Center");
      if (parts[1] === "autonomy-studio") breadcrumbs.push("Autonomy Studio");
      if (parts[1] === "workspace") breadcrumbs.push("Workspace");
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumb(activeRoute);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)} aria-label="Breadcrumb">
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight size={14} className="text-slate-300 flex-shrink-0" aria-hidden="true" />
          )}
          <span
            className={cn(
              "transition-colors duration-200 text-[13px]",
              index === breadcrumbs.length - 1 ? "text-slate-900 font-medium" : "text-slate-500 hover:opacity-80"
            )}
          >
            {breadcrumb}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}
