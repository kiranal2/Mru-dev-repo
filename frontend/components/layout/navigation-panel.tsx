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
        "fixed left-16 top-[57px] bottom-0 flex flex-col transition-all duration-300 ease-out z-30 border-r border-slate-200 bg-white",
        (hoveredRailItem || isPanelHovered)
          ? "w-60 opacity-100"
          : "w-0 opacity-0 overflow-hidden"
      )}
      style={{
        outline: 'none',
        boxShadow: (hoveredRailItem || isPanelHovered) ? '4px 0 24px rgba(15,23,42,0.08), 1px 0 4px rgba(15,23,42,0.04)' : 'none',
      }}
      onMouseEnter={onPanelMouseEnter}
      onMouseLeave={onPanelMouseLeave}
    >
      {/* Panel Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200">
        <h2 className="font-semibold text-slate-900 capitalize text-sm tracking-wide">
          {hoveredRailItem || selectedRailItem}
        </h2>
        <button
          onClick={onToggleMenu}
          className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150"
          style={{ outline: 'none', border: 'none' }}
          aria-label="Close menu"
        >
          <X size={14} />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" role="menu" aria-label={`${hoveredRailItem || selectedRailItem || 'home'} navigation`}>
        <div className="space-y-0.5">
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

  // Section header (has children) — styled as a group label
  if (hasChildren) {
    return (
      <div className={cn(level === 0 && "mt-4 first:mt-0")}>
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <span className="flex-shrink-0 text-slate-400">{item.icon}</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.label}</span>
        </div>
        <div className="space-y-0.5">
          {item.children!.map((child) => (
            <NavigationItemComponent
              key={child.id}
              item={child}
              activeRoute={activeRoute}
              onItemClick={onItemClick}
              level={level + 1}
            />
          ))}
        </div>
      </div>
    );
  }

  // Leaf nav item
  return (
    <div>
      <button
        onClick={() => onItemClick(item.route)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 relative",
          level > 0 && "pl-7",
          "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
          isExactActive
            ? "bg-blue-50 text-blue-700 font-medium"
            : ""
        )}
        style={{ outline: 'none', border: 'none' }}
        role="menuitem"
        aria-current={isExactActive ? "page" : undefined}
      >
        {isExactActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[65%] rounded-r-full bg-blue-500" />
        )}
        <span className={cn(
          "flex-shrink-0 transition-colors duration-200",
          isExactActive ? "text-blue-700" : "text-slate-400"
        )}>{item.icon}</span>
        <span className="flex-1 text-left">{item.label}</span>
      </button>
    </div>
  );
}
