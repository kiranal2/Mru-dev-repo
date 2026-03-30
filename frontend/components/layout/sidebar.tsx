'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Home, BarChart3, RefreshCw, UserCircle2, Settings, LogOut, LayoutGrid, Shield } from 'lucide-react';
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
        "flex flex-col pt-5 relative border-r",
        isCollapsed ? "w-20" : "w-20",
        loadingState === 'loading'
          ? "transition-all duration-300 ease-out opacity-0 -translate-x-4"
          : "transition-none opacity-100 translate-x-0"
      )}
      style={{
        background: 'var(--theme-sidebar-bg)',
        borderColor: 'var(--theme-border)',
      }}
    >
        <nav className="flex flex-col gap-0.5 px-1.5" role="navigation" aria-label="Main navigation">
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
                className="transition-all duration-200 p-2 rounded-lg relative group"
                style={{ outline: 'none', border: 'none', color: 'var(--theme-sidebar-text)' }}
                aria-label="User profile"
                onClick={(e) => {
                  e.stopPropagation();
                  onUserMenuToggle();
                }}
              >
                <UserCircle2 size={22} className="transition-transform duration-200 group-hover:scale-105" />
                {showUserMenu && (
                  <div
                    className="fixed w-52 rounded-xl py-2 shadow-elevation-3 animate-scale-in"
                    style={{
                      left: '84px',
                      bottom: '16px',
                      zIndex: 9999,
                      background: 'var(--theme-user-menu-bg)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid var(--theme-border)',
                    }}
                  >
                    <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--theme-border)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>{user?.name || 'User'}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        className="w-full px-4 py-2 text-left text-sm flex items-center transition-all duration-150 rounded-md mx-1"
                        style={{ outline: 'none', border: 'none', width: 'calc(100% - 8px)', color: 'var(--theme-text-secondary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--theme-sidebar-active-bg)'; e.currentTarget.style.color = 'var(--theme-text)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--theme-text-secondary)'; }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUserMenuClose();
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2.5" />
                        Settings
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left text-sm flex items-center transition-all duration-150 rounded-md mx-1"
                        style={{ outline: 'none', border: 'none', width: 'calc(100% - 8px)', color: '#ef4444cc' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444cc'; }}
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
      className="flex flex-col items-center justify-center w-full py-3 relative group transition-all duration-200 ease-out rounded-md"
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
    >
      {/* Active indicator bar */}
      <span
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] rounded-r-full transition-all duration-300",
          isSelected
            ? "h-7 opacity-100"
            : "h-0 opacity-0 group-hover:h-4 group-hover:opacity-40"
        )}
        style={{ background: 'var(--theme-sidebar-indicator)' }}
      />
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
}
