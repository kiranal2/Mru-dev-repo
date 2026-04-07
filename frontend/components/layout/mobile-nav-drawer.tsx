'use client';

import React from 'react';
import { Home, BarChart3, RefreshCw, LayoutGrid, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RailItem } from '@/lib/navigation';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';

type NavigationItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  children?: NavigationItem[];
};

interface MobileNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRailItem: RailItem | null;
  activeRoute: string;
  navigationStructure: Record<RailItem, NavigationItem[]>;
  onRailItemClick: (item: RailItem) => void;
  onNavigationItemClick: (route: string) => void;
}

const RAIL_ITEMS: { id: RailItem; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <Home size={18} /> },
  { id: 'automation', label: 'Automation', icon: <RefreshCw size={18} /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} /> },
  { id: 'workbench', label: 'Workbench', icon: <LayoutGrid size={18} /> },
  { id: 'admin', label: 'Admin', icon: <Shield size={18} /> },
];

export default function MobileNavDrawer({
  open,
  onOpenChange,
  selectedRailItem,
  activeRoute,
  navigationStructure,
  onRailItemClick,
  onNavigationItemClick,
}: MobileNavDrawerProps) {
  const [activeRail, setActiveRail] = React.useState<RailItem>(selectedRailItem || 'home');

  React.useEffect(() => {
    if (selectedRailItem) setActiveRail(selectedRailItem);
  }, [selectedRailItem]);

  const handleNavClick = (route: string) => {
    onNavigationItemClick(route);
    onOpenChange(false);
  };

  const handleRailClick = (item: RailItem) => {
    setActiveRail(item);
    onRailItemClick(item);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="p-0 w-[280px] sm:max-w-[320px] flex flex-col"
        style={{ background: 'var(--theme-bg-app, #fff)' }}
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>

        {/* Rail tabs */}
        <div
          className="flex border-b overflow-x-auto"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          {RAIL_ITEMS.map((rail) => (
            <button
              key={rail.id}
              onClick={() => handleRailClick(rail.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-3 text-[10px] font-medium whitespace-nowrap transition-colors flex-1 min-w-0',
                activeRail === rail.id
                  ? 'border-b-2'
                  : 'text-slate-400'
              )}
              style={
                activeRail === rail.id
                  ? { color: 'var(--theme-accent)', borderColor: 'var(--theme-accent)' }
                  : {}
              }
            >
              {rail.icon}
              {rail.label}
            </button>
          ))}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-0.5">
            {navigationStructure[activeRail]?.map((item) => (
              <MobileNavItem
                key={item.id}
                item={item}
                activeRoute={activeRoute}
                onItemClick={handleNavClick}
              />
            ))}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function MobileNavItem({
  item,
  activeRoute,
  onItemClick,
  level = 0,
}: {
  item: NavigationItem;
  activeRoute: string;
  onItemClick: (route: string) => void;
  level?: number;
}) {
  const isExactActive = activeRoute === item.route;
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div className={cn(level === 0 && 'mt-4 first:mt-0')}>
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <span className="flex-shrink-0 text-slate-400">{item.icon}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {item.label}
          </span>
        </div>
        <div className="space-y-0.5">
          {item.children!.map((child) => (
            <MobileNavItem
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

  return (
    <button
      onClick={() => onItemClick(item.route)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
        level > 0 && 'pl-7',
        isExactActive
          ? 'font-medium'
          : 'text-slate-600'
      )}
      style={
        isExactActive
          ? {
              color: 'var(--theme-accent)',
              background: 'var(--theme-accent-subtle)',
            }
          : {}
      }
    >
      <span className={cn('flex-shrink-0', isExactActive ? '' : 'text-slate-400')}>
        {item.icon}
      </span>
      <span className="flex-1 text-left truncate">{item.label}</span>
    </button>
  );
}
