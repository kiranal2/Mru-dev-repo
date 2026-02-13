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
        "fixed left-[72px] top-[57px] bottom-0 bg-[#F2FDFF] flex flex-col transition-all duration-300 ease-out z-30",
        (hoveredRailItem || isPanelHovered)
          ? "w-[280px] opacity-100"
          : "w-0 opacity-0 overflow-hidden"
      )}
      style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
      onMouseEnter={onPanelMouseEnter}
      onMouseLeave={onPanelMouseLeave}
    >
      {/* Panel Header */}
      <div className="h-14 flex items-center justify-between px-4 transition-colors duration-200">
        <h2 className="font-semibold text-[#0A3B77] capitalize text-sm tracking-wide">
          {hoveredRailItem || selectedRailItem}
        </h2>
        <button
          onClick={onToggleMenu}
          className="w-6 h-6 rounded-md flex items-center justify-center text-[#0A3B77] hover:bg-[#CDE4FF] transition-colors duration-200"
          style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
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
          // Only navigate if item doesn't have children (parent items should not be clickable)
          if (!hasChildren) {
            onItemClick(item.route);
          }
        }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-200",
          level > 0 && "pl-6 text-xs",
          hasChildren 
            ? "cursor-default text-gray-400" // Disabled style for parent items
            : "text-[#0A3B77] hover:bg-[#CDE4FF]", // Normal clickable style
          isExactActive && !hasChildren
            ? "bg-[#CDE4FF] text-[#0A3B77] font-medium"
            : ""
        )}
        style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
        role="menuitem"
        aria-current={isExactActive ? "page" : undefined}
        disabled={hasChildren}
        aria-disabled={hasChildren}
      >
        <span className={cn(
          "flex-shrink-0",
          hasChildren ? "text-gray-400" : "text-[#0A3B77]"
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
