"use client";

import { useState } from "react";
import { Bell, CheckCheck, Info, AlertTriangle, ShieldAlert, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "alert" | "success";
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n-001",
    title: "New high-risk case detected",
    description:
      "Case RL-2024-0019 flagged with Revenue Gap signal — ₹45,000 gap at SR01 Vijayawada Central.",
    time: "2 min ago",
    read: false,
    type: "alert",
  },
  {
    id: "n-002",
    title: "Detection run completed",
    description: "1,247 documents scanned, 18 new cases flagged across 6 offices.",
    time: "15 min ago",
    read: false,
    type: "info",
  },
  {
    id: "n-003",
    title: "SLA breach warning",
    description: "3 cases approaching SLA deadline — review required within 24 hours.",
    time: "1 hr ago",
    read: false,
    type: "warning",
  },
  {
    id: "n-004",
    title: "MV trend anomaly",
    description: "Unit rate drop of 22% detected in Tirupati North (SR02) for rural properties.",
    time: "3 hrs ago",
    read: true,
    type: "warning",
  },
  {
    id: "n-005",
    title: "Export ready",
    description: "High Risk Cases CSV export is ready for download — 24 records.",
    time: "5 hrs ago",
    read: true,
    type: "success",
  },
];

const typeIcon: Record<Notification["type"], React.ReactNode> = {
  info: <Info className="w-4 h-4 text-blue-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  alert: <ShieldAlert className="w-4 h-4 text-red-500" />,
  success: <CheckCheck className="w-4 h-4 text-emerald-500" />,
};

const typeBg: Record<Notification["type"], string> = {
  info: "bg-blue-50",
  warning: "bg-amber-50",
  alert: "bg-red-50",
  success: "bg-emerald-50",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Bell className="h-[18px] w-[18px] text-[#64748B]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[380px] p-0" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-slate-900">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`w-full text-left px-4 py-3 flex gap-3 border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50 ${
                !n.read ? "bg-blue-50/40" : ""
              }`}
            >
              <div
                className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${typeBg[n.type]}`}
              >
                {typeIcon[n.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm leading-tight ${!n.read ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}
                  >
                    {n.title}
                  </p>
                  {!n.read && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.description}</p>
                <p className="text-[11px] text-slate-400 mt-1">{n.time}</p>
              </div>
            </button>
          ))}
          {notifications.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">No notifications</div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
