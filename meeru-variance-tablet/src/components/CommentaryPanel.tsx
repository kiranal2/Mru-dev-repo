import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import type { CommentaryItem } from '../types';
import { Icon } from './icons';
import { useChat, type ConversationEntry } from '../store';

// ============ Status chip ============
// Inline tinted pills matching the web's chip-neg / chip-pos / chip-warn /
// chip-info classes. React Native doesn't support CSS color-mix, so we use
// pre-computed semi-transparent hex values. The tones map to the semantic
// tokens and work against both light + dark themes.
const CHIP_STYLE: Record<
  'neg' | 'pos' | 'warn' | 'info',
  { bg: string; border: string; textClass: string; label: string }
> = {
  // Palette audit: "INVESTIGATING" → warning-gold, "MONITORING" → neutral
  // (was red — too loud). Coral stays reserved for "WATCH" (active focus).
  neg:  { bg: 'rgba(220,38,38,0.14)',  border: 'rgba(220,38,38,0.28)',  textClass: 'text-negative', label: 'Blocker' },
  pos:  { bg: 'rgba(22,163,74,0.14)',  border: 'rgba(22,163,74,0.28)',  textClass: 'text-positive', label: 'On track' },
  warn: { bg: 'rgba(217,119,6,0.14)',  border: 'rgba(217,119,6,0.28)',  textClass: 'text-warning',  label: 'Monitoring' },
  info: { bg: 'rgba(182,77,29,0.14)',  border: 'rgba(182,77,29,0.28)',  textClass: 'text-brand',    label: 'Predictive flag' },
};

function StatusChip({ kind, children }: { kind: keyof typeof CHIP_STYLE; children: string }) {
  const s = CHIP_STYLE[kind];
  return (
    <View
      className="px-1.5 py-0.5 rounded"
      style={{ backgroundColor: s.bg, borderWidth: 1, borderColor: s.border }}
    >
      <Text className={`text-[13px] font-bold uppercase tracking-wider ${s.textClass}`}>
        {children}
      </Text>
    </View>
  );
}

// ============ Mini sparkline ============
function MiniSpark({ values, tone }: { values: number[]; tone: 'pos' | 'neg' | 'warn' }) {
  if (!values.length) return null;
  const W = 56;
  const H = 16;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - ((v - min) / range) * H;
      return `${x},${y}`;
    })
    .join(' ');
  const colorByTone = { pos: '#16A34A', neg: '#DC2626', warn: '#D97706' };
  return (
    <Svg width={W} height={H}>
      <Polyline points={points} fill="none" stroke={colorByTone[tone]} strokeWidth={1.5} />
    </Svg>
  );
}

// ============ Materiality flag ============
// Rendered when a commentary's delta amount >= $1M. Auto-derived from the
// delta string, no explicit authoring needed. Matches the web's Tier-1 view.
function MaterialityFlag() {
  return (
    <View className="px-1.5 py-0.5 rounded bg-warning-weak">
      <Text className="text-[13px] font-bold uppercase tracking-wider text-warning">Material</Text>
    </View>
  );
}

function parseImpactM(delta: string): number | null {
  // Pulls a magnitude from strings like "−$2.1M vs Plan" or "+$0.4M". Returns
  // the absolute value in millions, or null when not parseable.
  const m = delta.match(/[−\-+]?\$?(\d+(?:\.\d+)?)M/i);
  if (!m) return null;
  return parseFloat(m[1]);
}

function toneFromDelta(delta: string): 'pos' | 'neg' | 'warn' {
  if (/^[\+]|\+\$/.test(delta)) return 'pos';
  if (/^[\-−]|−\$|\-\$/.test(delta)) return 'neg';
  return 'warn';
}

function statusKindFromTags(tags: CommentaryItem['tags']): keyof typeof CHIP_STYLE {
  if (tags.some((t) => t.t === 'red')) return 'neg';
  if (tags.some((t) => t.t === 'green')) return 'pos';
  if (tags.some((t) => t.t === 'amber')) return 'warn';
  return 'info';
}

// ============ Commentary row ============
function CommentaryRow({ item, spark }: { item: CommentaryItem; spark?: number[] }) {
  const tone = toneFromDelta(item.delta);
  const impactM = parseImpactM(item.delta);
  const isMaterial = impactM !== null && impactM >= 1.0;
  const statusKind = statusKindFromTags(item.tags);
  return (
    <View className="mb-3 pb-3 border-b border-rule">
      <View className="flex-row items-start gap-2">
        <View className="w-5 h-5 rounded-full bg-surface-soft items-center justify-center shrink-0">
          <Text className="text-[14px] font-bold text-muted">{item.rank}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-2 mb-1">
            <Text className="text-[13px] font-semibold text-ink flex-1" numberOfLines={1}>
              {item.name}
            </Text>
            <Text
              className={`text-[13px] font-semibold ${
                tone === 'pos' ? 'text-positive' : tone === 'neg' ? 'text-negative' : 'text-warning'
              }`}
            >
              — {item.delta}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5 mb-1.5">
            <StatusChip kind={statusKind}>{CHIP_STYLE[statusKind].label}</StatusChip>
            {isMaterial && <MaterialityFlag />}
            <View className="flex-1" />
            {spark && <MiniSpark values={spark} tone={tone} />}
          </View>
          <Text className="text-[13.5px] leading-5 text-muted">{item.text}</Text>
          <View className="flex-row gap-1 mt-2 flex-wrap">
            <Pressable>
              <Text className="text-[13px] text-brand">Drill down ›</Text>
            </Pressable>
            <Text className="text-[13px] text-faint"> · </Text>
            <Pressable>
              <Text className="text-[13px] text-muted">★ Ask about this</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

// ============ History row ============
// Renders one past conversation as a tappable card. Tapping replays the
// exchange into the active CommandCenter via restoreFromHistory.
function HistoryRow({
  entry,
  onPress,
}: {
  entry: ConversationEntry;
  onPress: () => void;
}) {
  const when = new Date(entry.ts);
  const today = new Date();
  const sameDay =
    when.getFullYear() === today.getFullYear() &&
    when.getMonth() === today.getMonth() &&
    when.getDate() === today.getDate();
  const dateStr = sameDay
    ? when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : when.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return (
    <Pressable
      onPress={onPress}
      className="mb-2 px-3 py-2.5 rounded-md border border-rule bg-surface-soft"
    >
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-[10px] font-bold tracking-wider uppercase text-faint">
          {entry.persona ?? 'You'}
        </Text>
        <Text className="text-[10px] text-faint">{dateStr}</Text>
      </View>
      <Text className="text-[13px] font-semibold text-ink mb-1" numberOfLines={2}>
        {entry.userMsg}
      </Text>
      <Text className="text-[12px] text-muted" numberOfLines={2}>
        {entry.aiText}
      </Text>
    </Pressable>
  );
}

type Tab = 'insights' | 'history';

interface Props {
  items: CommentaryItem[];
  headline?: string;
  /** Map of commentary.name → sparkline values. */
  sparkByName?: Record<string, number[]>;
}

/**
 * AI Insights panel — the right column of the workbench. Two tabs:
 *   • Insights — ranked commentary rows (status chip, materiality, sparkline)
 *   • History  — every past user/AI exchange persisted across sessions.
 *                Tap a row to replay it into the active Command Center.
 */
export function CommentaryPanel({ items, headline, sparkByName }: Props) {
  const [tab, setTab] = useState<Tab>('insights');
  const { history, clearHistory, restoreFromHistory } = useChat();

  return (
    <View className="bg-surface border-l border-rule" style={{ width: 300 }}>
      {/* Header */}
      <View className="px-3.5 pt-3 pb-2 border-b border-rule flex-row items-center gap-2">
        <View className="w-1.5 h-1.5 rounded-full bg-positive" />
        <Icon.BarChart size={12} color="#B64D1D" />
        <Text className="text-[14px] font-bold tracking-wider uppercase text-ink">
          AI Insights
        </Text>
      </View>

      {/* Tab switcher */}
      <View className="flex-row px-2 pt-2 pb-1.5 border-b border-rule gap-1">
        <Pressable
          onPress={() => setTab('insights')}
          className={`flex-1 px-2.5 py-1.5 rounded-md ${tab === 'insights' ? 'bg-brand-tint border border-brand-weak' : ''}`}
        >
          <Text
            className={`text-[12px] font-semibold tracking-wider uppercase text-center ${tab === 'insights' ? 'text-brand' : 'text-muted'}`}
          >
            Insights
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('history')}
          className={`flex-1 px-2.5 py-1.5 rounded-md flex-row items-center justify-center gap-1 ${tab === 'history' ? 'bg-brand-tint border border-brand-weak' : ''}`}
        >
          <Text
            className={`text-[12px] font-semibold tracking-wider uppercase ${tab === 'history' ? 'text-brand' : 'text-muted'}`}
          >
            History
          </Text>
          {history.length > 0 && (
            <View className="px-1 rounded-full bg-surface-soft">
              <Text className={`text-[10px] font-bold ${tab === 'history' ? 'text-brand' : 'text-muted'}`}>
                {history.length}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Body */}
      {tab === 'insights' ? (
        <ScrollView contentContainerStyle={{ padding: 14 }}>
          {headline && (
            <Text className="text-[14px] font-semibold text-ink mb-3" numberOfLines={2}>
              {headline}
            </Text>
          )}
          {items.map((it) => (
            <CommentaryRow key={it.rank} item={it} spark={sparkByName?.[it.name]} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12 }}>
          {history.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-[13px] text-faint text-center">
                No past conversations yet.
              </Text>
              <Text className="text-[12px] text-faint text-center mt-1">
                Ask the Command Center anything to start your history.
              </Text>
            </View>
          ) : (
            <>
              <View className="flex-row items-center justify-between mb-2 px-1">
                <Text className="text-[11px] font-semibold tracking-wider uppercase text-faint">
                  Recent · newest first
                </Text>
                <Pressable onPress={clearHistory} hitSlop={8}>
                  <Text className="text-[11px] text-muted underline">Clear all</Text>
                </Pressable>
              </View>
              {history.map((entry) => (
                <HistoryRow
                  key={entry.id}
                  entry={entry}
                  onPress={() => restoreFromHistory(entry)}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
