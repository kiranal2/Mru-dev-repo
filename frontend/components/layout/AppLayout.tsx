"use client";
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  RefreshCw,
  BarChart3,
  UserCircle2,
  X,
  MessageSquareMore,
  FileText,
  Play,
  Calculator,
  CheckSquare,
  GitBranch,
  Kanban,
  FolderKanban,
  Pin,
  Eye,
  Sparkles,
  BookOpen,
  Boxes,
  Workflow,
  ClipboardCheck,
  Scale,
  CreditCard,
  Shield,
} from "lucide-react";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type RailItem = "home" | "automation" | "reports" | "workbench" | "admin";

interface NavigationItem {
  id: string;
  label: string;
  route: string;
  icon?: React.ReactNode;
  children?: NavigationItem[];
}

const NAVIGATION_STRUCTURE: Record<RailItem, NavigationItem[]> = {
  home: [
    {
      id: "command-center",
      label: "Command Center",
      route: "/",
      icon: <MessageSquareMore size={18} />,
    },
    {
      id: "my-workspace",
      label: "My Workspace",
      route: "/home/my-workspace",
      icon: <FolderKanban size={18} />,
    },
    {
      id: "my-workspace-2",
      label: "My Workspace 2",
      route: "/home/my-workspace-2",
      icon: <FolderKanban size={18} />,
    },
    { id: "live-pins", label: "Live Pins", route: "/home/live-pins", icon: <Pin size={18} /> },
    { id: "watchlist", label: "Watchlist", route: "/home/watchlist", icon: <Eye size={18} /> },
    {
      id: "autonomy-studio",
      label: "Autonomy Studio",
      route: "/home/studio",
      icon: <Sparkles size={18} />,
    },
    {
      id: "narratives",
      label: "Narratives",
      route: "/home/narratives",
      icon: <BookOpen size={18} />,
    },
    {
      id: "process-to-automation",
      label: "Process-to-Automation",
      route: "/home/process-to-automation",
      icon: <Workflow size={18} />,
    },
  ],
  automation: [
    {
      id: "data-templates",
      label: "Data Templates",
      route: "/automation/data-templates-list",
      icon: <FileText size={18} />,
    },
    { id: "all-runs", label: "All Runs", route: "/automation/runs", icon: <Play size={18} /> },
    {
      id: "reconciliation",
      label: "Reconciliation",
      route: "/automation/reconciliation",
      icon: <Calculator size={18} />,
    },
    {
      id: "worklist",
      label: "Worklist",
      route: "/automation/worklist",
      icon: <CheckSquare size={18} />,
    },
    {
      id: "workflow",
      label: "Workflow",
      route: "/automation/workflow",
      icon: <GitBranch size={18} />,
    },
    {
      id: "taskflow",
      label: "TaskFlow",
      route: "/automation/taskflow",
      icon: <Kanban size={18} />,
    },
  ],
  reports: [
    {
      id: "accounting",
      label: "Accounting",
      route: "/reports/accounting",
      icon: <BarChart3 size={18} />,
      children: [
        {
          id: "balance-sheet",
          label: "Balance Sheet",
          route: "/reports/balance-sheet",
          icon: <BarChart3 size={16} />,
        },
        {
          id: "collections",
          label: "Collections",
          route: "/reports/collections",
          icon: <BarChart3 size={16} />,
        },
        {
          id: "saas-renewals",
          label: "SaaS Renewals",
          route: "/reports/saas-renewals",
          icon: <BarChart3 size={16} />,
        },
      ],
    },
  ],
  workbench: [
    {
      id: "order-to-cash",
      label: "Order-to-Cash",
      route: "/reports/collections",
      icon: <FileText size={18} />,
      children: [
        {
          id: "cash-collection-workbench",
          label: "Cash Collection Workbench",
          route: "/reports/collections",
          icon: <CreditCard size={16} />,
        },
        {
          id: "cash-application-workbench",
          label: "Cash Application Workbench",
          route: "/workbench/order-to-cash/cash-application",
          icon: <CreditCard size={16} />,
        },
      ],
    },
    {
      id: "procure-to-pay",
      label: "Procure-to-Pay & Spend",
      route: "/reports/saas-renewals",
      icon: <FileText size={18} />,
      children: [
        {
          id: "saas-renewal-workbench",
          label: "SaaS Renewal Workbench",
          route: "/reports/saas-renewals",
          icon: <FileText size={16} />,
        },
      ],
    },
    {
      id: "record-to-report",
      label: "Record-to-Report",
      route: "/workbench/record-to-report",
      icon: <ClipboardCheck size={18} />,
      children: [
        {
          id: "close-workbench",
          label: "Close Workbench",
          route: "/workbench/close",
          icon: <ClipboardCheck size={16} />,
        },
        {
          id: "reconciliation-workbench",
          label: "Reconciliations Workbench",
          route: "/workbench/reconciliation",
          icon: <Scale size={16} />,
        },
      ],
    },
    {
      id: "supply-chain-finance",
      label: "Supply Chain Finance",
      route: "/workbench/supply-chain-finance",
      icon: <Boxes size={18} />,
      children: [
        {
          id: "mrp-workbench",
          label: "MRP Workbench",
          route: "/workbench/mrp",
          icon: <Boxes size={16} />,
        },
      ],
    },
    {
      id: "revenue-leakage",
      label: "Revenue Leakage",
      route: "/workbench/revenue-leakage/overview",
      icon: <Shield size={18} />,
      children: [
        {
          id: "revenue-leakage-ai-chat",
          label: "AI Chat",
          route: "/workbench/revenue-leakage/ai-chat",
          icon: <MessageSquareMore size={16} />,
        },
        {
          id: "revenue-leakage-overview",
          label: "Overview",
          route: "/workbench/revenue-leakage/overview",
          icon: <Shield size={16} />,
        },
        {
          id: "revenue-leakage-cases",
          label: "Cases",
          route: "/workbench/revenue-leakage/cases",
          icon: <Shield size={16} />,
        },
        {
          id: "revenue-leakage-rules",
          label: "Rules",
          route: "/workbench/revenue-leakage/rules",
          icon: <Shield size={16} />,
        },
        {
          id: "revenue-leakage-insights",
          label: "Insights",
          route: "/workbench/revenue-leakage/insights",
          icon: <Shield size={16} />,
        },
        {
          id: "revenue-leakage-mv-trends",
          label: "MV Trends",
          route: "/workbench/revenue-leakage/mv-trends",
          icon: <Shield size={16} />,
        },
        {
          id: "revenue-leakage-exports",
          label: "Exports",
          route: "/workbench/revenue-leakage/exports",
          icon: <Shield size={16} />,
        },
      ],
    },
  ],
  admin: [
    {
      id: "admin-overview",
      label: "Overview",
      route: "/admin/overview",
      icon: <BarChart3 size={18} />,
    },
    {
      id: "operations-overview",
      label: "Operations Overview",
      route: "/admin/operations-overview",
      icon: <BarChart3 size={18} />,
    },
    {
      id: "workbenches-group",
      label: "Workbenches",
      route: "",
      children: [
        {
          id: "collections-workbench",
          label: "Collections Workbench",
          route: "/reports/collections",
          icon: <CreditCard size={16} />,
        },
        {
          id: "merchant-dashboard",
          label: "Merchant Dashboard",
          route: "/admin/workbench/merchant",
          icon: <CreditCard size={16} />,
        },
        {
          id: "cash-application",
          label: "Cash Application",
          route: "/workbench/order-to-cash/cash-application",
          icon: <CreditCard size={16} />,
        },
      ],
    },
    {
      id: "data-health-group",
      label: "Data Health",
      route: "",
      children: [
        {
          id: "netsuite-sync-health",
          label: "NetSuite Sync Health",
          route: "/admin/data-health/netsuite-sync",
          icon: <FileText size={16} />,
        },
        {
          id: "mailbox-parsing-health",
          label: "Mailbox Parsing Health",
          route: "/admin/data-health/mailbox-parsing",
          icon: <FileText size={16} />,
        },
        {
          id: "bank-feed-settlement",
          label: "Bank Feed & Settlement",
          route: "/admin/data-health/bank-feed-settlement",
          icon: <FileText size={16} />,
        },
      ],
    },
  ],
};

interface RailButtonProps {
  icon: React.ReactNode;
  label: string;
  isSelected: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

const RailButton = React.forwardRef<HTMLButtonElement, RailButtonProps>(
  ({ icon, label, isSelected, isCollapsed, onClick }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          "flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all duration-200 ease-out relative hover:bg-[#DDEAFE] hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6B7EF3] focus:ring-offset-2",
          isSelected ? "text-[#334155] bg-[#DDEAFE]" : "text-[#7C8A9A] hover:text-[#334155]"
        )}
        aria-label={label}
        aria-current={isSelected ? "page" : undefined}
      >
        {icon}
        {!isCollapsed && <span className="text-xs">{label}</span>}
      </button>
    );
  }
);
RailButton.displayName = "RailButton";

interface NavigationItemComponentProps {
  item: NavigationItem;
  activeRoute: string;
  onItemClick: (route: string) => void;
  level?: number;
}

function NavigationItemComponent({
  item,
  activeRoute,
  onItemClick,
  level = 0,
}: NavigationItemComponentProps) {
  const isActive =
    activeRoute === item.route ||
    item.children?.some((child) => activeRoute.startsWith(child.route));
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <button
        onClick={() => item.route && onItemClick(item.route)}
        className={cn(
          "w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-150 flex items-center gap-2 group",
          level === 0 ? "font-medium" : "font-normal",
          isActive
            ? "bg-[#DDEAFE] text-[#334155] shadow-sm"
            : "text-[#64748B] hover:bg-[#DDEAFE]/50 hover:text-[#334155]"
        )}
        style={{ paddingLeft: `${0.75 + level * 0.75}rem` }}
      >
        {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
        <span className="flex-1">{item.label}</span>
      </button>

      {hasChildren && item.children && (
        <div className="mt-1 space-y-1">
          {item.children.map((child) => (
            <NavigationItemComponent
              key={child.id}
              item={child}
              activeRoute={activeRoute}
              onItemClick={onItemClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedRailItem, setSelectedRailItem] = useState<RailItem | null>(null);
  const [activeRoute, setActiveRoute] = useState(pathname);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(pathname.startsWith("/workbench/"));
  const railRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveRoute(pathname);

    if (pathname === "/" || pathname.startsWith("/home/") || pathname.startsWith("/live-pins")) {
      setSelectedRailItem("home");
    } else if (pathname.startsWith("/automation/")) {
      setSelectedRailItem("automation");
    } else if (pathname.startsWith("/reports/")) {
      setSelectedRailItem("reports");
    } else if (pathname.startsWith("/workbench/")) {
      setSelectedRailItem("workbench");
      // Close panel for workbenches with their own internal tab navigation
      if (
        pathname.startsWith("/workbench/order-to-cash/cash-application") ||
        pathname.startsWith("/workbench/revenue-leakage")
      ) {
        setIsPanelOpen(false);
      } else {
        setIsPanelOpen(true);
      }
    } else if (pathname.startsWith("/admin/")) {
      setSelectedRailItem("admin");
      setIsPanelOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      setIsCollapsed(window.innerWidth <= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleRailItemClick = (item: RailItem) => {
    if (selectedRailItem === item) {
      setIsPanelOpen(!isPanelOpen);
    } else {
      setSelectedRailItem(item);
      setIsPanelOpen(true);
    }
  };

  const getRailItemSelectedState = (railItem: RailItem) => {
    return selectedRailItem === railItem;
  };

  const handleNavigationItemClick = (route: string) => {
    setActiveRoute(route);
    setIsPanelOpen(false);
    router.push(route);
  };

  const handleToggleMenu = () => {
    setIsPanelOpen(false);
    setSelectedRailItem(null);
  };

  // Close panel when clicking outside rail and panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isPanelOpen) return;
      const target = e.target as Node;
      if (panelRef.current && panelRef.current.contains(target)) return;
      if (railRef.current && railRef.current.contains(target)) return;
      setIsPanelOpen(false);
      setSelectedRailItem(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPanelOpen]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-screen overflow-hidden bg-[#F8FAFC]">
        {/* Top Header */}
        <header className="h-[57px] bg-white border-b border-[#DCEAF6] flex items-center justify-between px-6 z-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[32px] font-light text-[#6B7EF3] tracking-tight">MeeruAI</span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Rail Navigation */}
          <aside
            ref={railRef}
            className={cn(
              "bg-white border-r border-[#DCEAF6] flex flex-col items-center py-4 transition-all duration-300 ease-out z-40 flex-shrink-0",
              isCollapsed ? "w-16" : "w-[72px]"
            )}
          >
            <nav className="flex flex-col gap-0" role="navigation" aria-label="Main navigation">
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <RailButton
                    icon={<Home size={22} />}
                    label="Home"
                    isSelected={getRailItemSelectedState("home")}
                    isCollapsed={isCollapsed}
                    onClick={() => handleRailItemClick("home")}
                  />
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" align="center" sideOffset={8}>
                    Home
                  </TooltipContent>
                )}
              </Tooltip>

              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <RailButton
                    icon={<RefreshCw size={22} />}
                    label="Automation"
                    isSelected={getRailItemSelectedState("automation")}
                    isCollapsed={isCollapsed}
                    onClick={() => handleRailItemClick("automation")}
                  />
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" align="center" sideOffset={8}>
                    Automate
                  </TooltipContent>
                )}
              </Tooltip>

              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <RailButton
                    icon={<BarChart3 size={22} />}
                    label="Reports"
                    isSelected={getRailItemSelectedState("reports")}
                    isCollapsed={isCollapsed}
                    onClick={() => handleRailItemClick("reports")}
                  />
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" align="center" sideOffset={8}>
                    Financials
                  </TooltipContent>
                )}
              </Tooltip>

              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <RailButton
                    icon={<Boxes size={22} />}
                    label="Workbench"
                    isSelected={getRailItemSelectedState("workbench")}
                    isCollapsed={isCollapsed}
                    onClick={() => handleRailItemClick("workbench")}
                  />
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" align="center" sideOffset={8}>
                    Workbench
                  </TooltipContent>
                )}
              </Tooltip>

              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <RailButton
                    icon={<Shield size={22} />}
                    label="Admin"
                    isSelected={getRailItemSelectedState("admin")}
                    isCollapsed={isCollapsed}
                    onClick={() => handleRailItemClick("admin")}
                  />
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" align="center" sideOffset={8}>
                    Admin
                  </TooltipContent>
                )}
              </Tooltip>
            </nav>

            <div className="mt-auto mb-4 flex justify-center">
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <button
                    className="text-[#7C8A9A] hover:text-[#334155] hover:scale-110 transition-all duration-200 ease-out p-2 rounded-lg hover:bg-[#DDEAFE]"
                    aria-label="User profile"
                  >
                    <UserCircle2 size={22} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" sideOffset={8}>
                  Profile
                </TooltipContent>
              </Tooltip>
            </div>
          </aside>

          {/* Navigation Panel Overlay */}
          <aside
            ref={panelRef}
            className={cn(
              "fixed left-[72px] top-[57px] bottom-0 bg-[#EEF8FF] border-r border-[#DCEAF6] flex flex-col transition-all duration-300 ease-out z-50",
              isPanelOpen && selectedRailItem
                ? "w-[280px] opacity-100"
                : "w-0 opacity-0 overflow-hidden",
              isPanelOpen && selectedRailItem && "shadow-xl"
            )}
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#DCEAF6] hover:bg-[#DDEAFE]/30 transition-colors duration-200">
              <h2 className="font-semibold text-[#0F172A] capitalize text-sm tracking-wide">
                {selectedRailItem}
              </h2>
              <button
                onClick={handleToggleMenu}
                className="w-6 h-6 rounded-md flex items-center justify-center text-[#7C8A9A] hover:text-[#334155] hover:bg-[#DDEAFE] hover:scale-110 transition-all duration-200 ease-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6B7EF3] focus:ring-offset-1"
                aria-label="Close menu"
              >
                <X size={14} />
              </button>
            </div>

            <nav
              className="flex-1 p-3 overflow-y-auto"
              role="menu"
              aria-label={`${selectedRailItem || "home"} navigation`}
            >
              <div className="space-y-1">
                {selectedRailItem &&
                  NAVIGATION_STRUCTURE[selectedRailItem].map((item: NavigationItem) => (
                    <NavigationItemComponent
                      key={item.id}
                      item={item}
                      activeRoute={activeRoute}
                      onItemClick={handleNavigationItemClick}
                    />
                  ))}
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
