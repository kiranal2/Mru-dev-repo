import { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useChat, useAuth, useIndustryData } from '../store';
import { Icon, iconForActionKind } from './icons';
import type { ActionCard, Role } from '../types';

// Persona-specific starter prompts. Falls back to the current industry preset's
// default prompts when no persona is active.
const PROMPTS_BY_PERSONA: Record<Role, string[]> = {
  CFO: [
    'Show items needing my approval',
    'Draft a W10 board summary',
    'What is the Q1 cumulative exposure?',
  ],
  CONTROLLER: [
    'Show my review queue',
    'What is blocking the close?',
    'Show reconciliation status',
  ],
  STAFF: [
    'What are my tasks today?',
    'How do I prepare the Mexico investigation?',
    'What evidence am I missing?',
  ],
};

interface Props {
  /** Override the default persona prompts (e.g. workbench-specific). */
  prompts?: string[];
}

/**
 * CommandCenter — docked ask-and-act surface at the bottom of the main column.
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │  ⭐ Command Center          · Every answer → next action │
 *   │                                                         │
 *   │  [chip] [chip] [chip]   ← persona-aware prompt chips     │
 *   │                                                         │
 *   │  ┌───────────────────────────────────────────────────┐ │
 *   │  │  Ask anything about this view…              [▶]   │ │
 *   │  └───────────────────────────────────────────────────┘ │
 *   │                                                         │
 *   │  ▾ Latest reply (if any) + action cards                 │
 *   └────────────────────────────────────────────────────────┘
 */
export function CommandCenter({ prompts }: Props) {
  const { user } = useAuth();
  const { msgs, contextual, followUps, thinking, send, reset } = useChat();
  const industry = useIndustryData();
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);

  const defaultPrompts = useMemo<string[]>(() => {
    if (prompts && prompts.length) return prompts;
    if (user?.key && PROMPTS_BY_PERSONA[user.key]) return PROMPTS_BY_PERSONA[user.key];
    return industry.meta.defaultPrompts;
  }, [prompts, user, industry]);

  // After the first AI reply we switch the chip row from `defaultPrompts` to
  // `followUps` — mirroring the web prototype's chat-to-cards flow.
  const chipPrompts = followUps.length ? followUps : defaultPrompts;

  const lastAi = [...msgs].reverse().find((m) => m.role === 'ai');
  const submit = (value: string) => {
    const q = value.trim();
    if (!q) return;
    send(q);
    setInput('');
    setExpanded(true);
  };

  return (
    <View className="bg-surface border-t border-rule">
      {/* Header row */}
      <View className="px-4 py-2 flex-row items-center gap-2 bg-brand-tint/40">
        <Icon.Sparkle size={12} color="#1E40AF" />
        <Text className="text-[12px] font-semibold text-ink">Command Center</Text>
        <View className="flex-1" />
        <Text className="text-[10px] text-faint">Every answer generates a next best action</Text>
        {msgs.length > 0 && (
          <Pressable onPress={reset} className="px-2 py-0.5">
            <Text className="text-[10.5px] text-brand">New chat</Text>
          </Pressable>
        )}
      </View>

      {/* Latest reply + action cards (when expanded) */}
      {expanded && lastAi && (
        <View className="px-4 pt-2.5 pb-1 border-b border-rule">
          {thinking ? (
            <Text className="text-[11px] italic text-muted">Thinking…</Text>
          ) : (
            <Text className="text-[12px] leading-5 text-ink" numberOfLines={4}>
              {lastAi.text}
            </Text>
          )}
          {contextual.length > 0 && !thinking && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8, gap: 8 }}
            >
              {contextual.slice(0, 6).map((a, i) => (
                <ActionCardTile key={i} card={a} />
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Prompt chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}
      >
        {chipPrompts.slice(0, 5).map((p, i) => (
          <Pressable
            key={i}
            onPress={() => submit(p)}
            className="px-3 py-1.5 rounded-full bg-surface-soft border border-rule"
          >
            <Text className="text-[11.5px] text-ink">{p}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Composer */}
      <View className="px-3 pb-3 pt-1">
        <View className="flex-row items-center gap-2 bg-surface-alt border border-rule rounded-xl px-3">
          <TextInput
            className="flex-1 text-[13px] text-ink py-2.5"
            placeholder="Ask Meeru anything — e.g. “Why did LATAM underperform?”"
            placeholderTextColor="#94A3B8"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => submit(input)}
            returnKeyType="send"
          />
          <Pressable
            onPress={() => submit(input)}
            disabled={!input.trim()}
            className={`w-8 h-8 rounded-lg items-center justify-center ${
              input.trim() ? 'bg-brand' : 'bg-surface-soft'
            }`}
          >
            <Icon.Send size={14} color={input.trim() ? '#FFFFFF' : '#94A3B8'} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ActionCardTile({ card }: { card: ActionCard }) {
  const IconComp = iconForActionKind(card.kind);
  return (
    <View className="w-[200px] p-2.5 bg-surface-alt border border-rule rounded-lg">
      <View className="flex-row items-center gap-1.5 mb-1">
        <IconComp size={12} color="#475569" />
        <Text className="text-[9px] font-bold uppercase tracking-wider text-faint">
          {card.kind}
        </Text>
      </View>
      <Text className="text-[12px] font-semibold text-ink mb-0.5" numberOfLines={1}>
        {card.label}
      </Text>
      <Text className="text-[10.5px] text-muted" numberOfLines={2}>
        {card.who}
      </Text>
    </View>
  );
}
