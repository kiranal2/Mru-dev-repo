"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, User } from "lucide-react";
import { getRoleDisplayInfo } from "@/lib/permissions";
import { getSession, logoutAdmin, type IGRSSession } from "@/lib/ai-chat-intelligence/auth";

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [igrsSession, setIgrsSession] = useState<IGRSSession | null>(null);

  // Check for IGRS localStorage session on mount
  useEffect(() => {
    setIgrsSession(getSession());
  }, []);

  // If neither Supabase user nor IGRS session, show login button
  if (!user && !igrsSession) {
    return (
      //   <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
      //     Login
      //   </Button>
      <></>
    );
  }

  // IGRS session (admin via landing page login)
  if (!user && igrsSession) {
    const handleIGRSLogout = () => {
      logoutAdmin();
      setIgrsSession(null);
      router.push("/ai-chat-intelligence/login");
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-auto px-2 py-1 rounded-full gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#1a365d] text-white text-xs font-semibold">
                IA
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-xs font-medium text-slate-700">{igrsSession.name}</span>
              <span className="text-[10px] text-slate-400">Admin</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{igrsSession.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{igrsSession.email}</p>
              <div className="pt-1">
                <Badge variant="secondary" className="text-xs">
                  IGRS Admin
                </Badge>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleIGRSLogout}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Original Supabase user flow
  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const roleInfo = getRoleDisplayInfo(user.role);
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-slate-200 text-slate-700 font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            <div className="pt-1">
              <Badge variant="secondary" className="text-xs">
                {roleInfo.label}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
