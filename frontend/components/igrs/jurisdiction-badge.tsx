"use client";

import { useIGRSRole } from "@/lib/ai-chat-intelligence/role-context";

const BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  IG: { label: "Viewing: All AP", className: "bg-violet-50 text-violet-700 border-violet-200" },
  DIG: { label: "Viewing: {zone} Zone", className: "bg-blue-50 text-blue-700 border-blue-200" },
  DR: { label: "Viewing: {district}", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  SR: { label: "Viewing: {srName}", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

export function JurisdictionBadge() {
  const { session } = useIGRSRole();
  if (!session) return null;

  const config = BADGE_CONFIG[session.role];
  if (!config) return null;

  let label = config.label;
  label = label.replace("{zone}", session.jurisdiction.zone ?? "");
  label = label.replace("{district}", session.jurisdiction.district ?? "");
  label = label.replace("{srName}", session.jurisdiction.srName ?? session.jurisdiction.srCode ?? "");

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20M2 12h20" />
      </svg>
      {label}
    </span>
  );
}
