'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RailItem } from '@/lib/navigation';

type NavigationItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  children?: NavigationItem[];
};

interface NavigationPanelProps {
  hoveredRailItem: RailItem | null;
  selectedRailItem: RailItem | null;
  isPanelHovered: boolean;
  activeRoute: string;
  navigationStructure: Record<RailItem, NavigationItem[]>;
  onPanelMouseEnter: () => void;
  onPanelMouseLeave: () => void;
  onToggleMenu: () => void;
  onNavigationItemClick: (route: string) => void;
}

export default function NavigationPanel({
  hoveredRailItem,
  selectedRailItem,
  isPanelHovered,
  activeRoute,
  navigationStructure,
  onPanelMouseEnter,
  onPanelMouseLeave,
  onToggleMenu,
  onNavigationItemClick
}: NavigationPanelProps) {
  return (
    <aside
      className={cn(
        "fixed left-[72px] top-[57px] bottom-0 flex flex-col transition-all duration-300 ease-out z-30 border-r border-[#0A3B77]/5",
        (hoveredRailItem || isPanelHovered)
          ? "w-[280px] opacity-100"
          : "w-0 opacity-0 overflow-hidden"
      )}
      style={{
        outline: 'none',
        border: 'none',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,252,255,0.97) 100%)',
        backdropFilter: 'blur(8px)',
        boxShadow: (hoveredRailItem || isPanelHovered) ? '4px 0 16px rgba(10,59,119,0.06)' : 'none',
      }}
      onMouseEnter={onPanelMouseEnter}
      onMouseLeave={onPanelMouseLeave}
    >
      {/* Panel Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[#0A3B77]/5">
        <h2 className="font-semibold text-[#0A3B77] capitalize text-sm tracking-wide">
          {hoveredRailItem || selectedRailItem}
        </h2>
        <button
          onClick={onToggleMenu}
          className="w-6 h-6 rounded-md flex items-center justify-center text-[#0A3B77]/50 hover:text-[#0A3B77] hover:bg-[#0A3B77]/5 transition-all duration-150"
          style={{ outline: 'none', border: 'none' }}
          aria-label="Close menu"
        >
          <X size={14} />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 overflow-y-auto" role="menu" aria-label={`${hoveredRailItem || selectedRailItem || 'home'} navigation`}>
        <div className="space-y-1">
          {(() => {
            const currentRailItem = hoveredRailItem || selectedRailItem;
            return currentRailItem ? navigationStructure[currentRailItem].map((item: NavigationItem) => (
              <NavigationItemComponent
                key={item.id}
                item={item}
                activeRoute={activeRoute}
                onItemClick={onNavigationItemClick}
              />
            )) : null;
          })()}
        </div>
      </nav>
    </aside>
  );
}

interface NavigationItemComponentProps {
  item: NavigationItem;
  activeRoute: string;
  onItemClick: (route: string) => void;
  level?: number;
}

function NavigationItemComponent({ item, activeRoute, onItemClick, level = 0 }: NavigationItemComponentProps) {
  const isActive = activeRoute === item.route || (item.children && item.children.some(child => child.route === activeRoute));
  const isExactActive = activeRoute === item.route;
  const hasChildren = item.children && item.children.length > 0;
  
  return (
    <div>
      <button
        onClick={() => {
          if (!hasChildren) {
            onItemClick(item.route);
          }
        }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 relative",
          level > 0 && "pl-6 text-xs",
          hasChildren
            ? "cursor-default text-[#0A3B77]/40"
            : "text-[#0A3B77]/80 hover:text-[#0A3B77] hover:bg-[#0A3B77]/[0.04]",
          isExactActive && !hasChildren
            ? "bg-[#0A3B77]/[0.06] text-[#0A3B77] font-medium"
            : ""
        )}
        style={{ outline: 'none', border: 'none' }}
        role="menuitem"
        aria-current={isExactActive ? "page" : undefined}
        disabled={hasChildren}
        aria-disabled={hasChildren}
      >
        {isExactActive && !hasChildren && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[60%] rounded-r-full bg-[#0A3B77]" />
        )}
        <span className={cn(
          "flex-shrink-0 transition-colors duration-200",
          hasChildren ? "text-[#0A3B77]/30" : isExactActive ? "text-[#0A3B77]" : "text-[#0A3B77]/60"
        )}>{item.icon}</span>
        <span className="flex-1 text-left">{item.label}</span>
      </button>
      
      {item.children && (
        <div className="mt-1 space-y-1">
          {item.children.map((child) => (
            <NavigationItemComponent
              key={child.id}
              item={child}
              activeRoute={activeRoute}
              onItemClick={onItemClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
