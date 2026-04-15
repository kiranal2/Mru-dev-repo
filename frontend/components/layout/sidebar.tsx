'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Home, BarChart3, RefreshCw, UserCircle2, Settings, LogOut, LayoutGrid, Shield, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { RailItem, RAIL_CONFIG, ALL_RAILS } from '@/lib/navigation';

// Safe auth hook with fallback
const useAuth = () => {
  try {
    // Dynamic import to avoid SSR issues
    const { useAuth: useAuthHook } = require('@/lib/auth-context');
    return useAuthHook();
  } catch (error) {
    console.warn('Auth context not available, using fallback');
    return {
      user: { name: 'User', email: 'user@example.com' },
      logout: () => console.log('Logout not available')
    };
  }
};

interface SidebarProps {
  loadingState: 'loading' | 'loaded';
  isCollapsed: boolean;
  selectedRailItem: RailItem | null;
  hoveredRailItem: RailItem | null;
  showUserMenu: boolean;
  onRailItemClick: (item: RailItem) => void;
  onRailItemHover: (item: RailItem | null) => void;
  onUserMenuToggle: () => void;
  onUserMenuClose: () => void;
  getRailItemSelectedState: (railItem: RailItem) => boolean;
  visibleRails?: RailItem[];
}

export default function Sidebar({
  loadingState,
  isCollapsed,
  selectedRailItem,
  hoveredRailItem,
  showUserMenu,
  onRailItemClick,
  onRailItemHover,
  onUserMenuToggle,
  onUserMenuClose,
  getRailItemSelectedState,
  visibleRails,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    try { localStorage.removeItem("meeru-demo-config"); } catch { /* ignore */ }
    try { logout(); } catch { /* ignore */ }
    onUserMenuClose();
    window.location.href = "/login";
  };

  return (
    <aside
      className={cn(
        "flex flex-col pt-1 xl:pt-2 relative border-r w-16 xl:w-20",
        loadingState === 'loading'
          ? "transition-all duration-300 ease-out opacity-0 -translate-x-4"
          : "transition-none opacity-100 translate-x-0"
      )}
      style={{
        background: 'var(--theme-sidebar-bg)',
        borderColor: 'var(--theme-border)',
      }}
    >
        <nav data-tour-id="sidebar" className="flex flex-col gap-0.5 px-1 xl:px-1.5 [&_svg]:w-[18px] [&_svg]:h-[18px] xl:[&_svg]:w-[22px] xl:[&_svg]:h-[22px]" role="navigation" aria-label="Main navigation">
          {(visibleRails || ALL_RAILS).map((railId) => {
            const config = RAIL_CONFIG[railId];
            return (
              <Tooltip key={railId} delayDuration={150}>
                <TooltipTrigger asChild>
                  <RailButton
                    icon={config.icon}
                    label={config.label}
                    isSelected={getRailItemSelectedState(railId)}
                    isCollapsed={isCollapsed}
                    onClick={() => onRailItemClick(railId)}
                    onMouseEnter={() => onRailItemHover(railId)}
                    onMouseLeave={() => onRailItemHover(null)}
                    tourId={`rail-${railId}`}
                  />
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" align="center" sideOffset={8}>
                    {config.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* Profile Icon at Bottom */}
        <div className="mt-auto mb-2 xl:mb-4 flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="transition-all duration-200 p-2 rounded-lg group"
                style={{ outline: 'none', border: 'none', color: 'var(--theme-sidebar-text)' }}
                aria-label="User profile"
              >
                <UserCircle2 size={18} className="transition-transform duration-200 group-hover:scale-105 xl:[width:22px] xl:[height:22px]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" sideOffset={8} className="w-52">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-semibold">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                try { localStorage.removeItem("meeru-demo-config"); } catch { /* ignore */ }
                window.location.href = "/login";
              }}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Switch Persona
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
  );
}

interface RailButtonProps {
  icon: React.ReactNode;
  label: string;
  isSelected: boolean;
  isCollapsed: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  tourId?: string;
}

const RailButton = React.forwardRef<HTMLButtonElement, RailButtonProps>(
  function RailButton({ icon, label, isSelected, isCollapsed, onClick, onMouseEnter, onMouseLeave, tourId, ...rest }, ref) {
  return (
    <button
      ref={ref}
      data-tour-id={tourId}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "flex flex-col items-center justify-center aspect-square w-full relative group transition-all duration-200 ease-out rounded-lg"
      )}
      style={{
        color: isSelected ? 'var(--theme-sidebar-text-active)' : 'var(--theme-sidebar-text)',
        background: isSelected ? 'var(--theme-sidebar-active-bg)' : 'transparent',
        outline: 'none',
        border: 'none',
      }}
      onMouseOver={(e) => { if (!isSelected) { e.currentTarget.style.background = 'var(--theme-sidebar-active-bg)'; e.currentTarget.style.color = 'var(--theme-sidebar-text-active)'; } }}
      onMouseOut={(e) => { if (!isSelected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--theme-sidebar-text)'; } }}
      aria-label={label}
      aria-current={isSelected ? "page" : undefined}
      {...rest}
    >
      {/* Hover indicator bar */}
      {!isSelected && (
        <span
          className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300 opacity-0 group-hover:opacity-40"
          style={{ background: 'var(--theme-sidebar-indicator)' }}
        />
      )}
      <span className="transition-transform duration-200">
        {icon}
      </span>
      {!isCollapsed && (
        <span className="text-[10px] font-medium mt-1 transition-colors duration-200" style={{ color: 'inherit' }}>
          {label}
        </span>
      )}
    </button>
  );
});
