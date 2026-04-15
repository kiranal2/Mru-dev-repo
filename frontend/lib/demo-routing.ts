import type { Persona } from "@/lib/persona-context";
import type { RailItem, NavigationItem } from "@/lib/navigation";

/** Rails each persona should see (others are hidden) */
const PERSONA_RAILS: Record<Persona, RailItem[]> = {
  cfo: ["home", "decision-intelligence", "close-intelligence", "reports", "workbench"],
  "cao": ["home", "decision-intelligence", "close-intelligence", "reports", "workbench"],
  "cao-controller": ["home", "close-intelligence", "decision-intelligence", "reports", "workbench", "automation"],
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
    reports: null,
    workbench: null,
  },
  "cao": {
    home: null,
    "decision-intelligence": null,
    "close-intelligence": null,
    reports: null,
    workbench: null,
  },
  "cao-controller": {
    home: null,
    "close-intelligence": null,
    "decision-intelligence": null,
    automation: null,
    reports: null,
    workbench: null,
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
  if (!persona) return true;
  return PERSONA_RAILS[persona].includes(rail);
}

/** Filter navigation items for a given persona within a rail */
export function filterNavigationItems(
  persona: Persona | null,
  rail: RailItem,
  items: NavigationItem[]
): NavigationItem[] {
  if (!persona) return items;
  const allowedIds = PERSONA_NAV_ITEMS[persona]?.[rail];
  if (allowedIds === null || allowedIds === undefined) return items;
  return items.filter((item) => allowedIds.includes(item.id));
}

/** Persona display labels */
export const PERSONA_LABELS: Record<Persona, string> = {
  cfo: "CFO",
  "cao": "CAO",
  "cao-controller": "Controller",
};
