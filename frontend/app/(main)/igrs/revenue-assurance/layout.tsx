"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { IGRSRoleProvider, useIGRSRole } from "@/lib/ai-chat-intelligence/role-context";

const IGRS_TABS = [
  { label: "AI Chat", path: "/igrs/revenue-assurance/ai-chat" },
  { label: "Overview", path: "/igrs/revenue-assurance/overview" },
  { label: "Cases", path: "/igrs/revenue-assurance/cases" },
  { label: "Insights", path: "/igrs/revenue-assurance/insights" },
  { label: "Patterns", path: "/igrs/revenue-assurance/patterns" },
  { label: "MV Trends", path: "/igrs/revenue-assurance/mv-trends" },
  { label: "Governance", path: "/igrs/revenue-assurance/governance" },
  { label: "AI Intelligence", path: "/igrs/revenue-assurance/ai-intelligence" },
  { label: "Escalations", path: "/igrs/revenue-assurance/escalations" },
  { label: "Admin", path: "/igrs/revenue-assurance/admin" },
];

// Role icon SVG for header badge
const ShieldIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

function getJurisdictionLabel(session: NonNullable<ReturnType<typeof useIGRSRole>["session"]>): string {
  switch (session.role) {
    case "IG": return "State of Andhra Pradesh";
    case "DIG": return `${session.jurisdiction.zone} Zone`;
    case "DR": return `${session.jurisdiction.district} District`;
    case "SR": return `${session.jurisdiction.srCode} – ${session.jurisdiction.srName}`;
    default: return "";
  }
}

function RevenueAssuranceInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useIGRSRole();

  const handleLogout = () => {
    logout();
    router.push("/ai-chat-intelligence/login");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b">
        <div className="px-6 pt-3 pb-1 flex items-center justify-between">
          <h1 className="text-base font-bold text-slate-900">
            Revenue Intelligence &amp; Leakage Detection System
          </h1>

          {/* Role Badge */}
          {session && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-600">{ShieldIcon}</span>
                <span className="text-xs font-semibold text-slate-700">
                  {session.designation}
                </span>
                <span className="text-[10px] text-slate-400">·</span>
                <span className="text-[10px] text-slate-500">
                  {getJurisdictionLabel(session)}
                </span>
              </div>
              <Link
                href="/ai-chat-intelligence/login"
                className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
              >
                Switch Role
              </Link>
              <button
                onClick={handleLogout}
                className="text-[10px] text-red-500 hover:text-red-700 font-medium"
              >
                Logout
              </button>
            </div>
          )}
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

export default function RevenueAssuranceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <IGRSRoleProvider>
      <RevenueAssuranceInner>{children}</RevenueAssuranceInner>
    </IGRSRoleProvider>
  );
}
