'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Home, BarChart3, RefreshCw, UserCircle2, Settings, LogOut, LayoutGrid, Shield, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RailItem } from '@/lib/navigation';

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
  getRailItemSelectedState
}: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className={cn(
        "flex flex-col pt-4 relative border-r border-[#0A3B77]/5",
        isCollapsed ? "w-[72px]" : "w-[72px]",
        loadingState === 'loading'
          ? "transition-all duration-300 ease-out opacity-0 -translate-x-4"
          : "transition-none opacity-100 translate-x-0"
      )}
      style={{
        background: 'linear-gradient(180deg, #F2FDFF 0%, #E8F4FF 40%, #DCEEFF 100%)',
      }}
    >
        <nav className="flex flex-col gap-1" role="navigation" aria-label="Main navigation">
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <RailButton
                icon={<Home size={22} />}
                label="Home"
                isSelected={getRailItemSelectedState('home')}
                isCollapsed={isCollapsed}
                onClick={() => onRailItemClick('home')}
                onMouseEnter={() => onRailItemHover('home')}
                onMouseLeave={() => onRailItemHover(null)}
              />
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" align="center" sideOffset={8}>
                Home
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <RailButton
                icon={<RefreshCw size={22} />}
                label="Automation"
                isSelected={getRailItemSelectedState('automation')}
                isCollapsed={isCollapsed}
                onClick={() => onRailItemClick('automation')}
                onMouseEnter={() => onRailItemHover('automation')}
                onMouseLeave={() => onRailItemHover(null)}
              />
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" align="center" sideOffset={8}>
                Automation
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <RailButton
                icon={<BarChart3 size={22} />}
                label="Reports"
                isSelected={getRailItemSelectedState('reports')}
                isCollapsed={isCollapsed}
                onClick={() => onRailItemClick('reports')}
                onMouseEnter={() => onRailItemHover('reports')}
                onMouseLeave={() => onRailItemHover(null)}
              />
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" align="center" sideOffset={8}>
                Reports
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <RailButton
                icon={<LayoutGrid size={22} />}
                label="Workbench"
                isSelected={getRailItemSelectedState('workbench')}
                isCollapsed={isCollapsed}
                onClick={() => onRailItemClick('workbench')}
                onMouseEnter={() => onRailItemHover('workbench')}
                onMouseLeave={() => onRailItemHover(null)}
              />
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" align="center" sideOffset={8}>
                Workbench
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <RailButton
                icon={<Landmark size={22} />}
                label="IGRS"
                isSelected={getRailItemSelectedState('igrs')}
                isCollapsed={isCollapsed}
                onClick={() => onRailItemClick('igrs')}
                onMouseEnter={() => onRailItemHover('igrs')}
                onMouseLeave={() => onRailItemHover(null)}
              />
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" align="center" sideOffset={8}>
                IGRS
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <RailButton
                icon={<Shield size={22} />}
                label="Admin"
                isSelected={getRailItemSelectedState('admin')}
                isCollapsed={isCollapsed}
                onClick={() => onRailItemClick('admin')}
                onMouseEnter={() => onRailItemHover('admin')}
                onMouseLeave={() => onRailItemHover(null)}
              />
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" align="center" sideOffset={8}>
                Admin
              </TooltipContent>
            )}
          </Tooltip>
        </nav>

        {/* Profile Icon at Bottom */}
        <div className="mt-auto mb-4 flex justify-center">
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                className="text-[#0A3B77]/70 hover:text-[#0A3B77] hover:bg-white/40 transition-all duration-200 p-2 rounded-lg relative group"
                style={{ outline: 'none', border: 'none' }}
                aria-label="User profile"
                onClick={(e) => {
                  e.stopPropagation();
                  onUserMenuToggle();
                }}
              >
                <UserCircle2 size={22} className="transition-transform duration-200 group-hover:scale-105" />
                {showUserMenu && (
                  <div
                    className="absolute left-full top-auto bottom-0 ml-2 w-52 rounded-xl py-2 z-50 shadow-elevation-3 border border-white/60 animate-scale-in"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(242,253,255,0.95) 100%)',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <div className="px-4 py-2.5 border-b border-[#0A3B77]/5">
                      <p className="text-sm font-semibold text-[#0A3B77]">{user?.name || 'User'}</p>
                      <p className="text-xs text-[#0A3B77]/60 mt-0.5">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-[#0A3B77]/80 hover:text-[#0A3B77] hover:bg-[#0A3B77]/5 flex items-center transition-all duration-150 rounded-md mx-1"
                        style={{ outline: 'none', border: 'none', width: 'calc(100% - 8px)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUserMenuClose();
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2.5" />
                        Settings
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-red-600/80 hover:text-red-600 hover:bg-red-50 flex items-center transition-all duration-150 rounded-md mx-1"
                        style={{ outline: 'none', border: 'none', width: 'calc(100% - 8px)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          logout();
                          onUserMenuClose();
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2.5" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" sideOffset={8}>
              Profile
            </TooltipContent>
          </Tooltip>
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
}

function RailButton({ icon, label, isSelected, isCollapsed, onClick, onMouseEnter, onMouseLeave }: RailButtonProps) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg relative group",
        "transition-all duration-200 ease-out",
        isSelected
          ? "text-[#0A3B77] bg-white/70 shadow-elevation-1"
          : "text-[#0A3B77]/70 hover:text-[#0A3B77] hover:bg-white/40"
      )}
      style={{ outline: 'none', border: 'none' }}
      aria-label={label}
      aria-current={isSelected ? "page" : undefined}
    >
      {/* Active indicator bar */}
      <span
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300",
          isSelected
            ? "h-[60%] opacity-100"
            : "h-0 opacity-0 group-hover:h-[40%] group-hover:opacity-50"
        )}
        style={{ background: 'var(--gradient-primary)' }}
      />
      <span className={cn(
        "transition-transform duration-200",
        isSelected ? "scale-110" : "group-hover:scale-105"
      )}>
        {icon}
      </span>
      {!isCollapsed && (
        <span className={cn(
          "text-[10px] font-medium transition-opacity duration-200",
          isSelected ? "opacity-100" : "opacity-70 group-hover:opacity-100"
        )}>
          {label}
        </span>
      )}
    </button>
  );
}
