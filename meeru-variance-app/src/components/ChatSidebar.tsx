import { useRef, useEffect, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { useSettings } from '../store';
import { ChatPanel } from './ChatPanel';
import { Icon } from '../icons';

const MIN_CHAT_W = 300;
const MAX_CHAT_W = 640;

/**
 * The chat panel as an <aside> with a drag-resize handle on its left edge.
 * Width + hidden state are read from Settings context.
 * Pass `gridArea="chat"` (or similar) via the `style` prop if you want it
 * to live inside a named CSS grid cell.
 */
export function ChatSidebar({ style }: { style?: CSSProperties }) {
  const { settings, update } = useSettings();
  const dragState = useRef<{ startX: number; startW: number } | null>(null);

  // Shared mouse listeners for resize — attach once
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragState.current) return;
      const dx = dragState.current.startX - e.clientX; // drag left → wider
      const nextW = Math.max(MIN_CHAT_W, Math.min(MAX_CHAT_W, dragState.current.startW + dx));
      update({ chatWidth: nextW });
    };
    const onUp = () => {
      if (dragState.current) {
        dragState.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [update]);

  const onHandleDown = useCallback((e: React.MouseEvent) => {
    dragState.current = { startX: e.clientX, startW: settings.chatWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }, [settings.chatWidth]);

  const onDouble = useCallback(() => {
    // Double-click handle → reset to default (344)
    update({ chatWidth: 344 });
  }, [update]);

  if (settings.chatHidden) return null;

  return (
    <aside
      style={style}
      className="bg-surface border-l border-rule border-r border-white/10 flex flex-col overflow-hidden relative"
    >
      {/* Resize handle — 4px hit area on the left edge, becomes visible on hover */}
      <div
        onMouseDown={onHandleDown}
        onDoubleClick={onDouble}
        title="Drag to resize · double-click to reset"
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-weak group z-20"
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r bg-rule opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <ChatPanel />
    </aside>
  );
}

/**
 * A thin floating button on the right edge that peeks in when the chat
 * is hidden. Clicking brings the chat back.
 */
export function ChatShowButton() {
  const { settings, update } = useSettings();
  if (!settings.chatHidden) return null;
  return (
    <button
      onClick={() => update({ chatHidden: false })}
      title="Show AI panel"
      className="fixed right-0 top-1/2 -translate-y-1/2 bg-surface border border-rule border-r-0 rounded-l-lg px-1.5 py-2.5 z-40 shadow-e2 hover:bg-brand-tint hover:border-brand text-muted hover:text-brand transition-colors flex flex-col items-center gap-1"
    >
      <Icon.Sparkle className="w-3.5 h-3.5" />
      <span className="text-[9px] font-semibold tracking-wider [writing-mode:vertical-rl] rotate-180">AI</span>
    </button>
  );
}
