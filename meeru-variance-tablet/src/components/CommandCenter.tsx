import { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChat, useAuth, useIndustryData, useToasts } from '../store';
import { Icon, iconForActionKind } from './icons';
import type { ActionCard, Role } from '../types';

// AsyncStorage keys for Command Center toggles + favorites.
const SK = {
  pinned: 'meeru.cc.pinned',
  fullsize: 'meeru.cc.fullsize',
  favorites: 'meeru.cc.favorites',
};

// Shared delivery-industry prompts that work for any persona — populated into
// the type-ahead library so every persona gets broad domain coverage.
const SHARED_PROMPTS = [
  'Why did LATAM underperform this week?',
  'What should we watch before Tuesday?',
  'Which regions are most at risk next week?',
  'What are the most significant exceptions this week?',
  'Why is Mexico Grocery in dampening?',
  'Explain the US Convenience exit rate spike',
  'What is driving EUP Grocery outperformance?',
  'What caused the AU Grocery miss?',
];

// Persona-specific prompt pools. `defaults` seed the chip row before the first
// reply. `library` is the broader set used by the type-ahead as the user types.
const PROMPTS_BY_PERSONA: Record<Role, { defaults: string[]; library: string[] }> = {
  CFO: {
    defaults: [
      'Show items needing my approval',
      'Draft a W10 board summary',
      'What is the Q1 cumulative exposure?',
    ],
    library: [
      'Show items needing my approval',
      'Draft a W10 board summary',
      'What is the Q1 cumulative exposure?',
      'What segments are ready for period lock?',
      'Compare W10 to same week last year',
      'Total materiality-exceeding variances this quarter',
      'Publish board pre-read for Friday',
      'Model Q2 recovery if all LATAM interventions land',
    ],
  },
  CONTROLLER: {
    defaults: [
      'Show my review queue',
      'What is blocking the close?',
      'Show reconciliation status',
    ],
    library: [
      'Show my review queue',
      'What is blocking the close?',
      'Show reconciliation status',
      'Show the Mexico audit trail',
      'Which staff-prepared items need approval?',
      'Post the Mexico provisional JE',
      'Route Mexico to CFO for sign-off',
      'Day 4 critical-path items',
    ],
  },
  STAFF: {
    defaults: [
      'What are my tasks today?',
      'How do I prepare the Mexico investigation?',
      'What evidence am I missing?',
    ],
    library: [
      'What are my tasks today?',
      'How do I prepare the Mexico investigation?',
      'What evidence am I missing?',
      'Submit Mexico for Controller review',
      'Show me a well-documented example',
      'How long does Raj usually take to review?',
      'Prepare the Voltair JE',
      'Upload Bank recon evidence',
    ],
  },
};

// Rank suggestions by how well they match the user's input. A starts-with
// match beats a word-start match beats a substring match. Capped at 5 rows.
function rankSuggestions(input: string, lib: string[]): string[] {
  const q = input.trim().toLowerCase();
  if (!q) return [];
  const scored: { s: string; score: number }[] = [];
  for (const s of lib) {
    const l = s.toLowerCase();
    if (l.startsWith(q)) scored.push({ s, score: 3 });
    else if (new RegExp(`\\b${q.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`).test(l)) scored.push({ s, score: 2 });
    else if (l.includes(q)) scored.push({ s, score: 1 });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, 5).map((r) => r.s);
}

interface Props {
  /** Override the default persona prompts (e.g. workbench-specific). */
  prompts?: string[];
}

/**
 * CommandCenter — docked ask-and-act surface at the bottom of the main column.
 * Has persona-aware prompt chips, a type-ahead suggestion dropdown that
 * appears as the user types, and a reply + action-card area that expands after
 * the first send.
 */
export function CommandCenter({ prompts }: Props) {
  const { user } = useAuth();
  const { msgs, contextual, followUps, thinking, send, reset } = useChat();
  const { push } = useToasts();
  const industry = useIndustryData();
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  // Parity with the web Command Center's header controls:
  //   minimized — collapses the body (chips + reply + composer) behind the header
  //   pinned    — keeps the widget visually pinned (decorative on tablet)
  //   favorited — saves this session (decorative + toast feedback)
  //   fullsize  — stretches the reply area to a bigger height
  //   hidden    — hides the whole widget (shown again via a floating pill)
  const [minimized, setMinimized] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [fullsize, setFullsize] = useState(false);
  const [hidden, setHidden] = useState(false);
  // Favorites persist across sessions. We key favorites by the user prompt
  // that produced the reply so de-dupe works naturally. `favorited` tracks
  // whether the CURRENT reply is in the saved list.
  const [favoritesMap, setFavoritesMap] = useState<Record<string, { text: string; ts: number }>>({});

  // Hydrate persisted toggles on mount.
  useEffect(() => {
    AsyncStorage.multiGet([SK.pinned, SK.fullsize, SK.favorites]).then((rows) => {
      for (const [key, val] of rows) {
        if (!val) continue;
        if (key === SK.pinned) setPinned(val === '1');
        else if (key === SK.fullsize) setFullsize(val === '1');
        else if (key === SK.favorites) {
          try { setFavoritesMap(JSON.parse(val)); } catch {}
        }
      }
    });
  }, []);

  // Last user question + AI reply pair — used as the Favorite's key + value.
  const lastUserMsg = [...msgs].reverse().find((m) => m.role === 'user')?.text ?? '';
  const favorited = !!favoritesMap[lastUserMsg];

  const personaPool = user?.key ? PROMPTS_BY_PERSONA[user.key] : undefined;
  const defaultPrompts = useMemo<string[]>(() => {
    if (prompts && prompts.length) return prompts;
    if (personaPool) return personaPool.defaults;
    return industry.meta.defaultPrompts;
  }, [prompts, personaPool, industry]);

  // After the first AI reply we switch the chip row from `defaultPrompts` to
  // `followUps` — mirrors the web prototype's chat-to-cards flow.
  const chipPrompts = followUps.length ? followUps : defaultPrompts;

  // Type-ahead library = persona library + shared prompts. Recomputed on
  // persona switch (not on every keystroke) so the match list is stable.
  const library = useMemo<string[]>(
    () => [...(personaPool?.library ?? []), ...SHARED_PROMPTS],
    [personaPool],
  );
  const suggestions = useMemo(() => rankSuggestions(input, library), [input, library]);
  const showSuggest = suggestions.length > 0 && input.trim().length > 0;

  const lastAi = [...msgs].reverse().find((m) => m.role === 'ai');
  const submit = (value: string) => {
    const q = value.trim();
    if (!q) return;
    send(q);
    setInput('');
    setExpanded(true);
  };

  if (hidden) {
    // Minimal floating "restore" pill when the user closes the widget with ×.
    return (
      <View className="bg-surface border-t border-rule px-3 py-2 flex-row items-center justify-center">
        <Pressable
          onPress={() => setHidden(false)}
          className="px-3 py-1.5 rounded-full bg-brand-tint border border-brand-weak flex-row items-center gap-1.5"
        >
          <Icon.Sparkle size={12} color="#B64D1D" />
          <Text className="text-[13px] font-semibold text-brand">Show Command Center</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      className={`bg-surface border-t ${
        pinned ? 'border-brand' : 'border-rule'
      }`}
      // `pinned` gets a 2px brand-colored top border (vs the default 1px rule)
      // so users see the widget is persistently docked.
      style={pinned ? { borderTopWidth: 2 } : undefined}
    >
      {/* ================================================================ */}
      {/* Header row — title on left, tagline + parity controls on right.  */}
      {/* Controls mirror the web: New Chat / Minimize / Pin / Favorite /  */}
      {/* Expand / Close. Each toggles its own state; Close hides the     */}
      {/* whole widget behind a "Show Command Center" pill (above).        */}
      {/* ================================================================ */}
      <View className="px-4 py-2.5 flex-row items-center gap-2 bg-brand-tint/40">
        <Icon.Sparkle size={14} color="#B64D1D" />
        <Text className="text-[15px] font-semibold text-ink">Command Center</Text>
        {/* New Chat — always visible on the left, right next to the title. */}
        <Pressable onPress={reset} className="ml-2 flex-row items-center gap-1">
          <Icon.Pencil size={12} color="#B64D1D" />
          <Text className="text-[13px] text-brand font-medium">New Chat</Text>
        </Pressable>
        <View className="flex-1" />
        <Text className="text-[13px] text-faint">Every answer generates a next best action</Text>

        {/* Right-side parity controls */}
        <View className="flex-row items-center gap-1 ml-3">
          <HeaderChip
            icon={<Icon.ChevDown size={12} color={minimized ? '#B64D1D' : '#A3A3A3'} />}
            label={minimized ? 'Restore' : 'Minimize'}
            active={minimized}
            disabled={pinned}
            onPress={() => {
              // When pinned the user explicitly opted to keep the widget
              // visible, so ignore minimize clicks + surface a toast.
              if (pinned) {
                push({ kind: 'info', title: 'Unpin first to minimize' });
                return;
              }
              setMinimized((v) => !v);
            }}
          />
          <HeaderChip
            icon={<Icon.Pin size={12} color={pinned ? '#B64D1D' : '#A3A3A3'} />}
            label="Pin"
            active={pinned}
            onPress={() => {
              const next = !pinned;
              setPinned(next);
              if (next) setMinimized(false); // Pinning forces the body open.
              AsyncStorage.setItem(SK.pinned, next ? '1' : '0').catch(() => {});
              push({ kind: 'info', title: next ? 'Pinned to bottom' : 'Unpinned' });
            }}
          />
          <HeaderChip
            icon={<Icon.Star size={12} color={favorited ? '#B64D1D' : '#A3A3A3'} fill={favorited ? '#B64D1D' : 'none'} />}
            label="Favorite"
            active={favorited}
            disabled={!lastAi || !lastUserMsg}
            onPress={() => {
              if (!lastAi || !lastUserMsg) {
                push({ kind: 'info', title: 'Ask a question first', sub: 'Favorites save the current reply.' });
                return;
              }
              const next = { ...favoritesMap };
              if (favorited) {
                delete next[lastUserMsg];
                push({ kind: 'info', title: 'Removed from favorites' });
              } else {
                next[lastUserMsg] = { text: lastAi.text ?? '', ts: Date.now() };
                push({
                  kind: 'ok',
                  title: 'Saved to favorites',
                  sub: `${Object.keys(next).length} total`,
                });
              }
              setFavoritesMap(next);
              AsyncStorage.setItem(SK.favorites, JSON.stringify(next)).catch(() => {});
            }}
          />
          <HeaderChip
            icon={fullsize ? <Icon.Minimize size={12} color="#B64D1D" /> : <Icon.Maximize size={12} color="#A3A3A3" />}
            label={fullsize ? 'Collapse' : 'Expand'}
            active={fullsize}
            onPress={() => {
              const next = !fullsize;
              setFullsize(next);
              AsyncStorage.setItem(SK.fullsize, next ? '1' : '0').catch(() => {});
              // Expanding auto-opens the reply area so the user sees the
              // benefit immediately.
              if (next) setExpanded(true);
            }}
          />
          <Pressable
            onPress={() => setHidden(true)}
            className="w-7 h-7 rounded-md items-center justify-center ml-0.5"
          >
            <Icon.X size={14} color="#A3A3A3" />
          </Pressable>
        </View>
      </View>

      {/* Latest reply + action cards (when expanded) — collapses when minimized.
          Default maxHeight is tall enough to show the reply preview PLUS the
          full action-card row (~120px tall). Fullsize bumps it further so
          long replies render without a vertical clip. */}
      {!minimized && expanded && lastAi && (
        <ScrollView
          className="border-b border-rule"
          style={{ maxHeight: fullsize ? 420 : 240 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 }}
        >
          {thinking ? (
            <Text className="text-[13px] italic text-muted">Thinking…</Text>
          ) : (
            <Text
              className="text-[14px] leading-5 text-ink"
              numberOfLines={fullsize ? undefined : 4}
            >
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
        </ScrollView>
      )}

      {/* Prompt chips — hidden when minimized */}
      {!minimized && (
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
              <Text className="text-[13.5px] text-ink">{p}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Composer with type-ahead dropdown — hidden when minimized */}
      {!minimized && (
      <View className="px-3 pb-3 pt-1 relative">
        {/* Type-ahead suggestions — floats above the input as the user types.
            Absolute so it overlays without pushing the composer. */}
        {showSuggest && (
          <View
            className="absolute left-3 right-3 bg-surface border border-rule rounded-xl overflow-hidden"
            style={{ bottom: '100%', marginBottom: 4, elevation: 8 }}
          >
            <View className="px-3 py-1.5 bg-surface-soft border-b border-rule">
              <Text className="text-[13px] font-semibold uppercase tracking-wider text-faint">
                Suggestions
              </Text>
            </View>
            {suggestions.map((s, i) => (
              <Pressable
                key={s}
                onPress={() => submit(s)}
                className={`px-3 py-2.5 flex-row items-center gap-2 ${
                  i < suggestions.length - 1 ? 'border-b border-rule' : ''
                }`}
              >
                <Icon.Sparkle size={12} color="#B64D1D" />
                <Text className="text-[14px] text-ink flex-1">{s}</Text>
              </Pressable>
            ))}
          </View>
        )}

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
      )}
    </View>
  );
}

// HeaderChip — compact icon-plus-label pill used for the Minimize / Pin /
// Favorite / Expand controls in the Command Center header. Active state
// (`bg-brand-tint` + coral icon) mirrors the web's toggle chips.
function HeaderChip({
  icon,
  label,
  active,
  disabled,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-1 px-2 py-1 rounded-md border ${
        disabled
          ? 'bg-surface-alt border-rule opacity-50'
          : active
          ? 'bg-brand-tint border-brand-weak'
          : 'bg-surface-alt border-rule'
      }`}
    >
      {icon}
      <Text
        className={`text-[12px] font-medium ${
          disabled ? 'text-faint' : active ? 'text-brand' : 'text-muted'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ActionCardTile({ card }: { card: ActionCard }) {
  const IconComp = iconForActionKind(card.kind);
  return (
    <View className="w-[200px] p-2.5 bg-surface-alt border border-rule rounded-lg">
      <View className="flex-row items-center gap-1.5 mb-1">
        <IconComp size={12} color="#475569" />
        <Text className="text-[13px] font-bold uppercase tracking-wider text-faint">
          {card.kind}
        </Text>
      </View>
      <Text className="text-[14px] font-semibold text-ink mb-0.5" numberOfLines={1}>
        {card.label}
      </Text>
      <Text className="text-[14px] text-muted" numberOfLines={2}>
        {card.who}
      </Text>
    </View>
  );
}
