import { View, Text, Pressable } from 'react-native';
import type { Kpi } from '../types';

const DELTA_CLASS = {
  pos:  'text-positive',
  neg:  'text-negative',
  warn: 'text-warning',
} as const;

/**
 * Compact stat card matching the web prototype's `.uf-stat-card` style.
 * Uses Tailwind tokens so it adapts to light/dark theme automatically.
 */
export function KpiCard({
  kpi,
  compact = true,
  onPress,
}: {
  kpi: Kpi;
  compact?: boolean;
  onPress?: () => void;
}) {
  const body = (
    <View className="flex-1 bg-surface border border-rule rounded-lg" style={{ padding: compact ? 10 : 14 }}>
      <Text className="text-[9.5px] font-semibold uppercase text-muted tracking-widest mb-1">
        {kpi.lbl}
      </Text>
      <Text
        className="text-ink font-bold"
        style={{
          fontSize: compact ? 20 : 24,
          lineHeight: compact ? 22 : 28,
          letterSpacing: -0.3,
        }}
      >
        {kpi.val}
      </Text>
      <Text className={`text-[10px] mt-0.5 ${DELTA_CLASS[kpi.tone]}`}>{kpi.delta}</Text>
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} className="flex-1">
        {body}
      </Pressable>
    );
  }
  return body;
}

/**
 * KpiRow — renders 4 KPI cards in a single row with tight spacing.
 * Parent provides the array; caller can hook per-card click routing.
 */
export function KpiRow({
  kpis,
  onCardClick,
}: {
  kpis: Kpi[];
  onCardClick?: (i: number, kpi: Kpi) => void;
}) {
  return (
    <View className="flex-row gap-2 mb-3">
      {kpis.map((k, i) => (
        <KpiCard key={i} kpi={k} onPress={onCardClick ? () => onCardClick(i, k) : undefined} />
      ))}
    </View>
  );
}
