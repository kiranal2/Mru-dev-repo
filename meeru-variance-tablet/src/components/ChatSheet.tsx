import React, { useCallback, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useChat, useToasts, useAuth } from '../store';
import { SUGGESTIONS } from '../data';
import { Icon, iconForActionKind } from './icons';
import type { ActionCard } from '../types';

export interface ChatSheetRef {
  expand: () => void;
  collapse: () => void;
}

export interface ChatSheetProps {
  /** Region-specific suggestion overrides. Falls back to SUGGESTIONS when empty/undefined. */
  suggestions?: string[];
}

export const ChatSheet = forwardRef<ChatSheetRef, ChatSheetProps>(({ suggestions }, ref) => {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['12%', '55%', '92%'], []);
  const [sheetIndex, setSheetIndex] = useState(0);

  useImperativeHandle(ref, () => ({
    expand: () => sheetRef.current?.snapToIndex(2),
    collapse: () => sheetRef.current?.snapToIndex(0),
  }));

  // Dim/blur the rest of the screen only when the sheet is at full screen
  // (index 2). At peek/mid the canvas stays fully interactive. Tapping the
  // backdrop drops back to the mid snap so the user can still see context.
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={2}
        disappearsOnIndex={1}
        opacity={0.35}
        pressBehavior="collapse"
        onPress={() => sheetRef.current?.snapToIndex(1)}
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={setSheetIndex}
      enablePanDownToClose={false}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#94A3B8', width: 40 }}
      backgroundStyle={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
    >
      <ChatContent
        sheetIndex={sheetIndex}
        onSnap={(i) => sheetRef.current?.snapToIndex(i)}
        suggestions={suggestions}
      />
    </BottomSheet>
  );
});
ChatSheet.displayName = 'ChatSheet';

function ChatContent({
  sheetIndex,
  onSnap,
  suggestions,
}: {
  sheetIndex: number;
  onSnap: (i: number) => void;
  suggestions?: string[];
}) {
  const expanded = sheetIndex > 0;
  const fullscreen = sheetIndex === 2;
  const onExpand = () => onSnap(2);
  const { user } = useAuth();
  const { msgs, send, reset, contextual, followUps, thinking, sent, markSent } = useChat();
  const { push } = useToasts();
  const [input, setInput] = useState('');
  // Session-scoped favorite — mirrors the web Command Center star. Filled
  // polygon when active; toast confirms the state change.
  const [favorited, setFavorited] = useState(false);

  const onSend = () => {
    if (!input.trim()) return;
    send(input);
    setInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const onSuggestion = (s: string) => {
    send(s);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View className="flex-1">
      {/* Header — title on the left, icon cluster on the right.
          Mirrors the web Command Center header: new-chat, favorite,
          maximize/minimize. Buttons only show once the sheet is expanded
          so the peek state stays clean. */}
      <View className="flex-row items-center justify-between px-4 pb-2" style={{ borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <Pressable onPress={expanded ? undefined : onExpand} className="flex-row items-center gap-2 flex-1">
          <Icon.Sparkle color="#F16922" size={16} />
          <Text className="text-sm font-semibold text-ink">AI Analysis</Text>
          <View className="ml-1 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#DCFCE7' }}>
            <Text style={{ fontSize: 9, fontWeight: '600', color: '#16A34A' }}>● LIVE</Text>
          </View>
        </Pressable>
        {expanded && (
          <View className="flex-row items-center gap-1">
            <HeaderIconButton
              label="New chat"
              onPress={() => {
                reset();
                setInput('');
                push({ kind: 'info', title: 'New chat started' });
              }}
            >
              <Icon.Pencil color="#475569" size={14} />
            </HeaderIconButton>
            <HeaderIconButton
              label={favorited ? 'Remove from favorites' : 'Add to favorites'}
              active={favorited}
              onPress={() => {
                const next = !favorited;
                setFavorited(next);
                push({
                  kind: 'ok',
                  title: next ? 'Added to favorites' : 'Removed from favorites',
                  sub: next ? 'This session is bookmarked for quick access' : undefined,
                });
                Haptics.selectionAsync();
              }}
            >
              <Icon.Star
                color={favorited ? '#F16922' : '#64748B'}
                fill={favorited ? '#F16922' : 'none'}
                size={14}
              />
            </HeaderIconButton>
            <HeaderIconButton
              label={fullscreen ? 'Collapse' : 'Full screen'}
              active={fullscreen}
              onPress={() => {
                onSnap(fullscreen ? 1 : 2);
                Haptics.selectionAsync();
              }}
            >
              {fullscreen
                ? <Icon.Minimize color="#F16922" size={14} />
                : <Icon.Maximize color="#475569" size={14} />}
            </HeaderIconButton>
            <HeaderIconButton
              label="Minimize"
              onPress={() => {
                onSnap(0);
                Haptics.selectionAsync();
              }}
            >
              <Icon.ChevDown color="#475569" size={14} />
            </HeaderIconButton>
          </View>
        )}
      </View>

      {/* Body */}
      <BottomSheetScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {msgs.length === 0 && (
          <WelcomeBlock personaName={user?.name.split(' ')[0] ?? 'there'} />
        )}

        {msgs.map((m, idx) => {
          const who = m.role === 'user' ? user?.name.split(' ')[0] ?? 'You' : 'Meeru AI';
          const isUser = m.role === 'user';
          return (
            <View key={idx} className="mb-3">
              <Text
                style={{ fontSize: 10, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4, color: isUser ? '#F16922' : '#475569' }}
              >
                {who}
              </Text>
              <View
                className="rounded-xl p-3"
                style={{
                  backgroundColor: isUser ? '#FFF1E7' : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: isUser ? '#FED5BC' : '#E2E8F0',
                }}
              >
                <Text className="text-[13px] leading-relaxed text-ink">{m.text}</Text>
              </View>
              {m.role === 'ai' && <MessageToolbar />}
            </View>
          );
        })}

        {thinking && <ThinkingBubble />}

        {contextual.length > 0 && (
          <View className="mt-2">
            <View className="flex-row items-center gap-1 mb-2">
              <Icon.Flag color="#F16922" size={12} />
              <Text className="text-[14px] tracking-wider uppercase font-semibold text-brand">
                Next Best Action
              </Text>
              <Text className="text-[14px] text-faint"> · ranked for {user?.role.split(' ').slice(-1)[0]}</Text>
            </View>
            {fullscreen ? (
              // Full-screen: 2-column grid with full-width cards so nothing
              // is truncated and there's no horizontal scroll to hide tiles.
              <View className="flex-row flex-wrap -mx-1">
                {contextual.map((a, i) => (
                  <View key={`${a.kind}-${i}`} style={{ width: '50%', paddingHorizontal: 4, marginBottom: 8 }}>
                    <NBACard
                      action={a}
                      sent={sent.has(`${a.kind}-${i}`)}
                      expanded
                      onSend={() => {
                        markSent(`${a.kind}-${i}`);
                        push({ kind: 'ok', title: `${a.label} — sent`, sub: a.who });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }}
                    />
                  </View>
                ))}
              </View>
            ) : (
              // Peek/mid: horizontal scroll is still the best use of space.
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {contextual.map((a, i) => (
                  <NBACard
                    key={`${a.kind}-${i}`}
                    action={a}
                    sent={sent.has(`${a.kind}-${i}`)}
                    onSend={() => {
                      markSent(`${a.kind}-${i}`);
                      push({ kind: 'ok', title: `${a.label} — sent`, sub: a.who });
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Suggestions — shown when empty, or follow-ups when conversation active */}
        <View className="mt-4">
          <View className="flex-row items-center gap-1 mb-2">
            <Icon.Sparkle color="#94A3B8" size={11} />
            <Text className="text-[14px] tracking-wider uppercase font-semibold text-faint">
              {msgs.length > 0 && followUps.length > 0 ? 'Follow-up' : 'Suggested'}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-1.5">
            {(msgs.length > 0 && followUps.length > 0
              ? followUps
              : (suggestions && suggestions.length > 0 ? suggestions : SUGGESTIONS)
            ).map((s, i) => (
              <Pressable
                key={`${s}-${i}`}
                onPress={() => onSuggestion(s)}
                className="px-3 py-1.5 rounded-full active:bg-brand-tint"
                style={{ borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
              >
                <Text className="text-[13px] text-ink">{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </BottomSheetScrollView>

      {/* Input */}
      <View className="px-3 pb-3 pt-2" style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
        <View
          className="flex-row items-center gap-2 px-3 py-2 rounded-xl"
          style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }}
        >
          <BottomSheetTextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about this workbench…"
            placeholderTextColor="#94A3B8"
            style={{ flex: 1, fontSize: 13, color: '#0F172A', paddingVertical: 4 }}
            onFocus={onExpand}
            onSubmitEditing={onSend}
            returnKeyType="send"
          />
          <Pressable className="p-2 active:opacity-70">
            <Icon.Mic color="#475569" size={16} />
          </Pressable>
          <Pressable
            onPress={onSend}
            disabled={!input.trim()}
            className="rounded-lg active:opacity-90"
            style={{
              backgroundColor: input.trim() ? '#F16922' : '#CBD5E1',
              width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon.Send color="#FFFFFF" size={14} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------- header icon button (consistent hit target) ----------
function HeaderIconButton({
  label,
  onPress,
  active,
  children,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="active:opacity-70"
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? '#FFF1E7' : 'transparent',
      }}
    >
      {children}
    </Pressable>
  );
}

// ---------- welcome on first open ----------
function WelcomeBlock({ personaName }: { personaName: string }) {
  return (
    <View
      className="rounded-2xl p-4 mb-3"
      style={{ backgroundColor: '#FFF1E7', borderWidth: 1, borderColor: '#FED5BC' }}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <View className="w-7 h-7 rounded-full bg-brand items-center justify-center">
          <Icon.Sparkle color="#FFFFFF" size={14} />
        </View>
        <View>
          <Text className="text-sm font-semibold text-ink">Welcome, {personaName}.</Text>
          <Text className="text-xs text-muted">Tap a suggestion below, or ask me anything about this workbench.</Text>
        </View>
      </View>
    </View>
  );
}

// ---------- typing indicator ----------
function ThinkingBubble() {
  return (
    <View className="mb-3">
      <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4, color: '#475569' }}>
        Meeru AI
      </Text>
      <View
        className="rounded-xl p-3 self-start flex-row items-center gap-2"
        style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}
      >
        <View className="flex-row gap-1">
          {[0, 1, 2].map((i) => (
            <View key={i} className="w-1.5 h-1.5 rounded-full bg-brand" />
          ))}
        </View>
        <Text className="text-[13px] text-muted">Analyzing…</Text>
      </View>
    </View>
  );
}

// ---------- message toolbar (pin / save / share / copy) ----------
function MessageToolbar() {
  const { push } = useToasts();
  const items: { key: string; label: string; icon: React.ReactNode; onPress: () => void }[] = [
    { key: 'pin',   label: 'Pin',    icon: <Icon.Pin size={12} />,    onPress: () => push({ kind: 'ok', title: 'Pinned to workspace' }) },
    { key: 'save',  label: 'Save',   icon: <Icon.File size={12} color="#475569" />, onPress: () => push({ kind: 'ok', title: 'Saved to notebook' }) },
    { key: 'share', label: 'Share',  icon: <Icon.Share size={12} />,  onPress: () => push({ kind: 'ok', title: 'Link copied' }) },
    { key: 'copy',  label: 'Copy',   icon: <Icon.Check size={12} color="#475569" />,onPress: () => push({ kind: 'ok', title: 'Copied' }) },
  ];
  return (
    <View className="flex-row gap-2 mt-1 ml-1">
      {items.map((it) => (
        <Pressable key={it.key} onPress={it.onPress} className="flex-row items-center gap-1 active:opacity-60">
          {it.icon}
          <Text className="text-[14px] text-faint">{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---------- NBA card ----------
// `expanded` = full-screen grid layout. In that mode the card stretches to the
// 50%-width grid cell and body text gets an extra line so nothing truncates.
function NBACard({
  action,
  sent,
  onSend,
  expanded,
}: {
  action: ActionCard;
  sent: boolean;
  onSend: () => void;
  expanded?: boolean;
}) {
  const Icn = iconForActionKind(action.kind);
  const accent: Record<string, string> = {
    slack: '#4A154B', email: '#F16922', im: '#16A34A', pin: '#D97706',
    remind: '#8B5CF6', share: '#475569', approve: '#16A34A',
    whatif: '#F16922', open: '#F16922', investigate: '#D97706',
  };
  const verb = ['pin', 'remind', 'share', 'approve', 'whatif', 'open', 'investigate'].includes(action.kind)
    ? (action.kind === 'pin' ? 'Pin' : action.kind === 'remind' ? 'Set' : action.kind === 'share' ? 'Share' : action.kind === 'approve' ? 'Approve' : action.kind === 'whatif' ? 'Run' : 'Open')
    : 'Send';
  return (
    <View
      className={`${expanded ? '' : 'mr-2'} p-3 rounded-xl`}
      style={{
        width: expanded ? '100%' : 240,
        backgroundColor: '#FFF1E7',
        borderWidth: 1,
        borderColor: '#FED5BC',
        opacity: sent ? 0.6 : 1,
        position: 'relative',
      }}
    >
      <View
        style={{
          position: 'absolute', left: 0, top: 8, bottom: 8,
          width: 3, borderRadius: 2, backgroundColor: accent[action.kind] ?? '#475569',
        }}
      />
      <View className="flex-row items-center gap-1 mb-1">
        <Icn size={12} />
        <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase', color: '#475569' }}>
          {action.who}
        </Text>
      </View>
      <Text numberOfLines={expanded ? 3 : 2} className="text-[13px] text-ink leading-snug mb-2">
        {action.body}
      </Text>
      <View className="flex-row items-center justify-between">
        <Pressable><Text className="text-[14px] text-faint">Edit</Text></Pressable>
        <Pressable
          onPress={onSend}
          disabled={sent}
          className="px-3 py-1 rounded"
          style={{ backgroundColor: sent ? '#16A34A' : '#F16922' }}
        >
          <Text className="text-[14px] font-semibold text-white">{sent ? '✓ Sent' : verb}</Text>
        </Pressable>
      </View>
    </View>
  );
}
