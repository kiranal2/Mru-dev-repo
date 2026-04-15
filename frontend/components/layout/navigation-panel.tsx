'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RailItem, RAIL_CONFIG } from '@/lib/navigation';

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
        "fixed left-16 xl:left-20 top-[44px] md:top-[48px] xl:top-[56px] bottom-0 flex flex-col transition-all duration-300 ease-out z-30",
        (hoveredRailItem || isPanelHovered)
          ? "w-60 opacity-100"
          : "w-0 opacity-0 overflow-hidden"
      )}
      style={{
        outline: 'none',
        background: 'var(--theme-navpanel-bg)',
        borderRight: '1px solid var(--theme-navpanel-border)',
        boxShadow: (hoveredRailItem || isPanelHovered) ? 'var(--theme-navpanel-shadow)' : 'none',
      }}
      onMouseEnter={onPanelMouseEnter}
      onMouseLeave={onPanelMouseLeave}
    >
      {/* Panel Header */}
      <div className="h-14 flex items-center justify-between px-4" style={{ borderBottom: '1px solid var(--theme-navpanel-border)' }}>
        <h2 className="font-semibold text-sm tracking-wide" style={{ color: 'var(--theme-text)' }}>
          {(() => {
            const currentRail = hoveredRailItem || selectedRailItem;
            if (!currentRail) return "";
            const panelLabels: Record<string, string> = {
              "decision-intelligence": "Decision Intelligence",
              "close-intelligence": "Close Intelligence",
            };
            return panelLabels[currentRail] || RAIL_CONFIG[currentRail]?.label || currentRail;
          })()}
        </h2>
        <button
          onClick={onToggleMenu}
          className="w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150"
          style={{ outline: 'none', border: 'none', color: 'var(--theme-text-muted)' }}
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
          <span className="flex-shrink-0" style={{ color: 'var(--theme-navpanel-group-text)' }}>{item.icon}</span>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-navpanel-group-text)' }}>{item.label}</span>
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
        )}
        style={{
          outline: 'none',
          border: 'none',
          color: isExactActive ? 'var(--theme-navpanel-text-active)' : 'var(--theme-navpanel-text)',
          background: isExactActive ? 'var(--theme-navpanel-active-bg)' : 'transparent',
          fontWeight: isExactActive ? 500 : 400,
        }}
        role="menuitem"
        aria-current={isExactActive ? "page" : undefined}
      >
        <span className="flex-shrink-0 transition-colors duration-200" style={{ color: isExactActive ? 'var(--theme-navpanel-text-active)' : 'var(--theme-navpanel-group-text)' }}>{item.icon}</span>
        <span className="flex-1 text-left">{item.label}</span>
      </button>
    </div>
  );
}
