"use client";

import React, { useState, useEffect, useRef, startTransition } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

// Layout Components
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import NavigationPanel from "@/components/layout/navigation-panel";
import MainContent from "@/components/layout/main-content";

// UI Components
import LivePinModal from "@/components/ui/live-pin-modal";
import { CreateWatchModal } from "@/components/ui/create-watch-modal";

// Navigation
import { NAVIGATION_STRUCTURE, RailItem } from "@/lib/navigation";

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
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const [hoveredRailItem, setHoveredRailItem] = useState<RailItem | null>(null);
  const [isPanelHovered, setIsPanelHovered] = useState(false);
  const [isLivePinModalOpen, setIsLivePinModalOpen] = useState(false);
  const [isCreateWatchModalOpen, setIsCreateWatchModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const hoverClearTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (savedRailItem && ["home", "automation", "reports", "workbench", "igrs", "admin"].includes(savedRailItem)) {
      setSelectedRailItem(savedRailItem as RailItem);
    }
  }, []);

  // Save rail selection to localStorage
  useEffect(() => {
    if (selectedRailItem) {
      localStorage.setItem("meeru-selected-rail", selectedRailItem);
    }
  }, [selectedRailItem]);

  // Handle responsive collapse
  useEffect(() => {
    const handleResize = () => {
      setIsCollapsed(window.innerWidth <= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync selected rail item with current route
  useEffect(() => {
    if (pathname) {
      if (pathname.startsWith("/home/")) {
        setSelectedRailItem("home");
      } else if (pathname.startsWith("/automation/")) {
        setSelectedRailItem("automation");
      } else if (pathname.startsWith("/reports/")) {
        setSelectedRailItem("reports");
      } else if (pathname.startsWith("/workbench/")) {
        setSelectedRailItem("workbench");
      } else if (pathname.startsWith("/igrs/")) {
        setSelectedRailItem("igrs");
      } else if (pathname.startsWith("/admin/")) {
        setSelectedRailItem("admin");
      }
    }
  }, [pathname]);

  // One-time panel open for IGRS login redirect flow.
  useEffect(() => {
    if (!pathname?.startsWith("/igrs/")) return;
    try {
      const shouldOpenPanel = localStorage.getItem("igrs-open-panel-default");
      if (shouldOpenPanel === "1") {
        setSelectedRailItem("igrs");
        setHoveredRailItem("igrs");
        localStorage.removeItem("igrs-open-panel-default");
      }
    } catch {
      // no-op
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
    setSelectedRailItem(item);
    // Set hoveredRailItem to show panel immediately when clicking
    setHoveredRailItem(item);
    const defaultRoutes: Record<RailItem, string> = {
      home: "/home/command-center",
      automation: "/automation/data-templates",
      reports: "/reports/sec/balance-sheet",
      workbench: "/workbench/order-to-cash/cash-application",
      igrs: "/igrs/revenue-assurance/overview",
      admin: "/admin/users",
    };
    const route = defaultRoutes[item];
    startTransition(() => {
      router.push(route);
    });
  };

  const getRailItemSelectedState = (railItem: RailItem) => {
    if (hoveredRailItem === railItem) return true;
    if (selectedRailItem === railItem) return true;
    return activeRoute.startsWith(`/${railItem}`);
  };

  const handleNavigationItemClick = (route: string) => {
    // Determine which rail item this route belongs to and set it as selected
    let railItem: RailItem | null = null;
    if (route.startsWith("/home/")) {
      railItem = "home";
      setSelectedRailItem("home");
    } else if (route.startsWith("/automation/")) {
      railItem = "automation";
      setSelectedRailItem("automation");
    } else if (route.startsWith("/reports/")) {
      railItem = "reports";
      setSelectedRailItem("reports");
    } else if (route.startsWith("/workbench/")) {
      railItem = "workbench";
      setSelectedRailItem("workbench");
    } else if (route.startsWith("/igrs/")) {
      railItem = "igrs";
      setSelectedRailItem("igrs");
    } else if (route.startsWith("/admin/")) {
      railItem = "admin";
      setSelectedRailItem("admin");
    }

    // Keep the hoveredRailItem set to the clicked rail item to maintain panel visibility
    // This prevents the panel from switching back to the previous rail item
    if (railItem) {
      setHoveredRailItem(railItem);
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

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white font-[Inter,system-ui,sans-serif]">
        <Header loadingState={hasInitiallyLoaded ? "loaded" : loadingState} />

        <div className="flex min-h-[calc(100vh-57px)]">
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
          />

          <MainContent
            loadingState={hasInitiallyLoaded ? "loaded" : loadingState}
            activeRoute={activeRoute}
          >
            {children}
          </MainContent>
        </div>

        {/* Navigation Panel Overlay */}
        <NavigationPanel
          hoveredRailItem={hoveredRailItem}
          selectedRailItem={selectedRailItem}
          isPanelHovered={isPanelHovered}
          activeRoute={activeRoute}
          navigationStructure={NAVIGATION_STRUCTURE}
          onPanelMouseEnter={handlePanelMouseEnter}
          onPanelMouseLeave={handlePanelMouseLeave}
          onToggleMenu={handleToggleMenu}
          onNavigationItemClick={handleNavigationItemClick}
        />

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
