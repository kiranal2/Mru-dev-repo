"use client";

import React, { useState, useEffect, useRef, useMemo, startTransition } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

// Layout Components
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import NavigationPanel from "@/components/layout/navigation-panel";
import MainContent from "@/components/layout/main-content";
import MobileNavDrawer from "@/components/layout/mobile-nav-drawer";
import { Home, RefreshCw, BarChart3, LayoutGrid, Shield } from "lucide-react";

// UI Components
import LivePinModal from "@/components/ui/live-pin-modal";
import { CreateWatchModal } from "@/components/ui/create-watch-modal";
import { WorkbenchSwitcher } from "@/components/demo/workbench-switcher";
import { DemoTourWrapper } from "@/components/demo/demo-tour-wrapper";

// Navigation
import { NAVIGATION_STRUCTURE, ALL_RAILS, RAIL_CONFIG, RailItem } from "@/lib/navigation";
import { usePersona } from "@/lib/persona-context";
import { isRailRelevant, filterNavigationItems } from "@/lib/demo-routing";

type LoadingState = "loading" | "loaded";

interface AppShellProps {
  children: React.ReactNode;
  activeRoute: string;
}

export default function AppShell({ children, activeRoute }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [selectedRailItem, setSelectedRailItem] = useState<RailItem | null>("home");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(true);
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const [hoveredRailItem, setHoveredRailItem] = useState<RailItem | null>(null);
  const [isPanelHovered, setIsPanelHovered] = useState(false);
  const [isLivePinModalOpen, setIsLivePinModalOpen] = useState(false);
  const [isCreateWatchModalOpen, setIsCreateWatchModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [tabletPanelOpen, setTabletPanelOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const hoverClearTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Persona-based navigation filtering
  const { persona: contextPersona } = usePersona();

  // Also read persona directly from localStorage as fallback
  const [localPersona, setLocalPersona] = useState<string | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("meeru-demo-config");
      if (stored) {
        const config = JSON.parse(stored);
        if (config.persona) setLocalPersona(config.persona);
      }
    } catch { /* ignore */ }
  }, [pathname]);

  const persona = contextPersona || (localPersona as any) || null;

  const visibleRails = useMemo(() => {
    return ALL_RAILS.filter((rail) => isRailRelevant(persona, rail));
  }, [persona]);

  const filteredNavigationStructure = useMemo(() => {
    const result: Record<string, any> = {};
    for (const rail of visibleRails) {
      result[rail] = filterNavigationItems(persona, rail, NAVIGATION_STRUCTURE[rail]);
    }
    return result as typeof NAVIGATION_STRUCTURE;
  }, [persona, visibleRails]);

  // Handle loading animation only on initial mount
  useEffect(() => {
    if (!hasInitiallyLoaded) {
      const timer = setTimeout(() => {
        setLoadingState("loaded");
        setHasInitiallyLoaded(true);
      }, 300); // Reduced from 800ms to 300ms
      return () => clearTimeout(timer);
    }
  }, [hasInitiallyLoaded]);

  // Load persisted rail selection from localStorage
  useEffect(() => {
    const savedRailItem = localStorage.getItem("meeru-selected-rail");
    if (savedRailItem && ALL_RAILS.includes(savedRailItem as RailItem)) {
      setSelectedRailItem(savedRailItem as RailItem);
    }
  }, []);

  // Save rail selection to localStorage
  useEffect(() => {
    if (selectedRailItem) {
      localStorage.setItem("meeru-selected-rail", selectedRailItem);
    }
  }, [selectedRailItem]);

  // Handle responsive collapse + mobile detection
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsCollapsed(w <= 1024);
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1280);
      // Close mobile nav if resizing to desktop
      if (w >= 768) setIsMobileNavOpen(false);
      // Close tablet panel if resizing to desktop
      if (w >= 1280) setTabletPanelOpen(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /** Map a route path to the appropriate sidebar rail */
  const routeToRail = (route: string): RailItem | null => {
    if (route.startsWith("/home/")) return "home";
    if (route.startsWith("/automation/")) return "automation";
    if (route.startsWith("/admin/")) return "admin";
    // Decision Intelligence routes
    if (route.startsWith("/workbench/custom-workbench/")) return "decision-intelligence";
    if (route.startsWith("/workbench/fpa/")) return "decision-intelligence";
    // Close Intelligence routes
    if (route.startsWith("/workbench/record-to-report/")) return "close-intelligence";
    // Analysis reports → Decision Intelligence
    if (route.startsWith("/reports/analysis/")) return "decision-intelligence";
    // Financial reports → Close Intelligence
    if (route.startsWith("/reports/sec/") || route.startsWith("/reports/financials/")) return "close-intelligence";
    // Fallback for remaining workbench routes (O2C, P2P, etc.)
    if (route.startsWith("/workbench/")) return "workbench";
    if (route.startsWith("/reports/")) return "reports";
    return null;
  };

  // Sync selected rail item with current route
  useEffect(() => {
    if (pathname) {
      const rail = routeToRail(pathname);
      if (rail) setSelectedRailItem(rail);
    }
  }, [pathname]);

  // Handle workspace default route - redirect to workspace-2
  useEffect(() => {
    if (pathname === "/home/workspace") {
      startTransition(() => {
        router.push("/home/workspace/workspace-2");
      });
    }
  }, [pathname, router]);

  const handleRailItemClick = (item: RailItem) => {
    // On tablet: toggle the nav panel instead of navigating
    if (isTablet) {
      if (tabletPanelOpen && hoveredRailItem === item) {
        // Clicking same item again — close panel
        setTabletPanelOpen(false);
        setHoveredRailItem(null);
      } else {
        // Open panel for this rail
        setSelectedRailItem(item);
        setHoveredRailItem(item);
        setTabletPanelOpen(true);
      }
      return;
    }

    setSelectedRailItem(item);
    // Set hoveredRailItem to show the nav panel immediately
    setHoveredRailItem(item);

    // Rails that have a nav panel — just open the panel, don't navigate
    const panelRails: RailItem[] = ["decision-intelligence", "close-intelligence", "automation", "reports", "workbench", "admin"];
    if (panelRails.includes(item)) {
      // Panel opens via hoveredRailItem — no default route needed
      return;
    }

    // Rails with a direct default route
    const defaultRoutes: Partial<Record<RailItem, string>> = {
      home: "/home/dashboard",
    };
    const route = defaultRoutes[item];
    if (route) {
      startTransition(() => {
        router.push(route);
      });
    }
  };

  const getRailItemSelectedState = (railItem: RailItem) => {
    if (hoveredRailItem === railItem) return true;
    if (selectedRailItem === railItem) return true;
    // Check if active route maps to this rail
    return routeToRail(activeRoute) === railItem;
  };

  const handleNavigationItemClick = (route: string) => {
    // Determine which rail item this route belongs to and set it as selected
    const railItem = routeToRail(route);
    if (railItem) {
      setSelectedRailItem(railItem);
    }

    // Close panel after navigation
    setHoveredRailItem(null);
    if (isTablet) {
      setTabletPanelOpen(false);
    }

    startTransition(() => {
      router.push(route);
    });
  };

  const handleRailItemHover = (item: RailItem | null) => {
    // Clear any pending timeout
    if (hoverClearTimeoutRef.current) {
      clearTimeout(hoverClearTimeoutRef.current);
      hoverClearTimeoutRef.current = null;
    }

    // If setting a new hover item, set it immediately
    if (item !== null) {
      setHoveredRailItem(item);
      return;
    }

    // If trying to clear hover (item is null)
    // Add a small delay to allow mouse to move to panel without closing it
    if (item === null) {
      hoverClearTimeoutRef.current = setTimeout(() => {
        // Only clear if panel is not hovered
        if (!isPanelHovered) {
          setHoveredRailItem(null);
        }
        hoverClearTimeoutRef.current = null;
      }, 100); // 100ms delay to allow smooth transition to panel
    }
  };

  const handlePanelMouseEnter = () => {
    setIsPanelHovered(true);
    // Cancel any pending hover clear timeout
    if (hoverClearTimeoutRef.current) {
      clearTimeout(hoverClearTimeoutRef.current);
      hoverClearTimeoutRef.current = null;
    }
    // Keep the current hoveredRailItem when entering the panel
    // This ensures the panel stays open when moving from sidebar to panel
    // If there's a selectedRailItem but no hoveredRailItem, use the selected one
    if (!hoveredRailItem && selectedRailItem) {
      setHoveredRailItem(selectedRailItem);
    }
  };

  const handlePanelMouseLeave = () => {
    setIsPanelHovered(false);
    // When mouse leaves panel, close it by clearing hoveredRailItem
    // Use a small delay to allow smooth transitions
    hoverClearTimeoutRef.current = setTimeout(() => {
      setHoveredRailItem(null);
      hoverClearTimeoutRef.current = null;
    }, 150);
  };

  const handleToggleMenu = () => {
    setIsMenuCollapsed(!isMenuCollapsed);
    setIsMenuHovered(false);
    setIsPanelHovered(false);
    setHoveredRailItem(null);
  };

  const handleOpenLivePinModal = () => {
    setIsLivePinModalOpen(true);
  };

  const handleCloseLivePinModal = () => {
    setIsLivePinModalOpen(false);
  };

  const handleAddToLivePins = () => {
    toast.success("Live pin tracker added for Amazon");
    setIsLivePinModalOpen(false);
  };

  const handleOpenCreateWatchModal = () => {
    setIsCreateWatchModalOpen(true);
  };

  const handleCloseCreateWatchModal = () => {
    setIsCreateWatchModalOpen(false);
  };

  const handleCreateWatch = () => {
    startTransition(() => {
      router.push("/home/workspace/watchlist");
    });
    setIsCreateWatchModalOpen(false);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showUserMenu]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverClearTimeoutRef.current) {
        clearTimeout(hoverClearTimeoutRef.current);
      }
    };
  }, []);

  // ─── Full app shell with sidebar + header ───
  return (
    <TooltipProvider>
      <div className="min-h-screen font-[Inter,system-ui,sans-serif]" style={{ background: 'var(--theme-bg)' }}>
        <Header
          loadingState={hasInitiallyLoaded ? "loaded" : loadingState}
          isSidebarHidden={isSidebarHidden}
          onToggleSidebar={() => setIsSidebarHidden(!isSidebarHidden)}
          isMobile={isMobile}
          onMobileMenuToggle={() => setIsMobileNavOpen(true)}
        />

        <div className={cn("flex overflow-hidden", isMobile ? "h-[calc(100vh-44px-52px)]" : "h-[calc(100vh-42px)] xl:h-[calc(100vh-46px)]")}>
          {!isSidebarHidden && !isMobile && (
            <Sidebar
              loadingState={hasInitiallyLoaded ? "loaded" : loadingState}
              isCollapsed={isCollapsed}
              selectedRailItem={selectedRailItem}
              hoveredRailItem={hoveredRailItem}
              showUserMenu={showUserMenu}
              onRailItemClick={handleRailItemClick}
              onRailItemHover={handleRailItemHover}
              onUserMenuToggle={() => setShowUserMenu(!showUserMenu)}
              onUserMenuClose={() => setShowUserMenu(false)}
              getRailItemSelectedState={getRailItemSelectedState}
              visibleRails={visibleRails}
            />
          )}

          <div className="flex flex-col flex-1 min-w-0">
            <WorkbenchSwitcher />
            <MainContent
              loadingState={hasInitiallyLoaded ? "loaded" : loadingState}
              activeRoute={activeRoute}
            >
              {children}
            </MainContent>
          </div>
        </div>

        {/* Guided tour — auto-starts on first workbench visit */}
        <DemoTourWrapper />

        {/* Navigation Panel Overlay (desktop hover + tablet click) */}
        {!isSidebarHidden && !isMobile && (
          <NavigationPanel
            hoveredRailItem={hoveredRailItem}
            selectedRailItem={selectedRailItem}
            isPanelHovered={isTablet ? tabletPanelOpen : isPanelHovered}
            activeRoute={activeRoute}
            navigationStructure={filteredNavigationStructure}
            onPanelMouseEnter={isTablet ? () => {} : handlePanelMouseEnter}
            onPanelMouseLeave={isTablet ? () => {} : handlePanelMouseLeave}
            onToggleMenu={() => { if (isTablet) { setTabletPanelOpen(false); setHoveredRailItem(null); } else { handleToggleMenu(); } }}
            onNavigationItemClick={handleNavigationItemClick}
          />
        )}

        {/* Tablet backdrop — closes panel when tapping outside */}
        {isTablet && tabletPanelOpen && (
          <div
            className="fixed inset-0 z-20"
            onClick={() => { setTabletPanelOpen(false); setHoveredRailItem(null); }}
          />
        )}

        {/* Mobile Navigation Drawer */}
        {isMobile && (
          <MobileNavDrawer
            open={isMobileNavOpen}
            onOpenChange={setIsMobileNavOpen}
            selectedRailItem={selectedRailItem}
            activeRoute={activeRoute}
            navigationStructure={filteredNavigationStructure}
            onRailItemClick={handleRailItemClick}
            onNavigationItemClick={handleNavigationItemClick}
          />
        )}

        {/* Mobile Bottom Tab Bar */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-white px-1 pb-[env(safe-area-inset-bottom)]"
            style={{ borderColor: 'var(--theme-border)', height: 52 }}
          >
            {visibleRails.map((railKey) => {
              const config = RAIL_CONFIG[railKey];
              const item = { key: railKey, icon: React.cloneElement(config.icon, { size: 20 }), label: config.label === "Automation" ? "Auto" : config.label };
              return item;
            }).map((item) => {
              const isActive = getRailItemSelectedState(item.key);
              return (
                <button
                  key={item.key}
                  onClick={() => handleRailItemClick(item.key)}
                  className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 min-w-0"
                  style={{
                    color: isActive ? 'var(--theme-sidebar-text-active, #1E40AF)' : 'var(--theme-text-secondary, #94a3b8)',
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                  }}
                >
                  {item.icon}
                  <span className="text-[9px] font-medium leading-none truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Live Pin Modal */}
        <LivePinModal
          open={isLivePinModalOpen}
          onClose={handleCloseLivePinModal}
          onAddToLivePins={handleAddToLivePins}
        />

        {/* Create Watch Modal */}
        <CreateWatchModal
          open={isCreateWatchModalOpen}
          onClose={handleCloseCreateWatchModal}
          onSuccess={handleCreateWatch}
          entityId="amazon-001"
          entityName="Amazon"
          params={{ status: "Open", prompt: "" }}
          invoiceData={[]}
        />
      </div>
    </TooltipProvider>
  );
}
