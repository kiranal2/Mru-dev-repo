import type { Persona } from "@/lib/persona-context";
import type { RailItem, NavigationItem } from "@/lib/navigation";

/** Rails each persona should see (others are hidden) */
const PERSONA_RAILS: Record<Persona, RailItem[]> = {
  cfo: ["home", "decision-intelligence", "close-intelligence", "admin"],
  "cao": ["home", "decision-intelligence", "close-intelligence", "admin"],
  "cao-controller": ["home", "close-intelligence", "decision-intelligence", "automation", "admin"],
};

/** Primary rail for each persona (auto-selected on login) */
const PERSONA_PRIMARY_RAIL: Record<Persona, RailItem> = {
  cfo: "home",
  "cao": "home",
  "cao-controller": "home",
};

/**
 * Navigation item IDs each persona should see within each rail.
 * null = show all items (no filtering for that rail).
 */
const PERSONA_NAV_ITEMS: Record<Persona, Partial<Record<RailItem, string[] | null>>> = {
  cfo: {
    home: null,
    "decision-intelligence": null,
    "close-intelligence": null,
    admin: null,
  },
  "cao": {
    home: null,
    "decision-intelligence": null,
    "close-intelligence": null,
    admin: null,
  },
  "cao-controller": {
    home: null,
    "close-intelligence": null,
    "decision-intelligence": null,
    automation: null,
    admin: null,
  },
};

/** Get the rail items relevant to a persona */
export function getPersonaRails(persona: Persona): RailItem[] {
  return PERSONA_RAILS[persona];
}

/** Get the primary rail for a persona */
export function getPersonaPrimaryRail(persona: Persona): RailItem {
  return PERSONA_PRIMARY_RAIL[persona];
}

/** Check if a rail is relevant for the given persona */
export function isRailRelevant(persona: Persona | null, rail: RailItem): boolean {
  if (!persona) {
    // If no persona yet, try reading from localStorage directly
    try {
      const stored = localStorage.getItem("meeru-demo-config");
      if (stored) {
        const config = JSON.parse(stored);
        if (config.persona && PERSONA_RAILS[config.persona as Persona]) {
          return PERSONA_RAILS[config.persona as Persona].includes(rail);
        }
      }
    } catch { /* ignore */ }
    // Fallback: show minimal set
    return ["home", "decision-intelligence", "close-intelligence", "admin"].includes(rail);
  }
  return PERSONA_RAILS[persona].includes(rail);
}

/** Filter navigation items for a given persona within a rail */
export function filterNavigationItems(
  persona: Persona | null,
  rail: RailItem,
  items: NavigationItem[]
): NavigationItem[] {
  let effectivePersona = persona;
  if (!effectivePersona) {
    try {
      const stored = localStorage.getItem("meeru-demo-config");
      if (stored) {
        const config = JSON.parse(stored);
        if (config.persona) effectivePersona = config.persona as Persona;
      }
    } catch { /* ignore */ }
  }
  if (!effectivePersona) return items;
  const allowedIds = PERSONA_NAV_ITEMS[effectivePersona]?.[rail];
  if (allowedIds === null || allowedIds === undefined) return items;
  return items.filter((item) => allowedIds.includes(item.id));
}

/** Persona display labels */
export const PERSONA_LABELS: Record<Persona, string> = {
  cfo: "CFO",
  "cao": "CAO",
  "cao-controller": "Controller",
};
