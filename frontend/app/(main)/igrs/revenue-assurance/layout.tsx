"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const IGRS_TABS = [
  { label: "AI Chat", path: "/igrs/revenue-assurance/ai-chat" },
  { label: "Overview", path: "/igrs/revenue-assurance/overview" },
  { label: "Cases", path: "/igrs/revenue-assurance/cases" },
  { label: "Rules", path: "/igrs/revenue-assurance/rules" },
  { label: "Insights", path: "/igrs/revenue-assurance/insights" },
  { label: "Patterns", path: "/igrs/revenue-assurance/patterns" },
  { label: "Exports", path: "/igrs/revenue-assurance/exports" },
  { label: "Admin", path: "/igrs/revenue-assurance/admin" },
];

export default function RevenueAssuranceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b">
        <div className="px-6 pt-3 pb-1">
          <h1 className="text-base font-bold text-slate-900">
            Revenue Intelligence &amp; Leakage Detection System
          </h1>
        </div>
        <div className="px-6 pb-2 pt-1">
          <div className="flex items-center gap-1">
            {IGRS_TABS.map((tab) => {
              const isActive = pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  href={tab.path}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
