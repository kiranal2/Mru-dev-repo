import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WORKBENCHES, PERF_COMMENTARY } from '../data';
import type { CommentaryItem } from '../types';
import { Icon } from '../icons';
import { CommentaryPanel, CommentaryShowButton } from './CommentaryPanel';
import { useChat, useSettings } from '../store';

const RAIL_W_EXPANDED = 200;
const RAIL_W_COLLAPSED = 36;

interface Props {
  /** The workbench key we're currently on */
  workbench: 'performance' | 'margin' | 'flux';
  /** Left rail content */
  leftRail: ReactNode;
  /** Top nav content */
  topNav: ReactNode;
  /** Main center canvas */
  children: ReactNode;
  /** Pinned footer inside the main column — stays visible while children scroll */
  dock?: ReactNode;
  /** Scope label shown at bottom of chat */
  scopeLabel?: string;
  /** Right-side scope indicator rendered in the top-nav row (e.g., "Week 10 · Global · Q1 FY2026") */
  scopeRight?: ReactNode;
  /** Commentary items to show in the right-side AI Commentary panel */
  commentary?: CommentaryItem[];
  /** Optional headline override for the commentary panel callout */
  commentaryHeadline?: string;
}

/**
 * The canonical three-zone template:
 *
 *  [Workbench tabs row]
 *  ┌──────────┬──────────────────────┬──────────┐
 *  │ left     │ topnav               │          │
 *  │ rail     ├──────────────────────┤  chat    │
 *  │          │ main                 │          │
 *  │          │                      │          │
 *  └──────────┴──────────────────────┴──────────┘
 *
 * (The universal quick-action strip that used to live below `main`
 * was removed — those actions are available via the chat panel toolbar
 * per-reply, which avoided the stacked-widget crowding.)
 */
export function WorkbenchShell({ workbench, leftRail, topNav, children, dock, scopeLabel, scopeRight, commentary, commentaryHeadline }: Props) {
  const { setScope } = useChat();
  const { settings, update } = useSettings();
  useEffect(() => {
    if (scopeLabel) setScope(scopeLabel);
  }, [scopeLabel, setScope]);

  const railW = settings.railCollapsed ? RAIL_W_COLLAPSED : RAIL_W_EXPANDED;
  const chatCol = settings.chatHidden ? '' : ` ${settings.chatWidth}px`;
  const gridCols = `${railW}px 1fr${chatCol}`;
  // When the workbench-tabs row is hidden, collapse its grid row entirely so
  // there's no empty stripe at the top. topnav then owns the first row.
  const showTabs = settings.showWorkbenchTabs;
  const gridRows = showTabs ? '40px 48px 1fr' : '48px 1fr';
  const gridAreas = showTabs
    ? (settings.chatHidden
        ? `"wb wb" "topnav topnav" "left main"`
        : `"wb wb chat" "topnav topnav chat" "left main chat"`)
    : (settings.chatHidden
        ? `"topnav topnav" "left main"`
        : `"topnav topnav chat" "left main chat"`);

  const toggleRail = () => update({ railCollapsed: !settings.railCollapsed });

  return (
    <>
      <div className="flex-1 grid min-h-0" style={{ gridTemplateColumns: gridCols, gridTemplateRows: gridRows, gridTemplateAreas: gridAreas }}>
        {showTabs && (
          <div style={{ gridArea: 'wb' }}>
            <WorkbenchTabs active={workbench} />
          </div>
        )}
        <div
          style={{ gridArea: 'topnav' }}
          className="bg-surface border-b border-rule flex items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            {topNav}
          </div>
          {scopeRight && (
            <div className="shrink-0 flex items-center gap-2 pr-4 text-[11px] font-medium text-muted whitespace-nowrap">
              {scopeRight}
            </div>
          )}
        </div>
        <aside
          style={{ gridArea: 'left' }}
          className={`bg-surface border-r border-rule overflow-y-auto overflow-x-hidden relative ${
            settings.railCollapsed ? 'px-0 py-2' : 'p-2.5'
          }`}
        >
          {settings.railCollapsed ? (
            <CollapsedRail onExpand={toggleRail} />
          ) : (
            <>
              {/* Collapse handle — pinned top-right of expanded rail */}
              <button
                onClick={toggleRail}
                title="Collapse filters"
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded grid place-items-center text-faint hover:bg-surface-soft hover:text-ink transition-colors z-10"
              >
                <Icon.ChevLeft className="w-3 h-3" />
              </button>
              {leftRail}
            </>
          )}
        </aside>
        <main style={{ gridArea: 'main' }} className="flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-auto p-5 min-h-0">
            {children}
          </div>
          {dock && (
            <div className="shrink-0 bg-surface">
              {dock}
            </div>
          )}
        </main>
        <CommentaryPanel
          style={{ gridArea: 'chat' }}
          items={commentary ?? PERF_COMMENTARY}
          scopeLabel={scopeLabel}
          headline={commentaryHeadline}
        />
      </div>
      <CommentaryShowButton />
    </>
  );
}

/**
 * Narrow rail shown when the workbench filters are collapsed. A single chevron
 * button restores the full rail. Rendered inside the same grid cell so the
 * layout doesn't reflow.
 */
function CollapsedRail({ onExpand }: { onExpand: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 pt-1">
      <button
        onClick={onExpand}
        title="Expand filters"
        className="w-7 h-7 rounded grid place-items-center text-muted hover:bg-surface-soft hover:text-ink transition-colors"
      >
        <Icon.ChevRight className="w-3.5 h-3.5" />
      </button>
      <div
        className="text-[9px] font-semibold tracking-wider uppercase text-faint"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        Filters
      </div>
    </div>
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
      <div className="flex-1" />
    </div>
  );
}
