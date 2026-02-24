"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { IGRSSession, loginIGRS, getSession, logoutAdmin } from "./auth";

// Zone → districts mapping for jurisdiction checks
const ZONE_DISTRICTS: Record<string, string[]> = {
  South: ["Krishna", "Guntur", "Chittoor", "Prakasam", "Nellore"],
  North: ["Visakhapatnam", "East Godavari", "West Godavari"],
  Central: ["Kurnool", "Anantapur"],
};

// Zone → SRO codes mapping
const ZONE_SROS: Record<string, string[]> = {
  South: ["SR01", "SR02", "SR03", "SR08", "SR09"],
  North: ["SR05", "SR06", "SR07"],
  Central: ["SR04", "SR10"],
};

interface IGRSRoleContextValue {
  session: IGRSSession | null;
  isLoading: boolean;
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  isInJurisdiction: (district?: string, srCode?: string) => boolean;
}

const IGRSRoleContext = createContext<IGRSRoleContextValue | null>(null);

export function IGRSRoleProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<IGRSSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setSession(getSession());
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    const result = loginIGRS(email, password);
    if (result.ok) {
      setSession(getSession());
    }
    return result;
  };

  const logout = () => {
    logoutAdmin();
    setSession(null);
  };

  const isInJurisdiction = (district?: string, srCode?: string): boolean => {
    if (!session) return false;

    switch (session.role) {
      case "IG":
        // State-wide — everything is in scope
        return true;

      case "DIG": {
        const zone = session.jurisdiction.zone;
        if (!zone) return true;
        const zoneDistricts = ZONE_DISTRICTS[zone] || [];
        const zoneSros = ZONE_SROS[zone] || [];
        if (district && !zoneDistricts.includes(district)) return false;
        if (srCode && !zoneSros.includes(srCode)) return false;
        return true;
      }

      case "DR": {
        if (district && district !== session.jurisdiction.district) return false;
        // DR can see all SROs within their district
        return true;
      }

      case "SR": {
        if (srCode && srCode !== session.jurisdiction.srCode) return false;
        if (district && district !== session.jurisdiction.district) return false;
        return true;
      }

      default:
        return false;
    }
  };

  return (
    <IGRSRoleContext.Provider value={{ session, isLoading, login, logout, isInJurisdiction }}>
      {children}
    </IGRSRoleContext.Provider>
  );
}

export function useIGRSRole() {
  const ctx = useContext(IGRSRoleContext);
  if (!ctx) throw new Error("useIGRSRole must be used within IGRSRoleProvider");
  return ctx;
}
