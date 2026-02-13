'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Home, BarChart3, RefreshCw, UserCircle2, Settings, LogOut, LayoutGrid } from 'lucide-react';
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
        "bg-[#F2FDFF] flex flex-col pt-4 relative",
        isCollapsed ? "w-[72px]" : "w-[72px]",
        loadingState === 'loading' 
          ? "transition-all duration-300 ease-out opacity-0 -translate-x-4" 
          : "transition-none opacity-100 translate-x-0"
      )}>
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
                label="Automate"
                isSelected={getRailItemSelectedState('automation')}
                isCollapsed={isCollapsed}
                onClick={() => onRailItemClick('automation')}
                onMouseEnter={() => onRailItemHover('automation')}
                onMouseLeave={() => onRailItemHover(null)}
              />
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" align="center" sideOffset={8}>
                Automate
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <RailButton
                icon={<LayoutGrid size={22} />}
                label="WorkBench"
                isSelected={getRailItemSelectedState('workbench')}
                isCollapsed={isCollapsed}
                onClick={() => onRailItemClick('workbench')}
                onMouseEnter={() => onRailItemHover('workbench')}
                onMouseLeave={() => onRailItemHover(null)}
              />
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" align="center" sideOffset={8}>
                WorkBench
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
                Financials
              </TooltipContent>
            )}
          </Tooltip>
        </nav>

        {/* Profile Icon at Bottom */}
        <div className="mt-auto mb-4 flex justify-center">
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                className="text-[#0A3B77] hover:bg-[#CDE4FF] transition-colors duration-200 p-2 rounded-lg relative"
                style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                aria-label="User profile"
                onClick={(e) => {
                  e.stopPropagation();
                  onUserMenuToggle();
                }}
              >
                <UserCircle2 size={22} />
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#F2FDFF] rounded-lg py-2 z-50" style={{ outline: 'none', border: 'none', boxShadow: 'none' }}>
                    <div className="px-4 py-2">
                      <p className="text-sm font-medium text-[#0A3B77]">{user?.name || 'User'}</p>
                      <p className="text-xs text-[#0A3B77] opacity-70">{user?.email}</p>
                    </div>
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-[#0A3B77] hover:bg-[#CDE4FF] flex items-center transition-colors"
                      style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUserMenuClose();
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-[#0A3B77] hover:bg-[#CDE4FF] flex items-center transition-colors"
                      style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        logout();
                        onUserMenuClose();
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
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
        "flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors duration-200 relative",
        isSelected 
          ? "text-[#0A3B77] bg-[#CDE4FF]" 
          : "text-[#0A3B77] hover:bg-[#CDE4FF]"
      )}
      style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
      aria-label={label}
      aria-current={isSelected ? "page" : undefined}
    >
      {icon}
      {!isCollapsed && <span className="text-xs">{label}</span>}
    </button>
  );
}
