"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IGRSRoleProvider, useIGRSRole } from "@/lib/ai-chat-intelligence/role-context";

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
  const router = useRouter();
  const { session, logout } = useIGRSRole();

  const handleLogout = () => {
    logout();
    router.push("/ai-chat-intelligence/login");
  };

  return (
    <div className="h-full flex flex-col">
      {session && (
        <div className="bg-white border-b px-6 py-2 flex items-center justify-end">
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
        </div>
      )}
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
