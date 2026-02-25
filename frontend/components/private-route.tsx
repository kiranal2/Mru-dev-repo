"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";
import { Menu, MenuItem } from "@/router/Menu";
import { extractCurrentLocation } from "@/utils/extract-current-location";
import PageForbidden from "@/app/ErrorPages/PageForbidden";
import { FIRST_PAGE_PATH, LOGIN_PATH, ROOT_PATH } from "@/conf/conf";

// Utility function to flatten menu items
const flattenMenuItems = (items: MenuItem[]): MenuItem[] => {
  return items.flatMap((item) =>
    item.tabsList ? [item, ...flattenMenuItems(item.tabsList)] : [item]
  );
};

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [showForbidden, setShowForbidden] = useState(false);
  const { hasPermission, isLoggedIn } = usePermission();

  //current location extraction
  const currentLocation = useMemo(() => extractCurrentLocation(pathname), [pathname]);

  //flattened menu to prevent unnecessary recalculations
  const flatMenu = useMemo(() => flattenMenuItems(Menu).filter((item) => !item.tabsList), []);

  //the current menu item lookup
  const currentMenu = useMemo(
    () => flatMenu.find((item) => item.path === currentLocation),
    [flatMenu, currentLocation]
  );

  // Find the first accessible page for the user
  const findFirstAccessiblePage = useCallback(() => {
    // Prioritize FIRST_PAGE_PATH as the main page
    const landingPage = flatMenu.find((item) => item.path === FIRST_PAGE_PATH);
    if (landingPage && hasPermission(landingPage.permission, landingPage.subPermission)) {
      return `/${FIRST_PAGE_PATH}`;
    }

    // Find the first accessible page
    const accessiblePage = flatMenu.find((item) =>
      hasPermission(item.permission, item.subPermission)
    );
    return accessiblePage ? `/${accessiblePage.path}` : null;
  }, [flatMenu, hasPermission]);

  // Handle root path redirect
  const handleRootPathRedirect = useCallback(() => {
    const firstAccessiblePage = findFirstAccessiblePage();
    if (firstAccessiblePage) {
      router.push(firstAccessiblePage);
      return true; // Indicates redirect was handled
    }
    return false; // No accessible page found
  }, [findFirstAccessiblePage, router]);

  // Check permissions for current location
  const checkCurrentLocationPermissions = useCallback(() => {
    if (!currentMenu) {
      // Fallback: check if any menu item with similar path structure has permission
      const similarPath = flatMenu.find((item) => {
        // Check if the current path starts with the menu item path
        return currentLocation.startsWith(item.path) || item.path.startsWith(currentLocation);
      });

      if (similarPath) {
        return hasPermission(similarPath.permission, similarPath.subPermission);
      }

      // Allow access for paths not registered in Menu (demo mode)
      // In production, this should return false
      return true;
    }

    return hasPermission(currentMenu.permission, currentMenu.subPermission);
  }, [currentMenu, hasPermission, currentLocation, flatMenu]);

  // Main validation logic
  const validateAccess = useCallback(() => {
    // Handle unauthenticated users
    if (!isLoggedIn) {
      router.push(LOGIN_PATH);
      return;
    }

    // Handle root path
    if (currentLocation === ROOT_PATH) {
      const redirectHandled = handleRootPathRedirect();
      if (!redirectHandled) {
        setShowForbidden(true);
      }
      return;
    }

    // Check permissions for current location
    const hasAccess = checkCurrentLocationPermissions();
    setShowForbidden(!hasAccess);
  }, [
    isLoggedIn,
    currentLocation,
    handleRootPathRedirect,
    checkCurrentLocationPermissions,
    router,
  ]);

  // Effect to validate access when dependencies change
  useEffect(() => {
    validateAccess();
  }, [validateAccess]);

  // Early return for forbidden access
  if (showForbidden) {
    return <PageForbidden />;
  }

  return <>{children}</>;
};

export { PrivateRoute };
export default PrivateRoute;
