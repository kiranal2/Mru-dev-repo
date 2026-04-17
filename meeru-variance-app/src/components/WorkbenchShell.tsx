import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WORKBENCHES } from '../data';
import { Icon } from '../icons';
import { ActionStrip } from './ActionStrip';
import { ChatSidebar, ChatShowButton } from './ChatSidebar';
import { useChat, useSettings } from '../store';

/** "Xs ago" ticking counter — lives in the workbench-tabs row. */
function LiveTimer() {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSec(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const label =
    sec < 60
      ? `${sec}s ago`
      : sec < 3600
      ? `${Math.floor(sec / 60)}m ${sec % 60}s ago`
      : `${Math.floor(sec / 3600)}h ago`;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-positive live-dot" />
      <span className="num">Live · updated {label}</span>
    </span>
  );
}

interface Props {
  /** The workbench key we're currently on */
  workbench: 'performance' | 'margin' | 'flux';
  /** Left rail content */
  leftRail: ReactNode;
  /** Top nav content */
  topNav: ReactNode;
  /** Main center canvas */
  children: ReactNode;
  /** Scope label shown at bottom of chat */
  scopeLabel?: string;
}

/**
 * The canonical four-zone template:
 *
 *  [Workbench tabs row]
 *  ┌──────────┬──────────────────────┬──────────┐
 *  │ left     │ topnav               │          │
 *  │ rail     ├──────────────────────┤  chat    │
 *  │          │ main                 │          │
 *  │          │                      │          │
 *  ├──────────┴──────────────────────┤          │
 *  │ action strip                    │          │
 *  └──────────────────────────────────┴──────────┘
 */
export function WorkbenchShell({ workbench, leftRail, topNav, children, scopeLabel }: Props) {
  const { setScope } = useChat();
  const { settings } = useSettings();
  useEffect(() => {
    if (scopeLabel) setScope(scopeLabel);
  }, [scopeLabel, setScope]);

  const chatCol = settings.chatHidden ? '' : ` ${settings.chatWidth}px`;
  const gridCols = `200px 1fr${chatCol}`;
  const gridAreas = settings.chatHidden
    ? `"wb wb" "left topnav" "left main" "strip strip"`
    : `"wb wb chat" "left topnav chat" "left main chat" "strip strip chat"`;

  return (
    <>
      <div className="flex-1 grid min-h-0" style={{ gridTemplateColumns: gridCols, gridTemplateRows: '40px 48px 1fr 48px', gridTemplateAreas: gridAreas }}>
        <div style={{ gridArea: 'wb' }}>
          <WorkbenchTabs active={workbench} />
        </div>
        <aside style={{ gridArea: 'left' }} className="bg-surface border-r border-rule overflow-y-auto p-2.5">
          {leftRail}
        </aside>
        <div style={{ gridArea: 'topnav' }} className="bg-surface border-b border-rule">
          {topNav}
        </div>
        <main style={{ gridArea: 'main' }} className="overflow-auto p-5">
          {children}
        </main>
        <div style={{ gridArea: 'strip' }} className="bg-surface border-t border-rule overflow-x-auto">
          <ActionStrip />
        </div>
        <ChatSidebar style={{ gridArea: 'chat' }} />
      </div>
      <ChatShowButton />
    </>
  );
}

function WorkbenchTabs({ active }: { active: string }) {
  return (
    <div className="bg-surface border-b border-rule flex items-stretch h-10">
      {Object.values(WORKBENCHES).map(wb => {
        const isActive = wb.key === active;
        const Ic = wb.icon === 'bars' ? Icon.Bars : wb.icon === 'trend' ? Icon.Trend : Icon.Sheet;
        return (
          <Link
            key={wb.key}
            to={wb.path}
            className={`inline-flex items-center gap-1.5 px-3.5 text-[12px] font-medium transition-colors ${
              isActive
                ? 'text-brand border-b-2 border-brand'
                : 'text-faint hover:text-ink hover:bg-surface-soft border-b-2 border-transparent'
            }`}
          >
            <Ic className="w-3.5 h-3.5" />
            <span>{wb.label}</span>
          </Link>
        );
      })}
      {/* Right-side meta — data-source summary + ticking "live updated" */}
      <div className="flex-1" />
      <div className="hidden lg:flex items-center gap-2 text-[11px] text-muted pr-4">
        <span className="num">Sources 9/9</span>
        <span className="text-faint">·</span>
        <span className="num">Segments 12</span>
        <span className="text-faint">·</span>
        <LiveTimer />
      </div>
    </div>
  );
}
