import { useState } from 'react';
import { View, ScrollView, Pressable, Text, useWindowDimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { Icon } from './icons';

interface Props {
  /** Top nav (TopNav) rendered above the main canvas. */
  topNav: ReactNode;
  /** Left rail column (LeftRail). */
  leftRail: ReactNode;
  /** Main scrollable canvas. */
  children: ReactNode;
  /** Optional right-side commentary panel (AI Insights). */
  commentary?: ReactNode;
  /** Optional pinned footer — stays visible while `children` scrolls. */
  dock?: ReactNode;
}

// Breakpoints — roughly "landscape tablet" vs "portrait tablet/phone".
// Above WIDE we render all 3 columns. Below WIDE, commentary collapses
// behind a toggle that opens it as a modal sheet. Below COMPACT, the
// LeftRail hides behind a toggle as well.
const WIDE_BREAKPOINT = 900;
const COMPACT_BREAKPOINT = 640;

/**
 * Three-zone tablet workbench template:
 *
 *   ┌────────┬───────────────────────────┬────────────┐
 *   │        │  topnav                   │            │
 *   │ left   ├───────────────────────────┤ commentary │
 *   │ rail   │  main (scroll)            │            │
 *   │        │ ───────────────────────── │            │
 *   │        │  dock (optional)          │            │
 *   └────────┴───────────────────────────┴────────────┘
 *
 * On narrower screens the side columns collapse behind toggle buttons in
 * the topnav row so the main canvas gets full width.
 */
export function WorkbenchShell({ topNav, leftRail, children, commentary, dock }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;
  const compact = width < COMPACT_BREAKPOINT;

  const [railOpen, setRailOpen] = useState(false);
  const [commentaryOpen, setCommentaryOpen] = useState(false);

  return (
    <SafeAreaView className="flex-1 flex-row bg-surface-alt" edges={['top']}>
      {/* Left rail — inline when there's room, modal on narrow screens */}
      {!compact && leftRail}
      {compact && (
        <Modal visible={railOpen} transparent animationType="slide" onRequestClose={() => setRailOpen(false)}>
          <Pressable className="flex-1 bg-black/40" onPress={() => setRailOpen(false)}>
            <Pressable onPress={() => {}}>{leftRail}</Pressable>
          </Pressable>
        </Modal>
      )}

      <View className="flex-1 flex-col">
        {/* Top nav + responsive toggles */}
        <View className="flex-row items-center bg-surface border-b border-rule">
          {compact && (
            <Pressable onPress={() => setRailOpen(true)} className="px-3 h-[44px] items-center justify-center">
              <Icon.Settings size={16} color="#475569" />
            </Pressable>
          )}
          <View className="flex-1">{topNav}</View>
          {!wide && commentary && (
            <Pressable
              onPress={() => setCommentaryOpen(true)}
              className="px-3 h-[44px] flex-row items-center justify-center gap-1.5 border-l border-rule"
            >
              <Icon.Sparkle size={14} color="#FE9519" />
              <Text className="text-[13px] font-semibold tracking-wider uppercase text-brand">AI</Text>
            </Pressable>
          )}
        </View>

        <View className="flex-1 flex-col">
          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
            {children}
          </ScrollView>
          {dock && <View className="shrink-0">{dock}</View>}
        </View>
      </View>

      {/* Commentary — inline on wide, modal on narrow */}
      {wide && commentary}
      {!wide && commentary && (
        <Modal
          visible={commentaryOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setCommentaryOpen(false)}
        >
          <Pressable className="flex-1 bg-black/40 flex-row justify-end" onPress={() => setCommentaryOpen(false)}>
            <Pressable onPress={() => {}}>{commentary}</Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}
