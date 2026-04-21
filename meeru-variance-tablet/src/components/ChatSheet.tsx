import React, { useCallback, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useChat, useToasts, useAuth } from '../store';
import { SUGGESTIONS } from '../data';
import { Icon, iconForActionKind } from './icons';
import type { ActionCard } from '../types';

export interface ChatSheetRef {
  expand: () => void;
  collapse: () => void;
}

export const ChatSheet = forwardRef<ChatSheetRef>((_, ref) => {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['12%', '55%', '92%'], []);
  const [sheetIndex, setSheetIndex] = useState(0);

  useImperativeHandle(ref, () => ({
    expand: () => sheetRef.current?.snapToIndex(2),
    collapse: () => sheetRef.current?.snapToIndex(0),
  }));

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={setSheetIndex}
      enablePanDownToClose={false}
      handleIndicatorStyle={{ backgroundColor: '#94A3B8', width: 40 }}
      backgroundStyle={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
    >
      <ChatContent expanded={sheetIndex > 0} onExpand={() => sheetRef.current?.snapToIndex(2)} />
    </BottomSheet>
  );
});
ChatSheet.displayName = 'ChatSheet';

function ChatContent({ expanded, onExpand }: { expanded: boolean; onExpand: () => void }) {
  const { user } = useAuth();
  const { msgs, send, reset, contextual, followUps, thinking, sent, markSent } = useChat();
  const { push } = useToasts();
  const [input, setInput] = useState('');

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
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-2" style={{ borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <Pressable onPress={expanded ? undefined : onExpand} className="flex-row items-center gap-2 flex-1">
          <Icon.Sparkle color="#1E40AF" size={16} />
          <Text className="text-sm font-semibold text-ink">AI Analysis</Text>
          <View className="ml-1 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#DCFCE7' }}>
            <Text style={{ fontSize: 9, fontWeight: '600', color: '#16A34A' }}>● LIVE</Text>
          </View>
        </Pressable>
        {expanded && (
          <Pressable onPress={reset} className="active:opacity-70 px-2 py-1">
            <Text className="text-xs text-muted">New</Text>
          </Pressable>
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
                style={{ fontSize: 10, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4, color: isUser ? '#1E40AF' : '#475569' }}
              >
                {who}
              </Text>
              <View
                className="rounded-xl p-3"
                style={{
                  backgroundColor: isUser ? '#EFF6FF' : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: isUser ? '#DBEAFE' : '#E2E8F0',
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
              <Icon.Flag color="#1E40AF" size={12} />
              <Text className="text-[10px] tracking-wider uppercase font-semibold text-brand">
                Next Best Action
              </Text>
              <Text className="text-[10px] text-faint"> · ranked for {user?.role.split(' ').slice(-1)[0]}</Text>
            </View>
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
          </View>
        )}

        {/* Suggestions — shown when empty, or follow-ups when conversation active */}
        <View className="mt-4">
          <View className="flex-row items-center gap-1 mb-2">
            <Icon.Sparkle color="#94A3B8" size={11} />
            <Text className="text-[10px] tracking-wider uppercase font-semibold text-faint">
              {msgs.length > 0 && followUps.length > 0 ? 'Follow-up' : 'Suggested'}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-1.5">
            {(msgs.length > 0 && followUps.length > 0 ? followUps : SUGGESTIONS).map((s, i) => (
              <Pressable
                key={`${s}-${i}`}
                onPress={() => onSuggestion(s)}
                className="px-3 py-1.5 rounded-full active:bg-brand-tint"
                style={{ borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
              >
                <Text className="text-[11px] text-ink">{s}</Text>
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
              backgroundColor: input.trim() ? '#1E40AF' : '#CBD5E1',
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

// ---------- welcome on first open ----------
function WelcomeBlock({ personaName }: { personaName: string }) {
  return (
    <View
      className="rounded-2xl p-4 mb-3"
      style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE' }}
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
        <Text className="text-[11px] text-muted">Analyzing…</Text>
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
          <Text className="text-[10px] text-faint">{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---------- NBA card ----------
function NBACard({ action, sent, onSend }: { action: ActionCard; sent: boolean; onSend: () => void }) {
  const Icn = iconForActionKind(action.kind);
  const accent: Record<string, string> = {
    slack: '#4A154B', email: '#1E40AF', im: '#16A34A', pin: '#D97706',
    remind: '#8B5CF6', share: '#475569', approve: '#16A34A',
    whatif: '#1E40AF', open: '#1E40AF', investigate: '#D97706',
  };
  const verb = ['pin', 'remind', 'share', 'approve', 'whatif', 'open', 'investigate'].includes(action.kind)
    ? (action.kind === 'pin' ? 'Pin' : action.kind === 'remind' ? 'Set' : action.kind === 'share' ? 'Share' : action.kind === 'approve' ? 'Approve' : action.kind === 'whatif' ? 'Run' : 'Open')
    : 'Send';
  return (
    <View
      className="mr-2 p-3 rounded-xl"
      style={{
        width: 240,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#DBEAFE',
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
      <Text numberOfLines={2} className="text-[11px] text-ink leading-snug mb-2">
        {action.body}
      </Text>
      <View className="flex-row items-center justify-between">
        <Pressable><Text className="text-[10px] text-faint">Edit</Text></Pressable>
        <Pressable
          onPress={onSend}
          disabled={sent}
          className="px-3 py-1 rounded"
          style={{ backgroundColor: sent ? '#16A34A' : '#1E40AF' }}
        >
          <Text className="text-[10px] font-semibold text-white">{sent ? '✓ Sent' : verb}</Text>
        </Pressable>
      </View>
    </View>
  );
}
