"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import React from "react";
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
import { LogOut, User, RotateCcw } from "lucide-react";
import { getRoleDisplayInfo } from "@/lib/permissions";
import { PERSONA_LABELS } from "@/lib/demo-routing";
import type { Persona } from "@/lib/persona-context";

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Read persona from localStorage
  const [demoPersona, setDemoPersona] = React.useState<string | null>(null);
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("meeru-demo-config");
      if (stored) {
        const config = JSON.parse(stored);
        setDemoPersona(config.persona || null);
      }
    } catch { /* ignore */ }
  }, []);

  if (!user) {
    return <></>;
  }

  const handleLogout = async () => {
    // Clear persona/demo config
    try {
      localStorage.removeItem("meeru-demo-config");
    } catch { /* ignore */ }

    // Clear auth session
    await logout();

    // Redirect to login
    router.push("/login");
  };

  const handleSwitchPersona = () => {
    // Clear persona config but keep auth session
    try {
      localStorage.removeItem("meeru-demo-config");
    } catch { /* ignore */ }
    setDemoPersona(null);
    router.push("/login");
  };

  const roleInfo = getRoleDisplayInfo(user.role);
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const personaLabel = demoPersona
    ? PERSONA_LABELS[demoPersona as Persona]
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 xl:h-10 xl:w-10 rounded-full">
          <Avatar className="h-8 w-8 xl:h-10 xl:w-10">
            <AvatarFallback className="bg-slate-200 text-slate-700 font-semibold text-xs xl:text-sm">
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
            <div className="flex items-center gap-1.5 pt-1">
              <Badge variant="secondary" className="text-xs">
                {roleInfo.label}
              </Badge>
              {personaLabel && (
                <Badge variant="outline" className="text-xs border-[#B8860B]/30 text-[#B8860B]">
                  {personaLabel}
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        {personaLabel && (
          <DropdownMenuItem onClick={handleSwitchPersona}>
            <RotateCcw className="mr-2 h-4 w-4" />
            <span>Switch Persona</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
